const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

const typography = {
  h1: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  h2: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
};

const lightTokens = {
  colors: {
    background: {
      primary: "#ECEDEF",
      secondary: "#E4E5E7",
    },
    surface: {
      1: "#F5F5F6",
      2: "#E9EAEC",
    },
    text: {
      primary: "#1D1F23",
      secondary: "#4A4D53",
      muted: "#7C8088",
    },
    brand: {
      primary: "#1F8F53",
      accent: "#1F8F53",
    },
    status: {
      success: "#1F8F53",
      warning: "#F6CF00",
      error: "#CB3434",
    },
    border: {
      default: "#C8CBD0",
    },
  },
};

const darkTokens = {
  colors: {
    background: {
      primary: "#0F141C",
      secondary: "#17202B",
    },
    surface: {
      1: "#1D2835",
      2: "#243244",
    },
    text: {
      primary: "#EAF0F8",
      secondary: "#BCC6D3",
      muted: "#97A4B5",
    },
    brand: {
      primary: "#44B877",
      accent: "#44B877",
    },
    status: {
      success: "#44B877",
      warning: "#F7D655",
      error: "#EF7777",
    },
    border: {
      default: "#314456",
    },
  },
};

function buildTheme(tokens) {
  return {
    tokens,
    spacing,
    radii,
    typography,
    colors: {
      background: tokens.colors.background.primary,
      surface: tokens.colors.surface[1],
      surfaceAlt: tokens.colors.surface[2],
      text: tokens.colors.text.primary,
      textSecondary: tokens.colors.text.secondary,
      textMuted: tokens.colors.text.muted,
      border: tokens.colors.border.default,
      primary: tokens.colors.brand.primary,
      accent: tokens.colors.brand.accent,
      primaryText: "#FFFFFF",
      success: tokens.colors.status.success,
      danger: tokens.colors.status.error,
      warning: tokens.colors.status.warning,
      strongSurface: tokens === lightTokens ? "#121418" : "#0A0E13",
      strongSurfaceText: "#FFFFFF",
      accentSoft: tokens === lightTokens ? "#D6EBDD" : "#234437",
      iconBubble: tokens === lightTokens ? "#8DD9B5" : "#2D6C52",
      tierBronze: tokens === lightTokens ? "#D88A34" : "#E09A4A",
    },
  };
}

export const lightTheme = buildTheme(lightTokens);
export const darkTheme = buildTheme(darkTokens);
