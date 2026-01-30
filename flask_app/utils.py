import os
import random
from datetime import datetime, timedelta

import requests
from flask import current_app

from models import db, User, Resolver, Misconfiguration


SLA_HOURS = {
    "CRITICAL": 4,
    "HIGH": 24,
    "MEDIUM": 168,
    "LOW": 720,
    "INFORMAL": 2160,
}

SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMAL"]
PROVIDERS = ["AWS", "GCP", "Azure"]
STATUSES = ["Open", "In Progress", "Resolved", "Overdue"]

RESOURCES = [
    "s3://production-logs-backup",
    "vm-instance-db-primary",
    "gcp-compute-frontend-v1",
    "azure-blob-customer-data",
    "vpc-main-security-group",
    "iam-role-admin-access",
    "k8s-cluster-prod-01",
    "rds-postgres-financial",
    "lb-public-gateway",
    "lambda-process-payments",
]

DESCRIPTIONS = [
    "S3 bucket publicly accessible",
    "Security group allows 0.0.0.0/0 on port 22",
    "IAM role with excessive permissions",
    "Database encryption disabled",
    "MFA not enabled for root account",
    "Kubernetes API server publicly accessible",
    "Unencrypted EBS volume attached",
    "Logging disabled for VPC flow logs",
    "Storage account allows public access",
    "Function URL accessible without authentication",
]


def calculate_sla_deadline(severity, detected_at):
    hours = SLA_HOURS[severity]
    return detected_at + timedelta(hours=hours)


def map_severity(value):
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return "MEDIUM"
    if numeric >= 90:
        return "CRITICAL"
    if numeric >= 70:
        return "HIGH"
    if numeric >= 40:
        return "MEDIUM"
    if numeric >= 20:
        return "LOW"
    return "INFORMAL"


def map_provider(raw):
    if not raw:
        return "AWS"
    raw_lower = str(raw).lower()
    if "gcp" in raw_lower or "google" in raw_lower:
        return "GCP"
    if "azure" in raw_lower:
        return "Azure"
    return "AWS"


def parse_timestamp(value):
    if not value:
        return datetime.utcnow()
    if isinstance(value, (int, float)):
        return datetime.utcfromtimestamp(value / 1000) if value > 1_000_000_000 else datetime.utcfromtimestamp(value)
    text = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text).replace(tzinfo=None)
    except ValueError:
        return datetime.utcnow()


def ensure_overdue_status():
    now = datetime.utcnow()
    tickets = Misconfiguration.query.all()
    updated = False
    for ticket in tickets:
        if ticket.status != "Resolved" and now > ticket.sla_deadline:
            if ticket.status != "Overdue":
                ticket.status = "Overdue"
                updated = True
    if updated:
        db.session.commit()


def seed_default_admin():
    default_username = "lucasadmin"
    default_password = "Molurus8@"
    existing = User.query.filter_by(username=default_username).first()
    if not existing:
        user = User(username=default_username, role="admin")
        user.set_password(default_password)
        db.session.add(user)
        db.session.commit()


def get_crowdstrike_token(base_url, client_id, client_secret):
    url = f"{base_url.rstrip('/')}/oauth2/token"
    response = requests.post(
        url,
        data={"client_id": client_id, "client_secret": client_secret},
        timeout=15,
    )
    response.raise_for_status()
    return response.json().get("access_token")


def query_crowdstrike_detect_ids(base_url, token, limit=50, filter_query=None):
    url = f"{base_url.rstrip('/')}/detects/queries/detects/v1"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"limit": limit}
    if filter_query:
        params["filter"] = filter_query
    response = requests.get(url, headers=headers, params=params, timeout=15)
    response.raise_for_status()
    body = response.json()
    return body.get("resources", []) or []


def get_crowdstrike_detect_summaries(base_url, token, detect_ids):
    url = f"{base_url.rstrip('/')}/detects/entities/summaries/GET"
    headers = {"Authorization": f"Bearer {token}"}
    summaries = []
    for i in range(0, len(detect_ids), 100):
        chunk = detect_ids[i : i + 100]
        response = requests.get(
            url,
            headers=headers,
            params={"ids": ",".join(chunk)},
            timeout=20,
        )
        response.raise_for_status()
        body = response.json()
        summaries.extend(body.get("resources", []) or [])
    return summaries


