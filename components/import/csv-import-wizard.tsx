"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { parse as parseDate, isValid, format } from "date-fns";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { importTransactions, type CsvImportRow, type ImportSummary } from "@/lib/actions/import";
import type { Account } from "@/types/database";

const DATE_FORMATS = [
  { value: "yyyy-MM-dd", label: "AAAA-MM-JJ (2026-08-09)" },
  { value: "dd/MM/yyyy", label: "JJ/MM/AAAA (09/08/2026)" },
  { value: "MM/dd/yyyy", label: "MM/JJ/AAAA (08/09/2026)" },
] as const;

type Step = "upload" | "mapping" | "preview" | "done";

export function CsvImportWizard({ accounts }: { accounts: Account[] }) {
  const [step, setStep] = useState<Step>("upload");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [dateColumn, setDateColumn] = useState("");
  const [amountColumn, setAmountColumn] = useState("");
  const [descriptionColumn, setDescriptionColumn] = useState("");
  const [merchantColumn, setMerchantColumn] = useState("");
  const [dateFormat, setDateFormat] = useState<(typeof DATE_FORMATS)[number]["value"]>("yyyy-MM-dd");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  function handleFile(file: File) {
    setFilename(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? [];
        setHeaders(cols);
        setRawRows(results.data);
        setDateColumn(cols.find((c) => /date/i.test(c)) ?? cols[0] ?? "");
        setAmountColumn(cols.find((c) => /montant|amount/i.test(c)) ?? cols[1] ?? "");
        setDescriptionColumn(cols.find((c) => /libell|description/i.test(c)) ?? "");
        setMerchantColumn(cols.find((c) => /marchand|merchant/i.test(c)) ?? "");
        setStep("mapping");
      },
      error: () => toast.error("Impossible de lire ce fichier CSV"),
    });
  }

  const normalizedRows: CsvImportRow[] = useMemo(() => {
    if (step === "upload") return [];
    return rawRows
      .map((row) => {
        const rawDate = row[dateColumn]?.trim();
        const rawAmount = row[amountColumn]?.trim().replace(",", ".").replace(/\s/g, "");
        const parsedDate = rawDate ? parseDate(rawDate, dateFormat, new Date()) : null;
        const amount = rawAmount ? Number(rawAmount) : NaN;
        return {
          date: parsedDate && isValid(parsedDate) ? format(parsedDate, "yyyy-MM-dd") : "",
          amount,
          description: descriptionColumn ? row[descriptionColumn] : undefined,
          merchant: merchantColumn ? row[merchantColumn] : undefined,
        };
      })
      .filter((r) => r.date && !Number.isNaN(r.amount));
  }, [rawRows, dateColumn, amountColumn, descriptionColumn, merchantColumn, dateFormat, step]);

  async function handleImport() {
    setImporting(true);
    const result = await importTransactions(filename, accountId, normalizedRows);
    setImporting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (result.summary) {
      setSummary(result.summary);
      setStep("done");
    }
  }

  if (step === "upload") {
    return (
      <label className="block cursor-pointer">
        <input
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <EmptyState
          icon={Upload}
          title="Importer un fichier CSV"
          description="Sélectionne l'export de transactions de ta banque."
          action={
            <Button render={<span />} nativeButton={false}>
              Choisir un fichier
            </Button>
          }
        />
      </label>
    );
  }

  if (step === "mapping") {
    return (
      <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{filename}</p>
          <span className="text-xs text-muted-foreground">({rawRows.length} lignes détectées)</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Compte de destination</Label>
            <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => accounts.find((a) => a.id === v)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Format de date</Label>
            <Select value={dateFormat} onValueChange={(v) => v && setDateFormat(v as typeof dateFormat)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => DATE_FORMATS.find((f) => f.value === v)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ColumnSelect label="Colonne date" value={dateColumn} onChange={setDateColumn} headers={headers} />
          <ColumnSelect label="Colonne montant" value={amountColumn} onChange={setAmountColumn} headers={headers} />
          <ColumnSelect
            label="Colonne description (optionnel)"
            value={descriptionColumn}
            onChange={setDescriptionColumn}
            headers={headers}
            optional
          />
          <ColumnSelect
            label="Colonne marchand (optionnel)"
            value={merchantColumn}
            onChange={setMerchantColumn}
            headers={headers}
            optional
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setStep("upload")}>
            Recommencer
          </Button>
          <Button onClick={() => setStep("preview")} disabled={!dateColumn || !amountColumn || !accountId}>
            Prévisualiser
          </Button>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
        <p className="font-medium">
          {normalizedRows.length} transaction{normalizedRows.length > 1 ? "s" : ""} détectée
          {normalizedRows.length > 1 ? "s" : ""}
        </p>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Marchand</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normalizedRows.slice(0, 10).map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.merchant || row.description || "—"}</TableCell>
                  <TableCell className="text-right">{row.amount.toFixed(2)} €</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {normalizedRows.length > 10 && (
          <p className="text-xs text-muted-foreground">Et {normalizedRows.length - 10} lignes de plus…</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setStep("mapping")}>
            Retour
          </Button>
          <Button onClick={handleImport} disabled={importing || normalizedRows.length === 0}>
            {importing && <Loader2 className="mr-2 size-4 animate-spin" />}
            Importer {normalizedRows.length} transactions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto mb-3 size-10 text-emerald-500" />
      <p className="font-medium">Import terminé</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {summary?.totalRows} lignes détectées · {summary?.importedRows} nouvelles · {summary?.duplicateRows}{" "}
        doublons · {summary?.failedRows} échecs
      </p>
      <Button className="mt-4" variant="outline" onClick={() => setStep("upload")}>
        Importer un autre fichier
      </Button>
    </div>
  );
}

function ColumnSelect({
  label,
  value,
  onChange,
  headers,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  headers: string[];
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || "__none__"} onValueChange={(v) => onChange(!v || v === "__none__" ? "" : v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choisir une colonne" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value="__none__">Aucune</SelectItem>}
          {headers.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
