import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const response = await fetch('http://localhost:5001/stripe/account/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await cookies()).get('token')?.value}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create account');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
