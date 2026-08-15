"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Category } from "@/types/database";

const SORT_LABELS: Record<string, string> = {
  next_occurrence: "Prochaine échéance",
  amount_desc: "Montant (plus élevé)",
  amount_asc: "Montant (plus faible)",
  name_asc: "Nom (A → Z)",
};

export function RecurringFilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const searchParamsString = searchParams.toString();
  const [prevSearchParamsString, setPrevSearchParamsString] = useState(searchParamsString);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [type, setType] = useState(() => searchParams.get("type") ?? "all");
  const [categoryId, setCategoryId] = useState(() => searchParams.get("categoryId") ?? "all");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "all");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "next_occurrence");

  // Keep local (controlled) state in sync when the URL changes from elsewhere
  // (back/forward navigation) — Base UI warns if defaultValue is used instead.
  if (searchParamsString !== prevSearchParamsString) {
    setPrevSearchParamsString(searchParamsString);
    setSearch(searchParams.get("search") ?? "");
    setType(searchParams.get("type") ?? "all");
    setCategoryId(searchParams.get("categoryId") ?? "all");
    setStatus(searchParams.get("status") ?? "all");
    setSort(searchParams.get("sort") ?? "next_occurrence");
  }

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-45 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom…"
          value={search}
          className="pl-9"
          onChange={(e) => {
            setSearch(e.target.value);
            setParam("search", e.target.value || null);
          }}
        />
      </div>

      <Select
        value={type}
        onValueChange={(v) => {
          setType(v ?? "all");
          setParam("type", v);
        }}
      >
        <SelectTrigger className="w-35">
          <SelectValue>
            {(v: string) => (v === "expense" ? "Dépense" : v === "income" ? "Revenu" : "Tous les types")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="expense">Dépense</SelectItem>
          <SelectItem value="income">Revenu</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={categoryId}
        onValueChange={(v) => {
          setCategoryId(v ?? "all");
          setParam("categoryId", v);
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue>
            {(v: string) => (v === "all" ? "Toutes catégories" : categories.find((c) => c.id === v)?.name)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes catégories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v ?? "all");
          setParam("status", v);
        }}
      >
        <SelectTrigger className="w-35">
          <SelectValue>
            {(v: string) => (v === "active" ? "Actives" : v === "inactive" ? "Désactivées" : "Tous les statuts")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="active">Actives</SelectItem>
          <SelectItem value="inactive">Désactivées</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(v) => {
          setSort(v ?? "next_occurrence");
          setParam("sort", v);
        }}
      >
        <SelectTrigger className="w-47.5">
          <SelectValue>{(v: string) => SORT_LABELS[v] ?? SORT_LABELS.next_occurrence}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
