from __future__ import annotations
from flask import Blueprint, jsonify, request
from app.models import User
from app.utils import require_admin

user_bp = Blueprint("users", __name__)

@user_bp.route("/", methods=["GET"])
def list_users():
    err = require_admin()
    if err:
        return err
    users = User.query.order_by(User.username).all()
    items = [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "orgId": u.org_id,
            "active": u.active,
        }
        for u in users
    ]
    return jsonify(items=items), 200

@user_bp.route("/", methods=["POST"])
def create_user():
    payload = request.get_json(silent=True) or {}
    return jsonify(message="create user placeholder", payload=payload), 201

@user_bp.route("/<int:user_id>", methods=["PUT"])
def update_user(user_id: int):
    payload = request.get_json(silent=True) or {}
    return jsonify(
        message="update user placeholder",
        user_id=user_id,
        payload=payload,
    ), 200

@user_bp.route("/<int:user_id>/password", methods=["PUT"])
def change_user_password(user_id: int):
    payload = request.get_json(silent=True) or {}
    return jsonify(
        message="change user password placeholder",
        user_id=user_id,
        payload=payload,
    ), 200
