import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingDown, PiggyBank, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Recommendations = () => {
  // Static recommendations for now - will be AI-powered later
  const recommendations = [
    {
      id: "1",
      type: "spending",
      title: "Reduce Dining Expenses",
      message: "You spent 28% of your monthly income on dining out. Consider reducing by 10% to save an additional $240/month.",
      icon: TrendingDown,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      id: "2",
      type: "saving",
      title: "Increase Emergency Fund",
      message: "Your emergency fund covers 2.5 months of expenses. Experts recommend 3-6 months. Consider saving an extra $500/month.",
      icon: PiggyBank,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "3",
      type: "investment",
      title: "Maximize Retirement Contributions",
      message: "You're contributing $300/month to retirement. Consider increasing to $500/month to maximize tax advantages and compound growth.",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      id: "4",
      type: "goal",
      title: "Vacation Fund On Track",
      message: "Great progress! You're 65% towards your vacation goal. Stay consistent with your $200/month contributions to reach it by June.",
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  const typeColors: Record<string, string> = {
    spending: "bg-warning",
    saving: "bg-primary",
    investment: "bg-success",
    goal: "bg-accent",
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recommendations</h1>
          <p className="text-muted-foreground">Personalized insights to improve your financial health</p>
        </div>

        <Card className="bg-gradient-primary shadow-lg border-none text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-6 w-6" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-white/90">
              Our intelligent system analyzes your spending patterns, savings goals, and investment portfolio 
              to provide personalized recommendations that help you achieve your financial objectives.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((recommendation) => {
            const Icon = recommendation.icon;
            return (
              <Card key={recommendation.id} className="shadow-md hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={typeColors[recommendation.type]}>
                          {recommendation.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{recommendation.title}</CardTitle>
                    </div>
                    <div className={`p-3 rounded-xl ${recommendation.bgColor}`}>
                      <Icon className={`h-6 w-6 ${recommendation.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{recommendation.message}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                    <Button size="sm">
                      Take Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">About Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Recommendations are generated based on your transaction history, account balances, and financial goals. 
              They are provided for informational purposes only and should not be considered as personalized financial advice. 
              Always consult with a licensed financial advisor before making significant financial decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Recommendations;
