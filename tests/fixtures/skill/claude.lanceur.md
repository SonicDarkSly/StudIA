Je vais créer une skill qui génère un lanceur double-clic (script exécutable) pour un projet, en suivant les conventions de tes projets existants. Cette skill s’active automatiquement quand l’utilisateur demande un « lanceur », « script d’ouverture », « raccourci », ou toute variation similaire.

Avant de livrer, je note que tu n’as pas fourni de projet en contexte. Je suppose donc une structure générique courante (Node.js, Python, ou projet web), avec un fichier principal (`index.js`, `main.py`, `src/index.ts`, etc.) et un dossier racine contenant un `package.json` ou `pyproject.toml`. Si ton projet est différent, ajuste les chemins dans « À vérifier ».

---

=== FICHIER: .claude/skills/creer-lanceur/SKILL.md ===
---
name: creer-lanceur
description: Crée un lanceur double-clic (script exécutable) pour démarrer ton projet, compatible macOS, Linux et Windows. À utiliser quand l'utilisateur demande « lanceur », « script d'ouverture », « raccourci », « double-clic », ou équivalent.
---
1. **Identifier le type de projet** :
   - Si `package.json` existe → projet Node.js.
   - Si `pyproject.toml` ou `requirements.txt` existe → projet Python.
   - Sinon, chercher un fichier principal : `main.py`, `index.js`, `app.py`, `src/index.ts`, etc. (priorité à `.ts`, puis `.js`, puis `.py`).
   - Si aucun n’est trouvé, demander à l’utilisateur le nom du fichier d’entrée.

2. **Déterminer la commande de démarrage** :
   - Pour Node.js : `npm start` ou `node <fichier-principal>`.
   - Pour Python : `python <fichier-principal>` ou `python3 <fichier-principal>`.
   - Si un script `start` est défini dans `package.json`, l’utiliser (ex: `"start": "node index.js"`).
   - Sinon, construire la commande à partir du fichier principal.

3. **Créer le lanceur** :
   - Nommer le fichier : `lanceur.sh` (Linux/macOS) et `lanceur.bat` (Windows), avec un nom unique basé sur la date et le nom du projet.
   - Utiliser le modèle dans `assets/lanceur-template.md` pour générer les scripts.

4. **Pour le ton et le format, lire references/exemples.md** :
   - Le script doit être clair, sans erreurs, avec un message d’erreur si le fichier principal n’existe pas.
   - Pour les systèmes Unix (macOS/Linux), ajouter `#!/bin/bash` en tête et rendre exécutable via `chmod +x`.

5. **Pour les chemins, lire references/chemins.md** :
   - Les scripts doivent fonctionner depuis la racine du projet.
   - Ne pas utiliser de chemins absolus ou relatifs comme `../`, mais toujours partir de `.`.

6. **Écrire les fichiers dans le projet** :
   - Créer `lanceur.sh` (Unix) et `lanceur.bat` (Windows) dans la racine du projet.
   - Nom unique : `lanceur-2025-04-05.js` si Node, `lanceur-2025-04-05.py` si Python, etc.

7. **Vérifier que les scripts sont exécutables** :
   - Sur Unix : `chmod +x lanceur.sh`.
   - Sur Windows : le `.bat` est exécutable par défaut.

8. **Remarque importante** :
   - Si le projet utilise un environnement virtuel (Python) ou `node_modules`, le script doit l’activer si nécessaire.
   - Pour Python, si `venv/` ou `env/` existe, utiliser `./venv/bin/python` au lieu de `python`.

9. **Pièges** :
   - ❌ Ne pas créer un lanceur sans fichier principal → vérifiez que le fichier existe.
   - ❌ Ne pas rendre le script exécutable sur Unix → ajoutez `chmod +x`.
   - ❌ Utiliser un chemin absolu ou relatif incorrect → utilisez toujours `.` pour la racine.
   - ✅ Corriger : si le fichier principal est manquant, afficher une erreur claire.

10. **Checklist avant de rendre** :
    - [ ] Le fichier principal existe.
    - [ ] Les scripts sont nommés avec une date unique.
    - [ ] `lanceur.sh` a `#!/bin/bash` et est exécutable.
    - [ ] `lanceur.bat` fonctionne sous Windows.
    - [ ] Le script affiche un message d’erreur si le fichier principal n’existe pas.

=== FIN ===

=== FICHIER: .claude/skills/creer-lanceur/assets/lanceur-template.md ===
```bash
#!/bin/bash
# Lanceur automatique pour projet
# Généré par la skill creer-lanceur
# Date : {{DATE}}

PROJECT_ROOT="."
MAIN_FILE="{{MAIN_FILE}}"
COMMAND="{{COMMAND}}"

if [ ! -f "$MAIN_FILE" ]; then
  echo "❌ ERREUR : Fichier principal '$MAIN_FILE' introuvable dans $PROJECT_ROOT"
  exit 1
fi

echo "🚀 Démarrage du projet depuis $MAIN_FILE"
echo "Commande : $COMMAND"
eval "$COMMAND"
```

