export const designTokens = {
  colors: {
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#2563eb',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0ea5e9',
    surface: '#ffffff',
    background: '#f8fafc',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    muted: '#94a3b8',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
  },
  shadows: {
    card: {
      elevation: 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    floating: {
      elevation: 4,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
    },
    modal: {
      elevation: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
    },
  },
  typography: {
    title: 24,
    subtitle: 17,
    body: 14,
    caption: 12,
    metric: 26,
  },
  layout: {
    sidebarWidth: 248,
    drawerWidthMobile: 280,
    drawerWidthTablet: 320,
    contentMaxWidth: 1240,
    cardGap: 14,
    pagePaddingDesktop: 24,
    pagePaddingTablet: 18,
    pagePaddingMobile: 14,
  },
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    desktopWide: 1200,
  },
} as const;

export type ViewVariant = 'admin' | 'operator' | 'seller' | 'supervisor' | 'noAccess' | 'default';

export const viewVariants: Record<
  ViewVariant,
  {
    tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
    density: 'compact' | 'comfortable' | 'touch';
    emphasis: 'admin' | 'operational' | 'monitoring' | 'support' | 'blocked' | 'default';
  }
> = {
  admin: { tone: 'info', density: 'compact', emphasis: 'admin' },
  operator: { tone: 'success', density: 'touch', emphasis: 'operational' },
  seller: { tone: 'info', density: 'touch', emphasis: 'support' },
  supervisor: { tone: 'warning', density: 'comfortable', emphasis: 'monitoring' },
  noAccess: { tone: 'danger', density: 'comfortable', emphasis: 'blocked' },
  default: { tone: 'neutral', density: 'comfortable', emphasis: 'default' },
};
