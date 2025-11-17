import { createServerClient } from "@/lib/db";
import { redirect } from "next/navigation";
import { AccountDeletionForm } from "@/components/AccountDeletionForm";

export const metadata = {
  title: "Delete Account | Watzy",
  description: "Permanently delete your account and all associated data",
};

export default async function DeleteAccountPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Delete Account
          </h1>
          <p className="text-gray-600">
            We're sorry to see you go. This action is permanent and cannot be
            undone.
          </p>
        </div>

        {/* Account Deletion Form */}
        <AccountDeletionForm />

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Need help instead?
          </h3>
          <p className="text-blue-800 mb-4">
            If you're experiencing issues or have concerns, we're here to help!
            Consider reaching out before deleting your account.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard/contact-us"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        </div>

        {/* GDPR Information */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            This deletion process complies with GDPR and data privacy
            regulations.
          </p>
          <p className="mt-2">
            For questions about data deletion, see our{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
