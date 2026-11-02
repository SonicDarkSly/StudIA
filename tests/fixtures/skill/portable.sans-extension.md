Je vais créer une skill qui ajoute un lanceur double-clic multiplateforme (macOS, Linux, Windows) à un projet, en suivant les conventions de vos projets existants. Cette skill s’active automatiquement quand l’utilisateur demande d’ajouter un « lanceur », « raccourci », « exécutable », ou « fichier .app / .sh / .exe » pour démarrer le projet.

---

=== FICHIER: .agents/skills/ajouter-lanceur-multitache/SKILL.md ===
---
name: ajouter-lanceur-multitache
description: Ajoute un lanceur double-clic fonctionnel sur macOS, Linux et Windows à un projet. À utiliser quand l'utilisateur demande un « lanceur », « raccourci », « fichier .app », « exécutable », ou « démarrage par double-clic » pour le projet.
---
### Étapes

1. **Identifier le type de projet**  
   Vérifiez si le projet contient un `package.json` (Node.js), un `pyproject.toml` ou `setup.py` (Python), un `Cargo.toml` (Rust), ou aucun fichier de gestion de dépendances.  
   - Si `package.json` existe : le projet est Node.js.  
   - Si `pyproject.toml` ou `setup.py` existe : le projet est Python.  
   - Si `Cargo.toml` existe : le projet est Rust.  
   - Sinon : supposer un projet générique (exécutable via `./run.sh` ou `main.py`).  

   *Pourquoi ?* Le lanceur doit exécuter la commande correcte selon le langage du projet.

2. **Déterminer la commande d’exécution**  
   - Pour Node.js : utilisez `npm start` ou `node index.js` (si `index.js` existe).  
   - Pour Python : utilisez `python main.py` ou `python app.py`.  
   - Pour Rust : utilisez `cargo run` (si `main.rs` existe).  
   - Sinon : utilisez `./run.sh` si présent, sinon `./main.py` ou `./app.js`.  

   *Pourquoi ?* Le lanceur doit lancer le bon point d’entrée du projet.

3. **Créer les fichiers du lanceur**  
   Créez les fichiers suivants dans le dossier racine du projet :
   - `lanceur.sh` (Linux/macOS) : script shell exécutable.
   - `lanceur.app` (macOS) : dossier `.app` avec un `Contents/MacOS/lanceur` et `Contents/Info.plist`.
   - `lanceur.exe` (Windows) : fichier `.exe` généré via `pyinstaller` ou `pkg` (selon le langage).

   *Pourquoi ?* Chaque OS a son format natif pour les lanceurs double-clic.

4. **Générer `lanceur.sh`**  
   Créez un script exécutable `lanceur.sh` avec ce contenu :
   ```bash
   #!/bin/bash
   # Lanceur double-clic pour projet Node.js, Python ou générique
   set -e

   echo "Lancement du projet..."

   # Détection du langage
   if [ -f package.json ]; then
     npm start
   elif [ -f pyproject.toml ] || [ -f setup.py ]; then
     python main.py
   elif [ -f Cargo.toml ]; then
     cargo run
   else
     if [ -f ./run.sh ]; then
       ./run.sh
     elif [ -f ./main.py ]; then
       python main.py
     elif [ -f ./app.js ]; then
       node app.js
     else
       echo "Erreur : aucun point d'entrée trouvé."
       exit 1
     fi
   fi
   ```
   Rendez-le exécutable : `chmod +x lanceur.sh`.

   *Pourquoi ?* Le script est portable, déclenche automatiquement la bonne commande.

