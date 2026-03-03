// Global theme initializer - runs on app load without blocking render
import { supabase } from '@/integrations/supabase/client';
import { getThemeById } from '@/lib/themes';

const defaultThemeId = 'classic-estate';

const applyTheme = (themeId: string) => {
  const theme = getThemeById(themeId);
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
  root.style.setProperty('--secondary', theme.colors.secondary);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.removeProperty('--background');
  root.style.removeProperty('--card');

  root.style.setProperty('--gradient-wealth', theme.colors.gradient);
  root.style.setProperty('--gradient-primary', theme.colors.gradient);
};

export const initializeTheme = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        applyTheme(savedTheme);
      } else {
        applyTheme(defaultThemeId);
      }
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('theme')
      .eq('id', user.id)
      .single();

    const themeValue = (profile as any)?.theme;
    if (themeValue) {
      applyTheme(themeValue);
    } else {
      applyTheme(defaultThemeId);
    }
  } catch (error) {
    console.error('Failed to initialize theme:', error);
  }
};

// Initialize theme immediately
initializeTheme();
