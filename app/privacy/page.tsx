import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> October 25, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Information We Collect
              </h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, such as when
                you create an account, create a store, or contact us for
                support.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Account Information:</strong> Email address, name, and
                  authentication details
                </li>
                <li>
                  <strong>Store Information:</strong> Store name, products,
                  prices, descriptions, and images
                </li>
                <li>
                  <strong>Contact Information:</strong> WhatsApp number for
                  order processing
                </li>
                <li>
                  <strong>Usage Data:</strong> How you use our service,
                  including pages visited and features used
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>
                  Monitor and analyze usage patterns to improve user experience
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Information Sharing
              </h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal
                information to third parties except:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>
                  With service providers who assist in our operations (under
                  strict confidentiality agreements)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>
                  Limited access to personal information on a need-to-know basis
                </li>
                <li>Secure hosting infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Your Rights
              </h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Cookies and Tracking
              </h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your
                experience, analyze usage, and personalize content. You can
                control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Third-Party Services
              </h2>
              <p className="text-gray-700 mb-4">
                Our service integrates with third-party services including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Supabase:</strong> Database and authentication
                  services
                </li>
                <li>
                  <strong>Razorpay:</strong> Payment processing
                </li>
                <li>
                  <strong>WhatsApp:</strong> Order messaging functionality
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                These services have their own privacy policies, which we
                encourage you to read.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Data Retention
              </h2>
              <p className="text-gray-700 mb-4">
                We retain your information only as long as necessary to provide
                services and comply with legal obligations. You may request
                deletion of your account and data at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Changes to This Policy
              </h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new policy on
                this page and updating the effective date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please
                contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> hello@watzy.app
                  <br />
                  <strong>WhatsApp:</strong> +91-7304848472
                </p>
              </div>
            </section>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                ← Back to Home
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/terms"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/shipping"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Shipping Policy
                </Link>
                <Link
                  href="/cancellation-refund"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancellation & Refund
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
