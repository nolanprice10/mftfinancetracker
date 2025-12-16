import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import InvestmentCalculator from "@/components/InvestmentCalculator";
import { 
  Wallet, 
  TrendingUp, 
  Target, 
  PieChart, 
  BarChart3, 
  Lightbulb,
  Star,
  Quote,
  ArrowRight,
  CheckCircle2,
  Calculator
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Dr. James Patterson",
      role: "Quantitative Analyst, Hedge Fund",
      content: "As a quant, I'm impressed by the mathematical rigor behind the analytics. The portfolio optimization and risk metrics are institutional-grade.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Data Scientist & Investor",
      content: "Finally, a personal finance tool that respects my intelligence. The data-driven insights are what I'd expect from professional trading platforms.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Freelance Developer",
      content: "The compound interest calculator alone is worth it. Clean interface with the sophistication I need to manage multiple income streams.",
      rating: 5
    }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          navigate("/dashboard");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Auto-cycle testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Same elegant background as other pages */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-amber-50/50 to-slate-100 dark:from-slate-900 dark:via-emerald-950/30 dark:to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-gradient-to-tr from-emerald-900/5 via-transparent to-transparent dark:from-emerald-800/10 -z-10"></div>
      <div className="fixed inset-0 bg-gradient-to-bl from-transparent via-transparent to-rose-900/5 dark:to-rose-950/10 -z-10"></div>
      
      <div className="fixed inset-0 opacity-[0.04] dark:opacity-[0.06] -z-10" 
           style={{
             backgroundImage: `
               linear-gradient(45deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%),
               linear-gradient(-45deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%)
             `,
             backgroundSize: '30px 30px',
             backgroundPosition: '0 0, 15px 15px'
           }}>
      </div>

      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/20 via-yellow-300/15 to-transparent dark:from-amber-600/25 dark:via-yellow-700/20 rounded-full blur-3xl animate-float-enhanced -z-10"></div>
      <div className="fixed bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-tr from-emerald-600/15 via-teal-500/12 to-transparent dark:from-emerald-400/20 dark:via-teal-300/15 rounded-full blur-3xl animate-float-delayed-enhanced -z-10"></div>
      
      <style>{`
        @keyframes float-enhanced {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          33% { transform: translate(40px, -40px) scale(1.1); opacity: 0.9; }
          66% { transform: translate(-30px, 30px) scale(0.9); opacity: 0.85; }
        }
        @keyframes float-delayed-enhanced {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          33% { transform: translate(-40px, 40px) scale(0.9); opacity: 0.85; }
          66% { transform: translate(30px, -30px) scale(1.1); opacity: 0.9; }
        }
        .animate-float-enhanced {
          animation: float-enhanced 12s ease-in-out infinite;
        }
        .animate-float-delayed-enhanced {
          animation: float-delayed-enhanced 15s ease-in-out infinite;
        }
      `}</style>

      {/* Navigation */}
      <nav className="relative z-10 bg-card/70 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-wealth flex items-center justify-center shadow-glow">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-xl tracking-wider font-semibold">MyFinanceTracker</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-gradient-wealth">
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center space-y-6">
          <div className="flex justify-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Try our free investment calculator below ↓</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-wealth text-white shadow-glow">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">Quant Backed</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Stop Juggling Apps.
            </span>
            <br />
            <span className="text-foreground">See Your Complete Financial Picture</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tired of switching between 5 different apps to track your money? MyFinanceTracker brings all your accounts, investments, and goals into one elegant dashboard. <strong>Built with quantitative finance principles</strong> used by Wall Street professionals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-gradient-wealth text-lg px-8 py-6 shadow-elegant"
            >
              Start Tracking Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Free Calculator Hook - The Growth Driver */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-wealth text-white mb-4">
            <Calculator className="h-5 w-5" />
            <span className="font-semibold">FREE TOOL - No Signup Required</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Calculate Your Future Wealth
          </h2>
          <p className="text-muted-foreground">
            See exactly how much you could have by age 25 (or any age) if you start investing today
          </p>
        </div>
        
        <InvestmentCalculator />
      </section>

      {/* Social Proof Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-background"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-background"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 border-2 border-background"></div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-foreground">500+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </div>
          
          <div className="h-12 w-px bg-border hidden sm:block"></div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">$2.5M+</p>
            <p className="text-sm text-muted-foreground">Wealth Tracked</p>
          </div>
          
          <div className="h-12 w-px bg-border hidden sm:block"></div>
          
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center mb-1">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-sm text-muted-foreground">Rated 4.9/5</p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-elegant">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-8">
              You're Not Alone If You're Struggling With...
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                  <span className="text-2xl">😵</span>
                </div>
                <h3 className="font-semibold">App Overload</h3>
                <p className="text-sm text-muted-foreground">
                  Opening 5+ different banking and investment apps just to see where you stand financially
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-semibold">Messy Spreadsheets</h3>
                <p className="text-sm text-muted-foreground">
                  Manually updating Excel sheets that break every time you add a new account or goal
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                  <span className="text-2xl">🤷</span>
                </div>
                <h3 className="font-semibold">No Clear Picture</h3>
                <p className="text-sm text-muted-foreground">
                  Never knowing your real net worth or whether you're on track for your financial goals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-wealth/10 border border-primary/20 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Quantitative Finance Principles Applied</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for professionals who demand institutional-grade analytics
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-md hover:shadow-elegant transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unified Dashboard</h3>
              <p className="text-muted-foreground">
                See all your checking, savings, and credit accounts in one clean view
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-md hover:shadow-elegant transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quantitative Analytics</h3>
              <p className="text-muted-foreground">
                Track portfolios with institutional-grade metrics: Sharpe ratios, volatility analysis, and correlation matrices
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-md hover:shadow-elegant transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Goal Setting</h3>
              <p className="text-muted-foreground">
                Set savings targets, track progress, and stay motivated with visual milestones
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-md hover:shadow-elegant transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transaction History</h3>
              <p className="text-muted-foreground">
                Automatically categorize and track every transaction across all accounts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-md hover:shadow-elegant transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quantitative Risk Models</h3>
              <p className="text-muted-foreground">
                Portfolio optimization using Modern Portfolio Theory and Monte Carlo simulations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-md hover:shadow-elegant transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
              <p className="text-muted-foreground">
                AI-powered insights to optimize spending and grow your wealth faster
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Trusted by Professionals</h2>
          <p className="text-muted-foreground">See what our users are saying</p>
        </div>

        <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-elegant">
          <CardContent className="p-8">
            <div key={currentTestimonial} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex gap-1 mb-4 justify-center">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="relative max-w-2xl mx-auto">
                <Quote className="absolute -top-2 -left-2 h-8 w-8 text-muted-foreground/20" />
                <p className="text-lg text-center leading-relaxed px-8 min-h-[100px] flex items-center justify-center">
                  "{testimonials[currentTestimonial].content}"
                </p>
              </div>
              <div className="mt-6 text-center">
                <p className="font-semibold text-lg">{testimonials[currentTestimonial].name}</p>
                <p className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</p>
              </div>
            </div>
            
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-gradient-wealth shadow-elegant">
          <CardContent className="p-12 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Take Control?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join professionals who've simplified their financial lives
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
            >
              Start Tracking Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-card/70 backdrop-blur-md mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 MyFinanceTracker. Curated wealth management for the modern professional.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
