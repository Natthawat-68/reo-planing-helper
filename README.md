# REO Planning Helper (SDG 4 Project Management System)

ระบบสารสนเทศสำหรับการบริหารจัดการ ติดตาม และประเมินผลการดำเนินงานโครงการภายใต้เป้าหมายการพัฒนาที่ยั่งยืนที่ 4 (Quality Education) พัฒนาขึ้นเพื่อเป็นเครื่องมือสนับสนุนการบูรณาการข้อมูลโครงการในระดับหน่วยงานและภาพรวมส่วนกลางอย่างมีประสิทธิภาพ

---

## ๑. ภาพรวมและขีดความสามารถ (System Overview & Features)

ระบบได้รับการออกแบบให้เป็น Single Page Application (SPA) ที่เน้นความเรียบง่าย ประสิทธิภาพสูง และการตอบสนองที่รวดเร็ว เพื่อรองรับการบริหารจัดการโครงการในปริมาณมาก

### คุณสมบัติหลัก (Key Features)
*   **Agency Management**: บริหารจัดการข้อมูลหน่วยงานภาคีและสถาบันในสังกัด
*   **Project Tracking**: ติดตามความคืบหน้าโครงการรายปีงบประมาณ พร้อมเชื่อมโยงกับ SDG Targets
*   **Analytical Dashboard**: สรุปผลทางสถิติในรูปแบบกราฟเชิงวิเคราะห์ (จำนวนโครงการ, งบประมาณ)
*   **Standardized Reporting**: ส่งออกข้อมูลโครงการเป็นไฟล์ CSV ตามมาตรฐานเพื่อการวิเคราะห์ต่อยอด
*   **Audit Logging**: ระบบบันทึกประวัติการดำเนินงาน (ใคร ทำอะไร เมื่อไหร่) เพื่อความโปร่งใสสูงสุด
*   **Multi-layer Security**: ระบบรักษาความปลอดภัยด้วยรหัสผ่านและ PIN 6 หลัก แยกตามระดับสิทธิ (Role-based)

---

## ๒. สถาปัตยกรรมทางเทคนิค (Technical Architecture)

| ส่วนประกอบ | เทคโนโลยีที่เลือกใช้ | รายละเอียด |
|-----------|------------------|----------|
| **Backend** | Python 3.10+ | Flask Framework (Restful API) |
| **Database** | SQLite / SQLAlchemy | ทรงพลัง ยืดหยุ่น และจัดการง่าย |
| **Frontend** | Vanilla JS / CSS | สร้างแบบ Single Page Application (SPA) |
| **UI/UX** | Tailwind CSS / DaisyUI | ดีไซน์ทันสมัย รองรับการแสดงผลทุกหน้าจอ |

---

## ๓. โครงสร้างโครงการ (Project Structure)

```text
SDG/
├── backend/                # ส่วนประมวลผลหลังบ้าน (Flask)
│   ├── app/                # ซอร์สโค้ดหลักของแอปพลิเคชัน
│   │   ├── routes/         # ส่วนจัดการ API Endpoints
│   │   ├── models.py       # ส่วนจัดการโครงสร้างฐานข้อมูล
│   │   ├── config.py       # การตั้งค่าระบบ
│   │   └── ...
│   ├── instance/           # ไฟล์ฐานข้อมูล (SQLite)
│   ├── run.py              # ไฟล์หลักสำหรับเริ่มทำงาน
│   └── requirements.txt    # รายการไลบรารีที่จำเป็น
├── frontend/               # ส่วนแสดงผลหน้าบ้าน (Vanilla JS)
│   ├── js/                 # ไฟล์ Logic และ API Calls
│   │   ├── pages/          # ส่วนประกอบหน้าจอต่างๆ
│   │   ├── core/           # คอร์ดีนตรอก (API, Utils, Store)
│   │   └── config/         # การตั้งค่าคงที่ (SDG Targets)
│   ├── styles.css          # การกำหนดสไตล์ (Tailwind/Base)
│   ├── app.js              # Entry point หลัก
│   └── index.html          # ไฟล์หน้าหลัก (Entry Point)
├── .gitignore
└── README.md
```

---

## ๔. การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### สิ่งที่ต้องเตรียม (Prerequisites)
*   Python 3.10 ขึ้นไป
*   pip (Python Package Manager)

### ขั้นตอนการติดตั้ง
1. **Clone Repository**:
   ```bash
   git clone https://github.com/Natthawat-68/reo-planing-helper
   cd reo-planing-helper
   ```

2. **Setup Virtual Environment**:
   ```bash
   cd backend
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize & Run**:
   ```bash
   python run.py
   ```
   *ระบบจะเริ่มทำงานที่ `http://localhost:5000`*

---

## ๕. การตั้งค่าระบบ (Configuration)

การปรับแต่งค่าต่างๆ ของระบบสามารถทำได้ที่ไฟล์ `backend/app/config.py`:

*   **ADMIN_PIN**: รหัสผ่าน 6 หลักสำหรับเข้าถึงส่วนควบคุมผู้ดูแลระบบ (หากไม่ได้กำหนด ระบบจะสุ่มให้โดยอัตโนมัติและแสดงผลใน Terminal เมื่อเริ่มต้นระบบ)
*   **SECRET_KEY**: กุญแจสำหรับการรักษาความปลอดภัยของ Session และ Token
*   **SQLALCHEMY_DATABASE_URI**: เส้นทางเชื่อมต่อฐานข้อมูล

---

## ๖. ระบบรักษาความปลอดภัย (Security & Authorization)

ระบบใช้มาตรฐานการเข้าถึงข้อมูลแบบแยกสิทธิ์การใช้งาน (Role-based Access Control):

*   **System Administrator**: จัดการหน่วยงาน, กำหนด PIN, และตรวจสอบ Audit Log ทั่วทั้งระบบ
*   **Agency Coordinator**: บริหารจัดการโครงการเฉพาะที่ได้รับมอบหมายภายใต้หน่วยงานของตนเอง
*   **Authentication**: ปกป้องชั้นข้อมูลด้วยสถาปัตยกรรม PIN-based และ Session Security

---


