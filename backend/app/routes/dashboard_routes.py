from __future__ import annotations
from collections import defaultdict
from flask import Blueprint, jsonify, request
from app.models import Org, Project
from locale import strxfrm

dashboard_bp = Blueprint("dashboard", __name__)


def _all_projects(province=None):
    q = Project.query
    if province == "__unspecified__":
        # กรองเฉพาะโครงการที่ไม่มี province (province ว่าง)
        q = q.filter((Project.province == None) | (Project.province == ""))
    elif province:
        q = q.filter(Project.province == province)
    return q.all()


def _all_orgs(province=None):
    q = Org.query.filter_by(active=True)
    if province:
        q = q.filter(Org.province == province)
    return q.all()


def _by_org_items(province=None) -> list[dict]:
    orgs = {o.id: o for o in _all_orgs(province)}
    by_org: dict[str, dict] = {}
    for p in _all_projects(province):
        oid = p.org_id
        if oid not in by_org:
            by_org[oid] = {
                "orgId": oid,
                "orgName": orgs[oid].name if oid in orgs else oid,
                "province": orgs[oid].province if oid in orgs else (p.province or ""),
                "projectCount": 0,
                "count": 0,
                "budget": 0.0,
            }
        by_org[oid]["projectCount"] += 1
        by_org[oid]["count"] += 1
        by_org[oid]["budget"] += float(p.budget or 0)
    return sorted(by_org.values(), key=lambda x: x["orgName"] or "")


@dashboard_bp.route("/summary", methods=["GET"])
def get_summary():
    province = (request.args.get("province") or "").strip()
    # ใช้ _all_orgs แบบไม่กรอง (สำหรับแสดงจำนวนหน่วยงานทั้งหมด)
    orgs = _all_orgs(None)
    projects = _all_projects(province if province else None)

    total_orgs = len(orgs)
    total_projects = len(projects)
    total_budget = sum((p.budget or 0) for p in projects)

    sdg_count = {}
    for p in projects:
        if p.sdg:
            for s in p.sdg:
                sdg_count[s] = sdg_count.get(s, 0) + 1

    # recent projects - ต้องจัดการ __unspecified__ ด้วย
    recent_q = Project.query
    if province == "__unspecified__":
        recent_q = recent_q.filter((Project.province == None) | (Project.province == ""))
    elif province:
        recent_q = recent_q.filter(Project.province == province)

    recent_projects = recent_q.order_by(Project.updated_at.desc()).limit(5).all()
    recent = [
        {
            "id": p.id,
            "title": p.title,
            "orgId": p.org_id,
            "year": p.year,
            "updatedAt": int(p.updated_at.timestamp() * 1000) if p.updated_at else None,
        }
        for p in recent_projects
    ]

    return jsonify(
        totalOrgs=total_orgs,
        totalProjects=total_projects,
        totalBudget=total_budget,
        sdgCounts=sdg_count,
        recentProjects=recent,
    ), 200


@dashboard_bp.route("/by-org", methods=["GET"])
def get_by_org():
    province = (request.args.get("province") or "").strip() or None
    # กรองตาม province ของโครงการ
    return jsonify(items=_by_org_items_by_project_province(province)), 200


def _by_org_items_by_project_province(province=None) -> list[dict]:
    """ดึงข้อมูลตามหน่วยงาน โดยกรองตาม province ของโครงการ"""
    orgs = {o.id: o for o in _all_orgs(None)}

    # กรองโครงการตาม province
    projects_q = Project.query
    if province == "__unspecified__":
        projects_q = projects_q.filter((Project.province == None) | (Project.province == ""))
    elif province:
        projects_q = projects_q.filter(Project.province == province)
    projects = projects_q.all()

    by_org: dict[str, dict] = {}
    for p in projects:
        oid = p.org_id
        if oid not in by_org:
            by_org[oid] = {
                "orgId": oid,
                "orgName": orgs[oid].name if oid in orgs else oid,
                "province": p.province or "",  # ใช้ province ของโครงการโดยตรง
                "projectCount": 0,
                "count": 0,
                "budget": 0.0,
            }
        by_org[oid]["projectCount"] += 1
        by_org[oid]["count"] += 1
        by_org[oid]["budget"] += float(p.budget or 0)
    return sorted(by_org.values(), key=lambda x: x["orgName"] or "")