5. **Générer `lanceur.app` (macOS)**  
   Créez un dossier `lanceur.app` avec cette structure :
   ```
   lanceur.app/
   ├── Contents/
   │   ├── Info.plist
   │   └── MacOS/
   │       └── lanceur
   ```
   - `Contents/Info.plist` :  
     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
     <plist version="1.0">
     <dict>
         <key>CFBundleDevelopmentRegion</key>
         <string>en</string>
         <key>CFBundleExecutable</key>
         <string>lanceur</string>
         <key>CFBundleIdentifier</key>
         <string>fr.example.lanceur</string>
         <key>CFBundleName</key>
         <string>Lanceur</string>
         <key>CFBundlePackageType</key>
         <string>APPL</string>
         <key>CFBundleShortVersionString</key>
         <string>1.0</string>
         <key>CFBundleVersion</key>
         <string>1.0</string>
     </dict>
     </plist>
     ```
   - `Contents/MacOS/lanceur` :  
     ```bash
     #!/bin/bash
     cd "$(dirname "$0")/.." || exit 1
     ./lanceur.sh
     ```

   Rendez `lanceur` exécutable : `chmod +x lanceur.app/Contents/MacOS/lanceur`.

   *Pourquoi ?* macOS nécessite un dossier `.app` structuré pour les lanceurs double-clic.

6. **Générer `lanceur.exe` (Windows)**  
   - Si projet Node.js : utilisez `pkg` pour créer un exécutable.  
     Installez `pkg` si nécessaire : `npm install -g pkg`.  
     Lancez : `pkg ./lanceur.sh --output lanceur.exe`.  
   - Si projet Python : utilisez `pyinstaller` :  
     Installez `pyinstaller` : `pip install pyinstaller`.  
     Lancez : `pyinstaller --onefile --windowed main.py --name lanceur`.  
     Copiez le fichier `dist/lanceur.exe` dans le dossier racine.  
   - Sinon : utilisez `bash scripts/generer-exe.sh` (voir ci-dessous).

   *Pourquoi ?* Windows ne peut pas exécuter directement les scripts shell.

7. **Fournir un script d’automatisation (facultatif, mais recommandé)**  
   Créez `scripts/generer-lanceur.sh` pour automatiser la génération :
   ```bash
   #!/bin/bash
   # Génère les lanceurs pour macOS, Linux et Windows
   set -e

   echo "Génération des lanceurs..."

   # Créer lanceur.sh
   cat > lanceur.sh << 'EOF'
   #!/bin/bash
   set -e
   echo "Lancement du projet..."
   if [ -f package.json ]; then
     npm start
   elif [ -f pyproject.toml ] || [ -f setup.py ]; then
     python main.py
   elif [ -f Cargo.toml ]; then
     cargo run
   else
     if [ -f ./run.sh ]; then
       ./run.sh
     elif [ -f ./main.py ]; then
       python main.py
     elif [ -f ./app.js ]; then
       node app.js
     else
       echo "Erreur : aucun point d'entrée trouvé."
       exit 1
     fi
   fi
   EOF

   chmod +x lanceur.sh

   # Créer lanceur.app (macOS)
   mkdir -p lanceur.app/Contents/MacOS
   cat > lanceur.app/Contents/Info.plist << 'EOF'
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>CFBundleDevelopmentRegion</key>
       <string>en</string>
       <key>CFBundleExecutable</key>
       <string>lanceur</string>
       <key>CFBundleIdentifier</key>
       <string>fr.example.lanceur</string>
       <key>CFBundleName</key>
       <string>Lanceur</string>
       <key>CFBundlePackageType</key>
       <string>APPL</string>
       <key>CFBundleShortVersionString</key>
       <string>1.0</string>
       <key>CFBundleVersion</key>
       <string>1.0</string>
   </dict>
   </plist>
   EOF

   cat > lanceur.app/Contents/MacOS/lanceur << 'EOF'
   #!/bin/bash
   cd "$(dirname "$0")/.." || exit 1
   ./lanceur.sh
   EOF

   chmod +x lanceur.app/Contents/MacOS/lanceur

   # Générer lanceur.exe (Windows)
   if [ -f package.json ]; then
     if ! command -v pkg &> /dev/null; then
       echo "Installation de pkg..."
       npm install -g pkg
     fi
     pkg ./lanceur.sh --output lanceur.exe
   elif [ -f pyproject.toml ] || [ -f setup.py ]; then
     if ! command -v pyinstaller &> /dev/null; then
       echo "Installation de pyinstaller..."
       pip install pyinstaller
     fi
     pyinstaller --onefile --windowed main.py --name lanceur
     cp dist/lanceur.exe .
   else
     echo "Aucun outil de génération d'exécutable trouvé pour ce type de projet."
     exit 1
   fi

   echo "Lanceurs générés : lanceur.sh, lanceur.app, lanceur.exe"
   ```

   *Pourquoi ?* Automatisation fiable et réutilisable.

8. **Vérifier les permissions**  
   Assurez-vous que `lanceur.sh` est exécutable (`chmod +x lanceur.sh`). Sur Windows, `lanceur.exe` doit être signé ou autorisé par le pare-feu si nécessaire.

9. **Documenter l’usage**  
   Ajoutez dans `README.md` (ou créez-le si absent) une section :
   ```markdown
   ## Lanceurs
   - Double-cliquez sur `lanceur.sh` pour démarrer le projet sous Linux/macOS.
   - Double-cliquez sur `lanceur.app` pour démarrer sous macOS.
   - Double-cliquez sur `lanceur.exe` pour démarrer sous Windows.
   ```

### Pièges
- ❌ Oublier de rendre `lanceur.sh` exécutable → **corriger avec `chmod +x lanceur.sh`**.
- ❌ Utiliser un chemin absolu dans le script → **toujours utiliser des chemins relatifs**.
- ❌ Ne pas générer `lanceur.exe` pour Python sans `pyinstaller` → **vérifier l’installation**.
- ❌ Créer `lanceur.app` sans `Info.plist` → **le fichier est obligatoire sur macOS**.

### Checklist
- [ ] Le projet contient un fichier de gestion (package.json, pyproject.toml, etc.)
- [ ] `lanceur.sh` existe et est exécutable
- [ ] `lanceur.app` a la structure correcte
- [ ] `lanceur.exe` est généré ou disponible
- [ ] Le script `scripts/generer-lanceur.sh` est présent
- [ ] Le README mentionne les lanceurs

### Fichiers de la skill
- `assets/lanceur.sh`: contient le script shell pour Linux/macOS.
- `assets/lanceur.app/Contents/Info.plist`: fichier de configuration macOS.
- `assets/lanceur.app/Contents/MacOS/lanceur`: script exécutable pour macOS.
- `scripts/generer-lanceur.sh`: script d’automatisation multiplateforme.
=== FIN ===

=== FICHIER: .agents/skills/ajouter-lanceur-multitache/assets/lanceur.sh ===
#!/bin/bash
# Lanceur double-clic pour projet Node.js, Python ou générique
set -e

echo "Lancement du projet..."

# Détection du langage
if [ -f package.json ]; then
  npm start
elif [ -f pyproject.toml ] || [ -f setup.py ]; then
  python main.py
elif [ -f Cargo.toml ]; then
  cargo run
else
  if [ -f ./run.sh ]; then
    ./run.sh
  elif [ -f ./main.py ]; then
    python main.py
  elif [ -f ./app.js ]; then
    node app.js
  else
    echo "Erreur : aucun point d'entrée trouvé."
    exit 1
  fi
fi
=== FIN ===

=== FICHIER: .agents/skills/ajouter-lanceur-multitache/assets/lanceur.app/Contents/Info.plist ===
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>lanceur</string>
    <key>CFBundleIdentifier</key>
    <string>fr.example.lanceur</string>
    <key>CFBundleName</key>
    <string>Lanceur</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
</dict>
</plist>
=== FIN ===

=== FICHIER: .agents/skills/ajouter-lanceur-multitache/assets/lanceur.app/Contents/MacOS/lanceur ===
#!/bin/bash
cd "$(dirname "$0")/.." || exit 1
./lanceur.sh
=== FIN ===

=== FICHIER: .agents/skills/ajouter-lanceur-multitache/scripts/generer-lanceur.sh ===
#!/bin/bash
# Génère les lanceurs pour macOS, Linux et Windows
set -e

echo "Génération des lanceurs..."

# Créer lanceur.sh
cat > lanceur.sh << 'EOF'
#!/bin/bash
set -e
echo "Lancement du projet..."
if [ -f package.json ]; then
  npm start
elif [ -f pyproject.toml ] || [ -f setup.py ]; then
  python main.py
elif [ -f Cargo.toml ]; then
  cargo run
else
  if [ -f ./run.sh ]; then
    ./run.sh
  elif [ -f ./main.py ]; then
    python main.py
  elif [ -f ./app.js ]; then
    node app.js
  else
    echo "Erreur : aucun point d'entrée trouvé."
    exit 1
  fi
fi
EOF

chmod +x lanceur.sh

# Créer lanceur.app (macOS)
mkdir -p lanceur.app/Contents/MacOS
cat > lanceur.app/Contents/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>lanceur</string>
    <key>CFBundleIdentifier</key>
    <string>fr.example.lanceur</string>
    <key>CFBundleName</key>
    <string>Lanceur</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
</dict>
</plist>
EOF

cat > lanceur.app/Contents/MacOS/lanceur << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.." || exit 1
./lanceur.sh
EOF

chmod +x lanceur.app/Contents/MacOS/lanceur

# Générer lanceur.exe (Windows)
if [ -f package.json ]; then
  if ! command -v pkg &> /dev/null; then
    echo "Installation de pkg..."
    npm install -g pkg
  fi
  pkg ./lanceur.sh --output lanceur.exe
elif [ -f pyproject.toml ] || [ -f setup.py ]; then
  if ! command -v pyinstaller &> /dev/null; then
    echo "Installation de pyinstaller..."
    pip install pyinstaller
  fi
  pyinstaller --onefile --windowed main.py --name lanceur
  cp dist/lanceur.exe .
else
  echo "Aucun outil de génération d'exécutable trouvé pour ce type de projet."
  exit 1
fi

echo "Lanceurs générés : lanceur.sh, lanceur.app, lanceur.exe"
=== FIN ===

=== FICHIER: .agents/skills/ajouter-lanceur-multitache/README.md ===
# Lanceur double-clic pour projet

Ce dossier contient les fichiers nécessaires à l'ajout d'un lanceur double-clic multiplateforme (macOS, Linux, Windows) au projet.

## Utilisation
- **Linux/macOS** : Double-cliquez sur `lanceur.sh` pour lancer le projet.
- **macOS** : Double-cliquez sur `lanceur.app` pour démarrer l'application.
- **Windows** : Double-cliquez sur `lanceur.exe` pour exé