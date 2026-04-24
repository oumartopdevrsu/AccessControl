/**
 * Système de design RSU AccessControl.
 * Toutes les couleurs, espacements, rayons et ombres sont définis ici
 * pour garantir une cohérence visuelle dans toute l'application.
 *
 * Palette inspirée de l'identité visuelle du Registre Social Unique :
 *  - Bleu ciel  : mains du logo
 *  - Bleu marine : livre du logo / texte
 *  - Rouge / Vert / Or : drapeau du Burkina Faso
 */

// ─── Couleurs ───────────────────────────────────────────────────────────────

export const Colors = {
  // Bleu RSU (mains du logo – couleur principale)
  primary:      '#0288D1',
  primaryDark:  '#01579B',
  primaryLight: '#29B6F6',
  primaryFaint: '#E3F2FD',

  // Marine sombre (livre du logo – textes et titres)
  navy:      '#1A3060',
  navyLight: '#2C4E8A',

  // Drapeau du Burkina Faso
  flagRed:  '#D32F2F',
  flagGreen:'#2E7D32',
  flagGold: '#F9A825',

  // Arrière-plans
  background:      '#EEF6FD',
  surface:         '#FFFFFF',
  surfaceElevated: '#F5FAFF',

  // Bordures
  border:      '#BDD8EF',
  borderFaint: '#DDEEFF',

  // Textes
  textPrimary:   '#1A3060',
  textSecondary: '#546E7A',
  textMuted:     '#90A4AE',
  textOnPrimary: '#FFFFFF',

  // Statuts fonctionnels
  success:       '#2E7D32',
  successBg:     '#E8F5E9',
  successBorder: '#A5D6A7',

  error:       '#C62828',
  errorBg:     '#FFEBEE',
  errorBorder: '#EF9A9A',

  warning:       '#E65100',
  warningBg:     '#FFF3E0',
  warningBorder: '#FFCC80',

  info:       '#0277BD',
  infoBg:     '#E3F2FD',
  infoBorder: '#81D4FA',
};

// ─── Espacements ────────────────────────────────────────────────────────────

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

// ─── Rayons de bordure ───────────────────────────────────────────────────────

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

// ─── Tailles de police ───────────────────────────────────────────────────────

export const FontSize = {
  xs:  11,
  sm:  13,
  md:  15,
  lg:  17,
  xl:  20,
  xxl: 24,
  h1:  28,
} as const;

// ─── Ombres ──────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor:   '#01579B',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   '#01579B',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  8,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#01579B',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius:  16,
    elevation:     8,
  },
} as const;
