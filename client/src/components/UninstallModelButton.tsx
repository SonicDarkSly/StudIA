import { DeleteOutlined } from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';
import type { ModelView } from '../types';
import { fmtNumber } from '../utils/format';

interface Props {
  model: ModelView;
  busy: boolean;
  onUninstall: (key: string) => void;
}

export function UninstallModelButton({ model, busy, onUninstall }: Props) {
  return (
    <Popconfirm
      title={`Désinstaller ${model.label} ?`}
      description={`Le fichier (${fmtNumber(model.sizeGb, 1)} Go) est supprimé de server/data/llm : il faudra le retélécharger pour s’en servir.`}
      okText="Désinstaller"
      okButtonProps={{ danger: true }}
      cancelText="Annuler"
      onConfirm={() => onUninstall(model.key)}
    >
      <Button size="small" type="text" danger icon={<DeleteOutlined aria-hidden />} disabled={busy}>
        Désinstaller<span className="sr-only"> {model.label}</span>
      </Button>
    </Popconfirm>
  );
}
