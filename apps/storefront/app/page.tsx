interface PageProps {
  searchParams: Promise<{
    productId?: string;
    shop?: string;
    handle?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const { productId, shop, handle } = params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-6 font-sans">
      <div className="mx-auto max-w-2xl">
        {/* Widget Header */}
        <div className="mb-6 rounded-lg bg-white/10 p-6 backdrop-blur-lg">
          <h1 className="text-3xl font-bold text-white">
            🚀 PriceFlow Widget
          </h1>
          <p className="mt-2 text-purple-100">
            Hot reload enabled - Edit this file to see changes instantly!
          </p>
        </div>

        {/* Product Info */}
        {productId && (
          <div className="mb-6 rounded-lg bg-white/10 p-6 backdrop-blur-lg">
            <h2 className="mb-4 text-xl font-semibold text-white">
              📦 Product Information
            </h2>
            <div className="space-y-2 text-purple-100">
              <p>
                <span className="font-medium">Product ID:</span> {productId}
              </p>
              <p>
                <span className="font-medium">Handle:</span> {handle || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Shop:</span> {shop || 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Price Comparison Demo */}
        <div className="rounded-lg bg-white/10 p-6 backdrop-blur-lg">
          <h2 className="mb-4 text-xl font-semibold text-white">
            💰 Price Comparison
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-500/20 p-4">
              <span className="font-medium text-white">Your Store</span>
              <span className="text-2xl font-bold text-green-300">$99.99</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-4">
              <span className="text-purple-200">Competitor A</span>
              <span className="text-xl text-purple-300">$109.99</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-4">
              <span className="text-purple-200">Competitor B</span>
              <span className="text-xl text-purple-300">$105.50</span>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-green-500/20 p-4 text-center">
            <p className="text-lg font-semibold text-green-300">
              ✨ You save $10 compared to competitors!
            </p>
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-6 rounded-lg bg-yellow-500/10 p-4 backdrop-blur-lg">
          <p className="text-sm text-yellow-200">
            💡 <strong>Hot Reload Active:</strong> Changes to this file will appear instantly in the iframe!
          </p>
        </div>
      </div>
    </div>
  );
}
