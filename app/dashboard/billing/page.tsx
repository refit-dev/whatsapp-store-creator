import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { BillingClient } from "./BillingClient";
import { SubscriptionProvider } from "@/components/SubscriptionProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";

// Force no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BillingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  return (
    <CurrencyProvider>
      <SubscriptionProvider>
        <BillingClient />
      </SubscriptionProvider>
    </CurrencyProvider>
  );
}
