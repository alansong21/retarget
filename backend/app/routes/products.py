from flask import Blueprint, jsonify, request
from app import db
from datetime import datetime

class Product(db.Model):
    """Product model for storing product information."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(500))
    url = db.Column(db.String(500), unique=True)
    store = db.Column(db.String(50))  # 'Target' or 'Trader Joes'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image': self.image_url,
            'url': self.url,
            'store': self.store,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET'])
def get_products():
    """Get all products.
    
    Returns:
        tuple: JSON response with list of products and 200 status code
    """
    products = Product.query.all()
    return jsonify([{
        'id': str(p.id),
        'name': p.name,
        'description': p.description,
        'price': p.price,
        'image': p.image_url,
        'url': p.url,
        'store': p.store
    } for p in products]), 200

@products_bp.route('/', methods=['POST'])
def add_product():
    """Add a new product.
    
    Returns:
        tuple: JSON response with the added product and 201 status code
    """
    data = request.get_json()
    url = data.get('url', '')
    
    # Check if product with this URL already exists
    existing_product = Product.query.filter_by(url=url).first() if url else None
    
    if existing_product:
        # Update existing product with new data
        existing_product.name = data['name']
        existing_product.description = data.get('description', '')
        existing_product.price = data['price']
        existing_product.image_url = data.get('image', '')
        existing_product.store = data.get('store', '')
        db.session.commit()
        product = existing_product
    else:
        # Create new product
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            price=data['price'],
            image_url=data.get('image', ''),
            url=url,
            store=data.get('store', '')
        )
        db.session.add(product)
        db.session.commit()
    
    return jsonify({
        'id': str(product.id),
        'name': product.name,
        'description': product.description,
        'price': product.price,
        'image': product.image_url,
        'url': product.url,
        'store': product.store
    }), 200 if existing_product else 201

@products_bp.route('/add', methods=['POST'])
def add_product_to_system():
    """Add a new product to the system."""
    data = request.get_json()
    
    # Check if product with this URL already exists
    existing_product = Product.query.filter_by(url=data['url']).first()
    if existing_product:
        return jsonify(existing_product.to_dict())
        
    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        image_url=data.get('image'),
        url=data['url'],
        store=data['store']
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'price': product.price,
        'image': product.image_url,
        'url': product.url,
        'store': product.store
    }), 201
