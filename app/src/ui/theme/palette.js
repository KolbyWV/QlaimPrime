const shared = {
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 18,
  },
};

export const lightTheme = {
  ...shared,
  colors: {
    background: "#F4F7FB",
    surface: "#FFFFFF",
    surfaceAlt: "#ECF2F8",
    text: "#132130",
    textMuted: "#5D6B7A",
    border: "#D1DCE8",
    primary: "#0F6E8D",
    primaryText: "#FFFFFF",
    success: "#147D52",
    danger: "#C93535",
    warning: "#B87400",
  },
};

export const darkTheme = {
  ...shared,
  colors: {
    background: "#0D1620",
    surface: "#152332",
    surfaceAlt: "#1C2E41",
    text: "#E6EFF8",
    textMuted: "#9EB0C5",
    border: "#2B425A",
    primary: "#4AB4D8",
    primaryText: "#062533",
    success: "#57D08A",
    danger: "#F57070",
    warning: "#F3C15B",
  },
};
