from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

class User(db.Model):
    __table_name__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    phone_number = db.Column(db.String(20))
    role = db.Column(db.String(20)) # 'buyer' or 'carrier'
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    orders = db.relationship('Order', backref='buyer', lazy=True)
    assignments = db.relationship('OrderAssignment', backref='carrier', lazy=True)

class Order(db.Model):
    __table_name__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    store_name = db.Column(db.String(120), nullable=False)
    item_list_json = db.Column(db.Text, nullable=False) # JSON string of items
    delivery_location = db.Column(db.String(255), nullable=False)
    service_fee = db.Column(db.Float, nullable=False)
    carrier_reward = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='open') # open, assigned, in_progress, ready_for_pickup, completed, cancelled, expired
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    assigned_carrier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    expiry_time = db.Column(db.DateTime, nullable=False)

    assignment = db.relationship('OrderAssignment', backref='order', uselist=False)

class OrderAssignment(db.Model):
    __table_name__ = 'order_assignments'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    carrier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='assigned') # assigned, in_progress, ready_for_pickup, completed
    accepted_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)