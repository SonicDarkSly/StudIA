import { DesktopOutlined } from '@ant-design/icons';
import type { MachineProfile, ModelView } from '@/types';
import { fmtNumber, percentOf } from '@/utils/format';
import './MachineCard.css';

const GPU_LABEL: Record<string, string> = {
  metal: 'Metal (Apple)',
  cuda: 'CUDA (NVIDIA)',
  vulkan: 'Vulkan',
};

const FULL_GAUGE_PERCENT = 100;

function ModelMemory({ machine, model }: { machine: MachineProfile; model: ModelView }) {
  const over = model.fit.needGb > machine.usableGb;
  const left = machine.usableGb - model.fit.needGb;
  return (
    <div className={`model-memory${over ? ' over' : ''}`}>
      <div className="model-memory-name" title={model.label}>
        {model.label}
      </div>
      <div className="muted usable">
        <span>
          Occupé ≈ {fmtNumber(model.fit.needGb, 1)} Go sur {fmtNumber(machine.usableGb, 1)} Go
        </span>
        <span className="model-memory-left">
          {over ? `manque ≈ ${fmtNumber(-left, 1)} Go` : `reste ≈ ${fmtNumber(left, 1)} Go`}
        </span>
      </div>
      <div className="gauge model-share" aria-hidden>
        <span
          style={{ width: `${over ? FULL_GAUGE_PERCENT : percentOf(model.fit.needGb, machine.usableGb)}%` }}
        />
      </div>
    </div>
  );
}

export function MachineCard({
  machine,
  selectedModel,
}: {
  machine: MachineProfile;
  selectedModel?: ModelView;
}) {
  return (
    <div className="glass panel-box machine-card">
      <div className="section-label">
        <DesktopOutlined aria-hidden /> Cette machine
      </div>
      <div className="specs">
        <b>{machine.cpu}</b> · {machine.cores} cœurs
        <br />
        {fmtNumber(machine.totalRamGb, 0)} Go de mémoire{machine.unifiedMemory ? ' unifiée' : ''}
        {machine.memoryOverridden && <span className="muted"> (fixée par STUDIA_MEMORY_GB)</span>}
        <br />
        {machine.gpu ? (
          <>
            Processeur graphique : {GPU_LABEL[machine.gpu] ?? machine.gpu}
            {machine.vramGb !== undefined && ` · ${fmtNumber(machine.vramGb, 1)} Go utilisables`}
          </>
        ) : (
          <span className="muted">Pas de processeur graphique utilisable : calcul sur le processeur.</span>
        )}
      </div>
      <div className="muted usable">
        <span>Mémoire laissée aux modèles</span>
        <span>≈ {fmtNumber(machine.usableGb, 1)} Go</span>
      </div>
      <div className="gauge" aria-hidden>
        <span style={{ width: `${percentOf(machine.usableGb, machine.totalRamGb)}%` }} />
      </div>
      {selectedModel && <ModelMemory machine={machine} model={selectedModel} />}
      <div className="muted note">
        Le reste est gardé pour le système et les autres applications. Un modèle « trop lourd » ne peut être
        ni choisi ni téléchargé.
        {machine.limitsIgnored && <b> Limites désactivées (STUDIA_IGNORE_LIMITS=1).</b>}
      </div>
    </div>
  );
}
