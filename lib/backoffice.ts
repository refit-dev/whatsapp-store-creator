import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export type BackofficeRole = "admin" | "approver";

export type BackofficeProfile = {
  role: BackofficeRole;
  email: string;
};

// Returns active admin/approver profile for the given user or null when unauthorized
export async function getBackofficeProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<BackofficeProfile | null> {
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  const adminRecord =
    admin as Database["public"]["Tables"]["admins"]["Row"] | null;

  if (adminRecord) {
    return { role: "admin", email: adminRecord.email };
  }

  const { data: approver } = await supabase
    .from("approvers")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  const approverRecord =
    approver as Database["public"]["Tables"]["approvers"]["Row"] | null;

  if (approverRecord) {
    return { role: "approver", email: approverRecord.email };
  }

  return null;
}
