from __future__ import annotations
from flask import Blueprint, jsonify, request, session
from app.database import db
from app.models import Org, User
from app.utils import get_current_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    org_id = data.get("orgId") or data.get("org_id")
    pin_raw = data.get("pin")
    pin = str(pin_raw).strip() if pin_raw is not None else ""

    if not pin or len(pin) != 6 or not pin.isdigit():
        return jsonify(message="PIN ต้องเป็นตัวเลข 6 หลัก"), 400

    if org_id == "admin":
        user = User.query.filter_by(role="admin", active=True).first()
        if not user or pin != user.password:
            return jsonify(message="รหัส PIN ของผู้ดูแลระบบไม่ถูกต้อง"), 401
        
        session["user_id"] = user.id
        session["role"] = "admin"
        session["org_id"] = None
        
        return jsonify(
            session={
                "role": "admin",
                "userId": user.id,
                "orgId": None,
            },
            message="เข้าสู่ระบบสำเร็จ",
        ), 200

    org = Org.query.filter_by(id=org_id, active=True).first()
    if not org:
        return jsonify(message="หน่วยงานถูกปิดใช้งาน"), 401

    user = User.query.filter_by(role="manager", org_id=org_id, active=True).first()
    if not user or pin != (org.pin or user.password):
        return jsonify(message="PIN ไม่ถูกต้อง"), 401

    session["user_id"] = user.id
    session["role"] = "manager"
    session["org_id"] = org_id

    return jsonify(
        session={
            "role": "manager",
            "userId": user.id,
            "orgId": org_id,
        },
        message="เข้าสู่ระบบสำเร็จ",
    ), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify(message="ออกจากระบบแล้ว"), 200

@auth_bp.route("/me", methods=["GET"])
def current_user():
    user = get_current_user()
    if not user:
        return jsonify(user=None), 200
    
    org_name = None
    if user.org_id:
        org = Org.query.get(user.org_id)
        org_name = org.name if org else None
    
    return jsonify(
        user={
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "orgId": user.org_id,
            "orgName": org_name,
        },
        session={
            "role": session.get("role"),
            "userId": user.id,
            "orgId": session.get("org_id"),
        },
    ), 200
