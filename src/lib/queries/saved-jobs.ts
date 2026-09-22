import type { SupabaseClient } from "@supabase/supabase-js"

export async function getSavedJobIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", userId)
  return new Set((data ?? []).map(function id(row) {
    return row.job_id as string
  }))
}
