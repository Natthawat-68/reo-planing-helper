from __future__ import annotations
import secrets
from flask import jsonify, session
from app.models import Org, User

ADMIN_ONLY_MSG = "เฉพาะผู้ดูแลระบบเท่านั้น"
LOGIN_REQUIRED_MSG = "กรุณาเข้าสู่ระบบ"

def get_current_user() -> User | None:
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)

def get_current_username() -> str:
    user = get_current_user()
    if user:
        return user.username
    return "unknown"

def require_admin() -> None | tuple:
    user = get_current_user()
    if not user or user.role != "admin":
        return jsonify(message=ADMIN_ONLY_MSG), 403
    return None

def require_login() -> None | tuple:
    if not get_current_user():
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
