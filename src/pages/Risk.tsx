import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { TrendingUp, Shield, Target, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiskProfile {
  risk_tolerance: string;
  risk_capacity: string;
  recommended_profile: string;
  quiz_responses: any;
}

interface RiskQuestion {
  id: number;
  question: string;
  description: string;
  options: {
    value: string;
    label: string;
    score: number;
  }[];
}

const riskQuestions: RiskQuestion[] = [
  {
    id: 1,
    question: "How long do you plan to keep your money invested?",
    description: "Think about when you might need this money. Longer time means you can handle more ups and downs.",
    options: [
      { value: "conservative", label: "Less than 3 years (saving for something soon)", score: 1 },
      { value: "moderate", label: "3-10 years (medium-term goals)", score: 2 },
      { value: "aggressive", label: "More than 10 years (long-term growth)", score: 3 },
    ],
  },
  {
    id: 2,
    question: "Imagine your investments lose 20% in one month. How would you feel?",
    description: "This helps us understand your emotional comfort with market swings.",
    options: [
      { value: "conservative", label: "Very stressed - I'd sell to avoid more losses", score: 1 },
      { value: "moderate", label: "Concerned but patient - I'd wait for recovery", score: 2 },
      { value: "aggressive", label: "Excited - I'd buy more at lower prices", score: 3 },
    ],
  },
  {
    id: 3,
    question: "What matters most to you with your investments?",
    description: "Different goals need different strategies.",
    options: [
      { value: "conservative", label: "Keeping my money safe, even if growth is slow", score: 1 },
      { value: "moderate", label: "A mix of safety and growth", score: 2 },
      { value: "aggressive", label: "Maximum growth, I can handle the risk", score: 3 },
    ],
  },
  {
    id: 4,
    question: "How familiar are you with investing?",
    description: "Your experience level helps us recommend appropriate investments.",
    options: [
      { value: "conservative", label: "New to investing or prefer simple options", score: 1 },
      { value: "moderate", label: "Some experience with stocks and bonds", score: 2 },
      { value: "aggressive", label: "Very experienced with different investment types", score: 3 },
    ],
  },
  {
    id: 5,
    question: "How much can your investments change in value each year?",
    description: "Volatility means how much your account balance might go up or down.",
    options: [
      { value: "conservative", label: "Very little change (under 5% swings)", score: 1 },
      { value: "moderate", label: "Moderate changes (5-15% swings)", score: 2 },
      { value: "aggressive", label: "Large changes are okay (over 15% swings)", score: 3 },
    ],
  },
];

const investmentRecommendations = {
  conservative: [
    { name: "High-Yield Savings Account", allocation: "40%", description: "FDIC insured, liquid emergency fund" },
    { name: "Treasury Bonds (T-Bills)", allocation: "30%", description: "Government-backed, low-risk bonds" },
    { name: "Investment-Grade Corporate Bonds", allocation: "20%", description: "Stable corporate debt securities" },
    { name: "Large-Cap Dividend Stocks", allocation: "10%", description: "Established companies with consistent dividends" },
  ],
  moderate: [
    { name: "Index Funds (S&P 500)", allocation: "35%", description: "Diversified equity exposure" },
    { name: "Bond Index Funds", allocation: "30%", description: "Fixed-income stability" },
    { name: "Real Estate Investment Trusts (REITs)", allocation: "15%", description: "Property market exposure" },
    { name: "International Stocks", allocation: "10%", description: "Global diversification" },
    { name: "High-Yield Savings", allocation: "10%", description: "Cash reserves" },
  ],
  aggressive: [
    { name: "Growth Stocks & Tech ETFs", allocation: "40%", description: "High-growth potential equities" },
    { name: "Small-Cap & Emerging Markets", allocation: "25%", description: "Higher risk, higher reward" },
    { name: "Index Funds (Total Market)", allocation: "20%", description: "Broad market exposure" },
    { name: "Alternative Investments", allocation: "10%", description: "Commodities, crypto (small allocation)" },
    { name: "Bond Funds", allocation: "5%", description: "Minimal stability component" },
  ],
};

const Risk = () => {
  const [step, setStep] = useState<"intro" | "quiz" | "capacity" | "results">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRiskProfile();
  }, []);

  const fetchRiskProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("risk_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setRiskProfile(data);
        setStep("results");
      }
    } catch (error) {
      // No existing profile
    }
  };

  const calculateRiskTolerance = (): string => {
    const scores = Object.values(answers).filter(a => typeof a === 'number');
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (avgScore <= 1.5) return "conservative";
    if (avgScore <= 2.5) return "moderate";
    return "aggressive";
  };

  const calculateRiskCapacity = async (): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "conservative";

      // Get user's financial data
      const [transactionsRes, accountsRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(90),
        supabase.from("accounts").select("balance").eq("user_id", user.id),
      ]);

      const transactions = transactionsRes.data || [];
      const totalBalance = (accountsRes.data || []).reduce((sum, acc) => sum + Number(acc.balance), 0);

      // Calculate income and expenses
      const monthlyIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) / 3;
      
      const monthlyExpenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) / 3;

      const monthlySavings = monthlyIncome - monthlyExpenses;
      const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

      // Determine capacity based on savings rate and balance - return risk profile types
      if (savingsRate > 20 && totalBalance > 10000) return "aggressive";
      if (savingsRate > 10 && totalBalance > 5000) return "moderate";
      return "conservative";
    } catch (error) {
      return "conservative";
    }
  };

  const handleAnswer = (value: string, score: number) => {
    setAnswers({ ...answers, [currentQuestion]: score });
  };

  const handleNext = () => {
    if (currentQuestion < riskQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("capacity");
      calculateAndSaveProfile();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateAndSaveProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        setStep("intro");
        setLoading(false);
        return;
      }

      const tolerance = calculateRiskTolerance();
      const capacity = await calculateRiskCapacity();
      
      // Determine recommended profile (more conservative of the two)
      const profileHierarchy = { conservative: 1, moderate: 2, aggressive: 3 };
      const recommended = profileHierarchy[tolerance as keyof typeof profileHierarchy] <= profileHierarchy[capacity as keyof typeof profileHierarchy]
        ? tolerance
        : capacity;

      // Ensure values are valid before saving
      if (!['conservative', 'moderate', 'aggressive'].includes(tolerance)) {
        throw new Error('Invalid risk tolerance value');
      }
      if (!['conservative', 'moderate', 'aggressive'].includes(capacity)) {
        throw new Error('Invalid risk capacity value');
      }
      if (!['conservative', 'moderate', 'aggressive'].includes(recommended)) {
        throw new Error('Invalid recommended profile value');
      }

      const profile = {
        user_id: user.id,
        risk_tolerance: tolerance,
        risk_capacity: capacity,
        recommended_profile: recommended,
        quiz_responses: answers,
      };

      const { error } = await supabase
        .from("risk_profiles")
        .upsert(profile);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      setRiskProfile(profile as RiskProfile);
      toast.success("Risk profile completed!");
      setStep("results");
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      toast.error(error.message || "Failed to save risk profile. Please try again.");
      setStep("intro");
    } finally {
      setLoading(false);
    }
  };

  const retakeQuiz = () => {
    setStep("quiz");
    setCurrentQuestion(0);
    setAnswers({});
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "conservative": return "text-success";
      case "moderate": return "text-warning";
      case "aggressive": return "text-destructive";
      default: return "text-foreground";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "conservative": return Shield;
      case "moderate": return Target;
      case "aggressive": return TrendingUp;
      default: return AlertTriangle;
    }
  };

  if (step === "intro") {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
          <Card className="shadow-elegant border-border">
            <CardHeader>
              <CardTitle className="text-3xl">Risk Assessment</CardTitle>
              <CardDescription>
                Discover your investment risk profile and get personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Risk Tolerance Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      Answer 5 questions to understand your emotional comfort with investment volatility
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <Target className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Risk Capacity Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Automated analysis of your financial situation based on income, expenses, and savings
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-success/10">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Personalized Recommendations</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive investment allocations tailored to your unique risk profile
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setStep("quiz")} className="w-full" size="lg">
                Start Risk Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (step === "quiz") {
    const question = riskQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / riskQuestions.length) * 100;

    return (
      <Layout>
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
          <Card className="shadow-elegant">
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Question {currentQuestion + 1} of {riskQuestions.length}</CardTitle>
                  <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{question.question}</h2>
                <p className="text-sm text-muted-foreground">{question.description}</p>
              </div>
              <RadioGroup
                value={answers[currentQuestion]?.toString() || ""}
                onValueChange={(value) => {
                  const option = question.options.find(o => o.score.toString() === value);
                  if (option) handleAnswer(option.value, option.score);
                }}
              >
                {question.options.map((option) => (
                  <div key={option.score} className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option.score.toString()} id={`option-${option.score}`} />
                    <Label htmlFor={`option-${option.score}`} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion]}
                  className="flex-1"
                >
                  {currentQuestion === riskQuestions.length - 1 ? "Complete" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (step === "capacity") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full shadow-elegant">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="animate-pulse">
                <TrendingUp className="h-16 w-16 mx-auto text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Analyzing Your Financial Capacity</h2>
              <p className="text-muted-foreground">
                Evaluating your income, expenses, and savings patterns...
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (step === "results" && riskProfile) {
    const RiskIcon = getRiskIcon(riskProfile.recommended_profile);
    const recommendations = investmentRecommendations[riskProfile.recommended_profile as keyof typeof investmentRecommendations];

    return (
      <Layout>
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Your Risk Profile</h1>
            <p className="text-muted-foreground">Personalized investment recommendations based on your assessment</p>
          </div>

          {/* Profile Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Risk Tolerance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Shield className={`h-5 w-5 ${getRiskColor(riskProfile.risk_tolerance)}`} />
                  <span className={`text-2xl font-bold capitalize ${getRiskColor(riskProfile.risk_tolerance)}`}>
                    {riskProfile.risk_tolerance}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Your emotional comfort with volatility</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Risk Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Target className={`h-5 w-5 ${getRiskColor(riskProfile.risk_capacity)}`} />
                  <span className={`text-2xl font-bold capitalize ${getRiskColor(riskProfile.risk_capacity)}`}>
                    {riskProfile.risk_capacity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Based on your financial situation</p>
              </CardContent>
            </Card>

            <Card className="shadow-md bg-gradient-primary border-none">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary-foreground">Recommended Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <RiskIcon className="h-5 w-5 text-primary-foreground" />
                  <span className="text-2xl font-bold capitalize text-primary-foreground">
                    {riskProfile.recommended_profile}
                  </span>
                </div>
                <p className="text-xs text-primary-foreground/80 mt-2">Your optimal investment strategy</p>
              </CardContent>
            </Card>
          </div>

          {/* Investment Recommendations */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Recommended Investment Allocation</CardTitle>
              <CardDescription>
                Diversified portfolio tailored to your {riskProfile.recommended_profile} risk profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rec.name}</h3>
                          <Badge variant="secondary">{rec.allocation}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                    </div>
                    <Progress value={parseInt(rec.allocation)} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Important Disclaimer</h4>
                <p className="text-sm text-muted-foreground">
                  These recommendations are for educational purposes only and do not constitute financial advice. 
                  Always consult with a qualified financial advisor before making investment decisions. Past 
                  performance does not guarantee future results.
                </p>
              </div>
              <Button onClick={retakeQuiz} variant="outline" className="w-full mt-4">
                Retake Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return null;
};

export default Risk;