def import_crowdstrike_detections(detections):
    imported = 0
    for det in detections:
        detection_id = det.get("detection_id") or det.get("id")
        if not detection_id:
            continue

        if Misconfiguration.query.filter_by(crowdstrike_id=detection_id).first():
            continue

        severity = map_severity(det.get("severity") or det.get("max_severity"))
        provider = map_provider(det.get("cloud_provider") or det.get("cloud_platform"))

        detected_at = parse_timestamp(
            det.get("created_timestamp") or det.get("first_behavior") or det.get("timestamp")
        )

        status_raw = str(det.get("status") or det.get("state") or "Open").lower()
        if "resolved" in status_raw or "closed" in status_raw:
            status = "Resolved"
        elif "progress" in status_raw:
            status = "In Progress"
        else:
            status = "Open"

        behaviors = det.get("behaviors") or []
        description = det.get("description") or (behaviors[0].get("description") if behaviors else None)
        description = description or f"CrowdStrike detection {detection_id}"

        device = det.get("device") or {}
        resource = (
            device.get("hostname")
            or det.get("device_hostname")
            or det.get("device_id")
            or det.get("hostname")
            or "CrowdStrike"
        )

        ticket_id = f"CS-{detection_id}"
        if len(ticket_id) > 40:
            ticket_id = ticket_id[:40]
        if Misconfiguration.query.filter_by(ticket_id=ticket_id).first():
            ticket_id = f"{ticket_id[:35]}-{random.randint(1000, 9999)}"

        ticket = Misconfiguration(
            ticket_id=ticket_id,
            severity=severity,
            provider=provider,
            resource=str(resource),
            description=str(description),
            resolver_id=None,
            status=status,
            sla_deadline=calculate_sla_deadline(severity, detected_at),
            detected_at=detected_at,
            crowdstrike_id=str(detection_id),
        )
        db.session.add(ticket)
        imported += 1

    if imported:
        db.session.commit()
    return imported


def fetch_and_import_crowdstrike(limit=50, filter_query=None):
    base_url = os.getenv("CROWDSTRIKE_BASE_URL", "https://api.crowdstrike.com")
    client_id = os.getenv("CROWDSTRIKE_CLIENT_ID")
    client_secret = os.getenv("CROWDSTRIKE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("Credenciais do CrowdStrike não configuradas.")

    token = get_crowdstrike_token(base_url, client_id, client_secret)
    detect_ids = query_crowdstrike_detect_ids(base_url, token, limit=limit, filter_query=filter_query)
    if not detect_ids:
        return 0
    summaries = get_crowdstrike_detect_summaries(base_url, token, detect_ids)
    return import_crowdstrike_detections(summaries)


def seed_mock_data_if_empty():
    marker_path = os.path.join(current_app.instance_path, "data", ".seeded_mock_data")
    if os.path.exists(marker_path):
        return

    if Misconfiguration.query.first():
        with open(marker_path, "w", encoding="utf-8") as marker_file:
            marker_file.write("seeded\n")
        return

    existing_resolvers = Resolver.query.all()
    if not existing_resolvers:
        for name, email in [
            ("Alice Security", "alice@company.com"),
            ("Bob Cloud", "bob@company.com"),
            ("Charlie Ops", "charlie@company.com"),
            ("Diana Dev", "diana@company.com"),
        ]:
            db.session.add(Resolver(name=name, email=email))
        db.session.commit()

    resolvers = Resolver.query.all()
    now = datetime.utcnow()

    for _ in range(35):
        severity = random.choice(SEVERITIES)
        provider = random.choice(PROVIDERS)
        detected_at = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        sla_deadline = calculate_sla_deadline(severity, detected_at)
        status = random.choice(STATUSES)
        if status != "Resolved" and now > sla_deadline:
            status = "Overdue"

        resolver = random.choice(resolvers + [None])
        ticket = Misconfiguration(
            ticket_id=f"MC-{random.randint(0, 9999):04d}",
            severity=severity,
            provider=provider,
            resource=random.choice(RESOURCES),
            description=random.choice(DESCRIPTIONS),
            resolver_id=resolver.id if resolver else None,
            status=status,
            sla_deadline=sla_deadline,
            detected_at=detected_at,
            crowdstrike_id=f"CS-{now.year}-{random.randint(0, 999999)}",
        )
        db.session.add(ticket)

    db.session.commit()

    with open(marker_path, "w", encoding="utf-8") as marker_file:
        marker_file.write("seeded\n")
