import Link from "next/link";

export default function ShippingPage() {
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
            Shipping Policy
          </h1>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded mb-6">
                <h2 className="text-xl font-bold text-blue-900 mb-2">
                  Important Notice
                </h2>
                <p className="text-blue-800">
                  watzy is a platform that connects buyers with individual
                  sellers.
                  <strong>
                    {" "}
                    Each seller is responsible for their own shipping
                    arrangements, costs, and policies.
                  </strong>
                  This page provides general guidelines, but specific shipping
                  terms are determined by each seller.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Shipping Responsibility
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-semibold text-gray-900">
                  Seller Responsibility
                </h3>
                <p>Individual sellers using watzy are responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Packaging products safely and securely</li>
                  <li>Arranging shipping/delivery method</li>
                  <li>Covering shipping costs (unless otherwise stated)</li>
                  <li>Providing tracking information when available</li>
                  <li>Ensuring timely dispatch of orders</li>
                  <li>Handling shipping-related customer inquiries</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  watzy's Role
                </h3>
                <p>watzy provides:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Platform for sellers to showcase products</li>
                  <li>Order processing system via WhatsApp</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Shipping Methods
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Sellers can choose from various shipping methods based on
                  their location and preferences:
                </p>

                <h3 className="text-xl font-semibold text-gray-900">
                  Local Delivery
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hand delivery within the seller's local area</li>
                  <li>Faster delivery, usually same-day or next-day</li>
                  <li>Often the most cost-effective option</li>
                  <li>Direct coordination between buyer and seller</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-4">
                  Courier Services
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Professional courier and postal services</li>
                  <li>Tracking numbers provided when available</li>
                  <li>Suitable for nationwide shipping</li>
                  <li>Delivery time varies by service provider and distance</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-4">
                  Self-Pickup
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Customers can collect orders directly from seller</li>
                  <li>No shipping costs</li>
                  <li>Immediate availability upon order readiness</li>
                  <li>Coordinates directly via WhatsApp</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Shipping Costs
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-semibold text-gray-900">
                  General Policy
                </h3>
                <p>
                  <strong>Sellers are responsible for shipping costs</strong>{" "}
                  unless they specifically mention additional shipping charges
                  in their product descriptions or during WhatsApp
                  conversations.
                </p>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
                  <p className="text-yellow-800">
                    <strong>Recommendation:</strong> We encourage sellers to
                    include shipping costs in their product pricing to provide
                    clear, upfront pricing to customers.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Delivery Timeframes
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>Delivery times vary by seller and shipping method:</p>

                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Local Delivery
                    </h4>
                    <p className="text-sm text-gray-700">
                      Same day to 2 business days
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Within City
                    </h4>
                    <p className="text-sm text-gray-700">1-3 business days</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Within State
                    </h4>
                    <p className="text-sm text-gray-700">2-5 business days</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Interstate
                    </h4>
                    <p className="text-sm text-gray-700">3-7 business days</p>
                  </div>
                </div>

                <p className="mt-4">
                  <strong>Note:</strong> These are general guidelines. Actual
                  delivery times depend on:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Seller's processing time</li>
                  <li>Chosen shipping method</li>
                  <li>Distance and location accessibility</li>
                  <li>Weather conditions and external factors</li>
                  <li>Peak season volumes (festivals, holidays)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Order Processing
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-semibold text-gray-900">
                  Seller Guidelines
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Order Confirmation:</strong> Confirm orders via
                    WhatsApp within 24 hours
                  </li>
                  <li>
                    <strong>Processing Time:</strong> Allow 1-2 business days
                    for order preparation
                  </li>
                  <li>
                    <strong>Dispatch Notification:</strong> Inform customers
                    when orders are shipped
                  </li>
                  <li>
                    <strong>Tracking:</strong> Provide tracking details when
                    available
                  </li>
                  <li>
                    <strong>Updates:</strong> Keep customers informed of any
                    delays
                  </li>
                </ol>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  Customer Expectations
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Orders are typically processed within 1-2 business days
                  </li>
                  <li>You'll receive shipping confirmation via WhatsApp</li>
                  <li>Contact the seller directly for order status updates</li>
                  <li>Keep your WhatsApp notifications active for updates</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Packaging Standards
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>We recommend sellers follow these packaging guidelines:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Protection:</strong> Use adequate padding and
                    protection materials
                  </li>
                  <li>
                    <strong>Waterproofing:</strong> Protect items from moisture
                    during transit
                  </li>
                  <li>
                    <strong>Labeling:</strong> Clear and accurate address labels
                  </li>
                  <li>
                    <strong>Fragile Items:</strong> Extra care and "fragile"
                    labeling when needed
                  </li>
                  <li>
                    <strong>Professional Appearance:</strong> Clean, presentable
                    packaging
                  </li>
                  <li>
                    <strong>Include Invoice:</strong> Order details or invoice
                    inside package
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Shipping Issues & Resolution
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-semibold text-gray-900">
                  Common Issues
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Delayed delivery</li>
                  <li>Lost or damaged packages</li>
                  <li>Wrong delivery address</li>
                  <li>Missing items</li>
                  <li>Package not received</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  Resolution Process
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Contact Seller First:</strong> Reach out via
                    WhatsApp with issue details
                  </li>
                  <li>
                    <strong>Allow Response Time:</strong> Give seller 24-48
                    hours to respond
                  </li>
                  <li>
                    <strong>Document Issues:</strong> Keep screenshots of
                    conversations and evidence
                  </li>
                  <li>
                    <strong>Escalate if Needed:</strong> Contact watzy support
                    at hello@watzy.app
                  </li>
                  <li>
                    <strong>Cooperation:</strong> Work together for fair
                    resolution
                  </li>
                </ol>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mt-4">
                  <p className="text-green-800">
                    <strong>Our Commitment:</strong> While watzy doesn't handle
                    shipping directly, we're here to help mediate shipping
                    disputes and ensure fair resolution for all parties.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. International Shipping
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  International shipping depends on individual seller
                  capabilities:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Not all sellers offer international shipping</li>
                  <li>Additional customs and duty charges may apply</li>
                  <li>Longer delivery times (7-21 business days typically)</li>
                  <li>Buyers responsible for import duties and taxes</li>
                  <li>
                    Coordinate directly with seller for international orders
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Contact & Support
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>For shipping-related questions or issues:</p>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p>
                    <strong>Primary Contact:</strong> Reach out to the seller
                    directly via WhatsApp
                  </p>
                  <p>
                    <strong>Platform Support:</strong> hello@watzy.app
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
                10. Policy Updates
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  This shipping policy may be updated to reflect changes in our
                  platform or shipping practices. We will notify users of
                  significant changes via email or platform notifications.
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
                  href="/cancellation-refund"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancellation & Refund
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
