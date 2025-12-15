// Global theme initializer - runs on app load without blocking render
import { supabase } from '@/integrations/supabase/client';
import { getThemeById } from '@/lib/themes';

const applyTheme = (themeId: string) => {
  const theme = getThemeById(themeId);
  if (!theme) return;

  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (key !== 'gradient') {
      root.style.setProperty(`--${key}`, value);
    }
  });

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
    }
  } catch (error) {
    console.error('Failed to initialize theme:', error);
  }
};

// Initialize theme immediately
initializeTheme();
