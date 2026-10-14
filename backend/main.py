from datetime import date, datetime, timedelta
from typing import Optional
import bcrypt
import jwt
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from pydantic import BaseModel

from database import engine, get_db
from models import (
    AdminUser,
    Category,
    Supplier,
    Customer,
    Employee,
    Product,
    Purchase,
    PurchaseDetails,
    Sale,
    SaleDetails
)


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Electronic Store Management System",
    description="Backend API for Electronic Store Management System",
    version="1.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# HOME & HEALTH CHECK
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Electronic Store Management System Backend is Running",
        "status": "online"
    }


@app.get("/test-db")
@app.get("/health")
@app.get("/api/health")
def test_database():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return {
                "status": "success",
                "database": "connected",
                "message": "MySQL Database Connected Successfully"
            }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "message": f"Unable to connect to MySQL database: {str(e)}"
        }


# =========================================================
# ==================== AUTHENTICATION =====================
# =========================================================

JWT_SECRET_KEY = "electrostore-super-secret-jwt-key-2026-management-system-auth"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=JWT_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> AdminUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    token = authorization.split("Bearer ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@app.get("/auth/status")
def get_auth_status(db: Session = Depends(get_db)):
    count = db.query(AdminUser).count()
    return {
        "has_admin": count > 0,
        "admin_count": count
    }


@app.post("/auth/register")
def register_admin(payload: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email or "." not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    existing = db.query(AdminUser).filter(func.lower(AdminUser.email) == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An administrator with this email address already exists."
        )

    full_name = payload.full_name.strip() if payload.full_name else clean_email.split("@")[0].capitalize()
    hashed = hash_password(payload.password)
    user = AdminUser(
        email=clean_email,
        hashed_password=hashed,
        full_name=full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"user_id": user.id, "email": user.email})
    return {
        "status": "success",
        "message": "Admin user registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }


@app.post("/auth/login")
def login_admin(payload: LoginRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    if not clean_email or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    user = db.query(AdminUser).filter(func.lower(AdminUser.email) == clean_email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials and try again."
        )

    token = create_access_token({"user_id": user.id, "email": user.email})
    return {
        "status": "success",
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }


@app.get("/auth/me")
def get_authenticated_user(current_user: AdminUser = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }


@app.post("/auth/change-password")
def change_admin_password(
    payload: ChangePasswordRequest,
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match our records."
        )
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {
        "status": "success",
        "message": "Password changed successfully."
    }


# =========================================================
# ======================= CATEGORY ========================
# =========================================================

class CategoryCreate(BaseModel):
    category_name: str


@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@app.get("/categories/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):

    category = db.query(Category).filter(
        Category.category_id == category_id
    ).first()

    if not category:
        return {
            "status": "error",
            "message": "Category not found"
        }

    return category


@app.post("/categories")
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):

    last_category = db.query(Category).order_by(
        Category.category_id.desc()
    ).first()

    new_id = last_category.category_id + 1 if last_category else 1

    new_category = Category(
        category_id=new_id,
        category_name=category.category_name
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@app.put("/categories/{category_id}")
def update_category(
    category_id: int,
    category: CategoryCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Category).filter(
        Category.category_id == category_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Category not found"
        }

    existing.category_name = category.category_name

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):

    category = db.query(Category).filter(
        Category.category_id == category_id
    ).first()

    if not category:
        return {
            "status": "error",
            "message": "Category not found"
        }

    try:
        db.delete(category)
        db.commit()

        return {
            "status": "success",
            "message": "Category deleted successfully",
            "category_id": category_id
        }

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "message": "Category cannot be deleted because it is used by products",
            "details": str(e)
        }


# =========================================================
# ======================= SUPPLIER ========================
# =========================================================

class SupplierCreate(BaseModel):
    supplier_name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None


@app.get("/suppliers")
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).all()


@app.get("/suppliers/{supplier_id}")
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id
    ).first()

    if not supplier:
        return {
            "status": "error",
            "message": "Supplier not found"
        }

    return supplier


@app.post("/suppliers")
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db)
):

    last_supplier = db.query(Supplier).order_by(
        Supplier.supplier_id.desc()
    ).first()

    new_id = last_supplier.supplier_id + 1 if last_supplier else 1

    new_supplier = Supplier(
        supplier_id=new_id,
        supplier_name=supplier.supplier_name,
        phone=supplier.phone,
        email=supplier.email,
        address=supplier.address
    )

    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    return new_supplier


