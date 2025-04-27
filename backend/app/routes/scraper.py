from flask import Blueprint, jsonify, request
from app.services.selenium_scraper import scrape_product_info
from app import db
from app.routes.products import Product

scraper_bp = Blueprint('scraper', __name__)

@scraper_bp.route('/', methods=['POST'])
def scrape_product():
    """Scrape product information from Target or Trader Joe's URL.
    
    Request body:
    {
        "url": "https://www.target.com/p/..." or "https://www.traderjoes.com/..."
    }
    
    Returns:
        JSON with product information
    """
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400
        
    url = data['url']
    
    try:
        # Check if product already exists
        existing_product = Product.query.filter_by(url=url).first()
        if existing_product:
            return jsonify(existing_product.to_dict())
            
        # Scrape new product info
        product_info = scrape_product_info(url)
        
        # Create new product
        product = Product(
            name=product_info['name'],
            description=product_info.get('description', ''),
            price=product_info['price'],
            image_url=product_info.get('image_url') or product_info.get('image'),
            url=url,
            store='Target' if 'target.com' in url else 'Trader Joes'
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify(product.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
