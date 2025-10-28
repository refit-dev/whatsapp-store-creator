import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Watzy
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/auth"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
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
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                WhatsApp
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Create a beautiful mini-shop. Customers browse, tap once, and
              WhatsApp opens with their order ready to send.
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">watzy</h3>
              <p className="text-gray-300 mb-4">
                Create your WhatsApp-powered store in minutes. No coding
                required, works globally.
              </p>
              <p className="text-sm text-gray-400">
                © 2025 watzy. All rights reserved.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/auth"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demo-bakery"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Demo Store
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal & Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cancellation-refund"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Cancellation & Refund
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              Made with ❤️ for entrepreneurs worldwide
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C8.396 0 7.989.013 7.041.048 6.094.082 5.52.204 5.012.388c-.526.19-1.004.441-1.463.9-.459.458-.709.937-.9 1.463-.184.508-.306 1.082-.34 2.029C2.277 5.728 2.264 6.135 2.264 9.756v4.508c0 3.621.013 4.028.048 4.976.034.947.156 1.521.34 2.029.19.526.441 1.004.9 1.463.458.459.937.709 1.463.9.508.184 1.082.306 2.029.34.948.035 1.355.048 4.976.048h4.508c3.621 0 4.028-.013 4.976-.048.947-.034 1.521-.156 2.029-.34.526-.19 1.004-.441 1.463-.9.459-.458.709-.937.9-1.463.184-.508.306-1.082.34-2.029.035-.948.048-1.355.048-4.976V9.756c0-3.621-.013-4.028-.048-4.976-.034-.947-.156-1.521-.34-2.029-.19-.526-.441-1.004-.9-1.463-.458-.459-.937-.709-1.463-.9-.508-.184-1.082-.306-2.029-.34C16.045.013 15.638 0 12.017 0zm0 5.838a6.18 6.18 0 110 12.361 6.18 6.18 0 010-12.361zM12.017 16a4 4 0 110-8 4 4 0 010 8zm6.624-10.845a1.441 1.441 0 11-2.883 0 1.441 1.441 0 012.883 0z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  number,
  icon,
  title,
  description,
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
  description,
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
