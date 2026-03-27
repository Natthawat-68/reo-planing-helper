from __future__ import annotations

from sqlalchemy import inspect, text

from .database import db


def ensure_project_province_column() -> None:
    """SQLite: เพิ่มคอลัมน์ province ให้ตาราง projects ถ้ายังไม่มี และเติมค่าจาก orgs"""
    insp = inspect(db.engine)
    if "projects" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("projects")}
    if "province" in cols:
        return
    with db.engine.begin() as conn:
        conn.execute(text("ALTER TABLE projects ADD COLUMN province VARCHAR(120)"))
    with db.engine.begin() as conn:
        conn.execute(text(
            "UPDATE projects SET province = ("
            "  SELECT COALESCE(orgs.province, '') FROM orgs WHERE orgs.id = projects.org_id"
            ") WHERE province IS NULL OR province = ''"
        ))


def ensure_org_province_column() -> None:
    """SQLite: เพิ่มคอลัมน์ province ให้ตาราง orgs ถ้ายังไม่มี และเติมค่าเริ่มต้นให้ข้อมูลเดิม"""
    insp = inspect(db.engine)
    if "orgs" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("orgs")}
    if "province" in cols:
        return
    with db.engine.begin() as conn:
        conn.execute(text("ALTER TABLE orgs ADD COLUMN province VARCHAR(120)"))
    with db.engine.begin() as conn:
        conn.execute(
            text(
                "UPDATE orgs SET province = 'นครราชสีมา' "
                "WHERE province IS NULL OR province = ''"
            )
        )
        conn.execute(
            text(
                "UPDATE orgs SET province = 'ไม่ระบุ' "
                "WHERE id IN ('org-001', 'org-013', 'org-018')"
            )
        )
