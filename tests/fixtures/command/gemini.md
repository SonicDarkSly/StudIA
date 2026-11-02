Une commande Gemini CLI.

=== FICHIER: .gemini/commands/verifier.toml ===
```toml
description = "Lance le typecheck et résume les erreurs"
prompt = """
Lance `npm run typecheck` puis résume les erreurs par fichier.
!{npm run typecheck}
"""
```
=== FIN ===
