from __future__ import annotations
import time
import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request
from app.database import db
from app.models import AuditLog, Project, ProjectImage
from app.utils import get_current_user, require_login

project_bp = Blueprint("projects", __name__)

def _project_to_json(p: Project) -> dict:
    images = [
        {
            "id": i.id,
            "name": i.name,
            "dataUrl": i.data_url
        } 
        for i in p.images
    ]
    return {
        "id": p.id,
        "orgId": p.org_id,
        "title": p.title,
        "budget": p.budget,
        "objective": p.objective,
        "policy": p.policy,
        "owner": p.owner,
        "year": p.year,
        "startDate": p.start_date.isoformat() if p.start_date else None,
        "endDate": p.end_date.isoformat() if p.end_date else None,
        "sdg": p.sdg or [],
        "images": images,
        "createdAt": int(p.created_at.timestamp() * 1000) if p.created_at else None,
        "updatedAt": int(p.updated_at.timestamp() * 1000) if p.updated_at else None,
        "updatedBy": p.updated_by,
    }

def _safe_strip(val):
    if val is None:
        return ""
    return str(val).strip()

def _parse_date(s):
    if s is None:
        return None
    s = str(s) if not isinstance(s, str) else s
    if not s.strip():
        return None
    try:
        return datetime.strptime(s[:10], "%Y-%m-%d").date()
    except Exception:
        return None

def _check_can_edit(project: Project, user) -> bool:
    if user.role == "admin":
        return True
    if user.role == "manager" and project.org_id == user.org_id:
        return True
    return False

@project_bp.route("/", methods=["GET"])
def list_projects():
    err = require_login()
    if err:
        return err
    org_id = request.args.get("orgId")
    sdg = request.args.get("sdg")
    year = request.args.get("year")
    search = (request.args.get("search") or "").strip().lower()
    q = Project.query
    if org_id:
        q = q.filter_by(org_id=org_id)
    if year:
        try:
            q = q.filter_by(year=int(year))
        except ValueError:
            pass
    if search:
        q = q.filter(Project.title.ilike(f"%{search}%"))
    projects = q.order_by(Project.updated_at.desc()).all()
    if sdg:
        projects = [p for p in projects if p.sdg and sdg in p.sdg]
    items = [_project_to_json(p) for p in projects]
    return jsonify(items=items), 200

@project_bp.route("/all", methods=["GET"])
def list_all_projects():
    return list_projects()

@project_bp.route("/<project_id>", methods=["GET"])
def get_project(project_id: str):
    err = require_login()
    if err:
        return err
    p = Project.query.get(project_id)
    if not p:
        return jsonify(message="ไม่พบโครงการ"), 404
    return jsonify(item=_project_to_json(p)), 200

@project_bp.route("/", methods=["POST"])
def create_project():
    err = require_login()
    if err:
        return err
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    title = _safe_strip(data.get("title"))
    if not title:
        return jsonify(message="กรุณาระบุชื่อโครงการ"), 400
    org_id = data.get("orgId") or data.get("org_id")
    if user.role == "manager":
        org_id = user.org_id
    if not org_id:
        return jsonify(message="กรุณาระบุหน่วยงาน"), 400
    try:
        budget_val = float(data.get("budget") or 0)
        if budget_val < 0:
            return jsonify(message="กรุณาระบุงบประมาณให้ถูกต้อง"), 400
    except (TypeError, ValueError):
        return jsonify(message="กรุณาระบุงบประมาณให้ถูกต้อง"), 400
    owner = _safe_strip(data.get("owner"))
    if not owner:
        return jsonify(message="กรุณาระบุผู้รับผิดชอบ"), 400
    year = data.get("year")
    if not year or (isinstance(year, (int, float)) and (year < 2400 or year > 2600)):
        return jsonify(message="กรุณาระบุปีงบประมาณให้ถูกต้อง"), 400
    start_date = _parse_date(data.get("startDate") or data.get("start_date"))
    if not start_date:
        return jsonify(message="กรุณาระบุวันเริ่มต้น"), 400
    end_date = _parse_date(data.get("endDate") or data.get("end_date"))
    if not end_date:
        return jsonify(message="กรุณาระบุวันสิ้นสุด"), 400
    if start_date > end_date:
        return jsonify(message="วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น"), 400
    objective = _safe_strip(data.get("objective"))
    if not objective:
        return jsonify(message="กรุณาระบุวัตถุประสงค์"), 400
    policy = _safe_strip(data.get("policy"))
    if not policy:
        return jsonify(message="กรุณาระบุนโยบาย/ข้อเสนอแนะ"), 400
    sdg = data.get("sdg") or []
    if not sdg:
        return jsonify(message="กรุณาเลือกอย่างน้อย 1 SDG Target"), 400
    images = data.get("images") or []
    if len(images) < 3:
        return jsonify(message="กรุณาอัปโหลดรูปกิจกรรมอย่างน้อย 3 รูป"), 400
    if len(images) > 4:
        return jsonify(message="รูปภาพต้องไม่เกิน 4 รูป"), 400

    project_id = "p-" + uuid.uuid4().hex[:12]
    p = Project(
        id=project_id,
        org_id=org_id,
        title=title,
        budget=budget_val,
        objective=objective,
        policy=policy,
        owner=owner,
        year=int(year),
        start_date=start_date,
        end_date=end_date,
        sdg=sdg,
        updated_by=user.username,
    )
    db.session.add(p)
    for img in images[:4]:
        img_id = img.get("id") or "img-" + uuid.uuid4().hex[:8]
        pi = ProjectImage(
            id=img_id,
            project_id=project_id,
            name=img.get("name"),
            data_url=img.get("dataUrl") or img.get("data_url") or "",
        )
        db.session.add(pi)
    db.session.add(AuditLog(
        at=int(time.time() * 1000),
        action="create_project",
        by_username=user.username,
        project_id=project_id,
        project_title=title,
        org_id=org_id,
        details=f"สร้างโครงการใหม่: {title}",
    ))
    db.session.commit()
    p = Project.query.get(project_id)
    return jsonify(item=_project_to_json(p), message="สร้างโครงการสำเร็จ"), 201

