from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="viewer", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @property
    def is_admin(self):
        return self.role == "admin"

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)


class Resolver(db.Model):
    __tablename__ = "resolvers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False)

    tickets = db.relationship("Misconfiguration", back_populates="resolver", lazy=True)


class Misconfiguration(db.Model):
    __tablename__ = "misconfigurations"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.String(40), unique=True, nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    provider = db.Column(db.String(20), nullable=False)
    resource = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    resolver_id = db.Column(db.Integer, db.ForeignKey("resolvers.id"), nullable=True)
    status = db.Column(db.String(20), nullable=False)
    sla_deadline = db.Column(db.DateTime, nullable=False)
    detected_at = db.Column(db.DateTime, nullable=False)
    crowdstrike_id = db.Column(db.String(40), nullable=False)

    resolver = db.relationship("Resolver", back_populates="tickets")
