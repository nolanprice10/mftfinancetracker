import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO 
        title="Page Not Found"
        description="The page you are looking for could not be found. Return to MyFinanceTracker to continue managing your wealth with institutional-grade analytics."
        canonicalUrl="/404"
        noIndex
      />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50/40 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-border/50 bg-card/90 backdrop-blur p-8 text-center shadow-elegant">
        <h1 className="mb-3 text-4xl font-bold">404 - Page Not Found</h1>
        <p className="mb-6 text-lg text-muted-foreground">The page you requested does not exist or has moved.</p>
        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default NotFound;
