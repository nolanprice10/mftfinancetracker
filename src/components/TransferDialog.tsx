import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onTransferComplete: () => void;
}

export const TransferDialog = ({ open, onOpenChange, accounts, onTransferComplete }: TransferDialogProps) => {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setNotes("");
    }
  }, [open]);

  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;

    // Validation
    if (!fromAccountId || !toAccountId) {
      toast.error("Please select both accounts");
      return;
    }

    if (fromAccountId === toAccountId) {
      toast.error("Cannot transfer to the same account");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (fromAccount && transferAmount > fromAccount.balance) {
      toast.error("Insufficient funds in source account");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to transfer funds");
        return;
      }

      // Update account balances only (no transactions created)
      const { error: fromAccountError } = await supabase
        .from("accounts")
        .update({ balance: fromAccount!.balance - transferAmount })
        .eq("id", fromAccountId);

      if (fromAccountError) throw fromAccountError;

      const { error: toAccountError } = await supabase
        .from("accounts")
        .update({ balance: toAccount!.balance + transferAmount })
        .eq("id", toAccountId);

      if (toAccountError) throw toAccountError;

      toast.success("Transfer completed successfully");
      onOpenChange(false);
      onTransferComplete();
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Failed to complete transfer");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter destination accounts to exclude the selected source account
  const availableDestinations = accounts.filter(a => a.id !== fromAccountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent disableFocusTrap disableOutsidePointerEvents={false}>
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
          <DialogDescription>Move money between your accounts</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-2">
            <Label>From Account</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (${account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center py-2">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label>To Account</Label>
            <Select 
              value={toAccountId} 
              onValueChange={setToAccountId}
              disabled={!fromAccountId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {availableDestinations.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (${account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoComplete="off"
              required
            />
            {fromAccount && amount && parseFloat(amount) > fromAccount.balance && (
              <p className="text-sm text-destructive">Insufficient funds (Available: ${fromAccount.balance.toFixed(2)})</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="Add transfer details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoComplete="off"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Transferring..." : "Complete Transfer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
