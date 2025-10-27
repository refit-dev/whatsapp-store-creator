import Link from "next/link";

export default function TermsAndConditions() {
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
            Terms & Conditions
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> October 25, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 mb-4">
                By accessing and using watzy ("Service"), you accept and agree
                to be bound by the terms and provision of this agreement. If you
                do not agree to abide by the above, please do not use this
                service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Service Description
              </h2>
              <p className="text-gray-700 mb-4">
                watzy is a platform that allows users to create online stores
                that integrate with WhatsApp for order processing. The service
                includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Store creation and customization tools</li>
                <li>Product management features</li>
                <li>WhatsApp integration for order processing</li>
                <li>Payment processing through third-party providers</li>
                <li>Order tracking and management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. User Accounts
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  You must provide accurate and complete information when
                  creating an account
                </li>
                <li>
                  You are responsible for maintaining the security of your
                  account credentials
                </li>
                <li>
                  You must notify us immediately of any unauthorized use of your
                  account
                </li>
                <li>
                  One person or legal entity may maintain only one account
                </li>
                <li>You must be at least 18 years old to use this service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Acceptable Use
              </h2>
              <p className="text-gray-700 mb-4">
                You agree not to use the service to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  Sell illegal, harmful, or prohibited products or services
                </li>
                <li>Violate any applicable laws or regulations</li>
                <li>
                  Infringe upon the intellectual property rights of others
                </li>
                <li>Spam or send unsolicited communications</li>
                <li>
                  Upload malicious code or attempt to compromise the platform
                </li>
                <li>Impersonate others or provide false information</li>
                <li>Engage in fraudulent activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Subscription and Payments
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>New users receive a 30-day free trial</li>
                <li>
                  After the trial period, continued use requires a monthly
                  subscription of ₹259
                </li>
                <li>
                  Payments are processed through Razorpay and are non-refundable
                </li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You may cancel your subscription at any time</li>
                <li>
                  Referral programs may provide additional free months as
                  specified
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Intellectual Property
              </h2>
              <p className="text-gray-700 mb-4">
                The service and its original content, features, and
                functionality are owned by watzy and are protected by
                intellectual property laws.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  You retain ownership of content you upload to your store
                </li>
                <li>
                  You grant us a license to use your content to provide the
                  service
                </li>
                <li>
                  You may not copy, modify, or distribute our proprietary
                  content
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Privacy and Data
              </h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy
                Policy, which also governs your use of the service, to
                understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Third-Party Services
              </h2>
              <p className="text-gray-700 mb-4">
                Our service integrates with third-party services including
                WhatsApp, Razorpay, and others. Your use of these services is
                subject to their respective terms and conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Service Availability
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  We strive to maintain 99.9% uptime but do not guarantee
                  uninterrupted service
                </li>
                <li>
                  We may perform maintenance that temporarily limits access
                </li>
                <li>
                  We reserve the right to modify or discontinue features with
                  notice
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-4">
                In no event shall watzy be liable for any indirect, incidental,
                special, consequential, or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other
                intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Indemnification
              </h2>
              <p className="text-gray-700 mb-4">
                You agree to defend, indemnify, and hold harmless watzy from and
                against any claims, damages, obligations, losses, liabilities,
                costs, or debt arising from your use of the service or violation
                of these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Termination
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Either party may terminate this agreement at any time</li>
                <li>
                  We may suspend or terminate accounts that violate these terms
                </li>
                <li>Upon termination, your access to the service will cease</li>
                <li>You may request data export before account deletion</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Governing Law
              </h2>
              <p className="text-gray-700 mb-4">
                These terms shall be governed by and construed in accordance
                with the laws of India, without regard to its conflict of law
                provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                14. Changes to Terms
              </h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. We will
                notify users of any material changes via email or through the
                service. Continued use constitutes acceptance of modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                15. Contact Information
              </h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms & Conditions, please contact us:
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
                  href="/privacy"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Privacy Policy
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
