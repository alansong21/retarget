"""Database models for the Grabbit application.

This module defines the SQLAlchemy models that represent the database schema.
It includes models for users, orders, and order assignments, establishing
the relationships between buyers, carriers, and delivery orders.
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

class User(db.Model):
    """User model representing both buyers and carriers in the system.
    
    A user can be either a buyer who creates orders or a carrier who fulfills them.
    The role field distinguishes between these two types of users.
    
    Attributes:
        id (int): Primary key
        name (str): User's full name
        email (str): User's email address (unique)
        password_hash (str): Hashed password
        phone_number (str): Contact phone number
        role (str): User role ('buyer' or 'carrier')
        created_at (datetime): Account creation timestamp
        updated_at (datetime): Last update timestamp
        orders (relationship): Orders created by this user (if buyer)
        assignments (relationship): Orders assigned to this user (if carrier)
    """
    
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    phone_number = db.Column(db.String(20))
    role = db.Column(db.String(20)) # 'buyer' or 'carrier'
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    orders = db.relationship('Order', backref='buyer', lazy=True, foreign_keys='Order.buyer_id')
    assignments = db.relationship('OrderAssignment', backref='carrier', lazy=True, foreign_keys='OrderAssignment.carrier_id')

class Order(db.Model):
    """Order model representing a delivery request.
    
    An order is created by a buyer and can be assigned to a carrier for fulfillment.
    It includes details about the items to be delivered, locations, and associated fees.
    
    Attributes:
        id (int): Primary key
        buyer_id (int): Foreign key to the buyer's user ID
        store_name (str): Name of the store where items should be purchased
        item_list_json (str): JSON string containing the list of items to purchase
        delivery_location (str): Delivery destination address
        service_fee (float): Fee charged for the service
        carrier_reward (float): Payment offered to the carrier
        status (str): Current order status
            ('open', 'assigned', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled', 'expired')
        created_at (datetime): Order creation timestamp
        updated_at (datetime): Last update timestamp
        assigned_carrier_id (int): Foreign key to the assigned carrier's user ID
        expiry_time (datetime): Time when the order expires if not accepted
        assignment (relationship): Associated order assignment details
    """
    
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    store_name = db.Column(db.String(120), nullable=False)
    items = db.Column(db.JSON, nullable=False)  # JSON array of items
    delivery_address = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='open') # open, assigned, in_progress, ready_for_pickup, completed, cancelled, expired
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    assigned_carrier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    expiry_time = db.Column(db.DateTime, nullable=False)

    assignment = db.relationship('OrderAssignment', backref='order', uselist=False)

class OrderAssignment(db.Model):
    """OrderAssignment model tracking the assignment of orders to carriers.
    
    When a carrier accepts an order, an assignment is created to track the fulfillment
    process and maintain the relationship between the order and carrier.
    
    Attributes:
        id (int): Primary key
        order_id (int): Foreign key to the assigned order
        carrier_id (int): Foreign key to the carrier's user ID
        status (str): Assignment status
            ('assigned', 'in_progress', 'ready_for_pickup', 'completed')
        accepted_at (datetime): Timestamp when the carrier accepted the order
        completed_at (datetime): Timestamp when the order was completed (if applicable)
    """
    
    __tablename__ = 'order_assignments'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    carrier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='assigned') # assigned, in_progress, ready_for_pickup, completed
    accepted_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)