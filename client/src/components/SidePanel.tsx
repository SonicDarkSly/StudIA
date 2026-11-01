import { FolderOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Badge, Tabs } from 'antd';
import type { ReactNode } from 'react';
import { ACCENT_CYAN } from '../theme';
import type { PanelTab } from '../types';
import { isPanelTab } from '../utils/panels';

interface Props {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  projectCount: number;
  fileCount: number;
  panels: Record<PanelTab, ReactNode>;
}

const BADGE_STYLE = { marginLeft: 6 };

export function SidePanel({ tab, onTab, projectCount, fileCount, panels }: Props) {
  return (
    <aside className="studia-right glass" aria-label="Panneau latéral">
      <Tabs
        activeKey={tab}
        tabBarGutter={0}
        onChange={(key) => {
          if (isPanelTab(key)) onTab(key);
        }}
        items={[
          {
            key: 'model',
            label: (
              <span>
                <ThunderboltOutlined aria-hidden /> Modèle
              </span>
            ),
            children: panels.model,
          },
          {
            key: 'settings',
            label: (
              <span>
                <SettingOutlined aria-hidden /> Réglages
              </span>
            ),
            children: panels.settings,
          },
          {
            key: 'projects',
            label: (
              <span>
                <FolderOutlined aria-hidden /> Projets
                {projectCount > 0 && <Badge count={projectCount} size="small" style={BADGE_STYLE} />}
              </span>
            ),
            children: panels.projects,
          },
          {
            key: 'files',
            label: (
              <span>
                Fichiers
                {fileCount > 0 && (
                  <Badge count={fileCount} size="small" color={ACCENT_CYAN} style={BADGE_STYLE} />
                )}
              </span>
            ),
            children: panels.files,
          },
        ]}
      />
    </aside>
  );
}
