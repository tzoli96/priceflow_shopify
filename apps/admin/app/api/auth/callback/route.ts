import { NextRequest, NextResponse } from 'next/server';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// Shopify API Configuration (same as in route.ts)
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

  try {
    // Complete OAuth callback
    const callbackResponse = await shopify.auth.callback({
      rawRequest: request as any,
    });

    const { session } = callbackResponse;

    if (!session) {
      throw new Error('No session returned from callback');
    }

    // TODO: Store session in database (API backend)
    // For now, we'll call the API to store it
    const apiUrl = process.env.API_URL || 'https://app.teszt.uk/api';

    try {
      await fetch(`${apiUrl}/shopify/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: session.shop,
          accessToken: session.accessToken,
          scope: session.scope,
        }),
      });
    } catch (apiError) {
      console.error('Failed to store session in API:', apiError);
      // Continue anyway - session is valid
    }

    // Redirect to app home with shop parameter
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('shop', session.shop);
    redirectUrl.searchParams.set('host', searchParams.get('host') || '');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed', details: error },
      { status: 500 }
    );
  }
}