@project_bp.route("/<project_id>", methods=["PUT"])
def update_project(project_id: str):
    err = require_login()
    if err:
        return err
    user = get_current_user()
    p = Project.query.get(project_id)
    if not p:
        return jsonify(message="ไม่พบโครงการ"), 404
    if not _check_can_edit(p, user):
        return jsonify(message="ไม่มีสิทธิ์แก้ไขโครงการนี้"), 403
    data = request.get_json(silent=True) or {}
    old_title = p.title
    if "title" in data:
        t = _safe_strip(data.get("title"))
        if not t:
            return jsonify(message="กรุณาระบุชื่อโครงการ"), 400
    else:
        t = p.title
    try:
        budget_val = float(data.get("budget", p.budget) or 0)
        if budget_val < 0:
            return jsonify(message="กรุณาระบุงบประมาณให้ถูกต้อง"), 400
    except (TypeError, ValueError):
        return jsonify(message="กรุณาระบุงบประมาณให้ถูกต้อง"), 400
    owner_val = _safe_strip(data.get("owner") or p.owner or "")
    if not owner_val:
        return jsonify(message="กรุณาระบุผู้รับผิดชอบ"), 400
    year_val = data.get("year", p.year)
    if not year_val or (isinstance(year_val, (int, float)) and (year_val < 2400 or year_val > 2600)):
        return jsonify(message="กรุณาระบุปีงบประมาณให้ถูกต้อง"), 400
    start_date_val = _parse_date(data.get("startDate") or data.get("start_date")) or p.start_date
    if not start_date_val:
        return jsonify(message="กรุณาระบุวันเริ่มต้น"), 400
    end_date_val = _parse_date(data.get("endDate") or data.get("end_date")) or p.end_date
    if not end_date_val:
        return jsonify(message="กรุณาระบุวันสิ้นสุด"), 400
    if start_date_val > end_date_val:
        return jsonify(message="วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น"), 400
    objective_val = _safe_strip(data.get("objective") or p.objective or "")
    if not objective_val:
        return jsonify(message="กรุณาระบุวัตถุประสงค์"), 400
    policy_val = _safe_strip(data.get("policy") or p.policy or "")
    if not policy_val:
        return jsonify(message="กรุณาระบุนโยบาย/ข้อเสนอแนะ"), 400
    sdg_val = data.get("sdg") or p.sdg or []
    if not sdg_val:
        return jsonify(message="กรุณาเลือกอย่างน้อย 1 SDG Target"), 400
    if "images" in data:
        images_val = data.get("images") or []
        if len(images_val) < 3:
            return jsonify(message="กรุณาอัปโหลดรูปกิจกรรมอย่างน้อย 3 รูป"), 400
        if len(images_val) > 4:
            return jsonify(message="รูปภาพต้องไม่เกิน 4 รูป"), 400
        ProjectImage.query.filter_by(project_id=project_id).delete()
        for img in images_val[:4]:
            img_id = img.get("id") or "img-" + uuid.uuid4().hex[:8]
            pi = ProjectImage(
                id=img_id,
                project_id=project_id,
                name=img.get("name"),
                data_url=img.get("dataUrl") or img.get("data_url") or "",
            )
            db.session.add(pi)
    p.title = t
    p.budget = budget_val
    p.owner = owner_val
    p.year = int(year_val)
    p.start_date = start_date_val
    p.end_date = end_date_val
    p.objective = objective_val
    p.policy = policy_val
    p.sdg = sdg_val
    if "orgId" in data and user.role == "admin":
        p.org_id = data["orgId"]
    p.updated_by = user.username
    db.session.add(AuditLog(
        at=int(time.time() * 1000),
        action="update_project",
        by_username=user.username,
        project_id=project_id,
        project_title=p.title,
        org_id=p.org_id,
        details=f"แก้ไขโครงการ: {old_title}",
    ))
    db.session.commit()
    return jsonify(item=_project_to_json(p), message="อัปเดตสำเร็จ"), 200

