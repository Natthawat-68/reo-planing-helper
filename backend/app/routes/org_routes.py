"""Organization routes. Maintainer: นายศิขรินทร์ ภูติโส"""
from __future__ import annotations

import time

from flask import Blueprint, jsonify, request

from app.database import db
from app.models import AuditLog, Org, Project, User
from app.utils import generate_unique_org_pin, get_current_username, require_admin

org_bp = Blueprint("orgs", __name__)


def _org_to_json(org: Org) -> dict:
    project_count = Project.query.filter_by(org_id=org.id).count()
    return {
        "id": org.id,
        "name": org.name,
        "active": org.active,
        "pin": org.pin,
        "projectCount": project_count,
    }


@org_bp.route("/", methods=["GET"])
def list_orgs():
    """Admin only - full list with pin."""
    err = require_admin()
    if err:
        return err
    orgs = Org.query.order_by(Org.name).all()
    return jsonify(items=[_org_to_json(o) for o in orgs]), 200


@org_bp.route("/public", methods=["GET"])
def list_orgs_public():
    """Read-only list for managers (no pin)."""
    orgs = Org.query.filter_by(active=True).order_by(Org.name).all()
    items = []
    for o in orgs:
        project_count = Project.query.filter_by(org_id=o.id).count()
        items.append({
            "id": o.id,
            "name": o.name,
            "active": o.active,
            "projectCount": project_count,
        })
    return jsonify(items=items), 200


@org_bp.route("/", methods=["POST"])
def create_org():
    err = require_admin()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    name_raw = data.get("name")
    name = str(name_raw).strip() if name_raw is not None else ""
    if not name:
        return jsonify(message="กรุณาระบุชื่อหน่วยงาน"), 400

    import uuid
    org_id = "org-" + uuid.uuid4().hex[:8]
    pin = generate_unique_org_pin()
    org = Org(id=org_id, name=name, active=True, pin=pin)
    db.session.add(org)

    mgr = User(
        id=f"u-mgr-{org_id}",
        username=f"mgr-{org_id}",
        password=pin,
        role="manager",
        org_id=org_id,
        active=True,
    )
    db.session.add(mgr)
    db.session.add(AuditLog(
        at=int(time.time() * 1000),
        action="create_org",
        by_username=get_current_username(),
        org_id=org_id,
        details=f"สร้างหน่วยงาน: {name}",
    ))
    db.session.commit()

    return jsonify(item=_org_to_json(org), message="เพิ่มหน่วยงานสำเร็จ"), 201


@org_bp.route("/<org_id>", methods=["PUT"])
def update_org(org_id: str):
    err = require_admin()
    if err:
        return err

    org = Org.query.get(org_id)
    if not org:
        return jsonify(message="ไม่พบหน่วยงาน"), 404

    data = request.get_json(silent=True) or {}
    name_raw = data.get("name")
    name = str(name_raw).strip() if name_raw is not None else ""
    if name:
        org.name = name
    if "active" in data:
        new_active = bool(data["active"])
        org.active = new_active
        # อัปเดต active ของ manager ของหน่วยงานนี้ให้ตรงกัน
        mgr = User.query.filter_by(role="manager", org_id=org_id).first()
        if mgr:
            mgr.active = new_active
    db.session.commit()
    return jsonify(item=_org_to_json(org), message="อัปเดตสำเร็จ"), 200


@org_bp.route("/<org_id>", methods=["DELETE"])
def delete_org(org_id: str):
    err = require_admin()
    if err:
        return err

    org = Org.query.get(org_id)
    if not org:
        return jsonify(message="ไม่พบหน่วยงาน"), 404

    project_count = Project.query.filter_by(org_id=org_id).count()

    if project_count > 0:
        return jsonify(
            message="ไม่สามารถลบได้ กรุณาลบโครงการที่เกี่ยวข้องก่อน",
            projectCount=project_count,
        ), 400

    User.query.filter_by(role="manager", org_id=org_id).delete()
    db.session.add(AuditLog(
        at=int(time.time() * 1000),
        action="delete_org",
        by_username=get_current_username(),
        org_id=org_id,
        details=f"ลบหน่วยงาน: {org.name}",
    ))
    db.session.delete(org)
    db.session.commit()
    return jsonify(message="ลบหน่วยงานสำเร็จ"), 200
