import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


SUPER_ADMIN_EMAIL = os.getenv('SUPER_ADMIN_EMAIL')
SUPER_ADMIN_PASSWORD = os.getenv('SUPER_ADMIN_PASSWORD')


def create_super_admin():
    db: Session = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == SUPER_ADMIN_EMAIL).first()
        
        if existing_user:
            print(f"Super Admin with email {SUPER_ADMIN_EMAIL} already exists. Skipping.")
            return

        # Create new super admin
        new_admin = User(
            email=SUPER_ADMIN_EMAIL,
            password=hash_password(SUPER_ADMIN_PASSWORD),
            role=UserRole.SUPER_ADMIN,
            school_id=None,
            is_active=True
        )

        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        
        print("Super Admin created successfully.")
        print(f"Email: {SUPER_ADMIN_EMAIL}")

    except Exception as e:
        db.rollback()
        print(f"An error occurred while creating Super Admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()