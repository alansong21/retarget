import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received checkout request:', body);
    
    const { items } = body;
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid items array' },
        { status: 400 }
      );
    }

    // Validate items and their prices
    const validItems = items.filter((item: any) => {
      if (!item.price_data?.unit_amount || !item.quantity) {
        console.error('Invalid item:', item);
        return false;
      }
      const unitAmount = Math.round(item.price_data.unit_amount);
      const isValid = unitAmount > 0 && item.quantity > 0;
      if (!isValid) {
        console.error('Invalid price or quantity:', { unitAmount, quantity: item.quantity });
      }
      return isValid;
    });

    if (validItems.length === 0) {
      console.error('No valid items after filtering');
      return NextResponse.json(
        { error: 'No valid items found in cart. Please ensure all items have valid prices and quantities.' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: validItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/canceled`,
    });

    if (!session.url) {
      throw new Error('No checkout URL returned from Stripe');
    }
    
    console.log('Created Stripe session:', { 
      id: session.id,
      url: session.url,
      status: session.status
    });
    
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
