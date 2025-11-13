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

interface InvestmentRecommendation {
  name: string;
  ticker?: string;
  allocation: string;
  description: string;
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
    { name: "Marcus by Goldman Sachs High-Yield Savings", ticker: "4.5% APY", allocation: "40%", description: "FDIC insured up to $250k, no minimums, daily compounding interest for emergency fund" },
    { name: "iShares 1-3 Year Treasury Bond ETF", ticker: "SHY", allocation: "30%", description: "Low-volatility government bonds, ideal for capital preservation with modest returns" },
    { name: "Vanguard Investment-Grade Corporate Bond ETF", ticker: "VCIT", allocation: "20%", description: "Diversified basket of high-quality corporate debt from stable companies like Apple, Microsoft" },
    { name: "Vanguard Dividend Appreciation ETF", ticker: "VIG", allocation: "10%", description: "Blue-chip stocks with 10+ years of dividend growth (Johnson & Johnson, Procter & Gamble)" },
  ],
  moderate: [
    { name: "Vanguard S&P 500 ETF", ticker: "VOO", allocation: "35%", description: "Tracks 500 largest US companies with ultra-low 0.03% expense ratio—Warren Buffett's recommendation" },
    { name: "Vanguard Total Bond Market ETF", ticker: "BND", allocation: "30%", description: "7,000+ US government and corporate bonds for stability and income generation" },
    { name: "Vanguard Real Estate ETF", ticker: "VNQ", allocation: "15%", description: "Exposure to 160+ REITs including data centers, apartments, and industrial properties" },
    { name: "Vanguard Total International Stock ETF", ticker: "VXUS", allocation: "10%", description: "8,000+ non-US stocks across developed and emerging markets for global diversification" },
    { name: "Ally Bank High-Yield Savings", ticker: "4.25% APY", allocation: "10%", description: "FDIC insured emergency fund with no monthly fees and 24/7 access" },
  ],
  aggressive: [
    { name: "Invesco QQQ Trust", ticker: "QQQ", allocation: "25%", description: "Top 100 Nasdaq stocks—heavy tech exposure to Apple, Microsoft, Nvidia, Tesla, Amazon" },
    { name: "ARK Innovation ETF", ticker: "ARKK", allocation: "15%", description: "Actively managed disruptive tech fund focusing on AI, genomics, fintech, and robotics" },
    { name: "Vanguard Small-Cap Growth ETF", ticker: "VBK", allocation: "15%", description: "Small companies with high growth potential—historically higher returns but more volatile" },
    { name: "iShares MSCI Emerging Markets ETF", ticker: "EEM", allocation: "10%", description: "Exposure to rapidly growing economies like China, India, Taiwan, South Korea" },
    { name: "Vanguard Total Stock Market ETF", ticker: "VTI", allocation: "20%", description: "Complete US market exposure—4,000+ stocks from mega-cap to micro-cap" },
    { name: "SPDR Gold Shares", ticker: "GLD", allocation: "8%", description: "Physical gold ETF as inflation hedge and portfolio diversifier during market uncertainty" },
    { name: "iShares Core U.S. Aggregate Bond ETF", ticker: "AGG", allocation: "7%", description: "Broad bond exposure for minimal stability during high-volatility growth periods" },
  ],
};

