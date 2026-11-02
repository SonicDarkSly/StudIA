export const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const FIX_MESSAGES = {
  fencedHeader: 'En-tête YAML remis entre deux lignes --- : le modèle l’avait placé dans un bloc ```.',
  bareHeader: 'En-tête YAML entouré des lignes --- qui manquaient.',
  trailingHeader: 'Champ(s) d’en-tête écrit(s) après le corps, replacé(s) dans l’en-tête.',
  scaffoldWins: 'Fichier fourni par StudIA : la version écrite par le modèle, différente, a été remplacée.',
  identicalDuplicate: 'Fichier livré plusieurs fois à l’identique : un seul exemplaire gardé.',
  codeFence: 'Ligne ``` retirée autour du code : le modèle avait entouré le fichier d’un bloc Markdown.',
  trailingRule: 'Ligne --- isolée retirée en fin de fichier.',
  leadingSeparator: 'Ligne --- isolée retirée en tête du fichier : il n’a pas d’en-tête YAML.',
  checklistInFile:
    'La liste « À vérifier » destinée à l’utilisateur était écrite dans le fichier : elle en a été retirée.',
  pluginManifestMoved:
    'Manifeste déplacé à l’emplacement attendu par l’IA choisie (le modèle l’avait mis à la racine du plugin).',
  trailingSeparator:
    'Ligne === FIN === manquante : le séparateur --- ajouté par le modèle en fin de fichier a été retiré.',
};
