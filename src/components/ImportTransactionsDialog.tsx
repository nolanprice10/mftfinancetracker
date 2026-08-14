import { useMemo, useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toLocalDateInputValue, toLocalDateOnlyString } from "@/lib/date";

type ParsedRow = Record<string, unknown>;

interface AccountOption {
  id: string;
  name: string;
}

interface ImportTransactionsDialogProps {
  accounts: AccountOption[];
  onSuccess: () => Promise<void> | void;
}

interface ImportSummary {
  imported: number;
  failed: number;
  errors: string[];
}

const HEADER_ALIASES = {
  amount: ["amount", "value", "total", "sum"],
  debit: ["debit", "withdrawal", "outflow"],
  credit: ["credit", "deposit", "inflow"],
  type: ["type", "transactiontype", "entrytype"],
  category: ["category", "group", "bucket"],
  date: ["date", "transactiondate", "posteddate", "postdate"],
  account: ["account", "accountname", "wallet"],
  notes: ["notes", "memo", "description", "details"],
} as const;

function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

function cleanAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = String(value).replace(/[$,\s]/g, "").trim();
  if (!normalized) return null;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function asIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return null;
  }

  const raw = String(value).trim();
  if (!raw) return null;
  const dateOnly = toLocalDateOnlyString(raw);
  if (dateOnly) return dateOnly;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return toLocalDateInputValue(date);
}

function normalizeType(rawType: unknown, amount: number | null): "income" | "expense" | null {
  if (typeof rawType === "string") {
    const value = rawType.toLowerCase().trim();
    if (["income", "credit", "deposit", "in"].includes(value)) return "income";
    if (["expense", "debit", "withdrawal", "out", "payment"].includes(value)) return "expense";
  }

  if (amount === null) return null;
  return amount >= 0 ? "income" : "expense";
}

function toGoogleSheetCsvUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());

    if (!url.hostname.includes("docs.google.com")) return null;
    if (url.pathname.includes("/pub")) {
      url.searchParams.set("output", "csv");
      return url.toString();
    }

    const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;

    const gid = url.searchParams.get("gid") || "0";
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
  } catch {
    return null;
  }
}

function getFieldValue(row: ParsedRow, aliases: readonly string[]): unknown {
  const normalized = new Map<string, unknown>();

  for (const [key, value] of Object.entries(row)) {
    normalized.set(normalizeKey(key), value);
  }

  for (const alias of aliases) {
    if (normalized.has(alias)) {
      return normalized.get(alias);
    }
  }

  return null;
}

async function parseFileRows(file: File): Promise<ParsedRow[]> {
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".tsv") && !lowerName.endsWith(".txt")) {
    throw new Error("Please upload a CSV, TSV, or plain-text file.");
  }

  const text = await file.text();
  const { data } = Papa.parse<ParsedRow>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return data;
}

async function parseGoogleSheetRows(url: string): Promise<ParsedRow[]> {
  const csvUrl = toGoogleSheetCsvUrl(url);
  if (!csvUrl) throw new Error("Invalid Google Sheets URL");

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error("Could not fetch Google Sheet. Make sure it is shared publicly.");
  }

  const csvText = await response.text();
  const { data } = Papa.parse<ParsedRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return data;
}

