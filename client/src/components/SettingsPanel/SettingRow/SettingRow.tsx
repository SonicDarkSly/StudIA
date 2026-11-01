import { InfoCircleOutlined } from '@ant-design/icons';
import { InputNumber, Slider, Tooltip } from 'antd';
import type { SettingHelp } from '@/types';
import { fmtNumber } from '@/utils/format';
import './SettingRow.css';

const FRACTION_DIGITS = 2;

export function SettingRow({
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
              <div className="setting-tooltip">
                <p>{help.what}</p>
                <p>
                  <b>Effet :</b> {help.effect}
                </p>
                <p>
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
            className="optional-number"
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
