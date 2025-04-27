import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // Call the backend API to get product information
    const response = await fetch('http://localhost:5001/scrape/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product info from backend');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error scraping product:', error);
    return NextResponse.json(
      { error: 'Failed to scrape product information' },
      { status: 500 }
    );
  }
}
