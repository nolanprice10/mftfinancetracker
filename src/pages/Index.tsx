import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          return;
        }
        
        if (session) {
          navigate("/dashboard");
        } else {
          navigate("/auth");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };
    checkAuth();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: 'red', marginBottom: '10px' }}>Error</h1>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '20px', 
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div>Loading...</div>
    </div>
  );
};

export default Index;
