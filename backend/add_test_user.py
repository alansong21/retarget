from create_db import app, db, User

def add_test_user():
    with app.app_context():
        # Check if test user exists
        test_user = User.query.filter_by(email='test@example.com').first()
        if not test_user:
            test_user = User(
                name='Test User',
                email='test@example.com',
                password_hash='test_hash',
                role='buyer'
            )
            db.session.add(test_user)
            db.session.commit()
            print(f"Created test user with ID: {test_user.id}")
        else:
            print(f"Test user already exists with ID: {test_user.id}")

if __name__ == '__main__':
    add_test_user()
