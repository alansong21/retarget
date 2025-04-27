from create_db import app, db, Order, User

def check_orders():
    with app.app_context():
        orders = Order.query.all()
        print("\nAll Orders:")
        print("-" * 50)
        for order in orders:
            buyer = User.query.get(order.buyer_id)
            print(f"Order ID: {order.id}")
            print(f"Buyer: {buyer.name}")
            print(f"Store: {order.store_name}")
            print(f"Items: {order.items}")
            print(f"Delivery Address: {order.delivery_address}")
            print(f"Status: {order.status}")
            print("-" * 50)

if __name__ == '__main__':
    check_orders()
