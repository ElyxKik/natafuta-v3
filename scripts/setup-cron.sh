#!/bin/bash

# Script pour configurer un cron job qui maintient la base de données Supabase active
# Exécute le keep-alive script toutes les 6 heures

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
KEEP_ALIVE_SCRIPT="$SCRIPT_DIR/keep-alive.js"
LOG_FILE="$PROJECT_DIR/logs/keep-alive.log"

# Créer le répertoire logs s'il n'existe pas
mkdir -p "$PROJECT_DIR/logs"

# Ajouter le cron job (toutes les 6 heures)
# Format: minute heure jour mois jour_semaine commande
CRON_JOB="0 */6 * * * cd $PROJECT_DIR && node $KEEP_ALIVE_SCRIPT >> $LOG_FILE 2>&1"

# Vérifier si le cron job existe déjà
if crontab -l 2>/dev/null | grep -q "keep-alive.js"; then
  echo "✓ Le cron job keep-alive existe déjà"
else
  # Ajouter le cron job
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "✓ Cron job configuré avec succès"
  echo "  Exécution: toutes les 6 heures"
  echo "  Log: $LOG_FILE"
fi

# Afficher les cron jobs actuels
echo ""
echo "Cron jobs actuels:"
crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$"
