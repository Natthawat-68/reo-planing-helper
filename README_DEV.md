# Developer Guide — คู่มือสำหรับ Dev 6 คน

เอกสารนี้อธิบายรายละเอียดว่าฟังก์ชันแต่ละส่วนทำงานอย่างไร Input จาก Frontend → Process ที่ Backend → Output และไฟล์ที่เกี่ยวข้องสำหรับสมาชิกทั้ง 6 คน

---

## ก่อนอ่าน (Quick Start)

แนะนำให้ **setup และรันระบบ** ตาม [README.md](./README.md) ก่อน — โคลนโปรเจกต์, สร้าง venv, ติดตั้ง dependencies, รัน `python run.py` แล้วเปิด `http://127.0.0.1:5000`

หลังจากรันได้แล้ว ค่อยอ่านเอกสารนี้เพื่อเข้าใจ flow และการเชื่อมต่อของแต่ละส่วน

---

## ลำดับการโหลดข้อมูล (Data Flow Overview)

เมื่อผู้ใช้ **เข้าสู่ระบบสำเร็จ** ระบบจะ:

1. เรียก `api.getFullData()` → `GET /api/data/full`
2. ได้รับ `{ orgs, users, projects, audit }` จาก Backend
3. เก็บลง `window.DB` (เช่น `DB.orgs`, `DB.projects`, `DB.users`, `DB.audit`)

**หน้าแต่ละหน้ามักใช้ `DB` เป็นหลัก** — เช่น หน้าย่อยโครงการใช้ `DB.projects` กรอง/แสดงผลฝั่ง client บางหน้าก็เรียก API เพิ่ม เช่น:
- Dashboard: เรียก `getDashboardSummary`, `getDashboardByOrg`, `getDashboardBySdg` (ข้อมูลสำหรับกราฟ/ตาราง)
- Audit Log: เรียก `getAuditLogs` (เพราะ audit ส่งเฉพาะ admin และมี filter)
- Users: เรียก `listUsers`, `getOrgsPublic` (ข้อมูล PIN/หน่วยงาน)

ดังนั้น **ข้อมูลส่วนใหญ่มาจาก `DB` ที่โหลดครั้งแรกหลัง login** — ถ้าต้องการให้ข้อมูลล่าสุด ให้ refresh หน้า หรือเรียก `api.getFullData()` แล้วอัปเดต `window.DB` ใหม่

---

