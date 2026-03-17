"""Dashboard summary routes. Maintainer: นายไชยวัฒน์ ทำดี"""
from __future__ import annotations

from flask import Blueprint, jsonify

from app.models import Org, Project
from app.utils import require_login

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/summary", methods=["GET"])
def summary():
    err = require_login()
    if err:
        return err

    # ทุกคนเห็นโครงการทั้งหมดเหมือนกัน
    projects = Project.query.all()

    total_projects = len(projects)
    total_budget = sum(p.budget or 0 for p in projects)
    total_orgs = Org.query.filter_by(active=True).count()

    return jsonify(
        totalProjects=total_projects,
        totalBudget=total_budget,
        totalOrgs=total_orgs,
    ), 200


@dashboard_bp.route("/by-org", methods=["GET"])
def by_org():
    err = require_login()
    if err:
        return err

    # ทุกคนเห็นโครงการทั้งหมดเหมือนกัน
    projects = Project.query.all()

    by_org = {}
    for p in projects:
        oid = p.org_id
        if oid not in by_org:
            by_org[oid] = {"count": 0, "budget": 0}
        by_org[oid]["count"] += 1
        by_org[oid]["budget"] += p.budget or 0

    items = []
    for oid, data in by_org.items():
        org = Org.query.get(oid)
        items.append({
            "orgId": oid,
            "orgName": org.name if org else oid,
            "count": data["count"],
            "budget": data["budget"],
        })
    items.sort(key=lambda x: -x["budget"])
    return jsonify(items=items), 200


@dashboard_bp.route("/by-sdg", methods=["GET"])
def by_sdg():
    err = require_login()
    if err:
        return err

    # ทุกคนเห็นโครงการทั้งหมดเหมือนกัน
    projects = Project.query.all()

    by_sdg = {}
    for p in projects:
        for s in (p.sdg or []):
            if s not in by_sdg:
                by_sdg[s] = set()
            by_sdg[s].add(p.id)
    items = [{"sdg": s, "count": len(ids)} for s, ids in sorted(by_sdg.items(), key=lambda x: -len(x[1]))]
    return jsonify(items=items), 200
