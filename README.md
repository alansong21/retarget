# retarget

LA Hacks 2025 Project 
Taiyu Chen, Evelyn Do, Jerry Li, Alan Song

This project proposes the development of a web application that facilitates peer-to-peer grocery delivery among UCLA students. Rather than individually traveling long distances to grocery stores, students (buyers) can post grocery orders on the platform. Other students (carriers) who are already planning grocery trips can view available orders and choose to fulfill them in exchange for a small monetary reward. Upon completing a delivery, buyers and carriers meet to validate the transaction.

## System Architecture:
The platform is composed of four primary interconnected components:

### 1. User Account and Authentication System:
Manages user registration, login, account creation, and identity verification to ensure secure participation.

### 2. Payment and Verification System:
Handles the collection of payments from buyers, distributes rewards to carriers, and verifies transaction completion.

### 3. Order Creation and Fulfillment System:
Enables buyers to create and manage grocery orders, matches available orders to carriers based on their planned trips, and maintains order lifecycle management (e.g., updating, removing stale orders).

### 4. Dynamic Pricing System:
Calculates service fees for buyers and reward bonuses for carriers in real time, based on relevant contextual variables (e.g., demand, distance, order size).


# building and installing

1. In one terminal, we start the backend server:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

// wtv database stuff @alan

2. Actually start the backend server.
```bash
python3 app.py
```

3. Start the front-end server.
```bash
cd frontend
npm run dev
```