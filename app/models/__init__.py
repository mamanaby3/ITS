from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'manager', 'operator', 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    dispatches = db.relationship('Dispatch', back_populates='manager', foreign_keys='Dispatch.manager_id')

class Client(db.Model):
    __tablename__ = 'clients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    contact = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    stocks = db.relationship('Stock', back_populates='client')
    dispatches = db.relationship('Dispatch', back_populates='client')

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    unit = db.Column(db.String(20), default='tonnes')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    stocks = db.relationship('Stock', back_populates='product')
    movements = db.relationship('StockMovement', back_populates='product')

class Warehouse(db.Model):
    __tablename__ = 'warehouses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    location = db.Column(db.String(200))
    capacity = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    stocks = db.relationship('Stock', back_populates='warehouse')
    movements = db.relationship('StockMovement', back_populates='warehouse')

class Chauffeur(db.Model):
    __tablename__ = 'chauffeurs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    license_number = db.Column(db.String(50), unique=True, nullable=False)
    truck_number = db.Column(db.String(20))
    truck_capacity = db.Column(db.Float, default=40.0)  # en tonnes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    rotations = db.relationship('Rotation', back_populates='chauffeur')

class Stock(db.Model):
    __tablename__ = 'stocks'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    client = db.relationship('Client', back_populates='stocks')
    product = db.relationship('Product', back_populates='stocks')
    warehouse = db.relationship('Warehouse', back_populates='stocks')
    
    __table_args__ = (db.UniqueConstraint('client_id', 'product_id', 'warehouse_id'),)

class Dispatch(db.Model):
    __tablename__ = 'dispatches'
    
    id = db.Column(db.Integer, primary_key=True)
    dispatch_number = db.Column(db.String(50), unique=True, nullable=False)
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    source_warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    destination_warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    total_quantity = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    manager = db.relationship('User', back_populates='dispatches')
    client = db.relationship('Client', back_populates='dispatches')
    product = db.relationship('Product')
    source_warehouse = db.relationship('Warehouse', foreign_keys=[source_warehouse_id])
    destination_warehouse = db.relationship('Warehouse', foreign_keys=[destination_warehouse_id])
    rotations = db.relationship('Rotation', back_populates='dispatch', cascade='all, delete-orphan')

class Rotation(db.Model):
    __tablename__ = 'rotations'
    
    id = db.Column(db.Integer, primary_key=True)
    dispatch_id = db.Column(db.Integer, db.ForeignKey('dispatches.id'), nullable=False)
    chauffeur_id = db.Column(db.Integer, db.ForeignKey('chauffeurs.id'), nullable=False)
    rotation_number = db.Column(db.String(50), unique=True, nullable=False)
    expected_quantity = db.Column(db.Float, nullable=False)
    delivered_quantity = db.Column(db.Float)
    departure_time = db.Column(db.DateTime, default=datetime.utcnow)
    arrival_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='in_transit')  # in_transit, delivered, missing
    discrepancy = db.Column(db.Float, default=0)
    notes = db.Column(db.Text)
    
    dispatch = db.relationship('Dispatch', back_populates='rotations')
    chauffeur = db.relationship('Chauffeur', back_populates='rotations')

class StockMovement(db.Model):
    __tablename__ = 'stock_movements'
    
    id = db.Column(db.Integer, primary_key=True)
    movement_type = db.Column(db.String(20), nullable=False)  # 'entry', 'exit', 'transfer'
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    rotation_id = db.Column(db.Integer, db.ForeignKey('rotations.id'))
    quantity = db.Column(db.Float, nullable=False)
    reference_number = db.Column(db.String(100))
    operator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    product = db.relationship('Product', back_populates='movements')
    warehouse = db.relationship('Warehouse', back_populates='movements')
    client = db.relationship('Client')
    rotation = db.relationship('Rotation')
    operator = db.relationship('User')