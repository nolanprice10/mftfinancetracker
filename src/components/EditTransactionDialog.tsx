import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormInput } from "@/hooks/useFormInput";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  notes: string | null;
  account_id: string;
}

interface Account {
  id: string;
  name: string;
}

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  accounts: Account[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTransactionDialog({ transaction, accounts, open, onOpenChange, onSuccess }: EditTransactionDialogProps) {
  const [type, setType] = useState(transaction?.type || "expense");
  const [accountId, setAccountId] = useState(transaction?.account_id || "");
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split("T")[0]);
  
  const amountInput = useFormInput(transaction?.amount.toString() || "");
  const categoryInput = useFormInput(transaction?.category || "");
  const notesInput = useFormInput(transaction?.notes || "");

  useEffect(() => {
    if (transaction) {
      amountInput.reset();
      categoryInput.reset();
      notesInput.reset();
      setType(transaction.type);
      setAccountId(transaction.account_id);
      setDate(transaction.date);
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    try {
      // Validate input data
      const { transactionSchema } = await import("@/lib/validation");
      const validationResult = transactionSchema.safeParse({
        amount: parseFloat(amountInput.value),
        type: type,
        category: categoryInput.value,
        date: date,
        notes: notesInput.value || null,
        account_id: accountId
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const validated = validationResult.data;

      // Update transaction (trigger will automatically update account balance)
      const { error: txError } = await supabase
        .from("transactions")
        .update({
          type: validated.type as any,
          category: validated.category,
          amount: validated.amount,
          date: validated.date,
          notes: validated.notes,
          account_id: validated.account_id,
        } as any)
        .eq("id", transaction.id);

      if (txError) throw txError;

      toast.success("Transaction updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to update transaction");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        forceMount
        disableFocusTrap
        disableOutsidePointerEvents={false}
      >
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Update transaction details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" step="0.01" placeholder="0.00" {...amountInput} required />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input placeholder="e.g., Food, Rent, Salary" {...categoryInput} required />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input placeholder="Add details..." {...notesInput} />
          </div>
          <Button type="submit" className="w-full">Update Transaction</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
