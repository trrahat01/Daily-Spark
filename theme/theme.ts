import { buildTheme, ColorScheme, AccentTheme } from "./colors";

/** Convenience themed values (shadows, radii, typography scale). */
export const spacing = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28 };
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const type = {
  h1: { fontSize: 30, lineHeight: 36 },
  h2: { fontSize: 22, lineHeight: 28 },
  body: { fontSize: 15, lineHeight: 23 },
  small: { fontSize: 13, lineHeight: 18 },
};

export function makeTheme(scheme: ColorScheme, accent: AccentTheme) {
  const colors = buildTheme(scheme, accent);
  const shadow =
    scheme === "dark"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 6,
        }
      : {
          shadowColor: "#1A1C20",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 3,
        };
  return { colors, shadow, spacing, radius, type, scheme, accent };
}

export type AppTheme = ReturnType<typeof makeTheme>;