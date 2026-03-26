from __future__ import annotations
from flask import Blueprint, jsonify, request
from app.models import Org, Project
from app.utils import require_login

dashboard_bp = Blueprint("dashboard", __name__)

def _get_active_projects():
    from datetime import date
    today = date.today()
    return Project.query.filter(Project.end_date >= today).all()

@dashboard_bp.route("/", methods=["GET"])
def get_dashboard():
    err = require_login()
    if err:
        return err
    year = request.args.get("year")
    year_int = None
    if year:
        try:
            year_int = int(year)
        except ValueError:
            pass
    q = Project.query
    if year_int:
        q = q.filter_by(year=year_int)
    all_projects = q.all()
    total_projects = len(all_projects)
    total_budget = sum(p.budget or 0 for p in all_projects)
    total_orgs = Org.query.count()
    if year_int:
        from datetime import date
        today = date.today()
        active_count = sum(1 for p in all_projects if p.end_date and p.end_date >= today)
    else:
        active_count = len(_get_active_projects())
    return jsonify(
        total={
            "projects": total_projects,
            "budget": total_budget,
            "orgs": total_orgs,
            "activeProjects": active_count,
        },
        year=year_int,
    ), 200

@dashboard_bp.route("/summary", methods=["GET"])
def get_dashboard_summary():
    err = require_login()
    if err:
        return err
    year = request.args.get("year")
    year_int = None
    if year:
        try:
            year_int = int(year)
        except ValueError:
            pass
    q = Project.query
    if year_int:
        q = q.filter_by(year=year_int)
    all_projects = q.all()
    total_projects = len(all_projects)
    total_budget = sum(p.budget or 0 for p in all_projects)
    total_orgs = Org.query.count()
    if year_int:
        from datetime import date
        today = date.today()
        active_count = sum(1 for p in all_projects if p.end_date and p.end_date >= today)
    else:
        active_count = len(_get_active_projects())
    return jsonify(
        totalProjects=total_projects,
        totalBudget=total_budget,
        totalOrgs=total_orgs,
        activeProjects=active_count,
    ), 200

@dashboard_bp.route("/by-org", methods=["GET"])
def get_dashboard_by_org():
    err = require_login()
    if err:
        return err
    year = request.args.get("year")
    year_int = None
    if year:
        try:
            year_int = int(year)
        except ValueError:
            pass
    orgs = Org.query.order_by(Org.name).all()
    items = []
    for org in orgs:
        q = Project.query.filter_by(org_id=org.id)
        if year_int:
            q = q.filter_by(year=year_int)
        projects = q.all()
        project_count = len(projects)
        budget = sum(p.budget or 0 for p in projects)
        sdgs = set()
        for p in projects:
            if p.sdg:
                sdgs.update(p.sdg)
        items.append({
            "orgId": org.id,
            "orgName": org.name,
            "projectCount": project_count,
            "budget": budget,
            "sdgs": sorted(list(sdgs)),
        })
    return jsonify(items=items), 200

@dashboard_bp.route("/by-sdg", methods=["GET"])
def get_dashboard_by_sdg():
    err = require_login()
    if err:
        return err
    year = request.args.get("year")
    year_int = None
    if year:
        try:
            year_int = int(year)
        except ValueError:
            pass
    q = Project.query
    if year_int:
        q = q.filter_by(year=year_int)
    all_projects = q.all()
    sdg_stats: dict[str, dict] = {}
    for p in all_projects:
        if not p.sdg:
            continue
        for sdg_target in p.sdg:
            if sdg_target not in sdg_stats:
                sdg_stats[sdg_target] = {"count": 0, "budget": 0}
            sdg_stats[sdg_target]["count"] += 1
            sdg_stats[sdg_target]["budget"] += p.budget or 0
    items = [
        {
            "sdg": sdg,
            "projectCount": stats["count"],
            "budget": stats["budget"],
        }
        for sdg, stats in sdg_stats.items()
    ]
    items.sort(key=lambda x: x["projectCount"], reverse=True)
    return jsonify(items=items), 200
