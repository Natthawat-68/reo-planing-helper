from __future__ import annotations
from datetime import datetime, timedelta
from flask import current_app
from .database import db
from .models import Admin, Org, Project
from .utils import generate_unique_org_pin, random_pin_6

def load_if_empty() -> None:
    if Org.query.first() is not None:
        return

    admin_cfg = str(current_app.config.get("ADMIN_PIN", "") or "").strip()
    if admin_cfg and len(admin_cfg) == 6 and admin_cfg.isdigit():
        admin_pin = admin_cfg
    else:
        admin_pin = random_pin_6()
    
    current_app.config["_SEEDED_ADMIN_PIN"] = admin_pin

    korat = "นครราชสีมา"
    national = "ไม่ระบุ"
    orgs = [
        ("org-001", "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน", national),
        ("org-002", "สพป.นม.1", korat),
        ("org-003", "สพป.นม.2", korat),
        ("org-004", "สพป.นม.3", korat),
        ("org-005", "สพป.นม.4", korat),
        ("org-006", "สพป.นม.5", korat),
        ("org-007", "สพป.นม.6", korat),
        ("org-008", "สพป.นม.7", korat),
        ("org-009", "สพป.นม.8", korat),
        ("org-010", "ศูนย์การศึกษาพิเศษ เขตการศึกษา 11 จังหวัดนครราชสีมา", korat),
        ("org-011", "โรงเรียนนครราชสีมาปัญญานุกูล", korat),
        ("org-012", "สำนักงานอาชีวศึกษาจังหวัดนครราชสีมา", korat),
        ("org-013", "สำนักงานคณะกรรมการส่งเสริมการศึกษาเอกชน", national),
        ("org-014", "สำนักงานส่งเสริมการเรียนรู้จังหวัดนครราชสีมา", korat),
        ("org-015", "สำนักงานส่งเสริมการปกครองท้องถิ่นจังหวัดนครราชสีมา", korat),
        ("org-016", "สำนักงานพระพุทธศาสนาจังหวัดนครราชสีมา", korat),
        ("org-017", "วิทยาลัยนาฏศิลปนครราชสีมา", korat),
        ("org-018", "กระทรวงอุดมศึกษา วิทยาศาสตร์ วิจัย และนวัตกรรม", national),
        ("org-019", "โรงเรียนสาธิตมหาวิทยาลัยราชภัฏนครราชสีมา", korat),
        ("org-020", "โรงเรียนสุรวิวัฒน์ มหาวิทยาลัยเทคโนโลยีสุรนารี", korat),
        ("org-021", "มหาวิทยาลัยเทคโนโลยีสุรนารี", korat),
        ("org-022", "มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน", korat),
        ("org-023", "มหาวิทยาลัยราชภัฏนครราชสีมา", korat),
        ("org-024", "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย วิทยาเขตนครราชสีมา", korat),
        ("org-025", "วิทยาลัยศาสนศาสตร์นครราชสีมา มหาวิทยาลัยมหามกุฏราชวิทยาลัย", korat),
        ("org-026", "มหาวิทยาลัยรามคำแหง สาขาวิทยบริการเฉลิมพระเกียรตินครราชสีมา", korat),
        ("org-027", "สถาบันบัณฑิตพัฒนบริหารศาสตร์ คณะรัฐประศาสนศาสตร์ ฯ", national),
        ("org-028", "มหาวิทยาลัยวงษ์ชวลิตกุล", korat),
        ("org-029", "วิทยาลัยนครราชสีมา", korat),
        ("org-030", "วิทยาลัยเทคโนโลยีพนมวันท์", korat),
        ("org-031", "วิทยาลัยพยาบาลบรมราชชนนีนครราชสีมา", korat),
        ("org-032", "สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดนครราชสีมา", korat),
        ("org-033", "สำนักงานสาธารณสุขจังหวัดนครราชสีมา", korat),
        ("org-034", "สำนักงานสถิติจังหวัดนครราชสีมา", korat),
        ("org-035", "สำนักงานศึกษาธิการจังหวัดนครราชสีมา", korat),
    ]

    used_pins: set[str] = {admin_pin}
    for oid, name, province in orgs:
        pin = generate_unique_org_pin(used_pins)
        used_pins.add(pin)
        db.session.add(Org(id=oid, name=name, province=province, active=True, pin=pin))

    db.session.add(Admin(
        id="admin-001",
        username="admin",
        password=admin_pin,
        active=True
    ))

    org_provinces = {oid: prov for oid, _, prov in orgs}

    base = datetime.utcnow()
    projects = [
        ("p-1", "org-023", "โครงการพัฒนาทักษะดิจิทัลสำหรับครู", 250000, ["4.4", "4.c"], "admin"),
        ("p-2", "org-002", "โครงการส่งเสริมการอ่านออกเขียนได้", 180000, ["4.1", "4.6"], "org-002"),
        ("p-3", "org-012", "โครงการพัฒนาทักษะอาชีพ", 280000, ["4.4"], "org-012"),
    ]
    
    for i, (pid, oid, title, budget, sdg, ub) in enumerate(projects):
        created = base - timedelta(days=10 - i)
        p = Project(
            id=pid,
            org_id=oid,
            province=org_provinces.get(oid, national),
            title=title,
            budget=budget,
            objective="",
            policy="",
            owner="ผู้รับผิดชอบ",
            year=2569,
            start_date=created.date(),
            end_date=(created + timedelta(days=180)).date(),
            sdg=sdg,
            created_at=created,
            updated_at=base - timedelta(days=1),
            updated_by=ub
        )
        db.session.add(p)

    db.session.commit()
