import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const response = await fetch('http://localhost:5001/stripe/account', {
      headers: {
        'Authorization': `Bearer ${(await cookies()).get('token')?.value}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch account');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
}
