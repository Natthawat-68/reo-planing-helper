from __future__ import annotations
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from .config import Config
from .database import db
from .routes.auth_routes import auth_bp
from .routes.dashboard_routes import dashboard_bp
from .routes.project_routes import project_bp
from .routes.org_routes import org_bp
from .routes.pin_routes import pin_bp
from .routes.data_routes import data_bp
from .routes.audit_routes import audit_bp

_FRONTEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
)

def create_app(config_class: type[Config] = Config) -> Flask:
    app = Flask(
        __name__,
        static_folder=_FRONTEND_DIR,
        static_url_path="",
    )
    app.config.from_object(config_class)
    db.init_app(app)
    CORS(app, origins=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", supports_credentials=True)

    with app.app_context():
        db.create_all()
        from .db_migrate import ensure_org_province_column, ensure_project_province_column
        ensure_org_province_column()
        ensure_project_province_column()
        from .initial_data import load_if_empty
        load_if_empty()

    register_blueprints(app)

    @app.get("/api/health")
    def health_check():
        return jsonify(status="ok"), 200

    @app.get("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.get("/<path:path>")
    def serve_spa(path: str):
        if path.startswith("api/"):
            return jsonify(error="Not Found"), 404
        full_path = os.path.join(app.static_folder, path)
        if os.path.isfile(full_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    return app

def register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(project_bp, url_prefix="/api/projects")
    app.register_blueprint(org_bp, url_prefix="/api/orgs")
    app.register_blueprint(pin_bp, url_prefix="/api/orgs")
    app.register_blueprint(data_bp, url_prefix="/api/data")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(audit_bp, url_prefix="/api/audit-logs")
