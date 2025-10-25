import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { DashboardClient } from "./DashboardClient";

// Force no caching for this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Auto-give free trial to new users
  try {
    await supabase.rpc("give_free_trial", { user_uuid: user.id });
  } catch (error) {
    console.log("Free trial already given or error:", error);
  }

  return <DashboardClient />;
}
