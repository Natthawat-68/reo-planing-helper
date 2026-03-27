from __future__ import annotations
from flask import Blueprint, jsonify, request, session
from app.database import db
from app.models import Admin, Org

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    org_id = data.get("orgId") or data.get("org_id")
    pin_raw = data.get("pin")
    pin = str(pin_raw).strip() if pin_raw is not None else ""

    if not pin or len(pin) != 6 or not pin.isdigit():
        return jsonify(message="PIN ต้องเป็นตัวเลข 6 หลัก"), 400

    # Admin login
    if org_id == "admin":
        admin = Admin.query.filter_by(active=True).first()
        if not admin or pin != admin.password:
            return jsonify(message="รหัส PIN ของผู้ดูแลระบบไม่ถูกต้อง"), 401
        
        session["admin_id"] = admin.id
        session["role"] = "admin"
        session["org_id"] = None
        
        return jsonify(
            session={
                "role": "admin",
                "adminId": admin.id,
                "orgId": None,
            },
            message="เข้าสู่ระบบสำเร็จ",
        ), 200

    # Org login - ใช้เฉพาะ orgs.pin
    org = Org.query.filter_by(id=org_id, active=True).first()
    if not org:
        return jsonify(message="หน่วยงานถูกปิดใช้งาน"), 401

    if pin != org.pin:
        return jsonify(message="PIN ไม่ถูกต้อง"), 401

    session["admin_id"] = None
    session["role"] = "org"
    session["org_id"] = org_id

    return jsonify(
        session={
            "role": "org",
            "adminId": None,
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
    admin_id = session.get("admin_id")
    org_id = session.get("org_id")
    role = session.get("role")

    if role == "admin" and admin_id:
        admin = Admin.query.get(admin_id)
        if not admin or not admin.active:
            return jsonify(user=None), 200
        return jsonify(
            user={
                "id": admin.id,
                "username": admin.username,
                "role": "admin",
                "orgId": None,
                "orgName": None,
            },
            session={
                "role": "admin",
                "adminId": admin.id,
                "orgId": None,
            },
        ), 200

    if role == "org" and org_id:
        org = Org.query.get(org_id)
        if not org or not org.active:
            return jsonify(user=None), 200
        return jsonify(
            user={
                "id": org.id,
                "username": org.name,
                "role": "org",
                "orgId": org.id,
                "orgName": org.name,
            },
            session={
                "role": "org",
                "adminId": None,
                "orgId": org.id,
            },
        ), 200

    return jsonify(user=None), 200