@dashboard_bp.route("/by-sdg", methods=["GET"])
def get_by_sdg():
    province = (request.args.get("province") or "").strip() or None
    sdg_projects: dict[str, set[str]] = defaultdict(set)

    # กรองโครงการตาม province
    projects_q = Project.query
    if province == "__unspecified__":
        projects_q = projects_q.filter((Project.province == None) | (Project.province == ""))
    elif province:
        projects_q = projects_q.filter(Project.province == province)

    for p in projects_q.all():
        if not p.sdg:
            continue
        for code in p.sdg:
            sdg_projects[code].add(p.id)

    items = [
        {
            "sdg": code,
            "projectCount": len(pids),
            "count": len(pids),
        }
        for code, pids in sorted(sdg_projects.items(), key=lambda x: x[0])
    ]
    return jsonify(items=items), 200


@dashboard_bp.route("/by-province", methods=["GET"])
def get_by_province():
    projects = Project.query.all()
    by_province: dict[str, dict] = {}
    sdg_by_province: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for p in projects:
        prov = (p.province or "").strip()
        if not prov:
            prov = "ไม่ระบุ"
        if prov not in by_province:
            by_province[prov] = {"province": prov, "projectCount": 0, "count": 0, "budget": 0.0, "orgCount": 0}
        by_province[prov]["projectCount"] += 1
        by_province[prov]["count"] += 1
        by_province[prov]["budget"] += float(p.budget or 0)
        if p.sdg:
            for s in p.sdg:
                sdg_by_province[prov][s] = sdg_by_province[prov].get(s, 0) + 1

    # org count per province
    orgs_by_province: dict[str, set] = defaultdict(set)
    for o in Org.query.filter_by(active=True).all():
        prov = (o.province or "").strip() or "ไม่ระบุ"
        orgs_by_province[prov].add(o.id)
    for prov in by_province:
        by_province[prov]["orgCount"] = len(orgs_by_province.get(prov, set()))

    # add top SDG per province
    for prov in by_province:
        sdg_counts = sdg_by_province.get(prov, {})
        if sdg_counts:
            top_sdg = max(sdg_counts, key=sdg_counts.get)
            by_province[prov]["topSdg"] = top_sdg
        else:
            by_province[prov]["topSdg"] = None

    items = sorted(by_province.values(), key=lambda x: x["province"] or "")
    return jsonify(items=items), 200


@dashboard_bp.route("/province-options", methods=["GET"])
def get_province_options():
    """ดึงรายชื่อจังหวัดจากข้อมูลโครงการเท่านั้น (ไม่รวมหน่วยงาน)"""
    provinces = set()
    has_unspecified = False

    for p in Project.query.all():
        prov = (p.province or "").strip()
        if prov:
            provinces.add(prov)
        else:
            has_unspecified = True

    items = []
    if has_unspecified:
        items.append({"value": "__unspecified__", "label": "ไม่ระบุ"})
    items.extend([{"value": p, "label": p} for p in sorted(provinces, key=_locale_sort_key)])
    return jsonify(items=items), 200


@dashboard_bp.route("/org-province-options", methods=["GET"])
def get_org_province_options():
    """ดึงรายชื่อจังหวัดจากข้อมูลหน่วยงาน"""
    provinces = set()
    has_unspecified = False

    for o in Org.query.filter_by(active=True).all():
        prov = (o.province or "").strip()
        if prov:
            provinces.add(prov)
        else:
            has_unspecified = True

    items = []
    if has_unspecified:
        items.append({"value": "__unspecified__", "label": "ไม่ระบุ"})
    items.extend([{"value": p, "label": p} for p in sorted(provinces, key=_locale_sort_key)])
    return jsonify(items=items), 200


def locale_compare(a, b):
    try:
        return strxfrm(a) < strxfrm(b)
    except Exception:
        return a < b


def _locale_sort_key(s):
    """Single-argument sort key for use with sorted()"""
    try:
        return strxfrm(s)
    except Exception:
        return s
