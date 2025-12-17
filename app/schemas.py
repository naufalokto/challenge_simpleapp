from typing import Optional
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# Customer Register Schema
class CustomerRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str


# User Schemas
class UserBase(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role_id: int


class UserResponse(BaseModel):
    id: int
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role_id: int
    role_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# Item Schemas
class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    pass


class Item(ItemBase):
    id: int

    class Config:
        from_attributes = True


# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class Role(RoleBase):
    id: int

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentItem(BaseModel):
    id: str
    price: float
    quantity: int
    name: str


class CreatePaymentRequest(BaseModel):
    order_id: str
    gross_amount: float
    items: list[PaymentItem]
    customer_details: dict  # {first_name, last_name, email, phone}


class PaymentResponse(BaseModel):
    token: str
    redirect_url: str


class PaymentWebhook(BaseModel):
    transaction_time: str
    transaction_status: str
    transaction_id: str
    status_message: str
    payment_type: str
    order_id: str
    gross_amount: str
    fraud_status: str


# Product Schemas
class ProductBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


class Product(ProductBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    creator_name: Optional[str] = None

    class Config:
        from_attributes = True


# Transaction Schemas
class TransactionBase(BaseModel):
    order_id: str
    customer_id: int
    product_id: Optional[int] = None
    quantity: int = 1
    total_amount: float
    status: str = "pending"
    # Shipping / alamat saat checkout
    shipping_name: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: int
    payment_method: Optional[str] = None
    midtrans_transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    shipping_name: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentBase(BaseModel):
    transaction_id: int
    order_id: str
    gross_amount: float
    transaction_status: str
    payment_type: Optional[str] = None
    fraud_status: Optional[str] = None


class Payment(PaymentBase):
    id: int
    transaction_time: Optional[datetime] = None
    status_message: Optional[str] = None
    midtrans_transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Dashboard/Overview Schemas
class RecentTransactionResponse(BaseModel):
    id: int
    order_id: str
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    total_amount: float
    status: str
    created_at: datetime


class EarningsResponse(BaseModel):
    total_earnings: float
    paid_count: int
    pending_count: int
    failed_count: int


