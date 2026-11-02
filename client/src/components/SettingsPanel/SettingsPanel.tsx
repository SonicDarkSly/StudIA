import { UndoOutlined } from '@ant-design/icons';
import { Alert, Button, Collapse, Input, Select, Space, Switch, Tag, Tooltip } from 'antd';
import { SETTINGS_HELP, TARGET_NOT_USED } from '@/consts';
import type {
  AiTarget,
  GenerationSettings,
  Mode,
  ModeKey,
  ModelView,
  NumericSettingKey,
  TargetKey,
} from '@/types';
import { modeIcon } from '@/components/icons';
import { SettingRow } from './SettingRow';
import { CodeView } from '@/components/CodeView';
import './SettingsPanel.css';

const INSTRUCTIONS_ROWS = { minRows: 3, maxRows: 10 };

function settingPatch<K extends NumericSettingKey>(
  key: K,
  value: GenerationSettings[K],
): Partial<GenerationSettings> {
  const patch: Partial<GenerationSettings> = {};
  patch[key] = value;
  return patch;
}

interface Props {
  modes: Mode[];
  targets: AiTarget[];
  modeKey: ModeKey;
  targetKey: TargetKey;
  onTarget: (key: TargetKey) => void;
  model: ModelView | undefined;
  settings: GenerationSettings;
  extraInstructions: string;
  locked: boolean;
  onMode: (key: ModeKey) => void;
  onChange: (patch: Partial<GenerationSettings>) => void;
  onReset: () => void;
  onInstructions: (text: string) => void;
}

export function SettingsPanel(props: Props) {
  const { settings, model, modes } = props;
  const mode = modes.find((g) => g.key === props.modeKey);
  const target = props.targets.find((t) => t.key === props.targetKey);
  const format = mode?.formats[props.targetKey];
  const targetApplies = mode?.usesFiles !== false;
  const fullPrompt = [
    mode?.systemPrompt,
    format?.instructions
      ? `FORMAT POUR L'IA CIBLE : ${target?.label} (${target?.vendor} · ${target?.tools}). Cette section prime sur tout le reste.\n${format.instructions}`
      : '',
    mode?.usesFiles ? '[+ protocole de livraison des fichiers : === FICHIER: chemin === … === FIN ===]' : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const basic = SETTINGS_HELP.filter((h) => !h.advanced);
  const advanced = SETTINGS_HELP.filter((h) => h.advanced && (h.key !== 'thoughtBudget' || model?.thinking));

  return (
    <div>
      <div className="section-label">Mode</div>
      <Select<ModeKey>
        aria-label="Mode"
        className="full-width"
        value={props.modeKey}
        disabled={props.locked}
        onChange={props.onMode}
        options={modes.map((g) => ({
          value: g.key,
          label: (
            <span>
              {modeIcon(g.key)} {g.label}
            </span>
          ),
        }))}
      />
      {props.locked && (
        <div className="muted note locked-note">
          Le mode est fixé pour cette conversation : ouvre une nouvelle conversation pour en changer.
        </div>
      )}

      <div className="section-label target-label">IA cible</div>
      <Select
        aria-label="IA cible"
        className="full-width"
        disabled={!targetApplies}
        aria-describedby={targetApplies ? undefined : 'ia-cible-sans-effet'}
        value={props.targetKey}
        onChange={props.onTarget}
        options={props.targets.map((t) => {
          const status = mode?.formats[t.key]?.status;
          return {
            value: t.key,
            label: (
              <span>
                {t.label} <span className="muted">· {t.vendor}</span>
                {status === 'adapte' && (
                  <Tag color="gold" variant="filled" className="status-tag">
                    adapté
                  </Tag>
                )}
                {status === 'indisponible' && (
                  <Tag color="red" variant="filled" className="status-tag">
                    indisponible
                  </Tag>
                )}
              </span>
            ),
          };
        })}
      />
      {!targetApplies && (
        <div id="ia-cible-sans-effet" className="muted runtime-details">
          {TARGET_NOT_USED}
        </div>
      )}
      {format && targetApplies && (
        <div className="muted runtime-details">
          {format.summary}
          {props.locked && ' Changer d’IA ouvre une nouvelle conversation avec les mêmes projets.'}
        </div>
      )}

      {model?.thinkingAlways && (
        <div className="setting">
          <div className="head">
            <span>Mode réflexion</span>
            <Tag color="magenta" variant="filled">
              toujours actif
            </Tag>
          </div>
          <div className="help">
            Ce modèle raisonne systématiquement avant de répondre (affiché à part) : on ne peut pas couper ce
            mode, seulement limiter sa longueur avec le budget de réflexion (réglages avancés).
          </div>
        </div>
      )}
      {model?.thinking && !model.thinkingAlways && (
        <div className="setting">
          <div className="head">
            <span>Mode réflexion</span>
            <Switch
              aria-label="Mode réflexion"
              checked={settings.thinking}
              onChange={(v) => props.onChange({ thinking: v })}
            />
          </div>
          <div className="help">
            Le modèle écrit d’abord son raisonnement (affiché à part), puis sa réponse. Plus fiable sur les
            problèmes logiques, mais plus lent et plus de tokens.
          </div>
        </div>
      )}

      <div className="catalog-head settings-head">
        <div className="section-label">Réglages du modèle</div>
        <Tooltip title="Revenir aux valeurs conseillées pour ce modèle et ce mode">
          <Button size="small" icon={<UndoOutlined aria-hidden />} onClick={props.onReset}>
            Conseillés
          </Button>
        </Tooltip>
      </div>
      {settings.temperature === 0 && (
        <Alert
          className="top-alert"
          type="info"
          showIcon
          title="Température 0 : le modèle prend toujours le mot le plus probable (top-p, top-k et min-p n’ont plus d’effet)."
        />
      )}
      {basic.map((h) => (
        <SettingRow
          key={h.key}
          help={h}
          value={settings[h.key]}
          onChange={(v) => props.onChange(settingPatch(h.key, v))}
        />
      ))}

      <Collapse
        ghost
        size="small"
        className="advanced-settings"
        items={[
          {
            key: 'adv',
            label: <span className="muted">Réglages avancés</span>,
            children: advanced.map((h) => (
              <SettingRow
                key={h.key}
                help={h}
                value={settings[h.key]}
                onChange={(v) => props.onChange(settingPatch(h.key, v))}
              />
            )),
          },
          {
            key: 'sys',
            label: <span className="muted">Consignes personnelles (ajoutées au prompt système)</span>,
            children: (
              <Space orientation="vertical" className="full-width">
                <Input.TextArea
                  aria-label="Consignes personnelles"
                  autoSize={INSTRUCTIONS_ROWS}
                  value={props.extraInstructions}
                  onChange={(e) => props.onInstructions(e.target.value)}
                  placeholder="Ex. : Réponds de façon concise. Commits sans accents. Pas d'emoji dans le code."
                />
                <div className="muted note">
                  S’ajoutent aux consignes du mode, à chaque message de cette conversation.
                </div>
              </Space>
            ),
          },
          {
            key: 'prompt',
            label: (
              <span className="muted">
                Voir le prompt système (« {mode?.label} »{targetApplies ? ` pour ${target?.label}` : ''})
              </span>
            ),
            children: (
              <CodeView label="Prompt système" className="prompt-preview">
                {fullPrompt}
              </CodeView>
            ),
          },
        ]}
      />
    </div>
  );
}
