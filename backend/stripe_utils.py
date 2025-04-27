import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

def create_stripe_account(email):
    """Create a Stripe Connect account for a user."""
    try:
        account = stripe.Account.create(
            type='express',
            country='US',
            email=email,
            capabilities={
                'card_payments': {'requested': True},
                'transfers': {'requested': True},
            },
        )
        
        # Create an account link for onboarding
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f"http://localhost:3000/profile?refresh=true",
            return_url=f"http://localhost:3000/profile",
            type="account_onboarding",
        )
        
        return {
            'account_id': account.id,
            'url': account_link.url
        }
    except stripe.error.StripeError as e:
        print(f"Error creating Stripe account: {str(e)}")
        raise e

def get_stripe_account(account_id):
    """Get a Stripe Connect account details."""
    try:
        return stripe.Account.retrieve(account_id)
    except stripe.error.StripeError as e:
        print(f"Error retrieving Stripe account: {str(e)}")
        raise e

def create_payment_intent(amount, currency='usd'):
    """Create a payment intent for the order."""
    try:
        return stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency=currency,
        )
    except stripe.error.StripeError as e:
        print(f"Error creating payment intent: {str(e)}")
        raise e

def transfer_to_carrier(amount, stripe_account_id, currency='usd'):
    """Transfer earnings to a carrier's Stripe account."""
    try:
        return stripe.Transfer.create(
            amount=int(amount * 100),  # Convert to cents
            currency=currency,
            destination=stripe_account_id,
        )
    except stripe.error.StripeError as e:
        print(f"Error transferring to carrier: {str(e)}")
        raise e
