from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # admin, sales
    description = Column(String(200), nullable=True)

    # Relasi: satu role punya banyak users
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=True, index=True)  # Nullable untuk customer yang pakai email
    email = Column(String(100), unique=True, nullable=True, index=True)  # Untuk customer login
    full_name = Column(String(100), nullable=True)  # Nama lengkap
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relasi: user belongs to role (many-to-one)
    role = relationship("Role", back_populates="users")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    stock = Column(Integer, default=0, nullable=False)  # Stock quantity
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relasi: product dibuat oleh user (sales/admin)
    creator = relationship("User", foreign_keys=[created_by])


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(100), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # Nullable jika custom order
    quantity = Column(Integer, default=1, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, paid, failed, cancelled
    payment_method = Column(String(50), nullable=True)
    midtrans_transaction_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relasi
    customer = relationship("User", foreign_keys=[customer_id])
    product = relationship("Product", foreign_keys=[product_id])


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    order_id = Column(String(100), nullable=False, index=True)
    gross_amount = Column(Numeric(10, 2), nullable=False)
    payment_type = Column(String(50), nullable=True)
    transaction_status = Column(String(50), nullable=False, index=True)  # pending, settlement, cancel, expire, deny
    fraud_status = Column(String(50), nullable=True)
    transaction_time = Column(DateTime(timezone=True), nullable=True)
    status_message = Column(String(500), nullable=True)
    midtrans_transaction_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relasi
    transaction = relationship("Transaction", foreign_keys=[transaction_id])


