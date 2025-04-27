import { NextResponse } from 'next/server';

const sampleProducts = [
  {
    id: '1',
    name: 'Good & Gather Organic Whole Milk',
    description: '1 Gallon - High-quality organic whole milk',
    price: 4.99,
    image: 'https://target.scene7.com/is/image/Target/GUEST_8bbf5fca-6882-4346-8c44-8c0f0f6eb16c',
    store: 'Target',
    url: 'https://www.target.com/p/organic-whole-milk-1gal-good-gather-8482/-/A-13276134'
  },
  {
    id: '2',
    name: 'Market Pantry Large Eggs',
    description: 'Grade A Large Eggs - 12ct',
    price: 3.99,
    image: 'https://target.scene7.com/is/image/Target/GUEST_7e1f7c5f-3c7d-4c86-8c4c-c2b4a6c7c2c0',
    store: 'Target',
    url: 'https://www.target.com/p/grade-a-large-eggs-12ct-market-pantry-8482/-/A-14713534'
  },
  {
    id: '3',
    name: 'Good & Gather Chicken Breast',
    description: 'Fresh Boneless Skinless Chicken Breast - 1lb',
    price: 5.99,
    image: 'https://target.scene7.com/is/image/Target/GUEST_b7a4c2f5-8c2a-4b35-9956-8bad84d37482',
    store: 'Target',
    url: 'https://www.target.com/p/fresh-boneless-skinless-chicken-breast-1lb-good-gather-8482/-/A-13273252'
  },
  {
    id: '4',
    name: 'Trader Joe\'s Greek Yogurt',
    description: 'Non-Fat Plain Greek Yogurt - 32oz',
    price: 4.99,
    image: 'https://www.traderjoes.com/content/dam/trjo/products/m20901/greek-yogurt.jpg',
    store: 'Trader Joes',
    url: 'https://www.traderjoes.com/home/products/pdp/non-fat-plain-greek-yogurt-32-oz-m20901'
  },
  {
    id: '5',
    name: 'Good & Gather Organic Bananas',
    description: 'Fresh Organic Bananas - 2lb bunch',
    price: 2.49,
    image: 'https://target.scene7.com/is/image/Target/GUEST_f5d0cfc3-9d02-4ee0-a6c6-ed5dc09971d1',
    store: 'Target',
    url: 'https://www.target.com/p/organic-bananas-2lb-bunch-good-gather-8482/-/A-14914799'
  },
  {
    id: '6',
    name: 'Trader Joe\'s Everything Bagels',
    description: 'Everything Bagels - 6ct',
    price: 3.49,
    image: 'https://www.traderjoes.com/content/dam/trjo/products/m30901/everything-bagels.jpg',
    store: 'Trader Joes',
    url: 'https://www.traderjoes.com/home/products/pdp/everything-bagels-m30901'
  },
  {
    id: '7',
    name: 'Market Pantry White Bread',
    description: 'Soft White Bread - 20oz loaf',
    price: 1.99,
    image: 'https://target.scene7.com/is/image/Target/GUEST_ff4b0c0b-6c1d-4f4d-89f7-0f6c9d0dbdc3',
    store: 'Target',
    url: 'https://www.target.com/p/white-bread-20oz-market-pantry-8482/-/A-13287285'
  },
  {
    id: '8',
    name: 'Trader Joe\'s Orange Juice',
    description: 'Fresh Squeezed Orange Juice - 52 fl oz',
    price: 5.99,
    image: 'https://www.traderjoes.com/content/dam/trjo/products/m40901/orange-juice.jpg',
    store: 'Trader Joes',
    url: 'https://www.traderjoes.com/home/products/pdp/fresh-squeezed-orange-juice-m40901'
  }
];

export async function GET() {
  try {
    const response = await fetch('http://localhost:5001/products', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
