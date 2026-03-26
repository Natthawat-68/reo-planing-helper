from __future__ import annotations
import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        print("=" * 60)
        print("SDG 4 Project Management System")
        print("=" * 60)
        print()
        print("Server starting at: http://localhost:5000")
        print()
        
        admin_pin = app.config.get("_SEEDED_ADMIN_PIN")
        if not admin_pin:
            with app.app_context():
                from app.models import User
                admin_user = User.query.filter_by(role="admin", active=True).first()
                if admin_user:
                    admin_pin = admin_user.password
        
        if admin_pin:
            print(f"Admin PIN: {admin_pin}")
        print()
        print("-" * 60)
    
    app.run(debug=True, host="0.0.0.0", port=5000)
