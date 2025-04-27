from flask import Blueprint, request, jsonify
from app.models import db, Order, OrderAssignment
from datetime import datetime, timedelta, timezone
import json

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/test', methods=['GET'])
def test_route():
    return jsonify({"message": "Orders blueprint is working"}), 200

@orders_bp.route('/create', methods=['POST'])
def create_order():
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
    

        
        