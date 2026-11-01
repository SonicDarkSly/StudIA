import type { ThemeMode } from './types';
import { theme, type ThemeConfig } from 'antd';

const PALETTE = {
  dark: { primary: '#a855f7', info: '#22d3ee', elevated: '#141029' },
  light: { primary: '#7c3aed', info: '#0891b2', elevated: '#ffffff' },
};

const BORDER_RADIUS = 12;
const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export const ACCENT_CYAN = PALETTE.dark.info;

export function antdTheme(mode: ThemeMode): ThemeConfig {
  const colors = PALETTE[mode];
  return {
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: colors.primary,
      colorInfo: colors.info,
      borderRadius: BORDER_RADIUS,
      fontFamily: FONT_FAMILY,
      colorBgElevated: colors.elevated,
    },
  };
}
