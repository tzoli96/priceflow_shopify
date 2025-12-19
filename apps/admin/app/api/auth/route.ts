import { NextRequest, NextResponse } from 'next/server';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// Shopify API Configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: ['read_products', 'write_products', 'read_orders', 'read_customers'],
  hostName: process.env.HOST || 'app.teszt.uk',
  hostScheme: 'https',
  apiVersion: ApiVersion.October24,
  isEmbeddedApp: true,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  try {
    // Begin OAuth
    const authRoute = await shopify.auth.begin({
      shop: shop.replace('.myshopify.com', ''),
      callbackPath: '/api/auth/callback',
      isOnline: false,
    });

    return NextResponse.redirect(authRoute);
  } catch (error) {
    console.error('OAuth begin error:', error);
    return NextResponse.json(
      { error: 'Failed to begin OAuth', details: error },
      { status: 500 }
    );
  }
}
