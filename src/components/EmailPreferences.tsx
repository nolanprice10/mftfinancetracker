import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle2, Clock } from 'lucide-react';

interface EmailPreferences {
  receive_email_updates: boolean;
  email_frequency: 'weekly' | 'monthly' | 'none';
  monthly_digest_day: number;
  last_email_sent_date: string | null;
  email_verified: boolean;
}

export function EmailPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  async function loadPreferences() {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('receive_email_updates, email_frequency, monthly_digest_day, last_email_sent_date, email_verified')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setPreferences({
        receive_email_updates: data?.receive_email_updates ?? true,
        email_frequency: data?.email_frequency ?? 'monthly',
        monthly_digest_day: data?.monthly_digest_day ?? 1,
        last_email_sent_date: data?.last_email_sent_date,
        email_verified: data?.email_verified ?? false,
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    if (!user?.id || !preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          receive_email_updates: preferences.receive_email_updates,
          email_frequency: preferences.email_frequency,
          monthly_digest_day: preferences.monthly_digest_day,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Email preferences updated successfully',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load preferences</p>
        </CardContent>
      </Card>
    );
  }

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Manage how we keep you updated on your financial goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Verification Status */}
        {preferences.email_verified ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Email verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Please verify your email to receive updates</span>
          </div>
        )}

        {/* Last Email Sent */}
        {preferences.last_email_sent_date && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Last email sent: <strong>{new Date(preferences.last_email_sent_date).toLocaleDateString()}</strong>
            </p>
          </div>
        )}

        {/* Email Updates Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Receive Email Updates</p>
            <p className="text-sm text-muted-foreground mt-1">
              Get monthly summaries of your goal progress and actionable improvements
            </p>
          </div>
          <Switch
            checked={preferences.receive_email_updates}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, receive_email_updates: checked })
            }
            disabled={!preferences.email_verified}
          />
        </div>

        {preferences.receive_email_updates && (
          <>
            {/* Email Frequency */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Email Frequency</label>
              <Select
                value={preferences.email_frequency}
                onValueChange={(value) =>
                  setPreferences({
                    ...preferences,
                    email_frequency: value as 'weekly' | 'monthly' | 'none',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Updates</SelectItem>
                  <SelectItem value="monthly">Monthly Summary</SelectItem>
                  <SelectItem value="none">No Updates (Unsubscribe)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how often you'd like to hear about your progress
              </p>
            </div>

            {/* Monthly Digest Day */}
            {preferences.email_frequency === 'monthly' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Send Digest On</label>
                <Select
                  value={preferences.monthly_digest_day.toString()}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, monthly_digest_day: parseInt(value, 10) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Day {day} of each month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Your monthly digest will be sent on this day of the month
                </p>
              </div>
            )}
          </>
        )}

        {/* What You'll Receive */}
        {preferences.receive_email_updates && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">You'll receive:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>💰 <strong>Probability Updates:</strong> How your goal success rate changed</li>
              <li>📊 <strong>Progress Summary:</strong> Current savings vs. targets</li>
              <li>💡 <strong>Action Items:</strong> One specific change to improve your odds</li>
              <li>🎯 <strong>Goal Insights:</strong> Analysis of your financial progress</li>
            </ul>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-2 pt-4">
          <Button onClick={savePreferences} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button variant="outline" onClick={loadPreferences} disabled={saving}>
            Reset
          </Button>
        </div>

        {/* Unsubscribe Info */}
        <p className="text-xs text-muted-foreground text-center">
          You can update these settings anytime or click the unsubscribe link in any email
        </p>
      </CardContent>
    </Card>
  );
}
