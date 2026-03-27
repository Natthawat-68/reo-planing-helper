from __future__ import annotations
import secrets
from flask import jsonify, session
from app.models import Admin, Org

ADMIN_ONLY_MSG = "เฉพาะผู้ดูแลระบบเท่านั้น"
LOGIN_REQUIRED_MSG = "กรุณาเข้าสู่ระบบ"

def get_current_admin() -> Admin | None:
    admin_id = session.get("admin_id")
    if not admin_id:
        return None
    return Admin.query.get(admin_id)

def get_current_username() -> str:
    admin = get_current_admin()
    if admin:
        return admin.username
    org_id = session.get("org_id")
    if org_id:
        org = Org.query.get(org_id)
        if org:
            return org.name
    return "unknown"

def require_admin() -> None | tuple:
    admin = get_current_admin()
    if not admin:
        return jsonify(message=ADMIN_ONLY_MSG), 403
    return None

def require_login() -> None | tuple:
    admin_id = session.get("admin_id")
    org_id = session.get("org_id")
    if not admin_id and not org_id:
        return jsonify(message=LOGIN_REQUIRED_MSG), 401
    return None

def random_pin_6() -> str:
    return str(secrets.randbelow(900000) + 100000)

def generate_unique_org_pin(existing: set[str] | None = None) -> str:
    if existing is None:
        existing = {o.pin for o in Org.query.all() if o.pin}
    for _ in range(1000):
        pin = random_pin_6()
        if pin not in existing:
            return pin
    raise ValueError("ไม่สามารถสร้าง PIN ไม่ซ้ำได้")
