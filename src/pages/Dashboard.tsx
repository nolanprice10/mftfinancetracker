import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Target as TargetIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  end_date: string;
}

interface Transaction {
  amount: number;
  type: string;
  date: string;
}

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [accountsRes, goalsRes, transactionsRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id).limit(3),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyNet = monthlyIncome - monthlyExpenses;

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-card border-none shadow-lg hover:shadow-glow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-none shadow-lg hover:shadow-glow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Net Flow</CardTitle>
              {monthlyNet >= 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${monthlyNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${Math.abs(monthlyNet).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${monthlyIncome.toFixed(2)} income - ${monthlyExpenses.toFixed(2)} expenses
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-none shadow-lg hover:shadow-glow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <TargetIcon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{goals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Financial goals in progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Goals Preview */}
        {goals.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Goals</CardTitle>
                <CardDescription>Track your progress towards financial goals</CardDescription>
              </div>
              <Link to="/goals">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal) => {
                const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ${Number(goal.current_amount).toFixed(0)} / ${Number(goal.target_amount).toFixed(0)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/transactions" className="block">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </Link>
              <Link to="/accounts" className="block">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </Link>
              <Link to="/goals" className="block">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </Link>
              <Link to="/investments" className="block">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Investment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