@project_bp.route("/<project_id>", methods=["DELETE"])
def delete_project(project_id: str):
    err = require_login()
    if err:
        return err
    user = get_current_user()
    p = Project.query.get(project_id)
    if not p:
        return jsonify(message="ไม่พบโครงการ"), 404
    if not _check_can_edit(p, user):
        return jsonify(message="ไม่มีสิทธิ์ลบโครงการนี้"), 403
    title = p.title
    org_id = p.org_id
    db.session.add(AuditLog(
        at=int(time.time() * 1000),
        action="delete_project",
        by_username=user.username,
        project_id=project_id,
        project_title=title,
        org_id=org_id,
        details=f"ลบโครงการ: {title}",
    ))
    db.session.delete(p)
    db.session.commit()
    return jsonify(message="ลบโครงการสำเร็จ"), 200

@project_bp.route("/<project_id>/images", methods=["POST"])
def upload_project_images(project_id: str):
    err = require_login()
    if err:
        return err
    user = get_current_user()
    p = Project.query.get(project_id)
    if not p:
        return jsonify(message="ไม่พบโครงการ"), 404
    if not _check_can_edit(p, user):
        return jsonify(message="ไม่มีสิทธิ์แก้ไขโครงการนี้"), 403
    data = request.get_json(silent=True) or {}
    images = data.get("images") or []
    existing = len(p.images)
    if existing + len(images) > 4:
        return jsonify(message="รูปภาพสูงสุด 4 รูป"), 400
    added = 0
    for img in images[: 4 - existing]:
        img_id = "img-" + uuid.uuid4().hex[:8]
        pi = ProjectImage(
            id=img_id,
            project_id=project_id,
            name=img.get("name"),
            data_url=img.get("dataUrl") or img.get("data_url") or "",
        )
        db.session.add(pi)
        added += 1
    p.updated_by = user.username
    db.session.add(AuditLog(
        at=int(time.time() * 1000),
        action="upload_image",
        by_username=user.username,
        project_id=project_id,
        project_title=p.title,
        org_id=p.org_id,
        details=f"อัปโหลดรูป {added} รูป",
    ))
    db.session.commit()
    return jsonify(item=_project_to_json(p), message=f"อัปโหลดรูป {added} รูปสำเร็จ"), 201

@project_bp.route("/<project_id>/images/<image_id>", methods=["DELETE"])
def delete_project_image(project_id: str, image_id: str):
    err = require_login()
    if err:
        return err
    user = get_current_user()
    p = Project.query.get(project_id)
    if not p:
        return jsonify(message="ไม่พบโครงการ"), 404
    if not _check_can_edit(p, user):
        return jsonify(message="ไม่มีสิทธิ์แก้ไขโครงการนี้"), 403
    img = ProjectImage.query.filter_by(id=image_id, project_id=project_id).first()
    if not img:
        return jsonify(message="ไม่พบรูปภาพ"), 404
    db.session.delete(img)
    p.updated_by = user.username
    db.session.add(AuditLog(
        at=int(time.time() * 1000),
        action="delete_image",
        by_username=user.username,
        project_id=project_id,
        project_title=p.title,
        org_id=p.org_id,
        details=f"ลบรูป: {img.name or 'unknown'}",
    ))
    db.session.commit()
    return jsonify(item=_project_to_json(p), message="ลบรูปภาพสำเร็จ"), 200