export function ImportTransactionsDialog({ accounts, onSuccess }: ImportTransactionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"file" | "google-sheet">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [fallbackAccountId, setFallbackAccountId] = useState("");
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const accountNameToId = useMemo(() => {
    return new Map(accounts.map((account) => [account.name.toLowerCase().trim(), account.id]));
  }, [accounts]);

  const getRowsFromSource = async () => {
    if (sourceType === "file") {
      if (!selectedFile) throw new Error("Please choose a file first");
      return parseFileRows(selectedFile);
    }

    if (!googleSheetUrl.trim()) throw new Error("Please provide a Google Sheets URL");
    return parseGoogleSheetRows(googleSheetUrl.trim());
  };

  const handleImport = async () => {
    if (!fallbackAccountId) {
      toast.error("Select a default account for rows without an account column");
      return;
    }

    setImporting(true);
    setSummary(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again");

      const { transactionSchema } = await import("@/lib/validation");

      const rows = await getRowsFromSource();
      if (rows.length === 0) throw new Error("No rows found in the selected source");

      const validPayload: Array<{
        user_id: string;
        account_id: string;
        type: "income" | "expense";
        category: string;
        amount: number;
        date: string;
        notes: string | null;
      }> = [];
      const errors: string[] = [];

      rows.forEach((row, index) => {
        const amountCandidate = cleanAmount(getFieldValue(row, HEADER_ALIASES.amount));
        const debitCandidate = cleanAmount(getFieldValue(row, HEADER_ALIASES.debit));
        const creditCandidate = cleanAmount(getFieldValue(row, HEADER_ALIASES.credit));

        let signedAmount = amountCandidate;
        if (signedAmount === null && debitCandidate !== null) signedAmount = -Math.abs(debitCandidate);
        if (signedAmount === null && creditCandidate !== null) signedAmount = Math.abs(creditCandidate);

        const transactionType = normalizeType(getFieldValue(row, HEADER_ALIASES.type), signedAmount);
        const categoryRaw = getFieldValue(row, HEADER_ALIASES.category);
        const notesRaw = getFieldValue(row, HEADER_ALIASES.notes);
        const dateIso = asIsoDate(getFieldValue(row, HEADER_ALIASES.date));

        const accountRaw = getFieldValue(row, HEADER_ALIASES.account);
        const accountFromName = typeof accountRaw === "string"
          ? accountNameToId.get(accountRaw.toLowerCase().trim())
          : undefined;
        const accountId = accountFromName || fallbackAccountId;

        const category = typeof categoryRaw === "string" && categoryRaw.trim()
          ? categoryRaw.trim()
          : "Imported";
        const notes = typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null;

        const schemaInput = {
          amount: signedAmount !== null ? Math.abs(signedAmount) : Number.NaN,
          type: transactionType,
          category,
          date: dateIso,
          notes,
          account_id: accountId,
        };

        const result = transactionSchema.safeParse(schemaInput);
        if (!result.success) {
          errors.push(`Row ${index + 2}: ${result.error.errors[0].message}`);
          return;
        }

        validPayload.push({
          user_id: user.id,
          account_id: result.data.account_id,
          type: result.data.type,
          category: result.data.category,
          amount: result.data.amount,
          date: result.data.date,
          notes: result.data.notes ?? null,
        });
      });

      if (validPayload.length === 0) {
        throw new Error(errors[0] || "No valid transactions to import");
      }

      const chunkSize = 200;
      for (let i = 0; i < validPayload.length; i += chunkSize) {
        const chunk = validPayload.slice(i, i + chunkSize);
        const { error } = await supabase.from("transactions").insert(chunk as any);
        if (error) throw error;
      }

      const importSummary: ImportSummary = {
        imported: validPayload.length,
        failed: errors.length,
        errors: errors.slice(0, 5),
      };
      setSummary(importSummary);

      await onSuccess();
      toast.success(`Imported ${importSummary.imported} transaction(s)`);

      if (importSummary.failed > 0) {
        toast.error(`${importSummary.failed} row(s) were skipped due to validation errors`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import transactions");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
                Import from CSV, TSV, plain text, or a public Google Sheets link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Import Source</Label>
            <Select value={sourceType} onValueChange={(value: "file" | "google-sheet") => setSourceType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file">CSV or text file</SelectItem>
                <SelectItem value="google-sheet">Google Sheets URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sourceType === "file" ? (
            <div className="space-y-2">
              <Label>File</Label>
              <Input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Google Sheets URL</Label>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={googleSheetUrl}
                onChange={(event) => setGoogleSheetUrl(event.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Default Account</Label>
            <Select value={fallbackAccountId} onValueChange={setFallbackAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Used when account column is missing" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Supported columns: amount/type/category/date/notes/account. If type is missing, positive amounts become income and negative amounts become expense.
          </p>

          {summary && (
            <div className="rounded-md border border-border p-3 space-y-2 text-sm">
              <p>Imported: {summary.imported}</p>
              <p>Skipped: {summary.failed}</p>
              {summary.errors.length > 0 && (
                <div className="space-y-1">
                  {summary.errors.map((err) => (
                    <p key={err} className="text-muted-foreground">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={handleImport} disabled={importing || accounts.length === 0} className="w-full">
            {importing ? "Importing..." : "Import Transactions"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
