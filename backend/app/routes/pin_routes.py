from __future__ import annotations
import time
from datetime import datetime
from flask import Blueprint, jsonify, request
from app.database import db
from app.models import AuditLog, Org, User
from app.utils import get_current_username, require_admin

pin_bp = Blueprint("org_pins", __name__)

@pin_bp.route("/<org_id>/pin", methods=["PUT"])
def set_org_pin(org_id: str):
    err = require_admin()
    if err:
        return err
    org = Org.query.get(org_id)
    if not org:
        return jsonify(message="ไม่พบหน่วยงาน"), 404
    data = request.get_json(silent=True) or {}
    pin = str(data.get("pin", "")).strip()
    if not pin or len(pin) != 6 or not pin.isdigit():
        return jsonify(message="PIN ต้องเป็นตัวเลข 6 หลัก"), 400
    org.pin = pin
    db.session.add(org)
    mgr = User.query.filter_by(role="manager", org_id=org_id).first()
    if mgr:
        mgr.password = pin
        db.session.add(mgr)
    ts_ms = int(time.time() * 1000)
    time_str = datetime.fromtimestamp(ts_ms / 1000.0).strftime("%d/%m/%Y %H:%M:%S")
    db.session.add(AuditLog(
        at=ts_ms,
        action="set_org_pin",
        by_username=get_current_username(),
        org_id=org_id,
        details=f"เปลี่ยน PIN หน่วยงาน เมื่อ {time_str}",
    ))
    db.session.commit()
    return jsonify(message="บันทึก PIN สำเร็จ"), 200
