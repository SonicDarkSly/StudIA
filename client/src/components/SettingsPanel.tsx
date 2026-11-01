import { InfoCircleOutlined, UndoOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Collapse,
  Input,
  InputNumber,
  Select,
  Slider,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import { SETTINGS_HELP, type SettingHelp } from '../constants';
import type {
  AiTarget,
  GenerationSettings,
  Generator,
  ModelView,
  NumericSettingKey,
  TargetKey,
} from '../types';
import { fmtNumber } from '../utils/format';
import { generatorIcon } from './icons';

const FRACTION_DIGITS = 2;

function settingPatch<K extends NumericSettingKey>(
  key: K,
  value: GenerationSettings[K],
): Partial<GenerationSettings> {
  const patch: Partial<GenerationSettings> = {};
  patch[key] = value;
  return patch;
}

interface Props {
  generators: Generator[];
  targets: AiTarget[];
  generatorKey: string;
  targetKey: TargetKey;
  onTarget: (key: TargetKey) => void;
  model: ModelView | undefined;
  settings: GenerationSettings;
  extraInstructions: string;
  locked: boolean;
  onGenerator: (key: string) => void;
  onChange: (patch: Partial<GenerationSettings>) => void;
  onReset: () => void;
  onInstructions: (text: string) => void;
}

function SettingRow({
  help,
  value,
  onChange,
}: {
  help: SettingHelp;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const optional = help.key === 'seed' || help.key === 'thoughtBudget';
  return (
    <div className="setting">
      <div className="head">
        <span>
          {help.label}{' '}
          <Tooltip
            trigger={['hover', 'focus']}
            title={
              <div>
                <p style={{ margin: '0 0 6px' }}>{help.what}</p>
                <p style={{ margin: '0 0 6px' }}>
                  <b>Effet :</b> {help.effect}
                </p>
                <p style={{ margin: 0 }}>
                  <b>Repère :</b> {help.tip}
                </p>
              </div>
            }
          >
            <button type="button" className="plain-button help-button" aria-label={`Aide : ${help.label}`}>
              <InfoCircleOutlined aria-hidden />
            </button>
          </Tooltip>
        </span>
        {optional ? (
          <InputNumber
            aria-label={help.label}
            size="small"
            min={help.min}
            max={help.max}
            value={value}
            placeholder={help.key === 'seed' ? 'aléatoire' : 'illimité'}
            onChange={(v) => onChange(v === null || v === undefined ? undefined : Number(v))}
            style={{ width: 110 }}
          />
        ) : (
          <span className="val">
            {value === undefined ? '—' : fmtNumber(value, help.step < 1 ? FRACTION_DIGITS : 0)}
          </span>
        )}
      </div>
      {!optional && (
        <Slider
          ariaLabelForHandle={help.label}
          min={help.min}
          max={help.max}
          step={help.step}
          value={value ?? help.min}
          onChange={(v) => onChange(v)}
        />
      )}
      <div className="help">{help.what}</div>
    </div>
  );
}

export function SettingsPanel(props: Props) {
  const { settings, model, generators } = props;
  const generator = generators.find((g) => g.key === props.generatorKey);
  const target = props.targets.find((t) => t.key === props.targetKey);
  const format = generator?.formats[props.targetKey];
  const fullPrompt = [
    generator?.systemPrompt,
    format?.instructions
      ? `FORMAT POUR L'IA CIBLE : ${target?.label} (${target?.vendor} · ${target?.tools}). Cette section prime sur tout le reste.\n${format.instructions}`
      : '',
    generator?.usesFiles
      ? '[+ protocole de livraison des fichiers : === FICHIER: chemin === … === FIN ===]'
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const basic = SETTINGS_HELP.filter((h) => !h.advanced);
  const advanced = SETTINGS_HELP.filter((h) => h.advanced && (h.key !== 'thoughtBudget' || model?.thinking));

  return (
    <div>
      <div className="section-label">Mode</div>
      <Select
        aria-label="Mode"
        style={{ width: '100%' }}
        value={props.generatorKey}
        disabled={props.locked}
        onChange={props.onGenerator}
        options={generators.map((g) => ({
          value: g.key,
          label: (
            <span>
              {generatorIcon(g.key)} {g.label}
            </span>
          ),
        }))}
      />
      {props.locked && (
        <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
          Le mode est fixé pour cette conversation : ouvre une nouvelle conversation pour en changer.
        </div>
      )}

      <div className="section-label" style={{ marginTop: 14 }}>
        IA cible
      </div>
      <Select
        aria-label="IA cible"
        style={{ width: '100%' }}
        value={props.targetKey}
        onChange={props.onTarget}
        options={props.targets.map((t) => {
          const status = generator?.formats[t.key]?.status;
          return {
            value: t.key,
            label: (
              <span>
                {t.label} <span className="muted">· {t.vendor}</span>
                {status === 'adapte' && (
                  <Tag color="gold" variant="filled" style={{ marginLeft: 6 }}>
                    adapté
                  </Tag>
                )}
                {status === 'indisponible' && (
                  <Tag color="red" variant="filled" style={{ marginLeft: 6 }}>
                    indisponible
                  </Tag>
                )}
              </span>
            ),
          };
        })}
      />
      {format && (
        <div className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <div className="section-label" style={{ margin: 0 }}>
          Réglages du modèle
        </div>
        <Tooltip title="Revenir aux valeurs conseillées pour ce modèle et ce mode">
          <Button size="small" icon={<UndoOutlined aria-hidden />} onClick={props.onReset}>
            Conseillés
          </Button>
        </Tooltip>
      </div>
      {settings.temperature === 0 && (
        <Alert
          style={{ marginTop: 8 }}
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
        style={{ marginTop: 6 }}
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
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Input.TextArea
                  aria-label="Consignes personnelles"
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  value={props.extraInstructions}
                  onChange={(e) => props.onInstructions(e.target.value)}
                  placeholder="Ex. : Réponds de façon concise. Commits sans accents. Pas d'emoji dans le code."
                />
                <div className="muted" style={{ fontSize: 11.5 }}>
                  S’ajoutent aux consignes du mode, à chaque message de cette conversation.
                </div>
              </Space>
            ),
          },
          {
            key: 'prompt',
            label: (
              <span className="muted">
                Voir le prompt système (« {generator?.label} » pour {target?.label})
              </span>
            ),
            children: (
              <div className="code-view" style={{ whiteSpace: 'pre-wrap', maxHeight: 360 }}>
                {fullPrompt}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
