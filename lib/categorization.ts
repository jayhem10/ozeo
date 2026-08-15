import type { Category, MerchantRule } from "@/types/database";

// Simple built-in merchant → category-name rules used to suggest a category
// when a transaction is created. `merchant_rules` (per-user, learned from the
// user's own corrections) are checked first — see rememberMerchantRule.
const DEFAULT_MERCHANT_RULES: Array<{ pattern: RegExp; categoryName: string }> = [
  { pattern: /netflix|spotify|disney\+|deezer|canal\+|apple music/i, categoryName: "Abonnements" },
  { pattern: /carrefour|leclerc|auchan|monoprix|lidl|intermarch/i, categoryName: "Courses" },
  { pattern: /uber|sncf|ratp|blablacar|taxi/i, categoryName: "Transport" },
  { pattern: /mcdonald|kfc|burger|restaurant|deliveroo|uber ?eats/i, categoryName: "Restaurants" },
  { pattern: /total|shell|esso|bp /i, categoryName: "Carburant" },
  { pattern: /pharmacie|doctolib|mutuelle/i, categoryName: "Santé" },
  { pattern: /airbnb|booking|ryanair|air france/i, categoryName: "Voyages" },
  { pattern: /amazon|zara|fnac|decathlon/i, categoryName: "Shopping" },
  { pattern: /loyer|edf|engie|veolia/i, categoryName: "Logement" },
];

// Rules are stored as plain (already-normalized) substrings, not regex, so
// user-typed merchant names can't be interpreted as regex syntax.
export function normalizeMerchantPattern(merchant: string): string {
  return merchant.trim().toLowerCase();
}

export function suggestCategoryId(
  merchant: string | null | undefined,
  categories: Category[],
  userRules: MerchantRule[] = []
): string | null {
  if (!merchant) return null;
  const normalized = normalizeMerchantPattern(merchant);

  const userRule = userRules.find((r) => normalized.includes(r.pattern));
  if (userRule) return userRule.category_id;

  const rule = DEFAULT_MERCHANT_RULES.find((r) => r.pattern.test(merchant));
  if (!rule) return null;
  return categories.find((c) => c.name === rule.categoryName)?.id ?? null;
}

