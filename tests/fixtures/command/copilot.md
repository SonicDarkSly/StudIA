Une commande Copilot.

=== FICHIER: .github/prompts/verifier.prompt.md ===
---
description: Lance le typecheck
agent: agent
tools: ['search', 'runCommands']
---
Lance npm run typecheck sur ${file} et résume les erreurs.
=== FIN ===
