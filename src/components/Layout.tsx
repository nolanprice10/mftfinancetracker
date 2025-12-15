import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Receipt, 
  Landmark, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  LogOut,
  Menu,
  X,
  Wallet,
  Settings as SettingsIcon,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Receipt, label: "Transactions", path: "/transactions" },
    { icon: Landmark, label: "Accounts", path: "/accounts" },
    { icon: Target, label: "Goals", path: "/goals" },
    { icon: TrendingUp, label: "Investments", path: "/investments" },
    { icon: Activity, label: "Risk", path: "/risk" },
    { icon: Lightbulb, label: "Recommendations", path: "/recommendations" },
    { icon: SettingsIcon, label: "Settings", path: "/settings" },
  ];

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Elegant Old Money Background - Rich Colors */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-amber-50/50 to-slate-100 dark:from-slate-900 dark:via-emerald-950/30 dark:to-slate-950 -z-10"></div>
      
      {/* Hunter Green Accent */}
      <div className="fixed inset-0 bg-gradient-to-tr from-emerald-900/5 via-transparent to-transparent dark:from-emerald-800/10 -z-10"></div>
      
      {/* Burgundy Accent */}
      <div className="fixed inset-0 bg-gradient-to-bl from-transparent via-transparent to-rose-900/5 dark:to-rose-950/10 -z-10"></div>
      
      {/* Herringbone Pattern */}
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

      {/* Elegant Damask-inspired Pattern */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.05] -z-10" 
           style={{
             backgroundImage: `radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
             backgroundSize: '50px 50px'
           }}>
      </div>

      {/* Art Deco Corner Accents */}
      <div className="fixed top-0 left-0 w-64 h-64 opacity-10 dark:opacity-20 -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full text-amber-700/30 dark:text-amber-400/20">
          <path d="M0,0 L60,0 L0,60 Z" fill="currentColor" />
          <path d="M0,0 L40,0 L0,40 Z" fill="currentColor" opacity="0.5" />
          <rect x="65" y="0" width="2" height="60" fill="currentColor" opacity="0.3" />
          <rect x="0" y="65" width="60" height="2" fill="currentColor" opacity="0.3" />
        </svg>
      </div>
      
      <div className="fixed bottom-0 right-0 w-64 h-64 opacity-10 dark:opacity-20 rotate-180 -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-800/30 dark:text-emerald-400/20">
          <path d="M0,0 L60,0 L0,60 Z" fill="currentColor" />
          <path d="M0,0 L40,0 L0,40 Z" fill="currentColor" opacity="0.5" />
          <rect x="65" y="0" width="2" height="60" fill="currentColor" opacity="0.3" />
          <rect x="0" y="65" width="60" height="2" fill="currentColor" opacity="0.3" />
        </svg>
      </div>

      {/* Gold Leaf Accent Orbs with Enhanced Animation */}
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/20 via-yellow-300/15 to-transparent dark:from-amber-600/25 dark:via-yellow-700/20 rounded-full blur-3xl animate-float-enhanced -z-10"></div>
      <div className="fixed bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-tr from-emerald-600/15 via-teal-500/12 to-transparent dark:from-emerald-400/20 dark:via-teal-300/15 rounded-full blur-3xl animate-float-delayed-enhanced -z-10"></div>
      <div className="fixed top-1/2 left-1/4 w-72 h-72 bg-gradient-to-bl from-rose-800/12 via-rose-600/8 to-transparent dark:from-rose-600/18 dark:via-rose-400/12 rounded-full blur-3xl animate-float-slow-enhanced -z-10"></div>
      
      {/* Subtle Leather Texture */}
      <div className="fixed inset-0 opacity-[0.015] dark:opacity-[0.025] mix-blend-overlay -z-10"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
           }}>
      </div>

      {/* Subtle Gold Border Frame Effect */}
      <div className="fixed inset-0 pointer-events-none -z-10">
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

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border shadow-glow">
              <div className="w-8 h-8 rounded-full bg-gradient-wealth flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-serif text-base tracking-wide leading-tight truncate-1">MyFinanceTracker</span>
              <span className="text-xs text-muted-foreground truncate-1">Curated wealth management</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        
        {mobileMenuOpen && (
          <div className="border-t border-border bg-card/80 backdrop-blur-md p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-w-0 ${
                    isActive
                      ? "bg-gradient-primary text-white shadow-md"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                    <span className="font-medium truncate-1">{item.label}</span>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:flex lg:flex-col lg:w-64 lg:h-screen bg-card/70 backdrop-blur-md border-r border-border/50 shadow-elegant z-40">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center border border-border shadow-glow">
              <div className="w-9 h-9 rounded-full bg-gradient-wealth flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-serif text-xl tracking-wider leading-tight truncate-1">MyFinanceTracker</span>
              <span className="text-xs text-muted-foreground truncate-1">Curated wealth management</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 min-w-0 ${
                  isActive
                    ? "bg-gradient-wealth text-white shadow-elegant"
                    : "hover:bg-muted/50 hover:translate-x-1"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium truncate-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-20 lg:pt-0 relative z-10">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
