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
              <strong>Effective Date:</strong> November 17, 2025
            </p>

            {/* GDPR Compliance Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    🇪🇺 GDPR Compliance
                  </h3>
                  <p className="text-sm text-blue-800">
                    We are fully compliant with the General Data Protection
                    Regulation (GDPR) and other international privacy laws. You
                    have full control over your personal data, including the
                    right to access, correct, delete, and export your
                    information at any time.
                  </p>
                </div>
              </div>
            </div>

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
                5. Your Rights (GDPR & Privacy Laws)
              </h2>
              <p className="text-gray-700 mb-4">
                Under GDPR and other privacy laws, you have comprehensive rights
                regarding your personal data:
              </p>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">👁️</span>
                    Right to Access
                  </h3>
                  <p className="text-gray-700 text-sm">
                    You can request a copy of all personal data we hold about
                    you. Go to{" "}
                    <strong>
                      Dashboard → Store Settings → Account → Export My Data
                    </strong>{" "}
                    to download your data.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">✏️</span>
                    Right to Rectification
                  </h3>
                  <p className="text-gray-700 text-sm">
                    You can update and correct inaccurate or incomplete
                    information through your dashboard settings at any time.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">🗑️</span>
                    Right to Erasure ("Right to be Forgotten")
                  </h3>
                  <p className="text-gray-700 text-sm">
                    You can request complete deletion of your account and all
                    associated data. Go to{" "}
                    <strong>
                      Dashboard → Store Settings → Account → Delete My Account
                    </strong>
                    . This action is permanent and will delete: stores,
                    products, orders, images, payment history, and all personal
                    information.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">📦</span>
                    Right to Data Portability
                  </h3>
                  <p className="text-gray-700 text-sm">
                    You can export your data in a structured, machine-readable
                    format (JSON) to transfer to another service.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">⛔</span>
                    Right to Object
                  </h3>
                  <p className="text-gray-700 text-sm">
                    You can object to processing of your personal data for
                    direct marketing purposes. Manage your cookie preferences
                    and opt out of marketing communications at any time.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">⏸️</span>
                    Right to Restriction of Processing
                  </h3>
                  <p className="text-gray-700 text-sm">
                    You can request that we limit how we use your data while we
                    investigate your concerns about data accuracy or processing.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">🚫</span>
                    Right to Withdraw Consent
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Where we process data based on consent, you can withdraw
                    that consent at any time through your cookie preferences or
                    account settings.
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>⚡ Quick Actions:</strong> To exercise any of these
                  rights, contact us at{" "}
                  <a
                    href="mailto:hello@watzy.app"
                    className="text-blue-600 hover:underline"
                  >
                    hello@watzy.app
                  </a>{" "}
                  or use the self-service options in your dashboard. We will
                  respond within 30 days.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your
                experience, analyze usage, and personalize content. We respect
                your privacy choices and give you full control over cookie
                preferences.
              </p>

              <div className="space-y-4 mt-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    🍪 What Are Cookies?
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Cookies are small text files stored on your device that help
                    websites remember your preferences and improve your browsing
                    experience.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Types of Cookies We Use:
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 text-sm space-y-2">
                    <li>
                      <strong>Essential Cookies (Always Active):</strong>{" "}
                      Required for the website to function properly (login,
                      shopping cart, security)
                    </li>
                    <li>
                      <strong>Analytics Cookies (Optional):</strong> Help us
                      understand how visitors interact with our website (Google
                      Analytics, page views, usage patterns)
                    </li>
                    <li>
                      <strong>Marketing Cookies (Optional):</strong> Used to
                      deliver relevant advertisements and track campaign
                      effectiveness
                    </li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Your Cookie Choices:
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 text-sm space-y-2">
                    <li>
                      Customize your preferences through our cookie consent
                      banner (appears on first visit)
                    </li>
                    <li>
                      Change preferences anytime through your browser settings
                    </li>
                    <li>
                      Block all non-essential cookies while keeping essential
                      functionality
                    </li>
                    <li>
                      Delete existing cookies through your browser's privacy
                      settings
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Blocking certain cookies may affect
                    website functionality and your user experience. Essential
                    cookies cannot be disabled as they are necessary for basic
                    website operations.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Third-Party Services & Data Processors
              </h2>
              <p className="text-gray-700 mb-4">
                We work with trusted third-party service providers to deliver
                our services. All processors are carefully selected and required
                to maintain GDPR-compliant data protection standards.
              </p>

              <div className="space-y-3 mt-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Supabase (Database & Authentication)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Stores user accounts, store data, and product information.
                    Data hosted in secure, GDPR-compliant infrastructure.
                  </p>
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Privacy Policy →
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Stripe & Razorpay (Payment Processing)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Handles secure payment transactions. We do not store your
                    full payment card details. PCI-DSS compliant payment
                    processing.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Stripe Privacy →
                    </a>
                    <a
                      href="https://razorpay.com/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Razorpay Privacy →
                    </a>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Twilio (WhatsApp Messaging)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Powers WhatsApp order notifications and customer
                    communications. Messages are transmitted securely.
                  </p>
                  <a
                    href="https://www.twilio.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Privacy Policy →
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Vercel (Hosting & CDN)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Hosts our application with TLS 1.3 encryption and global CDN
                    for fast, secure delivery.
                  </p>
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Privacy Policy →
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Google Analytics (Optional)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Anonymous usage analytics (only if you consent to analytics
                    cookies). No personally identifiable information is shared.
                  </p>
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Privacy Policy →
                  </a>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Data Processing Agreements:</strong> We have data
                  processing agreements (DPAs) in place with all third-party
                  processors to ensure GDPR compliance and protect your data.
                </p>
              </div>
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
                  <strong>WhatsApp:</strong> +91 92114 53827
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
