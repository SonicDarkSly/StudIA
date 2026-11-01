import type { GenerationSettings, GeneratorKey, SettingHelp, TargetKey } from './types';

export const DEFAULT_GENERATOR: GeneratorKey = 'chat';
export const DEFAULT_TARGET: TargetKey = 'claude';
export const TARGET_NOT_USED =
  'La discussion libre ne dépend pas de l’IA : choisis-la pour créer des fichiers.';

export const DEFAULT_SETTINGS: GenerationSettings = {
  temperature: 0.7,
  topP: 0.8,
  topK: 20,
  minP: 0,
  repeatPenalty: 1.05,
  frequencyPenalty: 0,
  presencePenalty: 0,
  repeatLastTokens: 64,
  maxTokens: 2048,
  contextSize: 8192,
  thinking: true,
};

export const SETTINGS_HELP: SettingHelp[] = [
  {
    key: 'temperature',
    label: 'Température',
    min: 0,
    max: 2,
    step: 0.05,
    what: 'Le thermostat de la créativité. À chaque mot, le modèle calcule des probabilités ; la température les aplatit (chaud) ou les accentue (froid).',
    effect:
      'Froid : réponses sûres, répétables, parfois plates. Chaud : plus variées et inventives, mais plus de risques d’erreurs et d’incohérences.',
    tip: '0 – 0,3 pour du code, du JSON, des fichiers de config · 0,5 – 0,8 pour rédiger · 0,9 – 1,2 pour des idées. À 0, le modèle choisit toujours le mot le plus probable.',
  },
  {
    key: 'topP',
    label: 'Top-p (noyau)',
    min: 0.05,
    max: 1,
    step: 0.01,
    what: 'Ne garde que les mots les plus probables jusqu’à atteindre ce total de probabilité (0,8 = les candidats qui font 80 % des chances).',
    effect:
      'Plus bas : on coupe la « longue traîne » des mots improbables, la réponse reste sur des rails. 1 = aucun filtre.',
    tip: 'Qwen conseille 0,8 (0,95 en mode réflexion). Rarement utile de descendre sous 0,5.',
  },
  {
    key: 'topK',
    label: 'Top-k',
    min: 0,
    max: 200,
    step: 1,
    what: 'Ne garde que les K mots les plus probables avant de tirer au sort.',
    effect: 'K petit (5 – 20) : réponses plus prévisibles. K grand : plus de diversité. 0 = désactivé.',
    tip: '20 est la valeur conseillée pour Qwen. Se combine avec top-p : les deux filtres s’appliquent.',
  },
  {
    key: 'minP',
    label: 'Min-p',
    min: 0,
    max: 0.5,
    step: 0.01,
    what: 'Écarte tout mot dont la probabilité est inférieure à ce pourcentage de celle du meilleur mot.',
    effect: 'Un filtre « intelligent » : s’adapte quand le modèle hésite ou est sûr de lui. 0 = désactivé.',
    tip: '0,05 – 0,1 permet de monter la température sans dérailler.',
    advanced: true,
  },
  {
    key: 'repeatPenalty',
    label: 'Pénalité de répétition',
    min: 1,
    max: 1.5,
    step: 0.01,
    what: 'Réduit la probabilité des mots déjà écrits récemment.',
    effect:
      'Évite les boucles (« … et donc, et donc, et donc »). Trop forte, elle empêche de répéter des mots nécessaires (noms de variables, balises).',
    tip: '1 = désactivée · 1,05 – 1,1 en usage courant · garder bas pour le code.',
  },
  {
    key: 'repeatLastTokens',
    label: 'Fenêtre de répétition',
    min: 0,
    max: 1024,
    step: 16,
    what: 'Combien de tokens récents sont surveillés par la pénalité de répétition.',
    effect: 'Plus grand : on évite les répétitions sur une plus longue distance.',
    tip: '64 par défaut.',
    advanced: true,
  },
  {
    key: 'frequencyPenalty',
    label: 'Pénalité de fréquence',
    min: 0,
    max: 1,
    step: 0.05,
    what: 'Pénalise un mot proportionnellement au nombre de fois où il est déjà apparu.',
    effect: 'Pousse à varier le vocabulaire.',
    tip: '0 par défaut ; 0,1 – 0,3 pour un texte moins répétitif.',
    advanced: true,
  },
  {
    key: 'presencePenalty',
    label: 'Pénalité de présence',
    min: 0,
    max: 1,
    step: 0.05,
    what: 'Pénalise tout mot déjà apparu au moins une fois, quel que soit son nombre d’apparitions.',
    effect: 'Encourage à aborder de nouveaux sujets.',
    tip: '0 par défaut.',
    advanced: true,
  },
  {
    key: 'maxTokens',
    label: 'Longueur maximale',
    min: 64,
    max: 16384,
    step: 64,
    what: 'Nombre maximal de tokens écrits dans la réponse (un token ≈ 4 caractères en français).',
    effect:
      'Coupe la réponse si elle est atteinte (raison d’arrêt « maxTokens »). Ne rend pas le modèle plus bavard.',
    tip: '2 048 pour discuter · 4 000 – 6 000 pour générer plusieurs fichiers.',
  },
  {
    key: 'contextSize',
    label: 'Taille du contexte',
    min: 2048,
    max: 65536,
    step: 1024,
    what: 'La mémoire de travail : prompt système + projets en contexte + toute la conversation + la réponse doivent y tenir.',
    effect:
      'Plus grand : plus de place pour les projets et l’historique, mais plus de mémoire vive et un démarrage plus lent.',
    tip: '8 192 suffit pour discuter · 16 384 – 32 768 avec plusieurs projets en contexte. Plafonné par le modèle.',
  },
  {
    key: 'seed',
    label: 'Graine',
    min: 0,
    max: 999999,
    step: 1,
    what: 'Le point de départ du tirage au sort. Même graine + mêmes réglages + même conversation = même réponse (en principe).',
    effect: 'Utile pour comparer l’effet d’un seul réglage. Vide = graine aléatoire à chaque fois.',
    tip: 'Sur GPU, de petites différences restent possibles (ordre des calculs).',
    advanced: true,
  },
  {
    key: 'thoughtBudget',
    label: 'Budget de réflexion',
    min: 0,
    max: 8192,
    step: 64,
    what: 'Nombre maximal de tokens que le modèle peut écrire dans sa réflexion avant de répondre.',
    effect: 'Limite le temps passé à réfléchir. Vide = pas de limite.',
    tip: 'Seulement pour les modèles à réflexion (Qwen3 8B, DeepSeek-R1, gpt-oss).',
    advanced: true,
  },
];

export const STOP_REASONS: Record<string, string> = {
  eogToken: 'fin naturelle',
  maxTokens: 'longueur maximale atteinte',
  abort: 'arrêté',
  stopGenerationTrigger: 'déclencheur d’arrêt',
  customStopTrigger: 'déclencheur d’arrêt',
  functionCalls: 'appel de fonction',
};

export const PROJECTS_CONTEXT_SHARE = 0.55;

export const PHASES: Record<string, string> = {
  queued: 'En file d’attente…',
  loading: 'Chargement du modèle en mémoire…',
  reading: 'Lecture du contexte…',
  thinking: 'Réflexion…',
  writing: 'Écriture…',
};

export const AUTHOR = {
  handle: 'SonicDarkSly',
  url: 'https://github.com/SonicDarkSly',
  license: 'Apache 2.0',
};
