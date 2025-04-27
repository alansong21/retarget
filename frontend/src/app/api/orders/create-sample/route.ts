import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const sampleOrder = {
      id: uuidv4(),
      items: [
        {
          id: 'sample-1',
          name: 'Sample Product 1',
          price: 0,
          quantity: 2,
          image: 'https://via.placeholder.com/150',
          store: 'Target',
          description: 'Sample product for testing'
        },
        {
          id: 'sample-2',
          name: 'Sample Product 2',
          price: 0,
          quantity: 1,
          image: 'https://via.placeholder.com/150',
          store: 'Trader Joes',
          description: 'Another sample product'
        }
      ],
      status: 'pending',
      total: 0,
      createdAt: new Date().toISOString(),
      userId: 'test-user'
    };

    return NextResponse.json(sampleOrder);
  } catch (err: any) {
    console.error('Error creating sample order:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
