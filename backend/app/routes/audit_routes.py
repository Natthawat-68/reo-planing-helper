"""Audit log routes. Maintainer: นายนัธทวัฒน์ เขาแก้ว"""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.database import db
from app.models import AuditLog, Org, User
from app.utils import get_current_user, require_admin

audit_bp = Blueprint("audit_logs", __name__)


def _get_display_name(username: str) -> str:
    if not username:
        return "-"
    if username == "admin":
        return "Admin"
    if username.startswith("mgr-"):
        from app.models import Org
        org_id = username.replace("mgr-", "")
        org = Org.query.get(org_id)
        return org.name if org else username
    return username


@audit_bp.route("/", methods=["GET"])
def list_audit_logs():
    err = require_admin()
    if err:
        return err

    action = request.args.get("action")
    by_user = request.args.get("by")
    from_ts = request.args.get("from")
    sort = request.args.get("sort", "newest")

    q = AuditLog.query
    if action:
        q = q.filter_by(action=action)
    if by_user:
        q = q.filter_by(by_username=by_user)
    if from_ts:
        try:
            ts = int(from_ts)
            q = q.filter(AuditLog.at >= ts)
        except ValueError:
            pass

    if sort == "oldest":
        q = q.order_by(AuditLog.at.asc())
    else:
        q = q.order_by(AuditLog.at.desc())

    logs = q.all()
    items = []
    for log in logs:
        org_name = None
        if log.org_id:
            org = Org.query.get(log.org_id)
            org_name = org.name if org else log.org_id
        items.append({
            "at": log.at,
            "action": log.action,
            "by": log.by_username,
            "displayName": _get_display_name(log.by_username),
            "projectId": log.project_id,
            "projectTitle": log.project_title,
            "orgId": log.org_id,
            "orgName": org_name,
            "details": log.details,
        })
    return jsonify(items=items), 200


@audit_bp.route("/filters", methods=["GET"])
def audit_filters():
    err = require_admin()
    if err:
        return err

    users = db.session.query(AuditLog.by_username).distinct().filter(AuditLog.by_username.isnot(None)).all()
    users = sorted({u[0] for u in users})
    actions = [
        ("create_project", "สร้างโครงการ"),
        ("create_org", "สร้างหน่วยงาน"),
        ("update_project", "แก้ไขโครงการ"),
        ("delete_project", "ลบโครงการ"),
        ("upload_image", "อัปโหลดรูป"),
        ("delete_image", "ลบรูป"),
        ("delete_org", "ลบหน่วยงาน"),
        ("set_org_pin", "ตั้ง PIN หน่วยงาน"),
    ]
    return jsonify(
        actions=[{"id": a[0], "label": a[1]} for a in actions],
        users=[{"username": u, "displayName": _get_display_name(u)} for u in users],
    ), 200
