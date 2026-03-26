from __future__ import annotations
import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "sdg-system-secure-key-handoff-2026")
    ADMIN_PIN = os.environ.get("ADMIN_PIN", "")

    _instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "instance")
    os.makedirs(_instance_path, exist_ok=True)
    _db_path = os.path.join(_instance_path, "sdg.db").replace("\\", "/")
    
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", f"sqlite:///{_db_path}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False

class DevConfig(Config):
    DEBUG = True

class ProdConfig(Config):
    DEBUG = False
    ADMIN_PIN = os.environ.get("ADMIN_PIN", "")
    _instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "instance")
    os.makedirs(_instance_path, exist_ok=True)
    
    _db_path = os.path.join(_instance_path, "sdg.db").replace("\\", "/")
    
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", f"sqlite:///{_db_path}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False


class DevConfig(Config):
    DEBUG = True

class ProdConfig(Config):
    DEBUG = False
