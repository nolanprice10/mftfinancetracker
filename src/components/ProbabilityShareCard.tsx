import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ProbabilityShareCardProps {
  probability: number;
  goalName: string;
  percentile?: number;
  referralCode?: string;
}

export const ProbabilityShareCard = ({
  probability,
  goalName,
  percentile,
  referralCode
}: ProbabilityShareCardProps) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const probabilityMessage = () => {
    if (probability >= 75) return "I'm on track to hit my goal";
    if (probability >= 50) return "I have a real shot at my goal";
    return "I know exactly what it takes to hit my goal";
  };

  const sharableLink = referralCode 
    ? `${window.location.origin}/auth?ref=${referralCode}&goal=${encodeURIComponent(goalName)}`
    : `${window.location.origin}/compare?probability=${probability}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check My Financial Probability",
          text: `${probabilityMessage()} — ${probability}% chance using MyFinanceTracker`,
          url: sharableLink
        });
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          console.error("Share failed:", err);
        }
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharableLink);
    setLinkCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setLinkCopied(false), 2000);

    // Track sharing action
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'copy_link',
        content_type: 'probability_result'
      });
    }
  };

  return (
    <>
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">Share & Compare</CardTitle>
          <CardDescription>See how you stack up against others</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Share Value Prop */}
          <div className="bg-background rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-muted-foreground">Your message:</p>
            <p className="text-base font-semibold mt-2">
              "{probabilityMessage()}"
            </p>
            <p className="text-2xl font-bold text-primary mt-3">{probability}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Probability of hitting {goalName}
            </p>
          </div>

          {/* Percentile Rank */}
          {percentile !== undefined && (
            <div className="bg-success/10 rounded-lg p-4 border border-success/20 flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  You're in the top {percentile}% of users
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on your financial probability for this goal
                </p>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleShare}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </Button>
            <Button 
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          {/* Comparison CTA */}
          <Button 
            onClick={() => setShowComparison(true)}
            variant="ghost"
            size="sm"
            className="w-full text-primary hover:bg-primary/10"
          >
            Compare with a friend's goal →
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Modal */}
      {showComparison && (
        <ComparisonPrompt 
          onClose={() => setShowComparison(false)}
          referralCode={referralCode}
        />
      )}
    </>
  );
};

interface ComparisonPromptProps {
  onClose: () => void;
  referralCode?: string;
}

function ComparisonPrompt({ onClose, referralCode }: ComparisonPromptProps) {
  const [friendProbability, setFriendProbability] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [userProbability, setUserProbability] = useState(0);

  const handleCompare = () => {
    const friendProb = parseFloat(friendProbability);
    if (isNaN(friendProb) || friendProb < 0 || friendProb > 100) {
      toast.error("Please enter a valid probability (0-100)");
      return;
    }
    setUserProbability(friendProb);
    setShowResult(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle>Compare Financial Odds</CardTitle>
          <CardDescription>
            {showResult 
              ? "Here's how you compare"
              : "What's your friend's probability?"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showResult ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Friend's Probability</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={friendProbability}
                  onChange={(e) => setFriendProbability(e.target.value)}
                  placeholder="e.g., 62"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCompare}
                  className="flex-1"
                  disabled={!friendProbability}
                >
                  Compare
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">You</p>
                  <p className="text-3xl font-bold text-primary">+{friendProbability}%</p>
                  <p className="text-xs text-muted-foreground mt-2">ahead of your friend</p>
                </div>
                {referralCode && (
                  <p className="text-xs text-muted-foreground text-center">
                    Share your link to bring them along: <span className="font-mono text-xs">/ref={referralCode}</span>
                  </p>
                )}
              </div>
              <Button 
                onClick={onClose}
                className="w-full"
              >
                Got it
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
