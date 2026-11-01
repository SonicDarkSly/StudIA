import type { PanelTab } from '../types';

const PANEL_TABS: readonly PanelTab[] = ['model', 'settings', 'projects', 'files'];

export function isPanelTab(value: string): value is PanelTab {
  return PANEL_TABS.some((tab) => tab === value);
}
