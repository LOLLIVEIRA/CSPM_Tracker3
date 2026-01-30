import os
from datetime import datetime, timedelta

from flask import (
    Flask,
    render_template,
    redirect,
    request,
    url_for,
    flash,
)
from flask_login import (
    LoginManager,
    login_user,
    login_required,
    logout_user,
    current_user,
)

from models import db, User, Resolver, Misconfiguration
from utils import (
    seed_default_admin,
    seed_mock_data_if_empty,
    calculate_sla_deadline,
    ensure_overdue_status,
    fetch_and_import_crowdstrike,
    import_crowdstrike_detections,
)


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
    db_path = os.path.join(app.instance_path, "data", "app.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = "login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @app.before_request
    def init_db():
        os.makedirs(os.path.join(app.instance_path, "data"), exist_ok=True)
        db.create_all()
        seed_default_admin()
        seed_mock_data_if_empty()

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for("dashboard"))

        if request.method == "POST":
            username = request.form.get("username", "").strip().lower()
            password = request.form.get("password", "")

            if not username or not password:
                flash("Por favor, insira usuário e senha.", "error")
                return render_template("login.html")

            user = User.query.filter_by(username=username).first()
            if user and user.verify_password(password):
                login_user(user)
                return redirect(url_for("dashboard"))

            flash("Credenciais inválidas. Verifique seu usuário e senha.", "error")

        return render_template("login.html")

    @app.route("/logout")
    @login_required
    def logout():
        logout_user()
        return redirect(url_for("login"))

    @app.route("/")
    @login_required
    def dashboard():
        ensure_overdue_status()
        data = Misconfiguration.query.order_by(Misconfiguration.detected_at.desc()).all()
        resolvers = Resolver.query.order_by(Resolver.name.asc()).all()

        critical_count = len([i for i in data if i.severity == "CRITICAL" and i.status != "Resolved"])
        high_count = len([i for i in data if i.severity == "HIGH" and i.status != "Resolved"])
        overdue_count = len([i for i in data if i.status == "Overdue"])
        resolved_count = len([i for i in data if i.status == "Resolved"])

        metrics = [
            {"label": "Críticos", "count": critical_count, "trend": "+12%", "severity": "CRITICAL"},
            {"label": "Alta Severidade", "count": high_count, "trend": "-5%", "severity": "HIGH"},
            {"label": "SLA Vencidos", "count": overdue_count, "trend": "+2", "severity": "INFORMAL"},
            {"label": "Resolvidos (30d)", "count": resolved_count, "trend": "+18%", "severity": "LOW"},
        ]

        recent = [i for i in data if i.status != "Resolved"][:5]
        return render_template(
            "dashboard.html",
            metrics=metrics,
            recent=recent,
            resolvers=resolvers,
            now=datetime.utcnow(),
        )

    @app.route("/misconfigurations")
    @login_required
    def misconfigurations():
        ensure_overdue_status()

        search = request.args.get("search", "").strip().lower()
        severities = request.args.getlist("severity")
        providers = request.args.getlist("provider")
        statuses = request.args.getlist("status")
        resolver_query = request.args.get("resolver", "").strip().lower()

        query = Misconfiguration.query
        if severities:
            query = query.filter(Misconfiguration.severity.in_(severities))
        if providers:
            query = query.filter(Misconfiguration.provider.in_(providers))
        if statuses:
            query = query.filter(Misconfiguration.status.in_(statuses))

        data = query.order_by(Misconfiguration.detected_at.desc()).all()

        def matches_search(item):
            if not search:
                return True
            return (
                search in item.resource.lower()
                or search in item.description.lower()
                or search in item.crowdstrike_id.lower()
                or search in item.ticket_id.lower()
            )

        def matches_resolver(item):
            if not resolver_query:
                return True
            if resolver_query == "unassigned":
                return item.resolver is None
            if not item.resolver:
                return False
            return resolver_query in item.resolver.name.lower() or resolver_query in item.resolver.email.lower()

        filtered = [i for i in data if matches_search(i) and matches_resolver(i)]
        resolvers = Resolver.query.order_by(Resolver.name.asc()).all()

        return render_template(
            "misconfigurations.html",
            data=filtered,
            resolvers=resolvers,
            filters={
                "search": search,
                "severity": severities,
                "provider": providers,
                "status": statuses,
                "resolver": resolver_query,
            },
            now=datetime.utcnow(),
        )

    @app.route("/tickets/new", methods=["GET", "POST"])
    @login_required
    def new_ticket():
        if request.method == "POST":
            severity = request.form.get("severity")
            provider = request.form.get("provider")
            resource = request.form.get("resource", "").strip()
            description = request.form.get("description", "").strip()
            resolver_id = request.form.get("resolver_id")
            status = request.form.get("status", "Open")

            if not severity or not provider or not resource or not description:
                flash("Preencha todos os campos obrigatórios.", "error")
            else:
                detected_at = datetime.utcnow()
                ticket = Misconfiguration(
                    ticket_id=f"MC-{int(datetime.utcnow().timestamp())}-{os.urandom(2).hex()}",
                    severity=severity,
                    provider=provider,
                    resource=resource,
                    description=description,
                    resolver_id=int(resolver_id) if resolver_id else None,
                    status=status,
                    detected_at=detected_at,
                    crowdstrike_id=f"CS-{datetime.utcnow().year}-{int(datetime.utcnow().timestamp())}",
                    sla_deadline=calculate_sla_deadline(severity, detected_at),
                )
                db.session.add(ticket)
                db.session.commit()
                flash("Ticket criado com sucesso!", "success")
                return redirect(url_for("misconfigurations"))

        resolvers = Resolver.query.order_by(Resolver.name.asc()).all()
        return render_template("ticket_new.html", resolvers=resolvers)

    @app.route("/ticket/<ticket_id>", methods=["GET", "POST"])
    @login_required
    def ticket_detail(ticket_id):
        ticket = Misconfiguration.query.filter_by(ticket_id=ticket_id).first_or_404()
        resolvers = Resolver.query.order_by(Resolver.name.asc()).all()

        if request.method == "POST":
            action = request.form.get("action")
            if action == "update":
                ticket.status = request.form.get("status", ticket.status)
                resolver_id = request.form.get("resolver_id")
                ticket.resolver_id = int(resolver_id) if resolver_id else None
                db.session.commit()
                flash("Ticket atualizado.", "success")
                return redirect(url_for("ticket_detail", ticket_id=ticket_id))
            if action == "delete":
                db.session.delete(ticket)
                db.session.commit()
                flash("Ticket removido.", "success")
                return redirect(url_for("misconfigurations"))

        return render_template("ticket_detail.html", ticket=ticket, resolvers=resolvers)

    @app.route("/ranking")
    @login_required
    def ranking():
        ensure_overdue_status()
        data = Misconfiguration.query.order_by(Misconfiguration.detected_at.desc()).all()
        resolvers = Resolver.query.order_by(Resolver.name.asc()).all()

        stats = {}
        now = datetime.utcnow()

        for resolver in resolvers:
            stats[resolver.email] = {
                "resolver": resolver,
                "resolved_count": 0,
                "resolved_within_sla": 0,
                "resolved_outside_sla": 0,
                "in_progress_count": 0,
                "overdue_count": 0,
                "total_assigned": 0,
                "avg_resolution_time": 0,
                "sla_compliance_rate": 0,
                "severity_breakdown": {
                    "CRITICAL": 0,
                    "HIGH": 0,
                    "MEDIUM": 0,
                    "LOW": 0,
                    "INFORMAL": 0,
                },
                "resolved_times": [],
            }

        for ticket in data:
            if not ticket.resolver:
                continue
            stats_item = stats.get(ticket.resolver.email)
            if not stats_item:
                continue
            stats_item["total_assigned"] += 1
            stats_item["severity_breakdown"][ticket.severity] += 1

            if ticket.status == "Resolved":
                stats_item["resolved_count"] += 1
                if now <= ticket.sla_deadline:
                    stats_item["resolved_within_sla"] += 1
                else:
                    stats_item["resolved_outside_sla"] += 1
                resolution_time = (now - ticket.detected_at).total_seconds() / 3600
                stats_item["resolved_times"].append(resolution_time)
            elif ticket.status == "In Progress":
                stats_item["in_progress_count"] += 1
            elif ticket.status == "Overdue":
                stats_item["overdue_count"] += 1

        ranking_list = []
        for item in stats.values():
            if item["resolved_times"]:
                item["avg_resolution_time"] = sum(item["resolved_times"]) / len(item["resolved_times"])
            if item["resolved_count"] > 0:
                item["sla_compliance_rate"] = round(
                    (item["resolved_within_sla"] / item["resolved_count"]) * 100
                )
            if item["total_assigned"] > 0:
                ranking_list.append(item)

        ranking_list.sort(
            key=lambda x: (
                -x["resolved_within_sla"],
                -x["resolved_count"],
                -x["sla_compliance_rate"],
            )
        )

        total_resolved = len([t for t in data if t.status == "Resolved"])
        total_in_progress = len([t for t in data if t.status == "In Progress"])
        total_overdue = len([t for t in data if t.status == "Overdue"])
        resolved_within_sla = len([t for t in data if t.status == "Resolved" and now <= t.sla_deadline])
        resolved_outside_sla = total_resolved - resolved_within_sla
        global_sla_compliance = round((resolved_within_sla / total_resolved) * 100) if total_resolved else 0

        return render_template(
            "ranking.html",
            ranking=ranking_list,
            total_resolved=total_resolved,
            total_in_progress=total_in_progress,
            total_overdue=total_overdue,
            resolved_within_sla=resolved_within_sla,
            resolved_outside_sla=resolved_outside_sla,
            global_sla_compliance=global_sla_compliance,
        )

    @app.route("/users", methods=["GET", "POST"])
    @login_required
    def users():
        if not current_user.is_admin:
            return redirect(url_for("dashboard"))

        if request.method == "POST":
            action = request.form.get("action")
            if action == "create":
                username = request.form.get("username", "").strip().lower()
                password = request.form.get("password", "")
                role = request.form.get("role", "viewer")
                if not username or not password:
                    flash("Preencha usuário e senha.", "error")
                elif User.query.filter_by(username=username).first():
                    flash("Usuário já existe.", "error")
                else:
                    user = User(username=username, role=role)
                    user.set_password(password)
                    db.session.add(user)
                    db.session.commit()
                    flash("Usuário criado.", "success")
            elif action == "reset":
                user_id = request.form.get("user_id")
                new_password = request.form.get("new_password", "")
                user = User.query.get(int(user_id)) if user_id else None
                if user and new_password:
                    user.set_password(new_password)
                    db.session.commit()
                    flash("Senha resetada.", "success")
            elif action == "delete":
                user_id = request.form.get("user_id")
                user = User.query.get(int(user_id)) if user_id else None
                if user and user.username != "lucasadmin":
                    remaining_admins = User.query.filter_by(role="admin").count()
                    if user.role == "admin" and remaining_admins <= 1:
                        flash("Não é possível remover o último administrador.", "error")
                        return redirect(url_for("users"))
                    db.session.delete(user)
                    db.session.commit()
                    flash("Usuário removido.", "success")
                else:
                    flash("Não é possível remover o admin padrão.", "error")

        users_list = User.query.order_by(User.created_at.asc()).all()
        return render_template("users.html", users=users_list)

    @app.route("/settings", methods=["GET", "POST"])
    @login_required
    def settings():
        if not current_user.is_admin:
            return redirect(url_for("dashboard"))

        if request.method == "POST":
            action = request.form.get("action")
            if action == "add_resolver":
                name = request.form.get("name", "").strip()
                email = request.form.get("email", "").strip().lower()
                if not name or not email:
                    flash("Nome e e-mail são obrigatórios.", "error")
                elif Resolver.query.filter_by(email=email).first():
                    flash("E-mail já cadastrado.", "error")
                else:
                    resolver = Resolver(name=name, email=email)
                    db.session.add(resolver)
                    db.session.commit()
                    flash("Resolvedor adicionado.", "success")
            elif action == "delete_all_tickets":
                Misconfiguration.query.delete()
                db.session.commit()
                flash("Todos os tickets foram removidos.", "success")
            elif action == "import_crowdstrike":
                try:
                    limit = int(request.form.get("limit", "50"))
                except ValueError:
                    limit = 50
                filter_query = request.form.get("filter_query") or None
                try:
                    imported = fetch_and_import_crowdstrike(limit=limit, filter_query=filter_query)
                    flash(f"{imported} deteções importadas do CrowdStrike.", "success")
                except Exception as exc:
                    flash(f"Erro ao importar do CrowdStrike: {exc}", "error")

        resolvers = Resolver.query.order_by(Resolver.name.asc()).all()
        total_tickets = Misconfiguration.query.count()
        return render_template("settings.html", resolvers=resolvers, total_tickets=total_tickets)

    @app.route("/resolvers/<int:resolver_id>/delete", methods=["POST"])
    @login_required
    def delete_resolver(resolver_id):
        if not current_user.is_admin:
            return redirect(url_for("dashboard"))

        resolver = Resolver.query.get_or_404(resolver_id)
        for ticket in resolver.tickets:
            ticket.resolver_id = None
        db.session.delete(resolver)
        db.session.commit()
        flash("Resolvedor removido.", "success")
        return redirect(url_for("settings"))

    @app.route("/api/crowdstrike/webhook", methods=["POST"])
    def crowdstrike_webhook():
        token = os.getenv("CROWDSTRIKE_WEBHOOK_TOKEN")
        if token and request.headers.get("X-API-KEY") != token:
            return {"error": "unauthorized"}, 401

        payload = request.get_json(silent=True) or {}
        detections = payload.get("resources") or payload.get("detections") or payload
        if isinstance(detections, dict):
            detections = [detections]
        if not isinstance(detections, list):
            return {"error": "payload inválido"}, 400

        imported = import_crowdstrike_detections(detections)
        return {"imported": imported}, 200

    return app


if __name__ == "__main__":
    create_app().run(debug=True)
