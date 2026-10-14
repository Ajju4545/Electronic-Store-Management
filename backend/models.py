from datetime import datetime
from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, ForeignKey
from database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Category(Base):
    __tablename__ = "Category"

    category_id = Column(Integer, primary_key=True)
    category_name = Column(String(100), nullable=False)


class Supplier(Base):
    __tablename__ = "Supplier"

    supplier_id = Column(Integer, primary_key=True)
    supplier_name = Column(String(150), nullable=False)
    phone = Column(String(15))
    email = Column(String(100))
    address = Column(String(255))


class Customer(Base):
    __tablename__ = "Customer"

    customer_id = Column(Integer, primary_key=True)
    customer_name = Column(String(150), nullable=False)
    phone = Column(String(15))
    email = Column(String(100))
    address = Column(String(255))


class Employee(Base):
    __tablename__ = "Employee"

    employee_id = Column(Integer, primary_key=True)
    employee_name = Column(String(150), nullable=False)
    phone = Column(String(15))
    role = Column(String(50))
    salary = Column(DECIMAL(10, 2))


class Product(Base):
    __tablename__ = "Product"

    product_id = Column(Integer, primary_key=True)
    product_name = Column(String(150), nullable=False)
    category_id = Column(Integer, ForeignKey("Category.category_id"), nullable=False)
    brand = Column(String(100))
    price = Column(DECIMAL(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    warranty_months = Column(Integer, default=0)


class Purchase(Base):
    __tablename__ = "Purchase"

    purchase_id = Column(Integer, primary_key=True)
    supplier_id = Column(Integer, ForeignKey("Supplier.supplier_id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("Employee.employee_id"), nullable=False)
    purchase_date = Column(Date, nullable=False)
    total_cost = Column(DECIMAL(12, 2), nullable=False)


class PurchaseDetails(Base):
    __tablename__ = "Purchase_Details"

    purchase_detail_id = Column(Integer, primary_key=True)
    purchase_id = Column(Integer, ForeignKey("Purchase.purchase_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("Product.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(DECIMAL(10, 2), nullable=False)


class Sale(Base):
    __tablename__ = "Sale"

    sale_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("Customer.customer_id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("Employee.employee_id"), nullable=False)
    sale_date = Column(Date, nullable=False)
    total_amount = Column(DECIMAL(12, 2), nullable=False)
    payment_method = Column(String(30))


class SaleDetails(Base):
    __tablename__ = "Sale_Details"

    sale_detail_id = Column(Integer, primary_key=True)
    sale_id = Column(Integer, ForeignKey("Sale.sale_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("Product.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)