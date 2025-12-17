import os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import models

# Secret key untuk JWT (dalam production, pakai environment variable yang aman)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 hari


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password dengan hash"""
    try:
        # Pastikan hashed_password adalah string
        if not isinstance(hashed_password, str):
            return False
        
        # Pastikan hashed_password adalah format bcrypt yang valid (harus dimulai dengan $2b$ atau $2a$)
        if not hashed_password.startswith('$2'):
            return False
        
        # Encode ke bytes untuk bcrypt.checkpw
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Hash password menggunakan bcrypt"""
    # Encode password ke bytes
    password_bytes = password.encode('utf-8')
    # Hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return sebagai string
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Buat JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, username_or_email: str, password: str):
    """Authenticate user dengan username atau email dan password"""
    # Strip whitespace dari username/email dan password
    username_or_email = username_or_email.strip() if username_or_email else ""
    password = password.strip() if password else ""
    
    print(f"Authenticating user - Username/Email: '{username_or_email}' (length: {len(username_or_email)}), Password length: {len(password)}")
    
    # Cek apakah input adalah email (ada @)
    if "@" in username_or_email:
        # Login dengan email
        user = db.query(models.User).filter(models.User.email == username_or_email).first()
    else:
        # Login dengan username
        user = db.query(models.User).filter(models.User.username == username_or_email).first()
    
    if not user:
        print(f"User not found: '{username_or_email}'")
        return False
    
    print(f"User found: {user.username or user.email} (id: {user.id}, role_id: {user.role_id})")
    print(f"Password hash starts with: {user.hashed_password[:20] if user.hashed_password else 'None'}")
    
    if not verify_password(password, user.hashed_password):
        print(f"Password verification failed for user: {username_or_email}")
        return False
    
    if not user.is_active:
        print(f"User {username_or_email} is not active")
        return False
    
    print(f"Authentication successful for user: {username_or_email}")
    return user


def get_user_by_username(db: Session, username: str):
    """Get user by username"""
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()


def decode_token(token: str):
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None


# ==================== PERMISSION SYSTEM ====================

def is_employee(user: models.User) -> bool:
    """Cek apakah user adalah employee (admin atau sales)"""
    if not user or not user.role:
        return False
    return user.role.name in ['admin', 'sales']


def is_customer(user: models.User) -> bool:
    """Cek apakah user adalah customer"""
    if not user or not user.role:
        return False
    return user.role.name == 'customer'


def is_admin(user: models.User) -> bool:
    """Cek apakah user adalah admin"""
    if not user or not user.role:
        return False
    return user.role.name == 'admin'


def is_sales(user: models.User) -> bool:
    """Cek apakah user adalah sales"""
    if not user or not user.role:
        return False
    return user.role.name == 'sales'


def require_employee(user: models.User):
    """Require user harus employee, raise exception jika tidak"""
    if not is_employee(user):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee access required."
        )


def require_customer(user: models.User):
    """Require user harus customer, raise exception jika tidak"""
    if not is_customer(user):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Customer access required."
        )


def require_admin(user: models.User):
    """Require user harus admin, raise exception jika tidak"""
    if not is_admin(user):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin access required."
        )


def can_access_resource(user: models.User, resource_owner_id: int = None) -> bool:
    """
    Cek apakah user bisa akses resource tertentu.
    - Employee (admin/sales): bisa akses semua resource
    - Customer: hanya bisa akses resource miliknya sendiri
    """
    if is_employee(user):
        # Employee bisa akses semua
        return True
    
    if is_customer(user):
        # Customer hanya bisa akses resource miliknya
        if resource_owner_id is None:
            return False
        return user.id == resource_owner_id
    
    return False

