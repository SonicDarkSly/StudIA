export const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const FIX_MESSAGES = {
  fencedHeader: 'En-tête YAML remis entre deux lignes --- : le modèle l’avait placé dans un bloc ```.',
  bareHeader: 'En-tête YAML entouré des lignes --- qui manquaient.',
  trailingHeader: 'Champ(s) d’en-tête écrit(s) après le corps, replacé(s) dans l’en-tête.',
  trailingRule: 'Ligne --- isolée retirée en fin de fichier.',
  leadingSeparator: 'Ligne --- isolée retirée en tête du fichier : il n’a pas d’en-tête YAML.',
  trailingSeparator:
    'Ligne === FIN === manquante : le séparateur --- ajouté par le modèle en fin de fichier a été retiré.',
};
