from datetime import timedelta
from typing import Optional
import os
import shutil
import uuid
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Request, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import json

# Load environment variables from .env file
load_dotenv()

from . import models, schemas, auth
from .database import engine, get_db, SessionLocal
from .midtrans_config import get_midtrans_snap, get_midtrans_core

models.Base.metadata.create_all(bind=engine)

# Inisialisasi roles default jika belum ada
def init_roles(db: Session):
    """Buat role admin, sales, dan customer jika belum ada"""
    admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
    if not admin_role:
        admin_role = models.Role(name="admin", description="Administrator")
        db.add(admin_role)
    
    sales_role = db.query(models.Role).filter(models.Role.name == "sales").first()
    if not sales_role:
        sales_role = models.Role(name="sales", description="Sales Person")
        db.add(sales_role)
    
    customer_role = db.query(models.Role).filter(models.Role.name == "customer").first()
    if not customer_role:
        customer_role = models.Role(name="customer", description="Customer Portal User")
        db.add(customer_role)
    
    db.commit()
    return admin_role, sales_role, customer_role

# Inisialisasi saat startup
db_init = SessionLocal()
try:
    init_roles(db_init)
finally:
    db_init.close()

app = FastAPI(title="Simple FastAPI + PostgreSQL App")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Allow requests from the React dev server (localhost:3000)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme untuk JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# Dependencies untuk authentication
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current user dari JWT token"""
    identifier = auth.decode_token(token)
    if identifier is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Cek apakah identifier adalah email atau username
    if "@" in identifier:
        user = auth.get_user_by_email(db, identifier)
    else:
        user = auth.get_user_by_username(db, identifier)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(role_name: str):
    """Dependency untuk cek role user"""
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role.name != role_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {role_name}"
            )
        return current_user
    return role_checker


# Permission Dependencies
def get_current_employee(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Dependency untuk require employee (admin atau sales)"""
    auth.require_employee(current_user)
    return current_user


def get_current_customer(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Dependency untuk require customer"""
    auth.require_customer(current_user)
    return current_user


def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Dependency untuk require admin"""
    auth.require_admin(current_user)
    return current_user


@app.get("/")
def read_root():
    return {"message": "API is running"}


# Auth endpoints
@app.post("/auth/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint - return JWT token"""
    print(f"Login attempt - Username: '{form_data.username}', Password length: {len(form_data.password) if form_data.password else 0}")
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        print(f"Authentication failed for username: '{form_data.username}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Gunakan email jika ada, jika tidak pakai username
    user_identifier = user.email if user.email else user.username
    access_token = auth.create_access_token(
        data={"sub": user_identifier}, expires_delta=access_token_expires
    )
    
    # Get role name
    role_name = user.role.name if user.role else None
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role_id": user.role_id,
            "role_name": role_name,
            "is_active": user.is_active
        }
    }


@app.get("/auth/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role_id": current_user.role_id,
        "role_name": current_user.role.name if current_user.role else None,
        "is_active": current_user.is_active
    }


@app.post("/auth/register", response_model=schemas.UserResponse)
def register_user(
    user_data: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)  # Hanya admin yang bisa create employee
):
    """Register employee baru - hanya admin yang bisa akses"""
    # Validasi: tidak boleh register customer via endpoint ini
    role = db.query(models.Role).filter(models.Role.id == user_data.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role_id"
        )
    
    if role.name == "customer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /auth/register/customer endpoint for customer registration"
        )
    
    # Cek apakah username sudah ada
    if user_data.username:
        existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
    
    # Buat user baru (employee)
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role_id=user_data.role_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role_id": new_user.role_id,
        "role_name": new_user.role.name if new_user.role else None,
        "is_active": new_user.is_active
    }


