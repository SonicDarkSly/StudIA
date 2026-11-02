Ce plugin « revue-code » ajoute une skill qui permet à l'utilisateur de relire les modifications en cours dans son index Git avant de valider un commit. Il s'inscrit dans une pratique de qualité du code en encourageant la vérification manuelle des changements, surtout utile lorsqu'on travaille rapidement ou avec des fichiers modifiés en grande quantité. La skill utilise `git diff --cached` pour afficher les modifications préparées, et propose un retour clair sur ce qui sera inclus dans le prochain commit.

=== FICHIER: revue-code/gemini-extension.json ===
{
  "name": "revue-code",
  "version": "1.0.0",
  "description": "Permet de relire les modifications en cours avant un commit, en affichant les fichiers ajoutés à l'index.",
  "contextFileName": "GEMINI.md"
}
=== FIN ===

=== FICHIER: revue-code/GEMINI.md ===
Ce plugin ajoute une skill pour vérifier les modifications préparées dans l'index Git avant de faire un commit. Il est utile pour éviter les oublis ou erreurs de sélection lors de la phase de staging.
=== FIN ===

=== FICHIER: revue-code/skills/revue-modifications/SKILL.md ===
name: revue-modifications
description: Affiche les modifications en cours dans l'index Git (prêtes pour le commit) afin de vérifier leur contenu avant validation. Utilisez cette skill si vous souhaitez relire ce qui sera inclus dans le prochain commit.
=== FIN ===

=== FICHIER: revue-code/README.md ===
# Plugin « revue-code »

Ce plugin ajoute une skill permettant de relire les modifications en cours dans l'index Git avant un commit. Il est particulièrement utile pour vérifier que seuls les fichiers attendus sont préparés, et qu’aucune modification inattendue n’a été ajoutée.

## Fonctionnalités

- `revue-code:revue-modifications` : affiche les différences entre l'index et le dernier commit (comme `git diff --cached`), pour une vérification rapide.

## Installation

1. Placez ce dossier dans votre répertoire d’extensions Gemini :
   ```bash
   gemini extensions link ./revue-code
   ```

2. Pour l’utiliser, exécutez la commande suivante dans un projet Git :
   ```bash
   gemini run revue-code:revue-modifications
   ```

## À vérifier

- Assurez-vous que `git` est installé et que vous êtes dans un dépôt Git.
- Si le plugin ne fonctionne pas, vérifiez que la commande `git diff --cached` est disponible (c’est le cas sur tous les systèmes standard).
- Le nom de la skill est `revue-modifications`, mais vous pouvez l’appeler via `revue-code:revue-modifications`.
=== FIN ===