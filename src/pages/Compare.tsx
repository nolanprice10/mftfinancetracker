import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { TrendingUp, Share2, ArrowRight } from "lucide-react";
import { calculatePercentile, getPercentileDescription } from "@/lib/percentile";
import { toast } from "sonner";

const Compare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [userProbability, setUserProbability] = useState<number | null>(null);
  const [friendProbability, setFriendProbability] = useState<number | null>(null);
  const [userPercentile, setUserPercentile] = useState<number | null>(null);
  const [friendPercentile, setFriendPercentile] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Get user's probability if logged in
        if (user) {
          const { data: goals } = await supabase
            .from("goals")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (goals && goals.length > 0) {
            // Simulate getting probability from last goal
            // In production, you'd calculate this real-time
            const simulated = Math.floor(Math.random() * 100) + 30; // Random 30-100
            setUserProbability(simulated);
            setUserPercentile(calculatePercentile(simulated));
          }
        }

        // Get friend's probability from URL params
        const friendProb = searchParams.get("probability");
        if (friendProb) {
          const prob = parseInt(friendProb);
          if (!isNaN(prob) && prob >= 0 && prob <= 100) {
            setFriendProbability(prob);
            setFriendPercentile(calculatePercentile(prob));
          }
        }
      } catch (error) {
        console.error("Error loading comparison:", error);
        toast.error("Failed to load comparison");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [searchParams]);

  const getDifference = () => {
    if (userProbability === null || friendProbability === null) return null;
    return Math.abs(userProbability - friendProbability);
  };

  const getWinner = () => {
    if (userProbability === null || friendProbability === null) return null;
    return userProbability > friendProbability ? "you" : "friend";
  };

  if (loading || !friendProbability) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 text-center">
          <p className="text-lg text-muted-foreground">Loading comparison...</p>
        </div>
      </Layout>
    );
  }

  const difference = getDifference();
  const winner = getWinner();
  const friendCatchUp = userProbability 
    ? Math.max(0, 75 - friendProbability)
    : null;

  return (
    <Layout>
      <SEO 
        title="Compare Financial Probabilities"
        description="See how your financial goal probability compares with others"
        canonicalUrl="/compare"
      />
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">
            How you stack up
          </h1>
          <p className="text-lg text-muted-foreground">
            See the difference between your financial goals
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* You */}
          {userProbability !== null && (
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-center">You</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-5xl md:text-6xl font-bold text-primary">
                    {userProbability}%
                  </div>
                  <p className="text-muted-foreground">Probability of success</p>
                </div>

                {userPercentile !== null && (
                  <div className="bg-background rounded-lg p-4 text-center border border-primary/20">
                    <p className="text-2xl font-bold text-primary">
                      Top {userPercentile}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getPercentileDescription(userPercentile)}
                    </p>
                  </div>
                )}

                {userProbability >= 75 && (
                  <div className="bg-success/10 rounded-lg p-3 text-center border border-success/20">
                    <p className="text-sm font-semibold text-success">
                      ✓ You're on track!
                    </p>
                  </div>
                )}

                {userProbability < 75 && (
                  <div className="bg-warning/10 rounded-lg p-3 text-center border border-warning/20">
                    <p className="text-sm font-semibold text-warning">
                      Keep improving
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Friend/Comparison */}
          {friendProbability !== null && (
            <Card className="border-2 border-foreground/20 bg-gradient-to-br from-foreground/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-center">Your friend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-5xl md:text-6xl font-bold text-foreground">
                    {friendProbability}%
                  </div>
                  <p className="text-muted-foreground">Probability of success</p>
                </div>

                {friendPercentile !== null && (
                  <div className="bg-background rounded-lg p-4 text-center border border-foreground/20">
                    <p className="text-2xl font-bold text-foreground">
                      Top {friendPercentile}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getPercentileDescription(friendPercentile)}
                    </p>
                  </div>
                )}

                {friendProbability >= 75 && (
                  <div className="bg-success/10 rounded-lg p-3 text-center border border-success/20">
                    <p className="text-sm font-semibold text-success">
                      ✓ They're on track!
                    </p>
                  </div>
                )}

                {friendProbability < 75 && (
                  <div className="bg-warning/10 rounded-lg p-3 text-center border border-warning/20">
                    <p className="text-sm font-semibold text-warning">
                      Room to improve
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Comparison Insight */}
        {userProbability !== null && friendProbability !== null && difference !== null && (
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle>The difference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">
                  +{difference}%
                </div>
                <p className="text-lg">
                  {winner === "you" 
                    ? "You're ahead of your friend"
                    : "Your friend has a higher probability"}
                </p>
              </div>

              {winner === "friend" && friendCatchUp && (
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Your path to close the gap:
                  </p>
                  <p className="text-lg font-semibold">
                    Increase monthly savings by ${friendCatchUp.toLocaleString()}
                  </p>
                </div>
              )}

              {winner === "you" && (
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    You're doing something right. Keep it up!
                  </p>
                  <p className="flex items-center justify-center gap-2 text-sm font-semibold text-success">
                    <TrendingUp className="h-4 w-4" />
                    You're outpacing them
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CTA to get started */}
        {!userProbability && (
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="pt-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">
                  Calculate your own probability
                </h2>
                <p className="text-muted-foreground">
                  Get your financial probability and start comparing with friends
                </p>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-wealth"
                  size="lg"
                >
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Share your result CTA */}
        {userProbability !== null && (
          <div className="text-center pt-4">
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share your probability
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Compare;
