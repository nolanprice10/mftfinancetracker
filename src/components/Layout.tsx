import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  BarChart3,
  CreditCard,
  Landmark,
  LineChart,
  LogOut,
  Menu,
  Scale,
  Settings as SettingsIcon,
  Target,
  TrendingUp,
  X
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
    { icon: LineChart, label: "Dashboard", path: "/dashboard" },
    { icon: CreditCard, label: "Transactions", path: "/transactions" },
    { icon: Landmark, label: "Accounts", path: "/accounts" },
    { icon: Target, label: "Goals", path: "/goals" },
    { icon: TrendingUp, label: "Investments", path: "/investments" },
    { icon: Scale, label: "Risk", path: "/risk" },
    { icon: BarChart3, label: "Recommendations", path: "/recommendations" },
    { icon: SettingsIcon, label: "Settings", path: "/settings" },
  ];

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Clean background with subtle texture */}
      <div className="fixed inset-0 bg-background -z-10"></div>
      <div
        className="fixed inset-0 opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay -z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      ></div>
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-border/60"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border/60"></div>
        <div className="absolute top-0 bottom-0 left-0 w-px bg-border/60"></div>
        <div className="absolute top-0 bottom-0 right-0 w-px bg-border/60"></div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border shadow-glow">
              <div className="w-8 h-8 rounded-full bg-gradient-wealth flex items-center justify-center">
                <Landmark className="h-4 w-4 text-white" />
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
                <Landmark className="h-5 w-5 text-white" />
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
