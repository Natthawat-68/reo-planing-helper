"""SQLAlchemy models for SDG4 Admin Dashboard."""
from __future__ import annotations

from datetime import datetime

from .database import db


class Org(db.Model):
    """หน่วยงาน"""
    __tablename__ = "orgs"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(500), nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    pin = db.Column(db.String(6), nullable=False, default="123456")

    # relationships
    users = db.relationship("User", back_populates="org", foreign_keys="User.org_id")
    projects = db.relationship("Project", back_populates="org")


class User(db.Model):
    """ผู้ใช้ (admin หรือ manager)"""
    __tablename__ = "users"

    id = db.Column(db.String(64), primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password = db.Column(db.String(64), nullable=False)
    role = db.Column(db.String(32), nullable=False)  # admin | manager
    org_id = db.Column(db.String(64), db.ForeignKey("orgs.id"), nullable=True)
    active = db.Column(db.Boolean, default=True, nullable=False)

    org = db.relationship("Org", back_populates="users", foreign_keys=[org_id])


class Project(db.Model):
    """โครงการ"""
    __tablename__ = "projects"

    id = db.Column(db.String(64), primary_key=True)
    org_id = db.Column(db.String(64), db.ForeignKey("orgs.id"), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    budget = db.Column(db.Float, nullable=True)
    objective = db.Column(db.Text, nullable=True)
    policy = db.Column(db.Text, nullable=True)
    owner = db.Column(db.String(255), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    sdg = db.Column(db.JSON, nullable=True)  # ['4.1','4.6'] etc
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = db.Column(db.String(64), nullable=True)

    org = db.relationship("Org", back_populates="projects")
    images = db.relationship("ProjectImage", back_populates="project", cascade="all, delete-orphan")


class ProjectImage(db.Model):
    """รูปภาพโครงการ (เก็บ base64 data URL)"""
    __tablename__ = "project_images"

    id = db.Column(db.String(64), primary_key=True)
    project_id = db.Column(db.String(64), db.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(255), nullable=True)
    data_url = db.Column(db.Text, nullable=False)  # base64 data URL
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    project = db.relationship("Project", back_populates="images")


class AuditLog(db.Model):
    """Audit log"""
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    at = db.Column(db.BigInteger, nullable=False)  # timestamp ms
    action = db.Column(db.String(64), nullable=False)
    by_username = db.Column(db.String(64), nullable=True)
    project_id = db.Column(db.String(64), nullable=True)
    project_title = db.Column(db.String(500), nullable=True)
    org_id = db.Column(db.String(64), nullable=True)
    details = db.Column(db.Text, nullable=True)
