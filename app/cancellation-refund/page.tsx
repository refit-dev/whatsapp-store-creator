import Link from "next/link";

export default function CancellationRefundPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              watzy
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Cancellation & Refund Policy
          </h1>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Cancellation Policy
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Since watzy is a platform that connects buyers with individual
                  sellers, cancellation policies are determined by each
                  individual seller. When you place an order through a watzy
                  store:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Orders are processed directly by the seller through WhatsApp
                  </li>
                  <li>
                    Cancellation requests must be made directly to the seller
                    via WhatsApp
                  </li>
                  <li>
                    Each seller sets their own cancellation timeline and
                    conditions
                  </li>
                  <li>
                    We recommend checking with the seller about their
                    cancellation policy before placing an order
                  </li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-blue-800">
                    <strong>Important:</strong> watzy acts as a platform
                    facilitator. All transaction disputes and cancellations are
                    handled directly between the buyer and seller.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Refund Policy
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-semibold text-gray-900">
                  For Orders
                </h3>
                <p>
                  Refunds for product orders are handled directly by the
                  individual sellers:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Each seller determines their own refund policy</li>
                  <li>
                    Refund requests must be made directly to the seller via
                    WhatsApp
                  </li>
                  <li>Refund processing time depends on the seller's policy</li>
                  <li>
                    watzy does not handle order payments or refunds directly
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  For watzy Subscription
                </h3>
                <p>For watzy platform subscription fees:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Free Trial:</strong> No charges during the 14-day
                    free trial period
                  </li>
                  <li>
                    <strong>Monthly Subscription:</strong> Refunds are provided
                    on a case-by-case basis
                  </li>
                  <li>
                    <strong>Refund Timeline:</strong> Approved refunds are
                    processed within 5-7 business days
                  </li>
                  <li>
                    <strong>Contact:</strong> Email us at hello@watzy.app for
                    subscription-related refund requests
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. How to Request Cancellation or Refund
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-semibold text-gray-900">
                  For Product Orders
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    Contact the seller directly via WhatsApp (the same number
                    you placed the order with)
                  </li>
                  <li>
                    Provide your order details and reason for
                    cancellation/refund
                  </li>
                  <li>
                    Follow the seller's specific cancellation/refund process
                  </li>
                  <li>
                    If you face issues with the seller, you can contact us at
                    hello@watzy.app for guidance
                  </li>
                </ol>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  For Platform Subscription
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Email us at hello@watzy.app</li>
                  <li>
                    Include your account email and reason for refund request
                  </li>
                  <li>Our team will review and respond within 24-48 hours</li>
                  <li>
                    Approved refunds will be processed to your original payment
                    method
                  </li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Non-Refundable Situations
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>The following situations may not be eligible for refunds:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Services already utilized (e.g., completed months of
                    subscription)
                  </li>
                  <li>
                    Requests made beyond reasonable timeframe (typically 30
                    days)
                  </li>
                  <li>Violation of platform terms of service</li>
                  <li>Fraudulent or abusive refund requests</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Dispute Resolution
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you cannot resolve an order-related issue directly with the
                  seller:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact us at hello@watzy.app with full details</li>
                  <li>We will attempt to mediate between you and the seller</li>
                  <li>
                    While we cannot guarantee resolution, we will make best
                    efforts to help
                  </li>
                  <li>
                    Final resolution depends on cooperation from both parties
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Contact Information
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>For any questions about cancellations or refunds:</p>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p>
                    <strong>Email:</strong> hello@watzy.app
                  </p>
                  <p>
                    <strong>Response Time:</strong> 24-48 hours
                  </p>
                  <p>
                    <strong>Support Hours:</strong> Monday to Friday, 9 AM to 6
                    PM IST
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Policy Updates
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  This cancellation and refund policy may be updated from time
                  to time. We will notify users of any significant changes via
                  email or platform notifications. Continued use of watzy after
                  policy changes constitutes acceptance of the updated terms.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Last Updated:</strong> October 27, 2025
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
