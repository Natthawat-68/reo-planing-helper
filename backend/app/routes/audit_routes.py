from __future__ import annotations
from flask import Blueprint, jsonify, request
from app.models import AuditLog
from app.utils import require_admin

audit_bp = Blueprint("audit", __name__)

@audit_bp.route("/", methods=["GET"])
def list_audit_logs():
    err = require_admin()
    if err:
        return err
    action = request.args.get("action")
    by_username = request.args.get("by")
    org_id = request.args.get("orgId")
    project_id = request.args.get("projectId")
    try:
        limit = int(request.args.get("limit", 500))
    except ValueError:
        limit = 500
    if limit > 1000:
        limit = 1000
    q = AuditLog.query
    if action:
        q = q.filter_by(action=action)
    if by_username:
        q = q.filter_by(by_username=by_username)
    if org_id:
        q = q.filter_by(org_id=org_id)
    if project_id:
        q = q.filter_by(project_id=project_id)
    logs = q.order_by(AuditLog.at.desc()).limit(limit).all()
    items = [
        {
            "at": log.at,
            "action": log.action,
            "by": log.by_username,
            "projectId": log.project_id,
            "projectTitle": log.project_title,
            "orgId": log.org_id,
            "details": log.details,
        }
        for log in logs
    ]
    return jsonify(items=items), 200
