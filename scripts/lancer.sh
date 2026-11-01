#!/bin/bash
# Lanceur macOS / Linux. Fermer la fenêtre arrête l'application.
set -m
cd "$(dirname "$0")/.."

API_PORT=3003
WEB_PORT=5175

if [ "$(uname)" = "Darwin" ]; then
  OPEN=open
else
  OPEN=xdg-open
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

NODE_MAJOR=24
if ! command -v npm >/dev/null 2>&1; then
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "Node.js est introuvable, installation de nvm (gestionnaire de versions Node)..."
    if ! curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash; then
      echo "Installation de nvm impossible (connexion internet ?)."
      echo "   Alternative : installer Node.js depuis https://nodejs.org puis relancer."
      read -r -p "Appuie sur Entrée pour fermer... "
      exit 1
    fi
    export NVM_DIR="$HOME/.nvm"
    . "$NVM_DIR/nvm.sh"
  fi
  echo "Installation de Node.js ${NODE_MAJOR} via nvm..."
  nvm install "$NODE_MAJOR" && nvm alias default "$NODE_MAJOR"
  echo "Node.js $(node --version) installé via nvm (désinstallation : supprimer ~/.nvm)."
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js reste introuvable après l'installation."
  read -r -p "Appuie sur Entrée pour fermer... "
  exit 1
fi

if curl -s --max-time 2 http://localhost:$API_PORT/api/health | grep -q ok \
   && curl -s -o /dev/null --max-time 2 http://localhost:$WEB_PORT; then
  echo "StudIA tourne déjà, ouverture de la page."
  "$OPEN" http://localhost:$WEB_PORT
  exit 0
fi

# par port : d'autres projets lancent aussi « node --watch dist/main.js »
for P in $API_PORT $WEB_PORT; do
  PIDS="$(lsof -ti tcp:$P -sTCP:LISTEN 2>/dev/null)"
  if [ -n "$PIDS" ]; then
    echo "Nettoyage d'une instance précédente (port $P)..."
    kill $PIDS 2>/dev/null
    sleep 2
  fi
done

installe() {
  [ -e "node_modules/$1" ] || [ -e "client/node_modules/$1" ] || [ -e "server/node_modules/$1" ]
}

echo "Vérification des dépendances..."
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ] \
   || ! installe .bin/vite || ! installe .bin/tsc || ! installe node-llama-cpp || ! installe @nestjs/cqrs \
   || ! installe react-markdown || ! installe jszip || ! installe antd \
   || ! (cd client && node -e "require('rolldown')") >/dev/null 2>&1; then
  echo "Dépendances manquantes ou incomplètes, installation (quelques minutes)..."
  npm install
  echo "Dépendances installées."
else
  echo "Dépendances déjà installées (node_modules complet)."
fi

echo "Démarrage de StudIA..."
npm run dev &
DEV_PID=$!

cleanup() {
  echo ""
  echo "Arrêt de StudIA..."
  kill -- -"$DEV_PID" 2>/dev/null
  wait "$DEV_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM HUP EXIT

echo "Préparation en cours (compilation du serveur)..."
for _ in $(seq 1 90); do
  if curl -s --max-time 2 http://localhost:$API_PORT/api/health | grep -q ok \
     && curl -s -o /dev/null --max-time 2 http://localhost:$WEB_PORT; then
    "$OPEN" http://localhost:$WEB_PORT
    break
  fi
  sleep 1
done

echo ""
echo "StudIA est ouvert : http://localhost:$WEB_PORT"
if [ "$STUDIA_LAN" = "1" ]; then
  if [ "$(uname -s)" = "Darwin" ]; then
    LOCAL_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)"
  else
    LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi
  [ -n "$LOCAL_IP" ] && echo "Accès réseau local (STUDIA_LAN=1) : http://${LOCAL_IP}:$WEB_PORT"
fi
echo "   Les modèles se chargent au premier message (10 à 30 s pour un 30B)."
echo "   Laisse cette fenêtre ouverte pendant l'utilisation."
echo "   Pour arrêter : ferme cette fenêtre (ou Ctrl+C)."
wait "$DEV_PID"
