Une skill appelée avec $verifier.

=== FICHIER: .agents/skills/verifier/SKILL.md ===
---
name: verifier
description: Lance le typecheck du projet et résume les erreurs par fichier, quand l'utilisateur demande de vérifier les types
---
1. Lance npm run typecheck.
2. Réponds par un tableau : fichier | nombre d'erreurs | première erreur.
=== FIN ===

=== FICHIER: .agents/skills/verifier/README.md ===
# verifier
=== FIN ===
