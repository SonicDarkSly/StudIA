Ce plugin permet à l'IA cible Antigravity d’effectuer une vérification automatique des modifications en cours avant un commit, en relisant les fichiers modifiés via une skill dédiée. Il s’intègre parfaitement dans le flux de travail Git en s’appuyant sur les outils natifs du système (comme `git diff`) et utilise une skill pour analyser les changements. Le plugin est léger, conforme aux standards Antigravity, et ne nécessite pas de serveur MCP.

=== FICHIER: revue-code/plugin.json ===
{
  "$schema": "https://antigravity.google/schemas/v1/plugin.json",
  "name": "revue-code",
  "version": "1.0.0",
  "description": "Vérifie les modifications en cours avant un commit en relisant les fichiers modifiés via une skill dédiée."
}
=== FIN ===

=== FICHIER: revue-code/README.md ===
# Plugin « revue-code »

Ce plugin ajoute une skill `revue` qui permet de relire les modifications en cours dans l'index Git avant un commit. Il est utile pour détecter rapidement des erreurs, des oublis ou des modifications inattendues.

## Fonctionnalités

- **Skill `revue`** : analyse les fichiers modifiés (via `git diff --cached`) et fournit une synthèse de leurs changements.
- Intégration directe dans le flux Antigravity via la commande `/revue`.

## Installation

1. Placez ce dossier dans votre projet ou dans le répertoire des plugins d’Antigravity.
2. Validez le plugin :
   ```bash
   agy plugin validate --strict ./revue-code
   ```
3. Installez-le :
   ```bash
   agy plugin install ./revue-code
   ```

## Utilisation

Exécutez la skill après avoir ajouté des fichiers à l’index (`git add`) :

```bash
/revue
```

L'IA relit les modifications en attente de commit et propose une analyse.

## À vérifier

- Assurez-vous que `git` est installé et accessible dans le chemin d’exécution.
- Le plugin suppose que l’agent a accès au répertoire Git courant.
=== FIN ===

=== FICHIER: revue-code/skills/revue/SKILL.md ===
---
name: revue
description: Relit les modifications en cours (dans l'index Git) avant un commit. Utilisez cette skill pour vérifier rapidement ce que vous allez valider.
---

1. Exécutez `git diff --cached --name-only` pour lister les fichiers modifiés dans l'index.
2. Pour chaque fichier, récupérez son contenu modifié avec `git diff --cached <fichier>`.
3. Compilez une synthèse des changements : indiquez le nom du fichier, les lignes ajoutées (en vert), supprimées (en rouge) et les modifications contextuelles.
4. Présentez un résumé clair des modifications principales, en mettant en évidence les parties critiques ou suspectes (ex: suppression de code important, ajout de log temporaire).
5. Demandez à l'utilisateur si les changements sont corrects et s’il souhaite continuer le commit.
=== FIN ===