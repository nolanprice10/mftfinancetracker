import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { parseDateOnlyString } from "@/lib/date";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface FinanceSnapshot {
  monthlyNet: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  goalCount: number;
  topGoalName: string | null;
  topGoalProgress: number;
}

const FinanceAssistant = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);

  useEffect(() => {
    const loadSnapshot = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [transactionsRes, goalsRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("amount,type,date")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(50),
          supabase.from("goals").select("name,current_amount,target_amount").eq("user_id", user.id).limit(5),
        ]);

        const transactions = transactionsRes.data || [];
        const goals = goalsRes.data || [];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyTransactions = transactions.filter((tx: any) => {
          const txDate = parseDateOnlyString(tx.date) ?? new Date(tx.date);
          return txDate >= startOfMonth;
        });

        const monthlyIncome = monthlyTransactions
          .filter((tx: any) => tx.type === "income")
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        const monthlyExpenses = monthlyTransactions
          .filter((tx: any) => tx.type === "expense")
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        const topGoal = goals.reduce((best: any, current: any) => {
          if (!best) return current;
          const bestProgress = Number(best.target_amount) > 0 ? (Number(best.current_amount) / Number(best.target_amount)) * 100 : 0;
          const currentProgress = Number(current.target_amount) > 0 ? (Number(current.current_amount) / Number(current.target_amount)) * 100 : 0;
          return currentProgress > bestProgress ? current : best;
        }, null as any);

        setSnapshot({
          monthlyNet: monthlyIncome - monthlyExpenses,
          monthlyIncome,
          monthlyExpenses,
          goalCount: goals.length,
          topGoalName: topGoal?.name || null,
          topGoalProgress: topGoal ? Math.round((Number(topGoal.current_amount) / Number(topGoal.target_amount)) * 100) : 0,
        });
      } catch {
        setSnapshot({ monthlyNet: 0, monthlyIncome: 0, monthlyExpenses: 0, goalCount: 0, topGoalName: null, topGoalProgress: 0 });
      }
    };

    loadSnapshot();
  }, []);

  useEffect(() => {
    if (!messages.length) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hi! I’m your finance guide. I can help with budgeting, savings, debt, goals, accounts, and investing. Ask me something about your money.",
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    if (!open) return;
    const container = document.querySelector(".finance-assistant-scroll");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    const response = getFinanceResponse(question, snapshot);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: question },
      { id: crypto.randomUUID(), role: "assistant", content: response },
    ]);
    setInput("");
  };

  const starterPrompts = useMemo(() => [
    "How can I save more?",
    "What should I do with my goal?",
    "How do I lower debt?",
  ], []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <Button
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full p-0 shadow-lg"
          aria-label="Open finance assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <div className="w-[92vw] max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Finance Assistant</p>
                <p className="text-xs text-muted-foreground">Focused on money guidance only</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="finance-assistant-scroll max-h-80 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSend} className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about budgeting, debt, goals..."
                className="flex-1"
              />
              <Button type="submit" size="icon" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const getFinanceResponse = (question: string, snapshot: FinanceSnapshot | null) => {
  const query = question.toLowerCase();

  if (/^(weather|movie|sports|joke|recipe|travel|politics|history|science|tech|music|hello|hi|who are you)/i.test(question)) {
    return "I can only help with personal finance topics. Ask me about budgeting, savings, debt, goals, accounts, or investing.";
  }

  if (query.includes("budget") || query.includes("spending") || query.includes("expenses")) {
    const savingsHint = snapshot && snapshot.monthlyNet > 0
      ? `Your current monthly net is about $${snapshot.monthlyNet.toFixed(0)}. That means you’re still adding money after expenses, so try directing a portion of that into savings or debt payoff.`
      : "Start by grouping your spending into needs, wants, and goals so every dollar has a purpose.";
    return `${savingsHint} A simple first step is to cap flexible categories and automate a small transfer to savings each payday.`;
  }

  if (query.includes("save") || query.includes("savings") || query.includes("goal")) {
    const goalHint = snapshot?.topGoalName
      ? `You currently have ${snapshot.goalCount} goal${snapshot.goalCount === 1 ? "" : "s"} in your tracker, with ${snapshot.topGoalName} at about ${snapshot.topGoalProgress}% progress.`
      : "You can make the biggest difference by focusing on one clear target at a time.";
    return `${goalHint} Try setting a small automatic transfer for that goal every payday and keep it separate from everyday spending.`;
  }

  if (query.includes("debt") || query.includes("loan") || query.includes("credit")) {
    return "For debt, the fastest approach is usually to pay extra toward the highest-interest balance while keeping minimums current. If you have multiple balances, focus on the one costing you the most each month.";
  }

  if (query.includes("invest") || query.includes("retirement") || query.includes("portfolio")) {
    return "Investing is usually easier when you keep it simple: build an emergency fund first, then automate a regular contribution to a diversified account that matches your timeline and risk comfort.";
  }

  if (query.includes("account") || query.includes("transaction") || query.includes("income")) {
    return "Good account habits come from regular review. Check your recurring transactions, make sure your income is predictable, and keep your cash flow visible so surprises are easier to spot.";
  }

  return "I can help you think through budgeting, savings, debt, goals, accounts, and investing. Ask me a money question and I’ll keep the answer focused on your finances.";
};

export default FinanceAssistant;
