from __future__ import annotations
from flask import Blueprint, jsonify, request
from app.models import AuditLog

audit_bp = Blueprint("audit", __name__)

@audit_bp.route("/", methods=["GET"])
def list_audit_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    per_page = min(per_page, 100)
    
    action = request.args.get("action")
    org_id = request.args.get("org_id")
    
    query = AuditLog.query
    
    if action:
        query = query.filter(AuditLog.action == action)
    if org_id:
        query = query.filter(AuditLog.org_id == org_id)
    
    query = query.order_by(AuditLog.at.desc())
    
    total = query.count()
    logs = query.offset((page - 1) * per_page).limit(per_page).all()
    
    items = [
        {
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
        for log in logs
    ]
    
    return jsonify(
        items=items,
        total=total,
        page=page,
        perPage=per_page,
    ), 200