@app.put("/suppliers/{supplier_id}")
def update_supplier(
    supplier_id: int,
    supplier: SupplierCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Supplier not found"
        }

    existing.supplier_name = supplier.supplier_name
    existing.phone = supplier.phone
    existing.email = supplier.email
    existing.address = supplier.address

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/suppliers/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id
    ).first()

    if not supplier:
        return {
            "status": "error",
            "message": "Supplier not found"
        }

    try:
        db.delete(supplier)
        db.commit()

        return {
            "status": "success",
            "message": "Supplier deleted successfully",
            "supplier_id": supplier_id
        }

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "message": "Supplier cannot be deleted because it is used by purchases",
            "details": str(e)
        }


# =========================================================
# ======================= CUSTOMER ========================
# =========================================================

class CustomerCreate(BaseModel):
    customer_name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None


@app.get("/customers")
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()


@app.get("/customers/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):

    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id
    ).first()

    if not customer:
        return {
            "status": "error",
            "message": "Customer not found"
        }

    return customer


@app.post("/customers")
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db)
):

    last_customer = db.query(Customer).order_by(
        Customer.customer_id.desc()
    ).first()

    new_id = last_customer.customer_id + 1 if last_customer else 1

    new_customer = Customer(
        customer_id=new_id,
        customer_name=customer.customer_name,
        phone=customer.phone,
        email=customer.email,
        address=customer.address
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@app.put("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    customer: CustomerCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Customer).filter(
        Customer.customer_id == customer_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Customer not found"
        }

    existing.customer_name = customer.customer_name
    existing.phone = customer.phone
    existing.email = customer.email
    existing.address = customer.address

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):

    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id
    ).first()

    if not customer:
        return {
            "status": "error",
            "message": "Customer not found"
        }

    try:
        db.delete(customer)
        db.commit()

        return {
            "status": "success",
            "message": "Customer deleted successfully",
            "customer_id": customer_id
        }

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "message": "Customer cannot be deleted because it is used by sales",
            "details": str(e)
        }


# =========================================================
# ======================= EMPLOYEE ========================
# =========================================================

class EmployeeCreate(BaseModel):
    employee_name: str
    phone: str | None = None
    role: str | None = None
    salary: float | None = None


@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()


@app.get("/employees/{employee_id}")
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db)
):

    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id
    ).first()

    if not employee:
        return {
            "status": "error",
            "message": "Employee not found"
        }

    return employee


@app.post("/employees")
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db)
):

    last_employee = db.query(Employee).order_by(
        Employee.employee_id.desc()
    ).first()

    new_id = last_employee.employee_id + 1 if last_employee else 1

    new_employee = Employee(
        employee_id=new_id,
        employee_name=employee.employee_name,
        phone=employee.phone,
        role=employee.role,
        salary=employee.salary
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee


@app.put("/employees/{employee_id}")
def update_employee(
    employee_id: int,
    employee: EmployeeCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Employee).filter(
        Employee.employee_id == employee_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Employee not found"
        }

    existing.employee_name = employee.employee_name
    existing.phone = employee.phone
    existing.role = employee.role
    existing.salary = employee.salary

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db)
):

    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id
    ).first()

    if not employee:
        return {
            "status": "error",
            "message": "Employee not found"
        }

    try:
        db.delete(employee)
        db.commit()

        return {
            "status": "success",
            "message": "Employee deleted successfully",
            "employee_id": employee_id
        }

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "message": "Employee cannot be deleted because it is used by purchases or sales",
            "details": str(e)
        }


# =========================================================
# ======================== PRODUCT ========================
# =========================================================

class ProductCreate(BaseModel):
    product_name: str
    category_id: int
    brand: str | None = None
    price: float
    stock_quantity: int = 0
    warranty_months: int = 0


@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@app.get("/products/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.product_id == product_id
    ).first()

    if not product:
        return {
            "status": "error",
            "message": "Product not found"
        }

    return product


@app.post("/products")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):

    last_product = db.query(Product).order_by(
        Product.product_id.desc()
    ).first()

    new_id = last_product.product_id + 1 if last_product else 1

    new_product = Product(
        product_id=new_id,
        product_name=product.product_name,
        category_id=product.category_id,
        brand=product.brand,
        price=product.price,
        stock_quantity=product.stock_quantity,
        warranty_months=product.warranty_months
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Product).filter(
        Product.product_id == product_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Product not found"
        }

    existing.product_name = product.product_name
    existing.category_id = product.category_id
    existing.brand = product.brand
    existing.price = product.price
    existing.stock_quantity = product.stock_quantity
    existing.warranty_months = product.warranty_months

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.product_id == product_id
    ).first()

    if not product:
        return {
            "status": "error",
            "message": "Product not found"
        }

    try:
        db.delete(product)
        db.commit()

        return {
            "status": "success",
            "message": "Product deleted successfully",
            "product_id": product_id
        }

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "message": "Product cannot be deleted because it is used in purchases or sales",
            "details": str(e)
        }


