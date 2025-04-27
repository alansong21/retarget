import re

def is_valid_email(email):
    # Check if the email has a valid format
    return re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+", email) is not None

def is_ucla_email(email):
    # Check if the email is a UCLA domain
    return email.endswith("@ucla.edu") or email.endswith("@g.ucla.edu")

def is_strong_password(password):
    # Ensure password meets security requirements
    return re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", password) is not None

def is_valid_phone_number(phone_number):
    # Check if phone number has valid format (optional field)
    if not phone_number:
        return True  # Phone number is optional
    return re.match(r"^\+?[1-9]\d{1,14}$", phone_number) is not None

def is_valid_role(role):
    # Check if role is either 'buyer' or 'carrier'
    return role in ['buyer', 'carrier']

def valid_name_length(name):
    # Check if name is within the allowed length (120 chars from model)
    return len(name) <= 120

def valid_signup_data(name, email, password, phone_number=None, role='buyer'):
    # Validate all signup data and return list of errors (empty if valid)
    errors = []
    
    # Name validation
    if not name:
        errors.append("Name is required.")
    elif not valid_name_length(name):
        errors.append("Name must be 120 characters or less.")
    
    # Email validation
    if not email:
        errors.append("Email is required.")
    elif not is_valid_email(email):
        errors.append("Valid email address is required.")
    elif not is_ucla_email(email):
        errors.append("Email must be a UCLA email address.")
    
    # Password validation
    if not password:
        errors.append("Password is required.")
    elif not is_strong_password(password):
        errors.append("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")
    
    # Phone number validation (optional)
    if phone_number and not is_valid_phone_number(phone_number):
        errors.append("Invalid phone number format.")
    
    # Role validation
    if not is_valid_role(role):
        errors.append("Role must be either 'buyer' or 'carrier'.")
    
    return errors