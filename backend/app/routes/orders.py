"""Order Management Routes.

This module contains all the API endpoints for managing orders in the Grabbit delivery system.
It handles order creation, assignment, status updates, and delivery confirmation.

The order lifecycle is as follows:
1. Order is created by buyer (status: open)
2. Order is accepted by carrier (status: assigned)
3. Carrier starts the delivery (status: in_progress)
4. Carrier marks items ready for pickup (status: ready_for_pickup)
5. Buyer confirms delivery (status: completed)

Additional statuses:
- cancelled: Order was cancelled
- expired: Order wasn't accepted within time limit
"""

from flask import Blueprint, request, jsonify
from app.models import db, Order, OrderAssignment
from datetime import datetime, timedelta, timezone
from app.services.selenium_scraper import (
    scrape_target_product,
    scrape_trader_joes_product,
    create_driver
)

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/test', methods=['GET'])
def test_route():
    """Test endpoint to verify the orders blueprint is working.
    
    Returns:
        tuple: JSON response with success message and 200 status code
    """
    return jsonify({"message": "Orders blueprint is working"}), 200

@orders_bp.route('/fetch_product_info', methods=['POST'])
def fetch_product_info():
    data = request.get_json()
    product_url = data.get('url')

    if not product_url:
        return jsonify({"error": "Missing URL"}), 400
    
    if not is_valid_retailer_url(product_url):
        return jsonify({"error": "Invalid retailer URL"}), 400

    try:
        if 'target.com' in product_url:
            product_info = scrape_target_product(product_url)
        elif 'ralphs.com' in product_url:
            product_info = scrape_ralphs_product(product_url)
        elif 'traderjoes.com' in product_url:
            product_info = scrape_trader_joes_product(product_url)
        else:
            return jsonify({"error": "Scraper not available for this retailer"}), 400

        return jsonify(product_info), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route('/batch_create', methods=['POST'])
