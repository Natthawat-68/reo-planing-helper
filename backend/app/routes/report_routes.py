"""รายงาน / Export - Maintainer: นายไชยวัฒน์ ทำดี"""
from __future__ import annotations

import csv
import io

from flask import Blueprint, Response, request

from app.models import Org, Project
from app.utils import require_login

report_bp = Blueprint("reports", __name__)

# คอลัมน์มาตรฐานตามแบบฟอร์ม (เหมือน frontend exportCSV)
EXPORT_COLUMNS = [
    ("org", "หน่วยงานหลัก"),
    ("title", "ชื่อโครงการ"),
    ("budget", "งบประมาณ (บาท)"),
    ("objective", "วัตถุประสงค์ของโครงการ"),
    ("duration", "ระยะเวลาในการดำเนินงาน"),
    ("policy", "ข้อเสนอแนะเชิงนโยบาย"),
    ("owner", "ผู้รับผิดชอบ"),
    ("sdg", "SDG targets"),
    ("imageCount", "จำนวนรูป"),
    ("year", "ปีงบประมาณ"),
    ("startDate", "วันเริ่ม"),
    ("endDate", "วันสิ้นสุด"),
]


def _sanitize_cell(value) -> str:
    s = str(value or "").replace("\r", " ").replace("\n", " ").replace("\t", " ").strip()
    return s


def _row_to_csv_row(p: Project, org_name: str) -> list[str]:
    duration = ""
    if p.start_date or p.end_date:
        parts = []
        if p.start_date:
            parts.append(p.start_date.isoformat())
        if p.end_date:
            parts.append(p.end_date.isoformat())
        duration = " - ".join(parts)
    sdg_str = ", ".join(p.sdg) if p.sdg else ""
    image_count = len(p.images) if p.images else 0
    return [
        org_name,
        p.title or "",
        str(p.budget) if p.budget is not None else "",
        (p.objective or "").replace("\n", " "),
        duration,
        (p.policy or "").replace("\n", " "),
        p.owner or "",
        sdg_str,
        str(image_count),
        str(p.year) if p.year else "",
        p.start_date.isoformat() if p.start_date else "",
        p.end_date.isoformat() if p.end_date else "",
    ]


@report_bp.route("/export", methods=["GET"])
def export_projects():
    """ส่งออกข้อมูลโครงการเป็นไฟล์ CSV"""
    err = require_login()
    if err:
        return err

    org_id = request.args.get("orgId") or request.args.get("org_id")
    year_str = request.args.get("year")

    q = Project.query.order_by(Project.updated_at.desc())
    if org_id:
        q = q.filter_by(org_id=org_id)
    if year_str:
        try:
            q = q.filter_by(year=int(year_str))
        except ValueError:
            pass
    projects = q.all()

    # สร้าง CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([label for _, label in EXPORT_COLUMNS])

    org_cache = {}
    for p in projects:
        org_name = org_cache.get(p.org_id)
        if org_name is None:
            org = Org.query.get(p.org_id)
            org_name = org.name if org else p.org_id
            org_cache[p.org_id] = org_name
        row = [_sanitize_cell(v) for v in _row_to_csv_row(p, org_name)]
        writer.writerow(row)

    csv_content = output.getvalue()
    bom = "\ufeff"
    body = bom + csv_content

    return Response(
        body,
        mimetype="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=sdg4_projects_export.csv",
        },
    )
