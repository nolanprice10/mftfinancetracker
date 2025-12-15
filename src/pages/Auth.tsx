import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, Star, Quote } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Small Business Owner",
      content: "Finally, a finance tracker that actually makes sense! The intuitive design helped me understand my cash flow and grow my savings.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      content: "The investment portfolio tracking is exceptional. I can see all my investments in one place with clear insights.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Freelance Designer",
      content: "As someone with irregular income, the goal-setting feature keeps me motivated and the clean interface makes checking my finances enjoyable.",
      rating: 5
    },
    {
      name: "David Thompson",
      role: "Recent Graduate",
      content: "Perfect for someone just starting their financial journey. Simple enough to understand but powerful enough to grow with me.",
      rating: 5
    },
    {
      name: "Jennifer Martinez",
      role: "Marketing Manager",
      content: "Love the recommendations feature. It's like having a financial advisor in my pocket. Helped me optimize my spending habits.",
      rating: 4
    },
    {
      name: "Robert Kim",
      role: "Entrepreneur",
      content: "Clean interface, reliable tracking, and actually useful insights. Best finance app I've used for managing multiple income streams.",
      rating: 5
    }
  ];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto-cycle testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: fullName },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      
      if (data.user) {
        toast.success("Welcome! Your account has been created.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 md:p-8">
      {/* Elegant Old Money Background - Rich Colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-amber-50/50 to-slate-100 dark:from-slate-900 dark:via-emerald-950/30 dark:to-slate-950"></div>
      
      {/* Hunter Green Accent */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/5 via-transparent to-transparent dark:from-emerald-800/10"></div>
      
      {/* Burgundy Accent */}
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-rose-900/5 dark:to-rose-950/10"></div>
      
      {/* Herringbone Pattern */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
           style={{
             backgroundImage: `
               linear-gradient(45deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%),
               linear-gradient(-45deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%)
             `,
             backgroundSize: '30px 30px',
             backgroundPosition: '0 0, 15px 15px'
           }}>
      </div>

      {/* Elegant Damask-inspired Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{
             backgroundImage: `radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
             backgroundSize: '50px 50px'
           }}>
      </div>

      {/* Art Deco Corner Accents */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-10 dark:opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full text-amber-700/30 dark:text-amber-400/20">
          <path d="M0,0 L60,0 L0,60 Z" fill="currentColor" />
          <path d="M0,0 L40,0 L0,40 Z" fill="currentColor" opacity="0.5" />
          <rect x="65" y="0" width="2" height="60" fill="currentColor" opacity="0.3" />
          <rect x="0" y="65" width="60" height="2" fill="currentColor" opacity="0.3" />
        </svg>
      </div>
      
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 dark:opacity-20 rotate-180">
        <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-800/30 dark:text-emerald-400/20">
          <path d="M0,0 L60,0 L0,60 Z" fill="currentColor" />
          <path d="M0,0 L40,0 L0,40 Z" fill="currentColor" opacity="0.5" />
          <rect x="65" y="0" width="2" height="60" fill="currentColor" opacity="0.3" />
          <rect x="0" y="65" width="60" height="2" fill="currentColor" opacity="0.3" />
        </svg>
      </div>

      {/* Gold Leaf Accent Orbs with Enhanced Animation */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/20 via-yellow-300/15 to-transparent dark:from-amber-600/25 dark:via-yellow-700/20 rounded-full blur-3xl animate-float-enhanced"></div>
      <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-tr from-emerald-600/15 via-teal-500/12 to-transparent dark:from-emerald-400/20 dark:via-teal-300/15 rounded-full blur-3xl animate-float-delayed-enhanced"></div>
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-bl from-rose-800/12 via-rose-600/8 to-transparent dark:from-rose-600/18 dark:via-rose-400/12 rounded-full blur-3xl animate-float-slow-enhanced"></div>
      
      {/* Subtle Leather Texture */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025] mix-blend-overlay"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
           }}>
      </div>

      {/* Subtle Gold Border Frame Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-700/20 to-transparent dark:via-amber-400/30"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-700/20 to-transparent dark:via-amber-400/30"></div>
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-amber-700/20 to-transparent dark:via-amber-400/30"></div>
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-amber-700/20 to-transparent dark:via-amber-400/30"></div>
      </div>

      <style>{`
        @keyframes float-enhanced {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 1;
          }
          33% { 
            transform: translate(40px, -40px) scale(1.1); 
            opacity: 0.9;
          }
          66% { 
            transform: translate(-30px, 30px) scale(0.9); 
            opacity: 0.85;
          }
        }
        @keyframes float-delayed-enhanced {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 1;
          }
          33% { 
            transform: translate(-40px, 40px) scale(0.9); 
            opacity: 0.85;
          }
          66% { 
            transform: translate(30px, -30px) scale(1.1); 
            opacity: 0.9;
          }
        }
        @keyframes float-slow-enhanced {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg); 
            opacity: 1;
          }
          50% { 
            transform: translate(25px, -35px) scale(1.05) rotate(5deg); 
            opacity: 0.9;
          }
        }
        .animate-float-enhanced {
          animation: float-enhanced 12s ease-in-out infinite;
        }
        .animate-float-delayed-enhanced {
          animation: float-delayed-enhanced 15s ease-in-out infinite;
        }
        .animate-float-slow-enhanced {
          animation: float-slow-enhanced 18s ease-in-out infinite;
        }
      `}</style>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Auth Card */}
        <Card className="w-full shadow-elegant border-border">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-primary rounded-2xl shadow-glow">
                <Wallet className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              MyFinanceTracker
            </CardTitle>
            <CardDescription>
              Manage your finances with confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              {!showForgotPassword ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input
                      id="email-signin"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Password</Label>
                    <Input
                      id="password-signin"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-reset">Email</Label>
                    <Input
                      id="email-reset"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Back to sign in
                  </Button>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    placeholder="Choose a secure password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Testimonials Section - Below Auth */}
      <div className="space-y-4 animate-fade-in">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Trusted by users
          </h3>
          <p className="text-sm text-muted-foreground">
            Real experiences from our community
          </p>
        </div>

        <div className="relative">
          <Card className="shadow-md border-border/50 overflow-hidden">
            <CardContent className="pt-4 pb-4">
              <div key={currentTestimonial} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex gap-1 mb-2">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="relative">
                  <Quote className="absolute -top-1 -left-1 h-5 w-5 text-muted-foreground/20" />
                  <p className="text-sm text-foreground/90 leading-relaxed pl-4 min-h-[60px]">
                    {testimonials[currentTestimonial].content}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="font-semibold text-sm">{testimonials[currentTestimonial].name}</p>
                  <p className="text-xs text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? 'w-6 bg-primary' 
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Auth;
