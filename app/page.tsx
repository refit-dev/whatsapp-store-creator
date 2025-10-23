import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-block">
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              ⚡ No coding required • Works globally
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Your Store on
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> WhatsApp</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Create a beautiful mini-shop. Customers browse, tap once, and WhatsApp opens with their order ready to send.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/auth" 
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Start Free →
            </Link>
            <Link 
              href="/demo-bakery" 
              className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-300 hover:shadow-md transition-all text-lg"
            >
              View Demo Store
            </Link>
          </div>

          {/* Social Proof */}
          <p className="text-sm text-gray-500">
            No credit card required • Set up in under 5 minutes
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            number="1"
            icon="🏪"
            title="Create Your Store"
            description="Add your products with photos, prices, and descriptions. Customize your store name and branding."
          />
          <FeatureCard
            number="2"
            icon="🔗"
            title="Share Your Link"
            description="Get a unique store link. Share it anywhere - social media, WhatsApp status, or your website."
          />
          <FeatureCard
            number="3"
            icon="💬"
            title="Get Orders on WhatsApp"
            description="Customers add items to cart and tap 'Order'. WhatsApp opens with the full order pre-filled for them."
          />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Sellers Love It
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BenefitItem
              icon="✅"
              title="No Complex Setup"
              description="No coding, no monthly fees, no complicated dashboards. Just add products and start selling."
            />
            <BenefitItem
              icon="💸"
              title="Higher Conversions"
              description="Customers trust WhatsApp. Orders happen in their favorite messaging app."
            />
            <BenefitItem
              icon="🌍"
              title="Works Everywhere"
              description="From big cities to small towns, if they have WhatsApp, they can order."
            />
            <BenefitItem
              icon="📱"
              title="Mobile-First"
              description="Beautiful on all devices. Customers can shop from anywhere, anytime."
            />
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6 text-gray-900">
          Ready to Start Selling?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of sellers using WhatsApp to grow their business.
        </p>
        <Link 
          href="/auth" 
          className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-lg"
        >
          Create Your Store Now →
        </Link>
      </div>
    </main>
  );
}

function FeatureCard({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: string; 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
        {number}
      </div>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({
  icon,
  title,
  description
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-6 rounded-xl bg-gray-50 border border-gray-100">
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="font-semibold text-lg mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}
