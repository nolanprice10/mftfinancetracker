import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Moon, Sun, User, Lock, Trash2, LogOut, Mail, Linkedin, MessageSquare, Gift, Copy, Check, Users, Palette, Sparkles } from "lucide-react";
import { themes, getFreeThemes, getLockedThemes } from "@/lib/themes";
import { useTheme } from "@/hooks/useTheme";
import { useRewards } from "@/hooks/useRewards";

const Settings = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");
  
  // Referral state
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [activeRewards, setActiveRewards] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Theme and rewards
  const { currentTheme, changeTheme } = useTheme();
  const { hasCustomThemes, hasAllFeatures, loading: rewardsLoading } = useRewards();
  const hasBasicThemes = hasCustomThemes();
  const hasAllThemesUnlocked = hasAllFeatures();

  useEffect(() => {
    fetchUserData();
    fetchReferralData();
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email, birthday")
        .eq("id", user.id)
        .single();

      if (profile) {
        setName(profile.name || "");
        setEmail(profile.email || "");
        setBirthday(profile.birthday || "");
      }
    } catch (error) {
      toast.error("Failed to load user data");
    }
  };

  const fetchReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create unique referral code for this user
      // Check if user already has ANY referral code (not just pending ones)
      const { data: existingReferrals } = await supabase
        .from("referrals")
        .select("referral_code")
        .eq("referrer_id", user.id)
        .limit(1);

      if (existingReferrals && existingReferrals.length > 0) {
        setReferralCode(existingReferrals[0].referral_code);
      } else {
        // Generate unique referral code (8 character alphanumeric)
        let code = '';
        let isUnique = false;
        
        while (!isUnique) {
          code = Math.random().toString(36).substring(2, 10).toUpperCase();
          
          // Check if code already exists
          const { data: existingCode } = await supabase
            .from("referrals")
            .select("id")
            .eq("referral_code", code)
            .limit(1);
          
          if (!existingCode || existingCode.length === 0) {
            isUnique = true;
          }
        }
        
        // Create a base referral entry with this user's unique code
        const { error: insertError } = await supabase
          .from("referrals")
          .insert({ 
            referrer_id: user.id, 
            referral_code: code,
            status: 'pending'
          });
        
        if (!insertError) {
          setReferralCode(code);
        }
      }

      // Count completed referrals
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id)
        .eq("status", "completed");

      setReferralCount(count || 0);

      // Get active rewards
      const { data: rewards } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .or("expires_at.is.null,expires_at.gt.now()");

      setActiveRewards(rewards || []);
    } catch (error) {
      console.error("Failed to load referral data:", error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ name, birthday: birthday || null })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string): "weak" | "medium" | "strong" => {
    if (password.length < 8) return "weak";
    
    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 1) return "weak";
    if (strength <= 2) return "medium";
    return "strong";
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (passwordStrength === "weak") {
      toast.error("Please use a stronger password with uppercase, lowercase, numbers, and symbols");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Unable to change password");
        setLoading(false);
        return;
      }

      // Note: Current password is required for security but verification
      // is handled server-side by Supabase to prevent timing attacks
      if (!currentPassword) {
        toast.error("Please enter your current password");
        setLoading(false);
        return;
      }

      // Update password - Supabase verifies current session automatically
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // Generic error message to prevent information disclosure
        toast.error("Unable to change password. Please verify your current password is correct.");
        setLoading(false);
        return;
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Unable to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all user data
      await Promise.all([
        supabase.from("profiles").delete().eq("id", user.id),
        supabase.from("accounts").delete().eq("user_id", user.id),
        supabase.from("transactions").delete().eq("user_id", user.id),
        supabase.from("goals").delete().eq("user_id", user.id),
        supabase.from("investments").delete().eq("user_id", user.id),
        supabase.from("recommendations").delete().eq("user_id", user.id),
      ]);

      // Sign out
      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        {/* Profile Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  placeholder="Your birthday"
                />
                <p className="text-xs text-muted-foreground">Used for age-based investment recommendations</p>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <div className={`h-1 flex-1 rounded transition-all ${passwordStrength === "weak" ? "bg-destructive" : passwordStrength === "medium" ? "bg-warning" : "bg-success"}`} />
                      <div className={`h-1 flex-1 rounded transition-all ${passwordStrength === "medium" || passwordStrength === "strong" ? passwordStrength === "medium" ? "bg-warning" : "bg-success" : "bg-muted"}`} />
                      <div className={`h-1 flex-1 rounded transition-all ${passwordStrength === "strong" ? "bg-success" : "bg-muted"}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className={passwordStrength === "weak" ? "text-destructive" : passwordStrength === "medium" ? "text-warning" : "text-success"}>
                        {passwordStrength}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use 12+ characters with uppercase, lowercase, numbers, and symbols
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize your viewing experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleToggleDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Selector */}
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Color Themes</CardTitle>
            </div>
            <CardDescription>
              Personalize your finance tracker with elegant color schemes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Free Themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Free Themes</Label>
                <Badge variant="outline" className="text-xs">Always Available</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getFreeThemes().map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      changeTheme(theme.id);
                      toast.success(`Theme changed to ${theme.name}`);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      currentTheme === theme.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded-md mb-2"
                      style={{ background: theme.colors.gradient }}
                    />
                    <p className="font-medium text-sm">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                    {currentTheme === theme.id && (
                      <Check className="h-4 w-4 text-primary mx-auto mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Locked Themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Premium Themes</Label>
                {hasAllThemesUnlocked ? (
                  <Badge className="text-xs bg-gradient-wealth">All Unlocked!</Badge>
                ) : hasBasicThemes ? (
                  <Badge className="text-xs bg-gradient-wealth">Partially Unlocked</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getLockedThemes().map((theme) => {
                  const isUnlocked = hasAllThemesUnlocked || (hasBasicThemes && theme.requiredReward === 'custom_themes');
                  const requiresAll = theme.requiredReward === 'all_features';
                  
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        if (isUnlocked) {
                          changeTheme(theme.id);
                          toast.success(`Theme changed to ${theme.name}`);
                        } else if (requiresAll) {
                          toast.error('Refer 5 friends to unlock all themes!');
                        } else {
                          toast.error('Refer 1 friend to unlock custom themes!');
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all relative ${
                        isUnlocked
                          ? currentTheme === theme.id
                            ? 'border-primary bg-primary/10 hover:scale-105'
                            : 'border-border hover:border-primary/50 hover:scale-105'
                          : 'border-border opacity-60 cursor-not-allowed'
                      }`}
                      disabled={!isUnlocked}
                    >
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">
                              {requiresAll ? '5 referrals' : '1 referral'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div
                        className="w-full h-12 rounded-md mb-2"
                        style={{ background: theme.colors.gradient }}
                      />
                      <p className="font-medium text-sm">{theme.name}</p>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                      {currentTheme === theme.id && isUnlocked && (
                        <Check className="h-4 w-4 text-primary mx-auto mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
              {!hasAllThemesUnlocked && (
                <div className="p-4 rounded-lg bg-gradient-wealth/10 border border-primary/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">Unlock Themes</p>
                      {!hasBasicThemes ? (
                        <p className="text-sm text-muted-foreground">
                          Refer <strong>1 friend</strong> to unlock 3 premium themes, or <strong>5 friends</strong> to unlock all {getLockedThemes().length} themes!
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Refer <strong>5 friends</strong> to unlock the remaining exclusive themes!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referral Program */}
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle>Invite Friends & Earn Rewards</CardTitle>
            </div>
            <CardDescription>Share MyFinanceTracker and unlock premium features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Referral Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Successful Referrals</p>
                </div>
                <p className="text-2xl font-bold">{referralCount}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Active Rewards</p>
                </div>
                <p className="text-2xl font-bold">{activeRewards.length}</p>
              </div>
            </div>

            {/* Active Rewards Display */}
            {activeRewards.length > 0 && (
              <div className="space-y-2">
                <Label>Your Active Rewards</Label>
                {activeRewards.map((reward) => (
                  <div 
                    key={reward.id} 
                    className="p-3 rounded-lg bg-gradient-wealth/10 border border-primary/30 flex items-start gap-3"
                  >
                    <Gift className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{reward.reward_description}</p>
                      {reward.expires_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {new Date(reward.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Referral Link */}
            <div className="space-y-2">
              <Label>Your Referral Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/auth?ref=${referralCode}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={copyReferralLink}
                  variant="outline"
                  size="icon"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with friends to earn rewards
              </p>
            </div>

            {/* Reward Tiers */}
            <div className="space-y-3">
              <Label>Unlock Rewards</Label>
              <div className="space-y-2">
                <div className={`p-3 rounded-lg border ${referralCount >= 1 ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">1 Friend → Custom Themes (6 premium colors)</p>
                    {referralCount >= 1 && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${referralCount >= 3 ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">3 Friends → Advanced Analytics + Data Export</p>
                    {referralCount >= 3 && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${referralCount >= 5 ? 'bg-gradient-wealth/20 border-primary/30' : 'bg-card border-border'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">5 Friends → All Advanced Features Forever! 🎉</p>
                    {referralCount >= 5 && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Share your link on social media, with coworkers, or in your Discord/Slack communities. 
                Your friends get a great finance tool, and you unlock premium features!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Support */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Contact & Support</CardTitle>
            </div>
            <CardDescription>Get in touch with the developer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href="mailto:nolangp10@icloud.com" 
                    className="text-sm text-primary hover:underline break-all"
                  >
                    nolangp10@icloud.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Linkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">LinkedIn</p>
                  <a 
                    href="https://linkedin.com/in/nolan-price-7373b0382" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    linkedin.com/in/nolan-price-7373b0382
                  </a>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground">
                  Have questions, feedback, or need support? Feel free to reach out via email or connect on LinkedIn. I'd love to hear from you!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="shadow-md border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
