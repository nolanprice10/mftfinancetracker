import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface Investment {
  id: string;
  name: string;
  current_value: number;
  ticker_symbol?: string;
  shares_owned?: number;
  purchase_price_per_share?: number;
  type: string;
}

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment | null;
  accounts: Account[];
  onComplete: () => void;
}

export const AddFundsDialog = ({ open, onOpenChange, investment, accounts, onComplete }: AddFundsDialogProps) => {
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSourceAccountId("");
      setAmount("");
    }
  }, [open]);

  const sourceAccount = accounts.find(a => a.id === sourceAccountId);
  const isCryptoOrStock = investment?.type === "individual_stock" || investment?.type === "crypto";

  // Calculate shares if this is a stock/crypto investment
  const calculatedShares = isCryptoOrStock && amount && investment?.purchase_price_per_share
    ? parseFloat(amount) / investment.purchase_price_per_share
    : 0;

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;

    // Validation
    if (!sourceAccountId) {
      toast.error("Please select a source account");
      return;
    }

    if (!investment) {
      toast.error("Investment not found");
      return;
    }

    const addAmount = parseFloat(amount);
    if (isNaN(addAmount) || addAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (sourceAccount && addAmount > sourceAccount.balance) {
      toast.error("Insufficient funds in source account");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add funds");
        return;
      }

      // Calculate new values
      let newCurrentValue = investment.current_value + addAmount;
      let newShares = investment.shares_owned;
      
      if (isCryptoOrStock && investment.purchase_price_per_share) {
        // Calculate shares based on amount and current price
        const sharesToAdd = addAmount / investment.purchase_price_per_share;
        newShares = (investment.shares_owned || 0) + sharesToAdd;
      }

      // Update investment
      const updateData: any = {
        current_value: newCurrentValue,
      };

      if (isCryptoOrStock && newShares !== undefined) {
        updateData.shares_owned = newShares;
      }

      const { error: investmentError } = await supabase
        .from("investments")
        .update(updateData)
        .eq("id", investment.id);

      if (investmentError) throw investmentError;

      // Deduct from source account
      const { error: accountError } = await supabase
        .from("accounts")
        .update({ balance: sourceAccount!.balance - addAmount })
        .eq("id", sourceAccountId);

      if (accountError) throw accountError;

      toast.success(`Added $${addAmount.toFixed(2)} to ${investment.name}`);
      onOpenChange(false);
      onComplete();
    } catch (error: any) {
      console.error("Add funds error:", error);
      toast.error(error.message || "Failed to add funds");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent disableFocusTrap disableOutsidePointerEvents={false}>
        <DialogHeader>
          <DialogTitle>Add Funds to Investment</DialogTitle>
          <DialogDescription>
            {investment ? `Adding to ${investment.name}` : "Select an investment"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddFunds} className="space-y-4">
          <div className="space-y-2">
            <Label>Source Account</Label>
            <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account to transfer from" />
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

        <div className="space-y-2">
          <Label>Amount to Add</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoComplete="off"
            required
          />
          {isCryptoOrStock && investment?.purchase_price_per_share && amount && (
            <p className="text-xs text-muted-foreground">
              ≈ {calculatedShares.toFixed(4)} {investment.type === "crypto" ? "units" : "shares"} @ ${investment.purchase_price_per_share.toFixed(2)} per {investment.type === "crypto" ? "unit" : "share"}
            </p>
          )}
          {sourceAccount && amount && parseFloat(amount) > sourceAccount.balance && (
            <p className="text-sm text-destructive">
              Insufficient funds (Available: ${sourceAccount.balance.toFixed(2)})
            </p>
          )}
        </div>

        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
          <div className="text-sm font-medium">Summary</div>
          <div className="text-xs text-muted-foreground">
            Current value: ${investment?.current_value.toFixed(2) || "0.00"}
          </div>
          {amount && parseFloat(amount) > 0 && (
            <div className="text-xs text-primary font-medium">
              New value: ${((investment?.current_value || 0) + parseFloat(amount)).toFixed(2)}
            </div>
          )}
          {isCryptoOrStock && investment?.shares_owned !== undefined && calculatedShares > 0 && (
            <div className="text-xs text-muted-foreground">
              {investment.type === "crypto" ? "Units" : "Shares"}: {investment.shares_owned.toFixed(3)} → {(investment.shares_owned + calculatedShares).toFixed(3)}
            </div>
          )}
        </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Adding Funds..." : "Add Funds"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
