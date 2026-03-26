from __future__ import annotations
from flask import Blueprint, jsonify
from app.models import AuditLog, Org, Project, ProjectImage, User
from app.utils import get_current_user, require_login

data_bp = Blueprint("data", __name__)

@data_bp.route("/full", methods=["GET"])
def get_full_data():
    err = require_login()
    if err:
        return err
    user = get_current_user()
    orgs = Org.query.order_by(Org.name).all()
    users = User.query.all()
    projects = Project.query.order_by(Project.updated_at.desc()).all()
    audit = []
    if user.role == "admin":
        for log in AuditLog.query.order_by(AuditLog.at.desc()).limit(500).all():
            audit.append({
                "at": log.at,
                "action": log.action,
                "by": log.by_username,
                "projectId": log.project_id,
                "projectTitle": log.project_title,
                "orgId": log.org_id,
                "details": log.details,
            })
    org_list = [
        {
            "id": o.id,
            "name": o.name,
            "active": o.active,
            "pin": o.pin if user.role == "admin" else "••••••"
        } 
        for o in orgs
    ]
    user_list = [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "orgId": u.org_id,
            "active": u.active
        } 
        for u in users
    ]
    project_list = []
    for p in projects:
        images = [
            {
                "id": i.id,
                "name": i.name,
                "dataUrl": i.data_url
            } 
            for i in p.images
        ]
        project_list.append({
            "id": p.id,
            "orgId": p.org_id,
            "title": p.title,
            "budget": p.budget,
            "objective": p.objective,
            "policy": p.policy,
            "owner": p.owner,
            "year": p.year,
            "startDate": p.start_date.isoformat() if p.start_date else None,
            "endDate": p.end_date.isoformat() if p.end_date else None,
            "sdg": p.sdg or [],
            "images": images,
            "createdAt": int(p.created_at.timestamp() * 1000) if p.created_at else None,
            "updatedAt": int(p.updated_at.timestamp() * 1000) if p.updated_at else None,
            "updatedBy": p.updated_by,
        })
    return jsonify(
        orgs=org_list,
        users=user_list,
        projects=project_list,
        audit=audit,
    ), 200
