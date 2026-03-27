from __future__ import annotations
from flask import Blueprint, jsonify
from sqlalchemy.orm import joinedload
from app.models import Admin, AuditLog, Org, Project
from app.routes.project_routes import _project_to_json

data_bp = Blueprint("data", __name__)


def _audit_to_json(log: AuditLog) -> dict:
    return {
        "id": log.id,
        "at": log.at,
        "action": log.action,
        "by": log.by_username,
        "byUsername": log.by_username,
        "projectId": log.project_id,
        "projectTitle": log.project_title,
        "orgId": log.org_id,
        "details": log.details,
    }


@data_bp.route("/full", methods=["GET"])
def get_full_data():
    users = [
        {
            "id": a.id,
            "username": a.username,
            "role": "admin",
            "active": a.active,
        }
        for a in Admin.query.all()
    ]

    orgs = [
        {
            "id": o.id,
            "name": o.name,
            "province": getattr(o, "province", None) or "",
            "active": o.active,
            "pin": o.pin,
            "projectCount": Project.query.filter_by(org_id=o.id).count(),
        }
        for o in Org.query.all()
    ]

    projects = (
        Project.query.options(
            joinedload(Project.images),
            joinedload(Project.org),
        )
        .order_by(Project.updated_at.desc())
        .all()
    )
    project_list = [_project_to_json(p) for p in projects]

    audit_logs = AuditLog.query.order_by(AuditLog.at.desc()).limit(500).all()
    audit_list = [_audit_to_json(log) for log in audit_logs]

    return jsonify(
        users=users,
        orgs=orgs,
        projects=project_list,
        audit=audit_list,
    ), 200


@data_bp.route("/stats", methods=["GET"])
def get_stats():
    total_orgs = Org.query.filter_by(active=True).count()
    total_projects = Project.query.count()

    sdg_count = {}
    for p in Project.query.all():
        if p.sdg:
            for s in p.sdg:
                sdg_count[s] = sdg_count.get(s, 0) + 1

    return jsonify(
        totalOrgs=total_orgs,
        totalProjects=total_projects,
        sdgCounts=sdg_count,
    ), 200
