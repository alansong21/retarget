import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:5001/orders/available', {
      // removed credentials since endpoint is public
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch orders');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API/orders] GET error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
