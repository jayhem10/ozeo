import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/types/database";

export async function getCategories(
  supabase: SupabaseClient,
  userId: string
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}
