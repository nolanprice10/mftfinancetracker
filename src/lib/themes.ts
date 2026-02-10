export interface Theme {
  id: string;
  name: string;
  description: string;
  locked: boolean;
  requiredReward?: 'custom_themes' | 'all_features';
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    gradient: string;
  };
}

export const themes: Theme[] = [
  {
    id: "classic-estate",
    name: "Classic Estate",
    description: "Restrained, institutional, and timeless",
    locked: false,
    colors: {
      primary: "210 47% 23%", // Navy
      primaryForeground: "39 50% 90%", // Cream
      secondary: "31 20% 57%", // Taupe
      accent: "0 44% 34%", // Burgundy
      background: "39 50% 90%", // Cream
      card: "39 50% 90%",
      gradient: "linear-gradient(135deg, #1F3B57 0%, #274C3B 55%, #A8937D 100%)"
    }
  },
  {
    id: "library-study",
    name: "Library Study",
    description: "Quiet focus with academic heritage",
    locked: false,
    colors: {
      primary: "0 0% 17%", // Charcoal
      primaryForeground: "40 23% 95%", // Off-white
      secondary: "41 42% 59%", // Antique gold
      accent: "88 18% 35%", // Moss green
      background: "40 23% 95%", // Off-white
      card: "35 30% 79%", // Warm beige
      gradient: "linear-gradient(135deg, #2B2B2B 0%, #5B6A4A 55%, #C2A66B 100%)"
    }
  },
  {
    id: "coastal-club",
    name: "Coastal Club",
    description: "Maritime tradition and quiet refinement",
    locked: true,
    requiredReward: 'custom_themes',
    colors: {
      primary: "182 45% 22%", // Deep teal
      primaryForeground: "46 37% 85%", // Oat
      secondary: "40 29% 69%", // Sand
      accent: "31 16% 48%", // Driftwood
      background: "46 37% 85%", // Oat
      card: "40 29% 69%", // Sand
      gradient: "linear-gradient(135deg, #1F4F51 0%, #60707A 55%, #C7B89A 100%)"
    }
  },
  {
    id: "winter-manor",
    name: "Winter Manor",
    description: "Midnight blues and heritage woods",
    locked: true,
    requiredReward: 'custom_themes',
    colors: {
      primary: "221 51% 16%", // Midnight blue
      primaryForeground: "34 30% 89%", // Linen
      secondary: "35 25% 61%", // Oxford tan
      accent: "14 37% 30%", // Mahogany
      background: "34 30% 89%", // Linen
      card: "34 30% 89%",
      gradient: "linear-gradient(135deg, #14213D 0%, #6A3E31 55%, #B49F82 100%)"
    }
  },
  {
    id: "academic-tradition",
    name: "Academic Tradition",
    description: "Ink, paper, and formal discipline",
    locked: true,
    requiredReward: 'all_features',
    colors: {
      primary: "0 0% 10%", // Ink black
      primaryForeground: "0 0% 100%", // Paper white
      secondary: "36 37% 63%", // Sepia
      accent: "0 100% 27%", // Deep red
      background: "0 0% 100%", // Paper white
      card: "0 0% 100%",
      gradient: "linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 55%, #C3A77E 100%)"
    }
  }
];

export const getThemeById = (id: string): Theme | undefined => {
  return themes.find(theme => theme.id === id);
};

export const getFreeThemes = (): Theme[] => {
  return themes.filter(theme => !theme.locked);
};

export const getLockedThemes = (): Theme[] => {
  return themes.filter(theme => theme.locked);
};
