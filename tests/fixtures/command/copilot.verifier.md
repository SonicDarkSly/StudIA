Tu peux utiliser la commande `/verifier` pour lancer le typecheck à la fois côté serveur et client, puis obtenir un résumé des erreurs par fichier. Cette commande s’appuie sur les scripts typiques de projet TypeScript (comme `tsc`), en supposant que ton projet utilise un `tsconfig.json` bien configuré pour le serveur et le client.

Voici la commande prête à être utilisée dans ton environnement GitHub Copilot (VS Code) via un fichier `.github/prompts/verifier.prompt.md`.

=== FICHIER: .github/prompts/verifier.prompt.md ===
---
description: Lance le typecheck côté serveur et client, puis résume les erreurs par fichier.
argument-hint: optionnel : nom de fichier ou mot-clé pour filtrer les erreurs
agent: copilot
tools: ['execute', 'read', 'search']
---
Lance d'abord le typecheck du serveur en utilisant la configuration appropriée (par exemple `tsconfig.server.json` ou `tsconfig.node.json`). Ensuite, lance le typecheck du client avec sa propre configuration (ex: `tsconfig.client.json` ou `tsconfig.browser.json`).  

Si les deux commandes réussissent, collecte les sorties d'erreurs (format JSON ou texte brut) et extrait les erreurs par fichier. Pour chaque fichier concerné, note :  
- le chemin relatif du fichier  
- le nombre d'erreurs dans ce fichier  
- la première erreur (message complet ou résumé court)

Regroupe ces informations dans un tableau au format suivant :

| Fichier | Nombre d'erreurs | Première erreur |
|--------|------------------|----------------|
| src/server/index.ts | 2 | Type 'string' is not assignable to type 'number'. |
| src/client/components/Button.tsx | 1 | Property 'disabled' is missing in type '{ children: string; }' |

Si aucun fichier n’a d’erreur, affiche : « Aucune erreur de type détectée. »  

Le texte saisi après la commande (`${input}`) peut être utilisé comme filtre (mot-clé ou nom de fichier partiel). Si fourni, ne liste que les fichiers contenant ce mot-clé dans le chemin ou le message d’erreur.

Ne modifie aucun fichier. Ne supprime rien.  
À vérifier :  
- Les noms réels des configurations TypeScript (`tsconfig.server.json`, etc.) doivent exister dans ton projet.  
- Les scripts `tsc` pour serveur et client doivent être définis dans `package.json` (ex: `"typecheck:server"`, `"typecheck:client"`).  
- Si tu utilises un autre outil que `tsc` (comme `ts-node`, `esbuild`, ou `swc`), adapte les commandes en conséquence.  
- Cette commande suppose que le projet est dans un environnement Node.js avec `tsc` installé.  
=== FIN ===

À vérifier :  
- Vérifie que les scripts de typecheck (`typecheck:server`, `typecheck:client`) existent bien dans ton `package.json`.  
- Assure-toi que les fichiers `tsconfig.server.json` et `tsconfig.client.json` sont présents.  
- Si tu utilises un autre outil que `tsc`, remplace les commandes d'exécution par celles adaptées (ex: `npx swc src --typecheck`).