# =========================================================
# ======================== PURCHASE =======================
# =========================================================

class PurchaseCreate(BaseModel):
    supplier_id: int
    employee_id: int
    purchase_date: date
    total_cost: float


@app.get("/purchases")
def get_purchases(db: Session = Depends(get_db)):
    return db.query(Purchase).all()


@app.get("/purchases/{purchase_id}")
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db)
):

    purchase = db.query(Purchase).filter(
        Purchase.purchase_id == purchase_id
    ).first()

    if not purchase:
        return {
            "status": "error",
            "message": "Purchase not found"
        }

    return purchase


@app.post("/purchases")
def create_purchase(
    purchase: PurchaseCreate,
    db: Session = Depends(get_db)
):

    last_purchase = db.query(Purchase).order_by(
        Purchase.purchase_id.desc()
    ).first()

    new_id = last_purchase.purchase_id + 1 if last_purchase else 1

    new_purchase = Purchase(
        purchase_id=new_id,
        supplier_id=purchase.supplier_id,
        employee_id=purchase.employee_id,
        purchase_date=purchase.purchase_date,
        total_cost=purchase.total_cost
    )

    db.add(new_purchase)
    db.commit()
    db.refresh(new_purchase)

    return new_purchase


@app.put("/purchases/{purchase_id}")
def update_purchase(
    purchase_id: int,
    purchase: PurchaseCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Purchase).filter(
        Purchase.purchase_id == purchase_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Purchase not found"
        }

    existing.supplier_id = purchase.supplier_id
    existing.employee_id = purchase.employee_id
    existing.purchase_date = purchase.purchase_date
    existing.total_cost = purchase.total_cost

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/purchases/{purchase_id}")
def delete_purchase(
    purchase_id: int,
    db: Session = Depends(get_db)
):

    purchase = db.query(Purchase).filter(
        Purchase.purchase_id == purchase_id
    ).first()

    if not purchase:
        return {
            "status": "error",
            "message": "Purchase not found"
        }

    try:
        db.delete(purchase)
        db.commit()

        return {
            "status": "success",
            "message": "Purchase deleted successfully",
            "purchase_id": purchase_id
        }

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "message": "Purchase cannot be deleted because it has purchase details",
            "details": str(e)
        }


# =========================================================
# =================== PURCHASE DETAILS ====================
# =========================================================

class PurchaseDetailsCreate(BaseModel):
    purchase_id: int
    product_id: int
    quantity: int
    unit_cost: float


