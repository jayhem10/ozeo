import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/types/database";

export async function getCategories(
  supabase: SupabaseClient,
  userId: string
): Promise<Category[]> {
  const [{ data, error }, { data: favorites, error: favError }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("name", { ascending: true }),
    supabase.from("favorite_categories").select("category_id").eq("user_id", userId),
  ]);
  if (error) throw error;
  if (favError) throw favError;

  const favoriteIds = new Set((favorites ?? []).map((f) => f.category_id));
  const categories = (data ?? []) as Category[];
  return categories
    .map((c) => ({ ...c, is_favorite: favoriteIds.has(c.id) }))
    .sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}
