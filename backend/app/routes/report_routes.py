from __future__ import annotations
import csv
import io
from flask import Blueprint, Response, request
from app.models import Org, Project
from app.utils import require_login

report_bp = Blueprint("report", __name__)

@report_bp.route("/export", methods=["GET"])
def export_csv():
    err = require_login()
    if err:
        return err
    org_id = request.args.get("orgId")
    year = request.args.get("year")
    year_int = None
    if year:
        try:
            year_int = int(year)
        except ValueError:
            pass
    output = io.StringIO()
    writer = csv.writer(output, lineterminator='\n')
    output.write('\ufeff')
    writer.writerow([
        "ลำดับที่",
        "ชื่อโครงการ",
        "หน่วยงาน",
        "ผู้รับผิดชอบ",
        "ปีงบประมาณ",
        "วันเริ่มต้น",
        "วันสิ้นสุด",
        "งบประมาณ (บาท)",
        "SDG Targets",
    ])
    q = Project.query
    if org_id:
        q = q.filter_by(org_id=org_id)
    if year_int:
        q = q.filter_by(year=year_int)
    projects = q.order_by(Project.title).all()
    org_names: dict[str, str] = {}
    for i, p in enumerate(projects, 1):
        if p.org_id not in org_names:
            org = Org.query.get(p.org_id)
            org_names[p.org_id] = org.name if org else "ไม่ระบุ"
        org_name = org_names[p.org_id]
        start_str = p.start_date.isoformat() if p.start_date else ""
        end_str = p.end_date.isoformat() if p.end_date else ""
        sdg_str = ", ".join(p.sdg) if p.sdg else ""
        writer.writerow([
            i,
            p.title,
            org_name,
            p.owner or "",
            p.year or "",
            start_str,
            end_str,
            p.budget or 0,
            sdg_str,
        ])
    from datetime import datetime
    now = datetime.now()
    filename = f"projects_report_{now.strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{filename}",
        },
    )