@app.get("/purchase-details")
def get_purchase_details(purchase_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(PurchaseDetails)
    if purchase_id is not None:
        q = q.filter(PurchaseDetails.purchase_id == purchase_id)
    return q.all()


@app.get("/purchase-details/{purchase_detail_id}")
def get_purchase_detail(
    purchase_detail_id: int,
    db: Session = Depends(get_db)
):

    detail = db.query(PurchaseDetails).filter(
        PurchaseDetails.purchase_detail_id == purchase_detail_id
    ).first()

    if not detail:
        return {
            "status": "error",
            "message": "Purchase detail not found"
        }

    return detail


@app.post("/purchase-details")
def create_purchase_detail(
    detail: PurchaseDetailsCreate,
    db: Session = Depends(get_db)
):

    last_detail = db.query(PurchaseDetails).order_by(
        PurchaseDetails.purchase_detail_id.desc()
    ).first()

    new_id = last_detail.purchase_detail_id + 1 if last_detail else 1

    new_detail = PurchaseDetails(
        purchase_detail_id=new_id,
        purchase_id=detail.purchase_id,
        product_id=detail.product_id,
        quantity=detail.quantity,
        unit_cost=detail.unit_cost
    )

    db.add(new_detail)
    db.commit()
    db.refresh(new_detail)

    return new_detail


@app.put("/purchase-details/{purchase_detail_id}")
def update_purchase_detail(
    purchase_detail_id: int,
    detail: PurchaseDetailsCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(PurchaseDetails).filter(
        PurchaseDetails.purchase_detail_id == purchase_detail_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Purchase detail not found"
        }

    existing.purchase_id = detail.purchase_id
    existing.product_id = detail.product_id
    existing.quantity = detail.quantity
    existing.unit_cost = detail.unit_cost

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/purchase-details/{purchase_detail_id}")
def delete_purchase_detail(
    purchase_detail_id: int,
    db: Session = Depends(get_db)
):

    detail = db.query(PurchaseDetails).filter(
        PurchaseDetails.purchase_detail_id == purchase_detail_id
    ).first()

    if not detail:
        return {
            "status": "error",
            "message": "Purchase detail not found"
        }

    db.delete(detail)
    db.commit()

    return {
        "status": "success",
        "message": "Purchase detail deleted successfully",
        "purchase_detail_id": purchase_detail_id
    }


# =========================================================
# ========================== SALE =========================
# =========================================================

class SaleCreate(BaseModel):
    customer_id: int
    employee_id: int
    sale_date: date
    total_amount: float
    payment_method: str | None = None


@app.get("/sales")
def get_sales(db: Session = Depends(get_db)):
    return db.query(Sale).all()


@app.get("/sales/{sale_id}")
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):

    sale = db.query(Sale).filter(
        Sale.sale_id == sale_id
    ).first()

    if not sale:
        return {
            "status": "error",
            "message": "Sale not found"
        }

    return sale


@app.post("/sales")
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db)
):

    last_sale = db.query(Sale).order_by(
        Sale.sale_id.desc()
    ).first()

    new_id = last_sale.sale_id + 1 if last_sale else 1

    new_sale = Sale(
        sale_id=new_id,
        customer_id=sale.customer_id,
        employee_id=sale.employee_id,
        sale_date=sale.sale_date,
        total_amount=sale.total_amount,
        payment_method=sale.payment_method
    )

    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)

    return new_sale


@app.put("/sales/{sale_id}")
def update_sale(
    sale_id: int,
    sale: SaleCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Sale).filter(
        Sale.sale_id == sale_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Sale not found"
        }

    existing.customer_id = sale.customer_id
    existing.employee_id = sale.employee_id
    existing.sale_date = sale.sale_date
    existing.total_amount = sale.total_amount
    existing.payment_method = sale.payment_method

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/sales/{sale_id}")
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):

    sale = db.query(Sale).filter(
        Sale.sale_id == sale_id
    ).first()

    if not sale:
        return {
            "status": "error",
            "message": "Sale not found"
        }

    try:
        db.delete(sale)
        db.commit()

        return {
            "status": "success",
            "message": "Sale deleted successfully",
            "sale_id": sale_id
        }

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "message": "Sale cannot be deleted because it has sale details",
            "details": str(e)
        }


# =========================================================
# ====================== SALE DETAILS =====================
# =========================================================

class SaleDetailsCreate(BaseModel):
    sale_id: int
    product_id: int
    quantity: int
    unit_price: float