## โครงสร้างระบบโดยรวม

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (SPA)                                                      │
│  js/core/api.js → เรียก API ทุก request                             │
│  js/auth/login.js, js/pages/*.js → UI + เรียก api.xxx()             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP (JSON, credentials: 'include')
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Backend (Flask)                                                     │
│  __init__.py → register blueprints (prefix /api/xxx)                 │
│  routes/*.py → จัดการ request, ดึงข้อมูล DB, return JSON/Response   │
│  models.py → Org, User, Project, ProjectImage, AuditLog              │
│  utils.py → require_login, require_admin, get_current_user, PIN      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SQLite (instance/sdg4.db)                                           │
└─────────────────────────────────────────────────────────────────────┘
```

**การทำงานร่วมกัน**
- Frontend ใช้ `fetch` + `credentials: 'include'` เพื่อส่ง session cookie
- Backend ตรวจสอบ `session['user_id']` จาก cookie (require_login)
- API base: `window.API_BASE` หรือ `http://localhost:5000/api` (เมื่อ port ≠ 5000)

---

## บุคคลที่ 1: นายอัครพนธ์ โอมาโฮนี่ — Login / Auth

### ไฟล์ที่รับผิดชอบ
| ฝั่ง | ไฟล์ | หน้าที่ |
|------|------|--------|
| Backend | `app/routes/auth_routes.py` | Login, Logout, Current user |
| Frontend | `js/auth/login.js` | หน้า Login, การเรียก login/logout |
| Frontend | `js/core/api.js` | `api.login()`, `api.logout()`, `api.me()` |
| Shared | `app/utils.py` | `get_current_user()`, `require_login()` — ใช้ทุก route |

### Flow: Login

**1. Frontend (login.js)**
- ผู้ใช้เลือกหน่วยงานจาก `<select id="loginOrg">` (ค่า: `admin` หรือ `org-xxx`)
- กรอก PIN 6 หลัก ใน `<input id="loginPin">`
- กดปุ่ม Login → `api.login(orgId, pin)`

**2. api.js**
```javascript
api.login(orgId, pin)
  → POST /api/auth/login
  → Body: { orgId: string, pin: string }
```

**3. Backend (auth_routes.py — `login()`)**

| ขั้นตอน | รายละเอียด |
|---------|-------------|
| Input | `request.get_json()` ได้ `{ orgId, pin }` |
| Validation | PIN ต้อง 6 หลัก เป็นตัวเลขเท่านั้น |
| Admin case | ถ้า `orgId == "admin"` → ค้นหา `User` role=admin, เปรียบเทียบ `pin == user.password` |
| Org case | ค้นหา `Org` ที่ id=orgId, เปรียบเทียบ `pin == org.pin` (หรือ user.password) |
| Session | ตั้ง `session["user_id"]`, `session["role"]`, `session["org_id"]` |
| Output | `{ session: { role, userId, orgId }, message }` หรือ error 401 |

**4. Frontend หลัง Login สำเร็จ**
- `login.js` เก็บ `window.session = res.session`
- เรียก `api.getFullData()` → โหลด orgs, users, projects, audit ใส่ `window.DB`
- เรียก `initApp()` → แสดง main app, navigate ไป dashboard

### Flow: Logout

- Frontend: `api.logout()` → `POST /api/auth/logout`
- Backend: `session.clear()` → return `{ message }`
- Frontend: `location.reload()` กลับไปหน้า Login

### Flow: ตรวจสอบ Session (api.me)

- เรียก `GET /api/auth/me` (credentials: include)
- Backend: `get_current_user()` จาก session → ถ้ามี user คืน `{ user, session }`
- ใช้ตอน init app เพื่อเช็คว่า login อยู่หรือไม่

---

## บุคคลที่ 2: นายไชยวัฒน์ ทำดี — Dashboard / Report

### ไฟล์ที่รับผิดชอบ
| ฝั่ง | ไฟล์ | หน้าที่ |
|------|------|--------|
| Backend | `app/routes/dashboard_routes.py` | summary, by-org, by-sdg |
| Backend | `app/routes/report_routes.py` | export CSV |
| Frontend | `js/pages/dashboard.js` | หน้า Dashboard, Charts, Export modal |
| Frontend | `js/core/api.js` | `getDashboardSummary()`, `getDashboardByOrg()`, `getDashboardBySdg()`, `downloadExportCsv()` |

### Flow: Dashboard Summary

**1. Frontend (dashboard.js)**
- `renderDashboard()` เรียก:
  - `api.getDashboardSummary()` → `GET /api/dashboard/summary`
  - `api.getDashboardByOrg()` → `GET /api/dashboard/by-org`
  - `api.getDashboardBySdg()` → `GET /api/dashboard/by-sdg`

**2. Backend (dashboard_routes.py)**

| Route | Function | Input | Process | Output |
|-------|----------|-------|---------|--------|
| `/summary` | `summary()` | - | `Project.query.all()` นับโครงการ, sum(budget), นับ Org active | `{ totalProjects, totalBudget, totalOrgs }` |
| `/by-org` | `by_org()` | - | group โครงการตาม org_id นับและ sum | `{ items: [{ orgId, orgName, count, budget }] }` |
| `/by-sdg` | `by_sdg()` | - | group โครงการตาม sdg ในแต่ละ project | `{ items: [{ sdg, count }] }` |

**3. Frontend**
- แสดง stat cards, tables, charts (Chart.js)
- กราฟใช้ข้อมูลจาก `DB.projects` + `byOrg`, `bySdg` ที่ได้จาก API

### Flow: Export CSV (Report)

**ทาง 1: API Export (report_routes.py)**
- Frontend: `api.downloadExportCsv({ orgId?, year? })` → `GET /api/projects/export?orgId=xxx&year=2568`
- Backend:
  - Query: `Project.query` + filter ตาม orgId, year
  - สร้าง CSV จาก `EXPORT_COLUMNS` (หน่วยงาน, ชื่อโครงการ, งบประมาณ, ...)
  - Return `Response(csv, mimetype='text/csv', Content-Disposition: attachment)`
- Frontend: ดาวน์โหลด blob เป็นไฟล์

**ทาง 2: Export Modal (Client-side — dashboard.js)**
- กดปุ่ม "ส่งออกข้อมูล" → เปิด modal (SweetAlert2)
- เลือกโครงการ (checkbox) + เลือกคอลัมน์
- สร้าง CSV จาก `DB.projects` ใน browser แล้ว trigger download
- ไม่เรียก API — ใช้ข้อมูลที่มีใน `DB` (มาจาก `getFullData`)

---

## บุคคลที่ 3: นายกฤษฎาพงษ์ ทิณพัฒน์ — Project Management

### ไฟล์ที่รับผิดชอบ
| ฝั่ง | ไฟล์ | หน้าที่ |
|------|------|--------|
| Backend | `app/routes/project_routes.py` | CRUD โครงการ + images |
| Frontend | `js/pages/projects.js` | หน้าจัดการโครงการ, สร้าง/แก้ไข/ลบ |
| Frontend | `js/core/api.js` | `createProject`, `updateProject`, `deleteProject`, `uploadProjectImages`, `deleteProjectImage` |
| Shared | `app/models.py` | `Project`, `ProjectImage` |

### Flow: List Projects

**Frontend:** ใช้ `DB.projects` (โหลดจาก `getFullData`) เป็นหลัก หรือเรียก `GET /api/projects/?orgId=&sdg=&year=&search=` ได้
**Backend:** `list_projects()` — query Project + filter ตาม params → return `{ items }`

### Flow: Create Project

**1. Frontend (projects.js)**
- ฟอร์ม: ชื่อโครงการ, งบประมาณ, ผู้รับผิดชอบ, ปี, วันเริ่ม-สิ้นสุด, วัตถุประสงค์, นโยบาย, SDG (≥1), รูป (3–4 รูป)
- กดบันทึก → สร้าง `body` object แล้วเรียก `api.createProject(body)`

**2. api.js**
```javascript
POST /api/projects
Body: {
  title, budget, owner, year, startDate, endDate,
  objective, policy, sdg: ['4.1','4.4'], images: [{ id, name, dataUrl }]
}
```

**3. Backend (project_routes.py — `create_project()`)**

| ขั้นตอน | รายละเอียด |
|---------|-------------|
| Auth | `require_login()`, `get_current_user()` |
| Input | `request.get_json()` |
| Validation | title, budget≥0, owner, year 2400-2600, startDate/endDate, objective, policy, sdg≥1, images 3–4 รูป |
| Manager | ถ้า role=manager → บังคับ org_id = session.orgId |
| Create | สร้าง Project + ProjectImage (เก็บ dataUrl base64) |
| Audit | บันทึก AuditLog action=create_project |
| Output | `{ item: project_json, message }` 201 |

### Flow: Update Project

- `PUT /api/projects/<project_id>`
- ตรวจสอบสิทธิ์: `_check_can_edit()` — admin ได้หมด, manager เฉพาะ org_id ตรง
- Validation เหมือน create
- อัปเดต Project + ลบ/สร้าง ProjectImage ใหม่ถ้ามี `images` ใน body
- บันทึก AuditLog `update_project`

### Flow: Delete Project

- `DELETE /api/projects/<project_id>`
- ตรวจสอบสิทธิ์ → บันทึก AuditLog → `db.session.delete(p)`

### Flow: Upload/Delete Images

- `POST /api/projects/<id>/images` — body: `{ images: [{ id, name, dataUrl }] }`
- `DELETE /api/projects/<id>/images/<image_id>`
- รูปเก็บใน ProjectImage เป็น base64 data URL

---

## บุคคลที่ 4: นายศิขรินทร์ ภูติโส — Organization

### ไฟล์ที่รับผิดชอบ
| ฝั่ง | ไฟล์ | หน้าที่ |
|------|------|--------|
| Backend | `app/routes/org_routes.py` | CRUD หน่วยงาน |
| Frontend | `js/pages/organizations.js` | หน้าจัดการหน่วยงาน (Admin), หน้าดูหน่วยงาน (Manager) |
| Frontend | `js/core/api.js` | `createOrg`, `updateOrg`, `deleteOrg`, `getOrgsPublic` |
| Shared | `app/utils.py` | `generate_unique_org_pin()` |

### Flow: List Orgs

**Admin:** `GET /api/orgs/` → ต้อง `require_admin()` → return `{ items }` รวม `pin`
**Manager/Public:** `GET /api/orgs/public` → return รายการหน่วยงาน (ไม่มี pin)

### Flow: Create Org

**1. Frontend**
- ฟอร์มกรอกชื่อหน่วยงาน → `api.createOrg(name)`

**2. Backend (org_routes.py — `create_org()`)**

| ขั้นตอน | รายละเอียด |
|---------|-------------|
| Auth | `require_admin()` |
| Input | `{ name }` |
| Create Org | `org_id = "org-" + uuid`, `pin = generate_unique_org_pin()` |
| Create Manager | `User` role=manager, password=pin, org_id |
| Audit | `create_org` |
| Output | `{ item: org_json, message }` 201 |

### Flow: Update Org

- `PUT /api/orgs/<org_id>` body: `{ name?, active? }`
- ถ้าเปลี่ยน active → อัปเดต `User.active` ของ manager ด้วย

### Flow: Delete Org

- เช็ค `Project.query.filter_by(org_id).count()` — ถ้ามีโครงการ return 400
- ลบ manager ก่อน → ลบ Org → บันทึก AuditLog

---

## บุคคลที่ 5: นายพิชชากร คำพรม — User / PIN

### ไฟล์ที่รับผิดชอบ
| ฝั่ง | ไฟล์ | หน้าที่ |
|------|------|--------|
| Backend | `app/routes/pin_routes.py` | ตั้งค่า PIN หน่วยงาน |
| Backend | `app/routes/user_routes.py` | รายชื่อผู้ใช้ (list) |
| Frontend | `js/pages/users.js` | หน้าตั้งค่า PIN, แสดงรายชื่อผู้ใช้ |
| Frontend | `js/core/api.js` | `setOrgPin`, `listUsers` |
| Shared | `app/utils.py` | `generate_unique_org_pin`, `random_pin_6` |

### Flow: Set Org PIN

**1. Frontend (users.js)**
- กดปุ่ม "ตั้ง/รีเซ็ต PIN" ที่หน่วยงาน → แสดง SweetAlert กรอก PIN 6 หลัก
- เรียก `api.setOrgPin(orgId, pin)`

**2. api.js**
```javascript
PUT /api/orgs/<org_id>/pin
Body: { pin: string }
```

**3. Backend (pin_routes.py — `set_org_pin()`)**

| ขั้นตอน | รายละเอียด |
|---------|-------------|
| Auth | `require_admin()` |
| Input | `{ pin }` ต้อง 6 หลัก เป็นตัวเลข |
| Update | `org.pin = pin`, `mgr.password = pin` |
| Audit | `set_org_pin` + details "เปลี่ยน PIN หน่วยงาน เมื่อ DD/MM/YYYY HH:MM:SS" |
| Output | `{ message }` 200 |

**หมายเหตุ:** route ลงทะเบียนที่ `pin_bp` url_prefix `/api/orgs` จึงได้ path เป็น `/api/orgs/<org_id>/pin` (ลงก่อน org_bp เพื่อ match ก่อน `/<org_id>`)

### Flow: List Users

- `GET /api/users/` → `require_admin()` → return `{ items: [{ id, username, role, orgId, active }] }`
- Frontend ใช้แสดงตารางรายชื่อผู้ใช้ใน users.js

---

## บุคคลที่ 6: นายนัธทวัฒน์ เขาแก้ว — Audit Log

### ไฟล์ที่รับผิดชอบ
| ฝั่ง | ไฟล์ | หน้าที่ |
|------|------|--------|
| Backend | `app/routes/audit_routes.py` | list audit logs, filters |
| Frontend | `js/pages/audit.js` | หน้า Audit Log + filter |
| Frontend | `js/core/api.js` | `getAuditLogs` |
| Shared | `app/models.py` | `AuditLog` |

### Flow: List Audit Logs

**1. Frontend (audit.js)**
- `api.getAuditLogs({ action?, by?, from?, sort? })`
- ใช้ filter ฝั่ง client ด้วย (กรองจากผลที่ได้)

**2. api.js**
```javascript
GET /api/audit-logs?action=create_project&by=admin&from=1234567890000&sort=newest
```

**3. Backend (audit_routes.py)**

| ขั้นตอน | รายละเอียด |
|---------|-------------|
| Auth | `require_admin()` |
| Query | filter ตาม action, by_username, at >= from |
| Sort | newest (desc) หรือ oldest (asc) |
| Output | `{ items: [{ at, action, by, displayName, projectId, projectTitle, orgId, orgName, details }] }` |

### Flow: Audit Filters

- `GET /api/audit-logs/filters` → return `{ actions, users }` สำหรับ dropdown
- `displayName`: admin → "Admin", mgr-org-xxx → ชื่อหน่วยงาน

### การบันทึก Audit (จาก routes อื่น)

ทุก route ที่มีการกระทำสำคัญจะเรียก:
```python
db.session.add(AuditLog(at=timestamp_ms, action="...", by_username=..., project_id=..., org_id=..., details="..."))
```

Actions: `create_project`, `create_org`, `update_project`, `delete_project`, `upload_image`, `delete_image`, `delete_org`, `set_org_pin`

---

## Data Routes (ใช้ร่วมกัน)

**ไฟล์:** `app/routes/data_routes.py`

| Route | Input | Output |
|-------|-------|--------|
| `GET /api/data/full` | - | `{ orgs, users, projects, audit }` สำหรับ frontend DB |

- เรียกหลัง login ใน `login.js` และ `app.js` (init)
- ใช้ `require_login()` — audit ส่งเฉพาะเมื่อ role=admin

---

## การลงทะเบียน Blueprints (__init__.py)

```python
auth_bp      → /api/auth
dashboard_bp → /api/dashboard
project_bp   → /api/projects
report_bp    → /api/projects  (route /export → /api/projects/export)
pin_bp       → /api/orgs      # ลงก่อน org_bp
org_bp       → /api/orgs
user_bp      → /api/users
audit_bp     → /api/audit-logs
data_bp      → /api/data
```

---

## สรุปตาราง Frontend → Backend

| Frontend Call | Method | URL | Backend File | Function |
|---------------|--------|-----|--------------|----------|
| api.login(orgId, pin) | POST | /api/auth/login | auth_routes | login |
| api.logout() | POST | /api/auth/logout | auth_routes | logout |
| api.me() | GET | /api/auth/me | auth_routes | current_user |
| api.getFullData() | GET | /api/data/full | data_routes | get_full_data |
| api.getOrgsPublic() | GET | /api/orgs/public | org_routes | list_orgs_public |
| api.getDashboardSummary() | GET | /api/dashboard/summary | dashboard_routes | summary |
| api.getDashboardByOrg() | GET | /api/dashboard/by-org | dashboard_routes | by_org |
| api.getDashboardBySdg() | GET | /api/dashboard/by-sdg | dashboard_routes | by_sdg |
| api.downloadExportCsv(params) | GET | /api/projects/export | report_routes | export_projects |
| api.createProject(body) | POST | /api/projects | project_routes | create_project |
| api.updateProject(id, body) | PUT | /api/projects/:id | project_routes | update_project |
| api.deleteProject(id) | DELETE | /api/projects/:id | project_routes | delete_project |
| api.uploadProjectImages(id, imgs) | POST | /api/projects/:id/images | project_routes | upload_project_images |
| api.deleteProjectImage(pid, iid) | DELETE | /api/projects/:id/images/:iid | project_routes | delete_project_image |
| api.createOrg(name) | POST | /api/orgs | org_routes | create_org |
| api.updateOrg(id, body) | PUT | /api/orgs/:id | org_routes | update_org |
| api.deleteOrg(id) | DELETE | /api/orgs/:id | org_routes | delete_org |
| api.setOrgPin(orgId, pin) | PUT | /api/orgs/:id/pin | pin_routes | set_org_pin |
| api.listUsers() | GET | /api/users/ | user_routes | list_users |
| api.getAuditLogs(params) | GET | /api/audit-logs | audit_routes | list_audit_logs |

---

## หมายเหตุสำหรับ Dev

1. **Session:** ใช้ Flask session + cookie (SECRET_KEY) — ต้องมี `credentials: 'include'` ทุก request
2. **CORS:** อนุญาต localhost ทุกพอร์ตสำหรับ dev
3. **DB:** SQLite อยู่ที่ `backend/instance/sdg4.db` — ไม่ควร commit ไฟล์ .db
4. **Models:** Org, User, Project, ProjectImage, AuditLog — ดู schema ใน `models.py`