def batch_create_orders():
    """Create multiple orders from a list of product URLs.
    
    Expected JSON payload:
    {
        "buyer_id": int,          # ID of the user creating the orders
        "delivery_address": str,  # Delivery destination
        "products": [             # List of products to order
            {
                "url": str,      # Product URL
                "quantity": int   # Quantity to order
            }
        ]
    }
    
    Returns:
        tuple: JSON response with created orders and status code
            201: Orders created successfully
            400: Invalid request
            500: Server error
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Validate required fields
        required_fields = ['buyer_id', 'delivery_address', 'products']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        if not isinstance(data['products'], list) or not data['products']:
            return jsonify({"error": "Products must be a non-empty list"}), 400

        # Create a driver for scraping
        driver = create_driver()
        created_orders = []

        try:
            # Process each product
            for product in data['products']:
                url = product.get('url')
                quantity = product.get('quantity', 1)

                if not url:
                    continue

                # Scrape product information
                try:
                    if 'target.com' in url:
                        product_info = scrape_target_product(url, driver)
                    elif 'traderjoes.com' in url:
                        product_info = scrape_trader_joes_product(url, driver)
                    else:
                        continue

                    # Create order with scraped information
                    store_name = 'Target' if 'target.com' in url else 'Trader Joes'

                    new_order = Order(
                        buyer_id=data['buyer_id'],
                        store_name=store_name,
                        items=[{
                            "name": product_info.get('name'),
                            "quantity": quantity,
                            "price": product_info.get('price')
                        }],
                        delivery_address=data['delivery_address'],
                        status='open',
                        expiry_time=datetime.now(timezone.utc) + timedelta(hours=1),
                        product_page_url=url,
                        product_image_url=product_info.get('image_url')
                    )

                    db.session.add(new_order)
                    created_orders.append({
                        "url": url,
                        "name": product_info.get('name'),
                        "price": product_info.get('price'),
                        "quantity": quantity,
                        "store": store_name
                    })

                except Exception as e:
                    print(f"Error processing {url}: {str(e)}")
                    continue

            # Commit all orders
            db.session.commit()

            return jsonify({
                "message": "Orders created successfully",
                "orders": created_orders
            }), 201

        finally:
            # Always close the driver
            driver.quit()

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route('/create', methods=['POST'])
def create_order():
    """Create a new delivery order.
    
    Expected JSON payload:
    {
        "buyer_id": int,          # ID of the user creating the order
        "store_name": string,     # Name of the store to purchase from
        "item_list": [            # List of items to purchase
            {
                "item": string,   # Item name
                "qty": int       # Quantity
            }
        ],
        "delivery_address": string # Delivery destination
    }
    
    Returns:
        tuple: JSON response with order details and status code
            201: Order created successfully
            400: Invalid request (missing fields or invalid data)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Validate required fields
        required_fields = ['buyer_id', 'store_name', 'item_list', 'delivery_address']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Create new order with default expiry time of 1 hour
        new_order = Order(
            buyer_id=data['buyer_id'],
            store_name=data['store_name'],
            items=data['item_list'],  # This will be stored as JSON
            delivery_address=data['delivery_address'],
            status='open',
            expiry_time=datetime.now(timezone.utc) + timedelta(hours=1)
        )

        db.session.add(new_order)
        db.session.commit()

        return jsonify({
            "message": "Order created successfully",
            "order_id": new_order.id,
            "status": new_order.status
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@orders_bp.route('/available', methods=['GET'])
def get_available_orders():
    """Get all open orders that haven't expired.
    
    This endpoint is used by carriers to view orders they can accept.
    Only returns orders that:
    1. Have status 'open'
    2. Haven't reached their expiry time
    
    Returns:
        tuple: JSON response with list of available orders and status code
            200: Success
            500: Server error
    """
    try:
        # Fetch all open orders that haven't expired
        now = datetime.now(timezone.utc)
        open_orders = Order.query.filter(
            Order.status == 'open',
            Order.expiry_time > now
        ).all()

        orders_list = []
        for order in open_orders:
            orders_list.append({
                "order_id": order.id,
                "store_name": order.store_name,
                "items": order.items,  # Already in JSON format
                "delivery_address": order.delivery_address,
                "expiry_time": order.expiry_time.isoformat()
            })

        return jsonify(orders_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route('/accept/<int:order_id>', methods=['POST'])
def accept_order(order_id):
    """Accept an open order as a carrier.
    
    URL Parameters:
        order_id (int): ID of the order to accept
    
    Expected JSON payload:
    {
        "carrier_id": int  # ID of the carrier accepting the order
    }
    
    The order must be:
    1. In 'open' status
    2. Not expired
    3. Not already assigned to another carrier
    
    Returns:
        tuple: JSON response with acceptance confirmation and status code
            200: Order accepted successfully
            400: Order already assigned or expired
            404: Order not found
    """
    data = request.get_json()

    try:
        carrier_id = data['carrier_id']

        # Find the order 
        order = Order.query.get(order_id)

        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Check if order is still open and not expired
        now = datetime.now(timezone.utc)
        if order.status != 'open':
            return jsonify({"error": "Order already assigned or closed"}), 400
        # Ensure expiry_time is timezone-aware before comparison
        expiry_time = order.expiry_time.replace(tzinfo=timezone.utc) if order.expiry_time.tzinfo is None else order.expiry_time
        if expiry_time <= now:
            return jsonify({"error": "Order has expired"}), 400
        
        # Assign carrier to order
        order.assigned_carrier_id = carrier_id
        order.status = 'assigned'
        
        # Create an OrderAssignment record
        assignment = OrderAssignment(
            order_id=order.id,
            carrier_id=carrier_id,
            status='assigned'
        )

        db.session.add(assignment)
        db.session.commit()

        return jsonify({
            "message": "Order accepted successfully",
            "order_id": order.id,
            "assigned_carrier_id": carrier_id
        }), 200

    except KeyError as e:
        return jsonify({"error": f"Missing field {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route('/update_status/<int:order_id>', methods=['POST'])
def update_order_status(order_id):
    """Update the status of an order by its assigned carrier.
    
    URL Parameters:
        order_id (int): ID of the order to update
    
    Expected JSON payload:
    {
        "carrier_id": int,     # ID of the carrier updating the order
        "new_status": string  # New status for the order
    }
    
    Valid status transitions:
    - assigned -> in_progress: Carrier has started the delivery
    - in_progress -> ready_for_pickup: Items are ready for buyer pickup
    
    Returns:
        tuple: JSON response with update confirmation and status code
            200: Status updated successfully
            400: Invalid status transition or not assigned carrier
            404: Order not found
    """
    data = request.get_json()

    try:
        carrier_id = data['carrier_id']
        new_status = data['new_status']

        # Find the order
        order = Order.query.get(order_id)

        if not order:
            return jsonify({"error": "Order not found"}), 404

        # Check carrier assignment 
        if order.assigned_carrier_id != carrier_id:
            return jsonify({"error": "You are not assigned to this order"}), 400

        # Check allowed status transitions
        valid_transitions = {
            "assigned": "in_progress",
            "in_progress": "ready_for_pickup"
        }

        if order.status not in valid_transitions or valid_transitions[order.status] != new_status:
            return jsonify({"error": "Invalid status transition"}), 400
        
        # Update order status
        order.status = new_status 

        # Update assignment status too
        assignment = OrderAssignment.query.filter_by(order_id=order_id, carrier_id=carrier_id).first()
        if assignment:
            assignment.status = new_status
            if new_status == 'ready_for_pickup':
                assignment.completed_at = datetime.now(timezone.utc)
            
        db.session.commit()

        return jsonify({
            "message": f"Order status updated to {new_status}",
            "order_id": order.id
        }), 200

    except KeyError as e:
        return jsonify({"error": f"Missing field {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@orders_bp.route('/confirm_delivery/<int:order_id>', methods=['POST'])
def confirm_delivery(order_id):
    """Confirm delivery completion by the buyer.
    
    URL Parameters:
        order_id (int): ID of the order to confirm
    
    Expected JSON payload:
    {
        "buyer_id": int  # ID of the buyer confirming delivery
    }
    
    Requirements:
    1. Order must be in 'ready_for_pickup' status
    2. Only the original buyer can confirm delivery
    
    This endpoint:
    1. Marks the order as 'completed'
    2. Updates the OrderAssignment status
    3. Records completion timestamp
    
    Returns:
        tuple: JSON response with confirmation and status code
            200: Delivery confirmed successfully
            400: Order not ready for confirmation
            403: Not the order's buyer
            404: Order not found
    """
    data = request.get_json()

    try:
        buyer_id = data['buyer_id']

        # Find the order
        order = Order.query.get(order_id)

        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Check buyer matches
        if order.buyer_id != buyer_id:
            return jsonify({"error": "You are not the buyer for this order"}), 403
        
        # Check that order is ready for pickup
        if order.status != 'ready_for_pickup':
            return jsonify({"error": f"Order is not ready for delivery confirmation (current status: {order.status})"}), 400
        
        # Mark order completed
        order.status = 'completed'

        # Update assignment as completed
        assignment = OrderAssignment.query.filter_by(order_id=order_id).first()
        if assignment:
            assignment.status = 'completed'
            assignment.completed_at = datetime.now(timezone.utc) 

        db.session.commit()

        return jsonify({
            "message": "Delivery confirmed and order completed",
            "order_id": order.id
        }), 200

    except KeyError as e:
        return jsonify({"error": f"Missing field {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500          