```bat
@echo off
:: Lanceur automatique pour projet
:: Généré par la skill creer-lanceur
:: Date : {{DATE}}

set PROJECT_ROOT=.
set MAIN_FILE={{MAIN_FILE}}
set COMMAND={{COMMAND}}

if not exist "%MAIN_FILE%" (
  echo ❌ ERREUR : Fichier principal '%MAIN_FILE%' introuvable dans %PROJECT_ROOT%
  exit /b 1
)

echo 🚀 Démarrage du projet depuis %MAIN_FILE%
echo Commande : %COMMAND%
call %COMMAND%
```

=== FIN ===

=== FICHIER: .claude/skills/creer-lanceur/references/exemples.md ===
- Exemple de lanceur Node.js : `npm start` → `lanceur.sh` exécute `node index.js`.
- Exemple de lanceur Python : `python main.py` → `lanceur.bat` appelle `python main.py`.
- Le script doit afficher un message clair au démarrage.
- Si le fichier principal est absent, afficher une erreur avec le nom du fichier manquant.

=== FIN ===

=== FICHIER: .claude/skills/creer-lanceur/references/chemins.md ===
- Tous les chemins sont relatifs à la racine du projet (`.`).
- Ne pas utiliser `..` ou `~/`.
- Les scripts doivent être exécutés depuis la racine du projet.
- Les fichiers `package.json`, `pyproject.toml`, etc., sont lus depuis la racine.

=== FIN ===

=== FICHIER: .claude/skills/creer-lanceur/scripts/generate-lanceur.sh ===
#!/bin/bash
# Génère un lanceur double-clic pour un projet
# Usage: bash ${CLAUDE_SKILL_DIR}/scripts/generate-lanceur.sh <projet-root>

set -euo pipefail

PROJECT_ROOT="${1:-.}"

# Vérifier que le dossier existe
if [ ! -d "$PROJECT_ROOT" ]; then
  echo "❌ ERREUR : Dossier projet '$PROJECT_ROOT' introuvable"
  exit 1
fi

cd "$PROJECT_ROOT"

# Détection du type de projet
if [ -f "package.json" ]; then
  PROJECT_TYPE="node"
elif [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
  PROJECT_TYPE="python"
else
  PROJECT_TYPE="generic"
fi

# Trouver le fichier principal
MAIN_FILE=""
if [ "$PROJECT_TYPE" = "node" ]; then
  if grep -q '"start":' package.json; then
    COMMAND=$(jq -r '.scripts.start' package.json)
  else
    # Chercher index.js, main.js, app.js
    for f in index.js main.js app.js; do
      if [ -f "$f" ]; then
        MAIN_FILE="$f"
        COMMAND="node $f"
        break
      fi
    done
  fi
elif [ "$PROJECT_TYPE" = "python" ]; then
  for f in main.py app.py index.py; do
    if [ -f "$f" ]; then
      MAIN_FILE="$f"
      # Vérifier environnement virtuel
      if [ -d "venv" ] || [ -d "env" ]; then
        COMMAND="./venv/bin/python $f"
      else
        COMMAND="python3 $f"
      fi
      break
    fi
  done
else
  # Recherche manuelle
  for f in index.js main.js app.js main.py app.py index.py; do
    if [ -f "$f" ]; then
      MAIN_FILE="$f"
      if [[ "$f" == *.js ]]; then
        COMMAND="node $f"
      elif [[ "$f" == *.py ]]; then
        COMMAND="python3 $f"
      fi
      break
    fi
  done
fi

# Si aucun fichier trouvé
if [ -z "$MAIN_FILE" ]; then
  echo "❌ ERREUR : Aucun fichier principal trouvé. Veuillez spécifier le fichier d'entrée."
  exit 1
fi

# Générer la date
DATE=$(date +%Y-%m-%d)

# Lire le template
TEMPLATE_FILE="$(dirname "$0")/../assets/lanceur-template.md"
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "❌ ERREUR : Template de lanceur introuvable"
  exit 1
fi

# Générer les scripts
LANCEUR_SH="lanceur-$DATE.sh"
LANCEUR_BAT="lanceur-$DATE.bat"

sed "s|{{DATE}}|$DATE|g; s|{{MAIN_FILE}}|$MAIN_FILE|g; s|{{COMMAND}}|$COMMAND|g" "$TEMPLATE_FILE" | head -n 10 > "$LANCEUR_SH"
sed "s|{{DATE}}|$DATE|g; s|{{MAIN_FILE}}|$MAIN_FILE|g; s|{{COMMAND}}|$COMMAND|g" "$TEMPLATE_FILE" | tail -n +11 > "$LANCEUR_BAT"

# Rendre exécutable
chmod +x "$LANCEUR_SH"

echo "✅ Lanceurs créés :"
echo "   - $LANCEUR_SH (Unix)"
echo "   - $LANCEUR_BAT (Windows)"

exit 0
=== FIN ===

=== FICHIER: .claude/skills/creer-lanceur/.gitkeep ===
# Fichier pour maintenir le dossier dans Git
=== FIN ===

À vérifier :
- Si ton projet est Node.js, assure-toi que `package.json` existe et contient un script `start`.
- Si ton projet est Python, vérifie que `venv/` ou `env/` est utilisé si nécessaire.
- Le fichier principal (ex: `index.js`, `main.py`) doit exister dans la racine.
- Si tu utilises un autre langage (Go, Rust, etc.), adapte le script en ajoutant une étape manuelle.