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
    id: "emerald-gold",
    name: "Sage & Champagne",
    description: "Timeless old money elegance",
    locked: false,
    colors: {
      primary: "145 25 55", // Soft sage green
      primaryForeground: "39 15 8",
      secondary: "45 30 85",
      accent: "45 40 70",
      background: "39 30 98", // Cream background
      card: "39 25 96",
      gradient: "linear-gradient(135deg, #b4c7a4 0%, #a8ba96 50%, #9aac89 100%)"
    }
  },
  {
    id: "navy-silver",
    name: "Dusty Blue & Pearl",
    description: "Refined aristocratic charm",
    locked: false,
    colors: {
      primary: "210 25 60", // Dusty blue
      primaryForeground: "210 8 15",
      secondary: "220 15 85",
      accent: "215 20 75",
      background: "220 20 96", // Pearl white
      card: "220 15 94",
      gradient: "linear-gradient(135deg, #8fa4b8 0%, #7d95ab 50%, #6b869e 100%)"
    }
  },
  {
    id: "burgundy-cream",
    name: "Mauve & Ivory",
    description: "Vintage romantic luxury",
    locked: true,
    requiredReward: 'custom_themes',
    colors: {
      primary: "330 30 55", // Soft mauve
      primaryForeground: "30 10 12",
      secondary: "340 25 75",
      accent: "330 35 65",
      background: "40 35 97", // Warm ivory
      card: "40 30 95",
      gradient: "linear-gradient(135deg, #c4a4a7 0%, #b89599 50%, #ac868a 100%)"
    }
  },
  {
    id: "forest-amber",
    name: "Moss & Cashmere",
    description: "Understated natural wealth",
    locked: true,
    requiredReward: 'custom_themes',
    colors: {
      primary: "95 25 50", // Soft moss
      primaryForeground: "45 12 10",
      secondary: "40 30 80",
      accent: "90 30 60",
      background: "45 25 96", // Cashmere beige
      card: "45 20 94",
      gradient: "linear-gradient(135deg, #a5b496 0%, #96a788 50%, #879a7a 100%)"
    }
  },
  {
    id: "royal-purple",
    name: "Lavender & Silk",
    description: "Regal pastel prestige",
    locked: true,
    requiredReward: 'custom_themes',
    colors: {
      primary: "270 30 65", // Soft lavender
      primaryForeground: "270 10 15",
      secondary: "280 20 80",
      accent: "265 35 70",
      background: "280 25 97", // Silky white
      card: "280 20 95",
      gradient: "linear-gradient(135deg, #b8a8c9 0%, #a898bb 50%, #9888ad 100%)"
    }
  },
  {
    id: "slate-teal",
    name: "Seafoam & Linen",
    description: "Coastal old money",
    locked: true,
    requiredReward: 'all_features',
    colors: {
      primary: "170 25 60", // Soft seafoam
      primaryForeground: "170 10 12",
      secondary: "180 20 82",
      accent: "165 30 65",
      background: "180 18 96", // Natural linen
      card: "180 15 94",
      gradient: "linear-gradient(135deg, #9bb8b3 0%, #8aaba6 50%, #799e99 100%)"
    }
  },
  {
    id: "bronze-black",
    name: "Taupe & Gold",
    description: "Muted sophistication",
    locked: true,
    requiredReward: 'all_features',
    colors: {
      primary: "35 20 55", // Soft taupe
      primaryForeground: "35 8 10",
      secondary: "45 25 75",
      accent: "40 30 65",
      background: "35 15 96", // Warm off-white
      card: "35 12 94",
      gradient: "linear-gradient(135deg, #b8a894 0%, #ab9b87 50%, #9e8e7a 100%)"
    }
  },
  {
    id: "crimson-gold",
    name: "Blush & Champagne",
    description: "Delicate opulence",
    locked: true,
    requiredReward: 'all_features',
    colors: {
      primary: "350 30 70", // Soft blush
      primaryForeground: "350 10 15",
      secondary: "45 35 85",
      accent: "355 35 75",
      background: "45 25 97", // Champagne
      card: "45 20 95",
      gradient: "linear-gradient(135deg, #d4b8b8 0%, #c8abab 50%, #bc9e9e 100%)"
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