const Risk = () => {
  const [step, setStep] = useState<"intro" | "quiz" | "capacity" | "results">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);

  useEffect(() => {
    fetchRiskProfile();
    fetchUserAge();
  }, []);

  const fetchUserAge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("birthday")
        .eq("id", user.id)
        .single();

      if (data?.birthday) {
        const birthDate = new Date(data.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setUserAge(age);
      }
    } catch (error) {
      console.error("Error fetching user age:", error);
    }
  };

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
      if (!user) return "low";

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

      // Determine capacity based on savings rate and balance
      // Higher savings rate + larger emergency fund = higher capacity for risk
      if (savingsRate > 20 && totalBalance > 10000) return "high";
      if (savingsRate > 10 && totalBalance > 5000) return "medium";
      return "low";
    } catch (error) {
      return "low";
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
      // Map capacity levels to tolerance levels for comparison
      const toleranceHierarchy = { conservative: 1, moderate: 2, aggressive: 3 };
      const capacityHierarchy = { low: 1, medium: 2, high: 3 };
      const capacityToTolerance = { low: 'conservative', medium: 'moderate', high: 'aggressive' };
      
      const toleranceLevel = toleranceHierarchy[tolerance as keyof typeof toleranceHierarchy];
      const capacityLevel = capacityHierarchy[capacity as keyof typeof capacityHierarchy];
      
      // Choose the more conservative option
      const recommended = toleranceLevel <= capacityLevel
        ? tolerance
        : capacityToTolerance[capacity as keyof typeof capacityToTolerance];

      // Ensure values are valid before saving
      if (!['conservative', 'moderate', 'aggressive'].includes(tolerance)) {
        throw new Error('Invalid risk tolerance value');
      }
      if (!['low', 'medium', 'high'].includes(capacity)) {
        throw new Error('Invalid risk capacity value');
      }
      if (!['conservative', 'moderate', 'aggressive'].includes(recommended)) {
        throw new Error('Invalid recommended profile value');
      }

      // Validate the profile data
      const { riskProfileSchema } = await import("@/lib/validation");
      const validationResult = riskProfileSchema.safeParse({
        risk_tolerance: tolerance,
        risk_capacity: capacity,
        recommended_profile: recommended,
        quiz_responses: answers
      });

      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message);
      }

      const profile = {
        user_id: user.id,
        ...validationResult.data
      };

      const { error } = await supabase
        .from("risk_profiles")
        .upsert(profile);

      if (error) throw error;

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
                Understanding your risk tolerance helps you invest confidently. This quick 5-question assessment considers both your emotional comfort with market changes and your financial capacity to handle them.
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
                      Your risk tolerance measures how comfortable you feel with market ups and downs. It's like knowing if you prefer a smooth highway or a thrilling rollercoaster—both can get you to your destination.
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
                      Risk capacity is different from tolerance—it's about what you can actually afford to risk. Someone with a healthy emergency fund and stable income has higher capacity, even if they don't like volatility.
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
                      We'll recommend the more conservative of your tolerance and capacity. Why? Because investing what you can't afford to lose—even if you're comfortable with risk—isn't wise financial planning.
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
    let recommendations = investmentRecommendations[riskProfile.recommended_profile as keyof typeof investmentRecommendations];
    
    // Filter recommendations based on age (must be 18+ for brokerage/savings accounts)
    if (userAge !== null && userAge < 18) {
      recommendations = recommendations.filter(rec => {
        const isAdultOnly = rec.name.toLowerCase().includes("goldman sachs") || 
                           rec.name.toLowerCase().includes("ally bank") ||
                           rec.name.toLowerCase().includes("marcus") ||
                           rec.ticker?.toLowerCase() === "shy" ||
                           rec.ticker?.toLowerCase() === "vcit" ||
                           rec.ticker?.toLowerCase() === "vig" ||
                           rec.ticker?.toLowerCase() === "voo" ||
                           rec.ticker?.toLowerCase() === "bnd" ||
                           rec.ticker?.toLowerCase() === "vnq" ||
                           rec.ticker?.toLowerCase() === "vxus" ||
                           rec.ticker?.toLowerCase() === "qqq" ||
                           rec.ticker?.toLowerCase() === "arkk" ||
                           rec.ticker?.toLowerCase() === "vbk" ||
                           rec.ticker?.toLowerCase() === "eem" ||
                           rec.ticker?.toLowerCase() === "vti" ||
                           rec.ticker?.toLowerCase() === "gld" ||
                           rec.ticker?.toLowerCase() === "agg";
        return !isAdultOnly;
      });
    }

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
                <p className="text-xs text-muted-foreground mt-2">
                  {riskProfile.risk_capacity === 'high' 
                    ? "Your strong savings rate and emergency fund give you financial flexibility to take on more risk."
                    : riskProfile.risk_capacity === 'medium'
                    ? "You have a solid foundation, but should balance growth with stability."
                    : "Focus on building your emergency fund before taking on significant investment risk."}
                </p>
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
                {userAge !== null && userAge < 18 ? (
                  <span className="text-warning font-semibold">
                    ⚠️ Age Restriction Notice: You must be 18+ to open brokerage and savings accounts. 
                    Consider a custodial account (UGMA/UTMA) with a parent or guardian, or focus on building savings until you turn 18.
                  </span>
                ) : (
                  `Diversified portfolio tailored to your ${riskProfile.recommended_profile} risk profile`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 && userAge !== null && userAge < 18 ? (
                <div className="p-6 text-center space-y-4 border border-border rounded-lg">
                  <AlertTriangle className="w-12 h-12 mx-auto text-warning" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Investment Restrictions for Minors</h3>
                    <p className="text-muted-foreground mb-4">
                      Most investment accounts require you to be at least 18 years old. However, you have options:
                    </p>
                    <div className="text-left space-y-3 max-w-2xl mx-auto">
                      <div className="p-3 bg-muted/50 rounded">
                        <strong>Custodial Accounts (UGMA/UTMA):</strong> A parent or guardian can open and manage an investment account 
                        on your behalf until you turn 18. Fidelity, Schwab, and Vanguard all offer these.
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <strong>High-Yield Savings (with Guardian):</strong> Some banks allow minors to open savings accounts with parental 
                        consent, helping you earn interest while building good financial habits.
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <strong>Focus on Learning:</strong> Use this time to learn about investing, follow the markets, and save money. 
                        When you turn 18, you'll be ready to invest confidently.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex flex-col gap-1 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{rec.name}</h3>
                            <Badge variant="secondary">{rec.allocation}</Badge>
                          </div>
                          {'ticker' in rec && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">{rec.ticker}</Badge>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <Progress value={parseInt(rec.allocation)} className="h-2 mt-2" />
                  </div>
                  ))}
                </div>
              )}
              {recommendations.length > 0 && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">💡 How to Actually Invest</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    You can buy these ETFs through any brokerage app like Fidelity, Vanguard, Schwab, or Robinhood. Search for the ticker symbol (e.g., "VOO") and purchase shares—most brokers now offer commission-free trading.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Pro tip:</strong> Set up automatic monthly investments (dollar-cost averaging) instead of trying to time the market. Investing $500/month consistently beats waiting for the "perfect" moment.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">💡 Understanding Diversification</h4>
                  <p className="text-sm text-muted-foreground">
                    Notice how your portfolio spreads across different asset types? This diversification means when tech stocks drop, your bonds might hold steady. When US markets struggle, international stocks might perform better. It's the financial equivalent of "don't put all your eggs in one basket."
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⚠️ Important Disclaimer</h4>
                  <p className="text-sm text-muted-foreground">
                    These specific investment recommendations are for educational purposes only and do not constitute financial advice. 
                    Always research thoroughly and consult with a qualified financial advisor before making investment decisions. Past 
                    performance does not guarantee future results. ETF expense ratios, holdings, and performance vary over time.
                  </p>
                </div>
                </div>
              )}
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
