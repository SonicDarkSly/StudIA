export const FILE_PROTOCOL = `
FORMAT DE LIVRAISON DES FICHIERS (obligatoire, l'application le lit automatiquement) :
- Avant les fichiers : 2 à 4 phrases qui expliquent ce que tu proposes et pourquoi.
- Chaque fichier, sans exception, est écrit exactement ainsi :
=== FICHIER: chemin/relatif/du/fichier ===
contenu complet du fichier, brut, sans bloc \`\`\` autour
=== FIN ===
- Ni le fichier ni son en-tête ne sont entourés d'un bloc \`\`\` (un exemple de code à l'intérieur d'un Markdown reste
  permis). Seul un fichier qui a un en-tête YAML commence par la ligne --- (l'en-tête se ferme par la ligne ---) ;
  les autres fichiers commencent directement par leur contenu.
- Les fichiers livrés seront utilisés par l'IA cible, pas par toi : ils ne mentionnent jamais StudIA (ni comme auteur,
  ni comme agent, ni comme signature), sauf si le projet concerné est StudIA lui-même.
- Chemins relatifs uniquement (jamais de « .. » ni de chemin absolu). Un bloc par fichier, contenu complet (pas de « … reste inchangé »).
- Après les fichiers : une courte liste « À vérifier » (ce que l'utilisateur doit relire ou adapter).
- Si la demande est trop floue pour bien faire, pose d'abord au plus 3 questions courtes et ne livre aucun fichier.
`;