@app.get("/sale-details")
def get_sale_details(sale_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(SaleDetails)
    if sale_id is not None:
        q = q.filter(SaleDetails.sale_id == sale_id)
    return q.all()


@app.get("/sale-details/{sale_detail_id}")
def get_sale_detail(
    sale_detail_id: int,
    db: Session = Depends(get_db)
):

    detail = db.query(SaleDetails).filter(
        SaleDetails.sale_detail_id == sale_detail_id
    ).first()

    if not detail:
        return {
            "status": "error",
            "message": "Sale detail not found"
        }

    return detail


@app.post("/sale-details")
def create_sale_detail(
    detail: SaleDetailsCreate,
    db: Session = Depends(get_db)
):

    last_detail = db.query(SaleDetails).order_by(
        SaleDetails.sale_detail_id.desc()
    ).first()

    new_id = last_detail.sale_detail_id + 1 if last_detail else 1

    new_detail = SaleDetails(
        sale_detail_id=new_id,
        sale_id=detail.sale_id,
        product_id=detail.product_id,
        quantity=detail.quantity,
        unit_price=detail.unit_price
    )

    db.add(new_detail)
    db.commit()
    db.refresh(new_detail)

    return new_detail


@app.put("/sale-details/{sale_detail_id}")
def update_sale_detail(
    sale_detail_id: int,
    detail: SaleDetailsCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(SaleDetails).filter(
        SaleDetails.sale_detail_id == sale_detail_id
    ).first()

    if not existing:
        return {
            "status": "error",
            "message": "Sale detail not found"
        }

    existing.sale_id = detail.sale_id
    existing.product_id = detail.product_id
    existing.quantity = detail.quantity
    existing.unit_price = detail.unit_price

    db.commit()
    db.refresh(existing)

    return existing


@app.delete("/sale-details/{sale_detail_id}")
def delete_sale_detail(
    sale_detail_id: int,
    db: Session = Depends(get_db)
):

    detail = db.query(SaleDetails).filter(
        SaleDetails.sale_detail_id == sale_detail_id
    ).first()

    if not detail:
        return {
            "status": "error",
            "message": "Sale detail not found"
        }

    db.delete(detail)
    db.commit()

    return {
        "status": "success",
        "message": "Sale detail deleted successfully",
        "sale_detail_id": sale_detail_id
    }


# =========================================================
# ======================= DASHBOARD =======================
# =========================================================

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    total_products = db.query(Product).count()
    total_categories = db.query(Category).count()
    total_customers = db.query(Customer).count()
    total_suppliers = db.query(Supplier).count()
    total_employees = db.query(Employee).count()
    total_purchases = db.query(Purchase).count()
    total_sales = db.query(Sale).count()

    recent_sales = db.query(Sale).order_by(Sale.sale_date.desc(), Sale.sale_id.desc()).limit(5).all()
    recent_purchases = db.query(Purchase).order_by(Purchase.purchase_date.desc(), Purchase.purchase_id.desc()).limit(5).all()

    return {
        "total_products": total_products,
        "total_categories": total_categories,
        "total_customers": total_customers,
        "total_suppliers": total_suppliers,
        "total_employees": total_employees,
        "total_purchases": total_purchases,
        "total_sales": total_sales,
        "recent_sales": recent_sales,
        "recent_purchases": recent_purchases
    }


# =========================================================
# ===================== SALES REPORT ======================
# =========================================================

@app.get("/reports/sales")
def sales_report(db: Session = Depends(get_db)):

    total_sales = db.query(Sale).count()

    total_amount = db.query(
        func.sum(Sale.total_amount)
    ).scalar()

    if total_amount is None:
        total_amount = 0

    return {
        "total_sales": total_sales,
        "total_sales_amount": float(total_amount)
    }


# =========================================================
# ================== PURCHASE REPORT =====================
# =========================================================

@app.get("/reports/purchases")
def purchase_report(db: Session = Depends(get_db)):

    total_purchases = db.query(Purchase).count()

    total_cost = db.query(
        func.sum(Purchase.total_cost)
    ).scalar()

    if total_cost is None:
        total_cost = 0

    return {
        "total_purchases": total_purchases,
        "total_purchase_cost": float(total_cost)
    }


# =========================================================
# ===================== LOW STOCK =========================
# =========================================================

@app.get("/reports/low-stock")
def low_stock_products(
    db: Session = Depends(get_db)
):

    products = db.query(Product).filter(
        Product.stock_quantity <= 5
    ).all()

    return products


# =========================================================
# ===================== INVENTORY VALUE ===================
# =========================================================

@app.get("/reports/inventory")
def inventory_report(
    db: Session = Depends(get_db)
):

    products = db.query(Product).all()

    total_stock_items = sum(
        product.stock_quantity or 0
        for product in products
    )

    inventory_value = sum(
        float(product.price or 0) *
        (product.stock_quantity or 0)
        for product in products
    )

    return {
        "total_stock_items": total_stock_items,
        "inventory_value": inventory_value
    }


# =========================================================
# ===================== TOP PRODUCTS ======================
# =========================================================

@app.get("/reports/top-products")
def top_products(
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            Product.product_id,
            Product.product_name,
            func.sum(
                SaleDetails.quantity
            ).label("total_quantity_sold")
        )
        .join(
            SaleDetails,
            Product.product_id == SaleDetails.product_id
        )
        .group_by(
            Product.product_id,
            Product.product_name
        )
        .order_by(
            func.sum(
                SaleDetails.quantity
            ).desc()
        )
        .limit(10)
        .all()
    )

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "total_quantity_sold": int(row.total_quantity_sold)
        }
        for row in results
    ]


# =========================================================
# ===================== PAYMENT SUMMARY ===================
# =========================================================

@app.get("/reports/payment-methods")
def payment_methods(
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            Sale.payment_method,
            func.count(Sale.sale_id).label("total_sales"),
            func.sum(Sale.total_amount).label("total_amount")
        )
        .group_by(Sale.payment_method)
        .all()
    )

    return [
        {
            "payment_method": row.payment_method,
            "total_sales": int(row.total_sales),
            "total_amount": float(row.total_amount or 0)
        }
        for row in results
    ]