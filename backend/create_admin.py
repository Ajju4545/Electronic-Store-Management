"""
Script to create an administrator user for ElectroStore OS.
Can be run interactively or via CLI flags:
  python create_admin.py --email admin@example.com --password mysecret --name "Admin User"
"""

import argparse
import getpass
import sys
from datetime import datetime
import bcrypt

from database import SessionLocal
from models import AdminUser


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def main():
    parser = argparse.ArgumentParser(description="Create an admin user for ElectroStore OS")
    parser.add_argument("--email", help="Admin email address")
    parser.add_argument("--password", help="Admin password")
    parser.add_argument("--name", help="Admin full name (optional)")

    args = parser.parse_args()

    email = args.email
    if not email:
        email = input("Enter admin email address: ").strip()

    email = email.lower().strip()
    if not email or "@" not in email or "." not in email:
        print("Error: Please provide a valid email address.", file=sys.stderr)
        sys.exit(1)

    name = args.name
    if not name:
        default_name = email.split("@")[0].capitalize()
        entered_name = input(f"Enter full name [{default_name}]: ").strip()
        name = entered_name or default_name

    password = args.password
    if not password:
        password = getpass.getpass("Enter admin password (min 6 chars): ")
        confirm = getpass.getpass("Confirm admin password: ")
        if password != confirm:
            print("Error: Passwords do not match.", file=sys.stderr)
            sys.exit(1)

    if len(password) < 6:
        print("Error: Password must be at least 6 characters long.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.email == email).first()
        if existing:
            print(f"Error: An administrator with email '{email}' already exists.", file=sys.stderr)
            sys.exit(1)

        user = AdminUser(
            email=email,
            full_name=name,
            hashed_password=hash_password(password),
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        print("\n==============================================")
        print(" ElectroStore OS - Admin User Created")
        print("==============================================")
        print(f" ID:         {user.id}")
        print(f" Email:      {user.email}")
        print(f" Name:       {user.full_name}")
        print(f" Created At: {user.created_at}")
        print("==============================================")
        print("You can now log in at http://localhost:3000 using these credentials.\n")

    except Exception as e:
        db.rollback()
        print(f"Error creating admin user: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
