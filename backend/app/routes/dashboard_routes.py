from __future__ import annotations
from collections import defaultdict
from flask import Blueprint, jsonify
from app.models import Org, Project

dashboard_bp = Blueprint("dashboard", __name__)


def _by_org_items() -> list[dict]:
    orgs = {o.id: o for o in Org.query.all()}
    by_org: dict[str, dict] = {}
    for p in Project.query.all():
        oid = p.org_id
        if oid not in by_org:
            by_org[oid] = {
                "orgId": oid,
                "orgName": orgs[oid].name if oid in orgs else oid,
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
    orgs = Org.query.filter_by(active=True).all()
    projects = Project.query.all()

    total_orgs = len(orgs)
    total_projects = len(projects)
    total_budget = sum((p.budget or 0) for p in projects)

    sdg_count = {}
    for p in projects:
        if p.sdg:
            for s in p.sdg:
                sdg_count[s] = sdg_count.get(s, 0) + 1

    recent_projects = (
        Project.query.order_by(Project.updated_at.desc()).limit(5).all()
    )
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
    return jsonify(items=_by_org_items()), 200


@dashboard_bp.route("/by-sdg", methods=["GET"])
def get_by_sdg():
    sdg_projects: dict[str, set[str]] = defaultdict(set)

    for p in Project.query.all():
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