@app.post("/auth/register/customer", response_model=schemas.UserResponse)
def register_customer(customer_data: schemas.CustomerRegister, db: Session = Depends(get_db)):
    """Register customer baru - public endpoint"""
    # Cek apakah email sudah ada
    existing_user = db.query(models.User).filter(models.User.email == customer_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Get customer role
    customer_role = db.query(models.Role).filter(models.Role.name == "customer").first()
    if not customer_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Customer role not found"
        )
    
    # Buat customer baru
    hashed_password = auth.get_password_hash(customer_data.password)
    new_customer = models.User(
        username=None,  # Customer tidak pakai username
        email=customer_data.email,
        full_name=customer_data.full_name,
        hashed_password=hashed_password,
        role_id=customer_role.id,
        is_active=True
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    
    return {
        "id": new_customer.id,
        "username": new_customer.username,
        "email": new_customer.email,
        "full_name": new_customer.full_name,
        "role_id": new_customer.role_id,
        "role_name": new_customer.role.name if new_customer.role else None,
        "is_active": new_customer.is_active
    }


# ==================== EXAMPLE ENDPOINTS WITH PERMISSION ====================

# Employee-only endpoints (admin dan sales)
@app.post("/items", response_model=schemas.Item)
def create_item(
    item: schemas.ItemCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_employee)  # Hanya employee
):
    """Create item - hanya employee yang bisa"""
    db_item = models.Item(title=item.title, description=item.description)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/items", response_model=list[schemas.Item])
def list_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_employee)  # Hanya employee
):
    """List all items - hanya employee yang bisa"""
    items = db.query(models.Item).all()
    return items


@app.get("/items/{item_id}", response_model=schemas.Item)
def get_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  # Semua user yang login
):
    """Get item - semua user yang login bisa akses"""
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.delete("/items/{item_id}")
def delete_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)  # Hanya admin
):
    """Delete item - hanya admin yang bisa"""
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


# Customer-only endpoints
@app.get("/my/orders")
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_customer)  # Hanya customer
):
    """Get customer's own orders - hanya customer yang bisa akses"""
    # TODO: Implement order model dan query
    return {
        "message": "My orders",
        "user_id": current_user.id,
        "orders": []  # Placeholder
    }


# Employee dashboard endpoint
@app.get("/employee/dashboard")
def employee_dashboard(
    current_user: models.User = Depends(get_current_employee)  # Hanya employee
):
    """Employee dashboard - hanya employee yang bisa akses"""
    return {
        "message": "Employee Dashboard",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.name
        }
    }


# Customer dashboard endpoint
@app.get("/customer/dashboard")
def customer_dashboard(
    current_user: models.User = Depends(get_current_customer)  # Hanya customer
):
    """Customer dashboard - hanya customer yang bisa akses"""
    return {
        "message": "Customer Dashboard",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.name
        }
    }


# ==================== MIDTRANS PAYMENT ENDPOINTS ====================

@app.post("/api/payment/create", response_model=schemas.PaymentResponse)
def create_payment(
    payment_data: schemas.CreatePaymentRequest,
    current_user: models.User = Depends(get_current_customer),  # Hanya customer
    db: Session = Depends(get_db)
):
    """Create Midtrans payment transaction"""
    try:
        # Initialize Midtrans Snap
        snap = get_midtrans_snap()
        
        # Prepare transaction data
        transaction_details = {
            "order_id": payment_data.order_id,
            "gross_amount": payment_data.gross_amount
        }
        
        # Prepare item details
        item_details = []
        for item in payment_data.items:
            item_details.append({
                "id": item.id,
                "price": item.price,
                "quantity": item.quantity,
                "name": item.name
            })
        
        # Prepare customer details
        customer_details = payment_data.customer_details
        # Tambahkan customer ID dari current user
        customer_details["user_id"] = str(current_user.id)
        
        # Prepare redirect URLs untuk redirect kembali ke aplikasi setelah payment
        # URL akan redirect ke frontend dengan query params order_id dan transaction_status
        frontend_base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        # Redirect ke root dengan query params agar bisa di-handle oleh CustomerPage
        finish_redirect_url = f"{frontend_base_url}/?payment=success"
        unfinish_redirect_url = f"{frontend_base_url}/?payment=unfinish"
        error_redirect_url = f"{frontend_base_url}/?payment=error"
        
        # Create transaction
        param = {
            "transaction_details": transaction_details,
            "item_details": item_details,
            "customer_details": customer_details,
            "callbacks": {
                "finish": finish_redirect_url,
                "unfinish": unfinish_redirect_url,
                "error": error_redirect_url
            }
        }
        
        # Create transaction token
        transaction = snap.create_transaction(param)
        
        return {
            "token": transaction["token"],
            "redirect_url": transaction["redirect_url"]
        }
        
    except Exception as e:
        print(f"Error creating payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment: {str(e)}"
        )


