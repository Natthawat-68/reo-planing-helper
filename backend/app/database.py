"""จัดการการเชื่อมต่อฐานข้อมูล (Database connection)"""
from __future__ import annotations

from flask_sqlalchemy import SQLAlchemy

db: SQLAlchemy = SQLAlchemy()
