import {
  AppstoreOutlined,
  DesktopOutlined,
  MoonOutlined,
  QuestionCircleOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import type { ThemeMode } from '../hooks/useTheme';
import type { MachineProfile, ModelView, PanelTab, RuntimeStatus } from '../types';
import { fmtNumber } from '../utils/format';
import { Logo } from './Logo';

interface Props {
  mode: ThemeMode;
  machine?: MachineProfile;
  runtime?: RuntimeStatus;
  models: ModelView[];
  showRight: boolean;
  onToggleTheme: () => void;
  onHelp: () => void;
  onToggleRight: () => void;
  onOpenPanel: (tab: PanelTab) => void;
}

const shortCpuName = (cpu: string) => cpu.replace(/\(R\)|\(TM\)|CPU|@.*$/g, '').trim();

const gpuLabel = (gpu: MachineProfile['gpu']) => {
  if (!gpu) return '';
  return ` · ${gpu === 'metal' ? 'Metal' : gpu.toUpperCase()}`;
};

export function AppHeader({ mode, machine, runtime, models, showRight, ...actions }: Props) {
  const runtimeLabel = runtime?.loadingKey
    ? 'chargement…'
    : (models.find((m) => m.key === runtime?.loadedKey)?.label ?? 'en veille');
  const dotState = runtime?.busy ? ' busy' : runtime?.loadedKey ? ' on' : '';

  return (
    <header className="studia-header glass">
      <h1 className="sr-only">StudIA, studio d’éléments pour l’IA</h1>
      <Logo />
      <span className="muted" style={{ fontSize: 13 }}>
        Studio d’éléments pour l’IA · 100 % local
      </span>
      <span className="spacer" />
      {machine && (
        <Tooltip
          title={`Mémoire laissée aux modèles : ${fmtNumber(machine.usableGb, 1)} Go. Détail dans l’onglet Modèle.`}
        >
          <button
            type="button"
            className="plain-button machine-chip"
            onClick={() => actions.onOpenPanel('model')}
          >
            <DesktopOutlined aria-hidden /> {shortCpuName(machine.cpu)} · {Math.round(machine.totalRamGb)} Go
            {gpuLabel(machine.gpu)}
            <span className="sr-only">, voir le détail de la machine</span>
          </button>
        </Tooltip>
      )}
      <Tooltip title={runtime?.loadedKey ? 'Modèle en mémoire' : 'Aucun modèle en mémoire'}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span className={`status-dot${dotState}`} aria-hidden />
          <span className="muted">{runtimeLabel}</span>
        </span>
      </Tooltip>
      <Tooltip title="Aide">
        <Button
          type="text"
          icon={<QuestionCircleOutlined aria-hidden />}
          aria-label="Aide"
          onClick={actions.onHelp}
        />
      </Tooltip>
      <Tooltip title={mode === 'dark' ? 'Thème clair' : 'Thème néon'}>
        <Button
          type="text"
          icon={mode === 'dark' ? <SunOutlined aria-hidden /> : <MoonOutlined aria-hidden />}
          aria-label={mode === 'dark' ? 'Passer au thème clair' : 'Passer au thème néon'}
          onClick={actions.onToggleTheme}
        />
      </Tooltip>
      <Tooltip title={showRight ? 'Masquer le panneau' : 'Afficher le panneau'}>
        <Button
          type="text"
          icon={<AppstoreOutlined aria-hidden />}
          aria-label={showRight ? 'Masquer le panneau' : 'Afficher le panneau'}
          aria-expanded={showRight}
          onClick={actions.onToggleRight}
        />
      </Tooltip>
    </header>
  );
}