@app.post("/api/payment/webhook")
async def payment_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Midtrans payment notification webhook"""
    try:
        # Parse JSON body dari Midtrans webhook
        body = await request.json()
        
        # Parse webhook data
        transaction_status = body.get("transaction_status")
        order_id = body.get("order_id")
        transaction_id = body.get("transaction_id")
        gross_amount = body.get("gross_amount")
        fraud_status = body.get("fraud_status")
        payment_type = body.get("payment_type")
        status_message = body.get("status_message")
        transaction_time = body.get("transaction_time")
        
        print(f"Webhook received - Order ID: {order_id}, Status: {transaction_status}")
        print(f"Full webhook data: {json.dumps(body, indent=2)}")
        
        # Find transaction by order_id
        transaction = db.query(models.Transaction).filter(models.Transaction.order_id == order_id).first()
        if not transaction:
            print(f"Transaction not found for order_id: {order_id}")
            return {"status": "ok"}
        
        # Update or create payment record
        payment = db.query(models.Payment).filter(models.Payment.order_id == order_id).first()
        if not payment:
            payment = models.Payment(
                transaction_id=transaction.id,
                order_id=order_id,
                gross_amount=float(gross_amount) if gross_amount else transaction.total_amount,
                payment_type=payment_type,
                transaction_status=transaction_status,
                fraud_status=fraud_status,
                midtrans_transaction_id=transaction_id,
                status_message=status_message,
            )
            db.add(payment)
        else:
            payment.transaction_status = transaction_status
            payment.fraud_status = fraud_status
            payment.midtrans_transaction_id = transaction_id
            payment.status_message = status_message
            if transaction_time:
                from datetime import datetime
                payment.transaction_time = datetime.fromisoformat(transaction_time.replace('Z', '+00:00'))
        
        # Update transaction status and reduce stock on payment success
        # Hanya kurangi stock jika status berubah dari pending/other ke paid (menghindari double decrement)
        if transaction_status in ["settlement", "capture"]:
            # Payment success
            # Cek apakah status sebelumnya sudah "paid" untuk menghindari double decrement stock
            previous_status = transaction.status
            transaction.status = "paid"
            transaction.midtrans_transaction_id = transaction_id
            
            # Reduce stock hanya jika sebelumnya belum "paid" (menghindari double decrement)
            if previous_status != "paid" and transaction.product_id:
                product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
                if product:
                    # Check if stock is sufficient
                    if product.stock >= transaction.quantity:
                        product.stock -= transaction.quantity
                        print(f"Stock reduced for product {product.id}: {product.stock + transaction.quantity} -> {product.stock}")
                    else:
                        print(f"Warning: Insufficient stock for product {product.id}. Stock: {product.stock}, Requested: {transaction.quantity}")
        elif transaction_status in ["deny", "cancel", "expire"]:
            # Payment failed
            transaction.status = "failed"
        
        db.commit()
        
        # Return response untuk Midtrans
        return {"status": "ok"}
        
    except Exception as e:
        print(f"Error processing webhook: {e}")
        import traceback
        traceback.print_exc()
        # Tetap return ok agar Midtrans tidak retry terus
        return {"status": "error", "message": str(e)}


# ==================== MANUAL PAYMENT STATUS UPDATE (UNTUK TESTING) ====================
@app.post("/api/payment/manual-update")
def manual_update_payment_status(
    order_id: str,
    transaction_status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Manual update payment status - untuk testing saat webhook tidak bisa diakses
    Hanya untuk development/testing, sebaiknya di-disable di production
    """
    try:
        print(f"Manual update - Order ID: {order_id}, Status: {transaction_status}")
        
        # Find transaction by order_id
        transaction = db.query(models.Transaction).filter(models.Transaction.order_id == order_id).first()
        if not transaction:
            raise HTTPException(status_code=404, detail=f"Transaction not found for order_id: {order_id}")
        
        # Update or create payment record
        payment = db.query(models.Payment).filter(models.Payment.order_id == order_id).first()
        if not payment:
            payment = models.Payment(
                transaction_id=transaction.id,
                order_id=order_id,
                gross_amount=float(transaction.total_amount),
                transaction_status=transaction_status,
                midtrans_transaction_id=f"manual-{order_id}",
            )
            db.add(payment)
        else:
            payment.transaction_status = transaction_status
        
        # Update transaction status and reduce stock on payment success
        # Hanya kurangi stock jika status berubah dari pending/other ke paid (menghindari double decrement)
        if transaction_status in ["settlement", "capture"]:
            # Payment success
            # Cek apakah status sebelumnya sudah "paid" untuk menghindari double decrement stock
            previous_status = transaction.status
            transaction.status = "paid"
            
            # Reduce stock hanya jika sebelumnya belum "paid" (menghindari double decrement)
            if previous_status != "paid" and transaction.product_id:
                product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
                if product:
                    # Check if stock is sufficient
                    if product.stock >= transaction.quantity:
                        product.stock -= transaction.quantity
                        print(f"Stock reduced for product {product.id}: {product.stock + transaction.quantity} -> {product.stock}")
                    else:
                        print(f"Warning: Insufficient stock for product {product.id}. Stock: {product.stock}, Requested: {transaction.quantity}")
        elif transaction_status in ["deny", "cancel", "expire"]:
            # Payment failed
            transaction.status = "failed"
        
        db.commit()
        
        return {
            "status": "ok",
            "message": f"Payment status updated to {transaction_status}",
            "transaction_id": transaction.id,
            "order_id": order_id
        }
        
    except Exception as e:
        print(f"Error in manual update: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CHECK PAYMENT STATUS FROM MIDTRANS ====================
@app.get("/api/payment/check-status/{order_id}")
def check_payment_status(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Check payment status dari Midtrans API dan update database
    Berguna saat webhook tidak terpanggil otomatis
    """
    try:
        # Find transaction by order_id
        transaction = db.query(models.Transaction).filter(models.Transaction.order_id == order_id).first()
        if not transaction:
            raise HTTPException(status_code=404, detail=f"Transaction not found for order_id: {order_id}")
        
        # Check permission: customer hanya bisa check transaksi mereka sendiri
        if current_user.role.name == "customer" and transaction.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get status dari Midtrans Core API
        core_api = get_midtrans_core()
        status_response = core_api.transactions.status(order_id)
        
        print(f"Midtrans status check - Order ID: {order_id}, Status: {status_response.get('transaction_status')}")
        
        transaction_status = status_response.get("transaction_status")
        transaction_id = status_response.get("transaction_id")
        gross_amount = status_response.get("gross_amount")
        payment_type = status_response.get("payment_type")
        fraud_status = status_response.get("fraud_status")
        status_message = status_response.get("status_message")
        transaction_time = status_response.get("transaction_time")
        
        # Update or create payment record
        payment = db.query(models.Payment).filter(models.Payment.order_id == order_id).first()
        if not payment:
            payment = models.Payment(
                transaction_id=transaction.id,
                order_id=order_id,
                gross_amount=float(gross_amount) if gross_amount else transaction.total_amount,
                payment_type=payment_type,
                transaction_status=transaction_status,
                fraud_status=fraud_status,
                midtrans_transaction_id=transaction_id,
                status_message=status_message,
            )
            db.add(payment)
        else:
            payment.transaction_status = transaction_status
            payment.fraud_status = fraud_status
            payment.midtrans_transaction_id = transaction_id
            payment.status_message = status_message
            if transaction_time:
                from datetime import datetime
                payment.transaction_time = datetime.fromisoformat(transaction_time.replace('Z', '+00:00'))
        
        # Update transaction status and reduce stock on payment success
        # Hanya kurangi stock jika status berubah dari pending/other ke paid (menghindari double decrement)
        if transaction_status in ["settlement", "capture"]:
            # Payment success
            # Cek apakah status sebelumnya sudah "paid" untuk menghindari double decrement stock
            previous_status = transaction.status
            transaction.status = "paid"
            transaction.midtrans_transaction_id = transaction_id
            
            # Reduce stock hanya jika sebelumnya belum "paid" (menghindari double decrement)
            if previous_status != "paid" and transaction.product_id:
                product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
                if product:
                    # Check if stock is sufficient
                    if product.stock >= transaction.quantity:
                        product.stock -= transaction.quantity
                        print(f"Stock reduced for product {product.id}: {product.stock + transaction.quantity} -> {product.stock}")
                    else:
                        print(f"Warning: Insufficient stock for product {product.id}. Stock: {product.stock}, Requested: {transaction.quantity}")
        elif transaction_status in ["deny", "cancel", "expire"]:
            # Payment failed
            transaction.status = "failed"
        
        db.commit()
        
        return {
            "status": "ok",
            "order_id": order_id,
            "transaction_status": transaction_status,
            "message": f"Payment status: {transaction_status}"
        }
        
    except Exception as e:
        print(f"Error checking payment status: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PRODUCT ENDPOINTS ====================
@app.post("/api/products", response_model=schemas.Product)
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    description: Optional[str] = Form(None),
    stock: int = Form(0),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_employee)
):
    """Create new product - hanya employee (admin/sales) yang bisa"""
    image_url = None
    
    # Handle file upload
    if image:
        # Generate unique filename
        file_extension = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Set image URL (relative path untuk di-serve via static files)
        image_url = f"/uploads/{unique_filename}"
    
    product = models.Product(
        name=name,
        price=price,
        description=description,
        image_url=image_url,
        stock=stock,
        created_by=current_user.id
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Get creator name
    creator = db.query(models.User).filter(models.User.id == product.created_by).first()
    return {
        **schemas.Product.model_validate(product).model_dump(),
        "creator_name": creator.full_name if creator and creator.full_name else creator.username if creator else None
    }


@app.get("/api/products", response_model=list[schemas.Product])
def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all products"""
    products = db.query(models.Product).filter(models.Product.is_active == True).offset(skip).limit(limit).all()
    result = []
    for product in products:
        creator = db.query(models.User).filter(models.User.id == product.created_by).first()
        result.append({
            **schemas.Product.model_validate(product).model_dump(),
            "creator_name": creator.full_name if creator and creator.full_name else creator.username if creator else None
        })
    return result


@app.get("/api/products/{product_id}", response_model=schemas.Product)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get product by ID"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    creator = db.query(models.User).filter(models.User.id == product.created_by).first()
    return {
        **schemas.Product.model_validate(product).model_dump(),
        "creator_name": creator.full_name if creator and creator.full_name else creator.username if creator else None
    }


@app.put("/api/products/{product_id}", response_model=schemas.Product)
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    description: Optional[str] = Form(None),
    stock: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    is_active: Optional[bool] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_employee)
):
    """Update product - hanya employee yang bisa"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    if name is not None:
        product.name = name
    if price is not None:
        product.price = price
    if description is not None:
        product.description = description
    if stock is not None:
        product.stock = stock
    if is_active is not None:
        product.is_active = is_active
    
    # Handle file upload
    if image:
        # Delete old image if exists
        if product.image_url and product.image_url.startswith("/uploads/"):
            old_file_path = product.image_url.replace("/uploads/", UPLOAD_DIR + "/")
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Generate unique filename
        file_extension = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Set image URL
        product.image_url = f"/uploads/{unique_filename}"
    
    db.commit()
    db.refresh(product)
    creator = db.query(models.User).filter(models.User.id == product.created_by).first()
    return {
        **schemas.Product.model_validate(product).model_dump(),
        "creator_name": creator.full_name if creator and creator.full_name else creator.username if creator else None
    }


@app.delete("/api/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_employee)
):
    """Delete product (soft delete) - hanya employee yang bisa"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.is_active = False
    db.commit()
    return {"message": "Product deleted successfully"}


