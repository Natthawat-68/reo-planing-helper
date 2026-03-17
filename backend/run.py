from __future__ import annotations

import os

from app import create_app

app = create_app()

# ANSI colors (ทำงานใน PowerShell, CMD, Terminal)
_C = {
    "rst": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "cyan": "\033[96m",
    "green": "\033[92m",
    "blue": "\033[94m",
    "magenta": "\033[95m",
    "yellow": "\033[93m",
}


def _banner() -> None:
    admin_pin = app.config.get("_SEEDED_ADMIN_PIN")
    if not admin_pin:
        with app.app_context():
            from app.models import User
            admin = User.query.filter_by(role="admin", active=True).first()
            admin_pin = admin.password if admin else None
    print()
    print(f"{_C['cyan']}{_C['bold']}  +----------------------------------------------------+{_C['rst']}")
    print(f"    {_C['green']}REO Planning Helper{_C['rst']}  {_C['dim']}(SDG 4){_C['rst']}")
    print(f"    {_C['dim']}Backend + Frontend   http://127.0.0.1:5000{_C['rst']}")
    if admin_pin:
        print(f"    {_C['yellow']}Admin PIN: {admin_pin}{_C['rst']}  {_C['dim']}(keep confidential){_C['rst']}")
    print(f"{_C['cyan']}  +----------------------------------------------------+{_C['rst']}")
    print(f"{_C['dim']}  Press CTRL+C to quit{_C['rst']}")
    print()


if __name__ == "__main__":
    # ใน debug mode Flask reloader รันสคริปต์ 2 รอบ — แสดง banner เฉพาะรอบจริง (child)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        _banner()
    app.run(debug=True)

