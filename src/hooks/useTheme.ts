import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getThemeById } from '@/lib/themes';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<string>('emerald-gold');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Load from localStorage for non-authenticated users
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          applyTheme(savedTheme);
          setCurrentTheme(savedTheme);
        }
        setLoading(false);
        return;
      }

      // Load from database for authenticated users
      const { data: profile } = await supabase
        .from('profiles')
        .select('theme')
        .eq('id', user.id)
        .single();

      const themeValue = (profile as any)?.theme;
      if (themeValue) {
        applyTheme(themeValue);
        setCurrentTheme(themeValue);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (key !== 'gradient') {
        root.style.setProperty(`--${key}`, value);
      }
    });

    // Update gradient variable
    root.style.setProperty('--gradient-wealth', theme.colors.gradient);
    root.style.setProperty('--gradient-primary', theme.colors.gradient);
  };

  const changeTheme = async (themeId: string) => {
    try {
      applyTheme(themeId);
      setCurrentTheme(themeId);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Save to database for authenticated users
        await supabase
          .from('profiles')
          .update({ theme: themeId } as any)
          .eq('id', user.id);
      } else {
        // Save to localStorage for non-authenticated users
        localStorage.setItem('theme', themeId);
      }
    } catch (error) {
      console.error('Failed to change theme:', error);
      throw error;
    }
  };

  return {
    currentTheme,
    changeTheme,
    loading
  };
};