# ==================== TRANSACTION ENDPOINTS ====================
@app.post("/api/transactions", response_model=schemas.Transaction)
def create_transaction(
    transaction_data: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create new transaction"""
    # Check stock if product_id is provided
    if transaction_data.product_id:
        product = db.query(models.Product).filter(models.Product.id == transaction_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if stock is sufficient
        if product.stock < transaction_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available: {product.stock}, Requested: {transaction_data.quantity}"
            )
    
    transaction = models.Transaction(
        order_id=transaction_data.order_id,
        customer_id=transaction_data.customer_id,
        product_id=transaction_data.product_id,
        quantity=transaction_data.quantity,
        total_amount=transaction_data.total_amount,
        status=transaction_data.status,
        shipping_name=transaction_data.shipping_name,
        shipping_phone=transaction_data.shipping_phone,
        shipping_address=transaction_data.shipping_address,
        shipping_city=transaction_data.shipping_city,
        shipping_postal_code=transaction_data.shipping_postal_code,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    # Get customer and product names
    customer = db.query(models.User).filter(models.User.id == transaction.customer_id).first()
    product = None
    if transaction.product_id:
        product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
    
    return {
        **schemas.Transaction.model_validate(transaction).model_dump(),
        "customer_name": customer.full_name if customer and customer.full_name else customer.email if customer else None,
        "product_name": product.name if product else None
    }


@app.get("/api/transactions", response_model=list[schemas.Transaction])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all transactions - sales/admin bisa lihat semua, customer hanya lihat miliknya"""
    query = db.query(models.Transaction)
    
    # Customer hanya bisa lihat transaksi mereka sendiri
    if current_user.role.name == "customer":
        query = query.filter(models.Transaction.customer_id == current_user.id)
    
    # Filter by status if provided
    if status:
        query = query.filter(models.Transaction.status == status)
    
    transactions = query.order_by(models.Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for transaction in transactions:
        customer = db.query(models.User).filter(models.User.id == transaction.customer_id).first()
        product = None
        if transaction.product_id:
            product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
        result.append({
            **schemas.Transaction.model_validate(transaction).model_dump(),
            "customer_name": customer.full_name if customer and customer.full_name else customer.email if customer else None,
            "product_name": product.name if product else None
        })
    return result


@app.get("/api/transactions/{transaction_id}", response_model=schemas.Transaction)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get transaction by ID"""
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check permission: customer hanya bisa lihat transaksi mereka sendiri
    if current_user.role.name == "customer" and transaction.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    customer = db.query(models.User).filter(models.User.id == transaction.customer_id).first()
    product = None
    if transaction.product_id:
        product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
    
    return {
        **schemas.Transaction.model_validate(transaction).model_dump(),
        "customer_name": customer.full_name if customer and customer.full_name else customer.email if customer else None,
        "product_name": product.name if product else None
    }


# ==================== PAYMENT ENDPOINTS ====================
@app.get("/api/payments", response_model=list[schemas.Payment])
def get_payments(
    skip: int = 0,
    limit: int = 100,
    transaction_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_employee)
):
    """Get all payments - hanya employee yang bisa akses"""
    query = db.query(models.Payment)
    
    # Filter by transaction_status if provided
    if transaction_status:
        query = query.filter(models.Payment.transaction_status == transaction_status)
    
    payments = query.order_by(models.Payment.created_at.desc()).offset(skip).limit(limit).all()
    return payments


@app.get("/api/payments/{payment_id}", response_model=schemas.Payment)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_employee)
):
    """Get payment by ID - hanya employee yang bisa akses"""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


# ==================== DASHBOARD/OVERVIEW ENDPOINTS ====================
@app.get("/api/dashboard/recent-transactions", response_model=list[schemas.RecentTransactionResponse])
def get_recent_transactions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get recent transactions for dashboard"""
    query = db.query(models.Transaction)
    
    # Customer hanya bisa lihat transaksi mereka sendiri
    if current_user.role.name == "customer":
        query = query.filter(models.Transaction.customer_id == current_user.id)
    
    transactions = query.order_by(models.Transaction.created_at.desc()).limit(limit).all()
    
    result = []
    for transaction in transactions:
        customer = db.query(models.User).filter(models.User.id == transaction.customer_id).first()
        product = None
        if transaction.product_id:
            product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
        result.append({
            "id": transaction.id,
            "order_id": transaction.order_id,
            "customer_name": customer.full_name if customer and customer.full_name else customer.email if customer else None,
            "product_name": product.name if product else None,
            "total_amount": float(transaction.total_amount),
            "status": transaction.status,
            "created_at": transaction.created_at
        })
    return result


@app.get("/api/dashboard/earnings", response_model=schemas.EarningsResponse)
def get_earnings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_employee)
):
    """Get earnings statistics - hanya employee yang bisa akses"""
    # Get all paid transactions
    paid_transactions = db.query(models.Transaction).filter(models.Transaction.status == "paid").all()
    pending_transactions = db.query(models.Transaction).filter(models.Transaction.status == "pending").all()
    failed_transactions = db.query(models.Transaction).filter(models.Transaction.status == "failed").all()
    
    total_earnings = sum(float(t.total_amount) for t in paid_transactions)
    
    return {
        "total_earnings": total_earnings,
        "paid_count": len(paid_transactions),
        "pending_count": len(pending_transactions),
        "failed_count": len(failed_transactions)
    }


