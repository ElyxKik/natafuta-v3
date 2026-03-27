#!/bin/bash

# Script de migration Natafuta vers Supabase
# Usage: ./scripts/migrate-to-supabase.sh

set -e

echo "🚀 Migration Natafuta vers Supabase"
echo "===================================="
echo ""

# Vérifier que .env.local existe
if [ ! -f .env.local ]; then
    echo "❌ Erreur : .env.local non trouvé"
    echo "Créez .env.local en copiant .env.example et en remplissant DATABASE_URL"
    exit 1
fi

# Vérifier que DATABASE_URL est configuré
if ! grep -q "postgresql://" .env.local; then
    echo "❌ Erreur : DATABASE_URL ne contient pas de connection string PostgreSQL"
    echo "Mettez à jour .env.local avec votre DATABASE_URL Supabase"
    exit 1
fi

echo "✅ Configuration .env.local détectée"
echo ""

# Étape 1 : Générer le client Prisma
echo "📦 Étape 1 : Génération du client Prisma..."
npx prisma generate
echo "✅ Client Prisma généré"
echo ""

# Étape 2 : Appliquer les migrations
echo "🔄 Étape 2 : Application des migrations..."
npx prisma migrate deploy
echo "✅ Migrations appliquées"
echo ""

# Étape 3 : Synchroniser le schéma
echo "🔄 Étape 3 : Synchronisation du schéma..."
npx prisma db push --skip-generate
echo "✅ Schéma synchronisé"
echo ""

# Étape 4 : Vérifier la connexion
echo "🔍 Étape 4 : Vérification de la connexion..."
npx prisma db execute --stdin < /dev/null
echo "✅ Connexion à Supabase réussie"
echo ""

echo "🎉 Migration vers Supabase terminée avec succès!"
echo ""
echo "Prochaines étapes :"
echo "1. Créer le premier utilisateur admin :"
echo "   npx prisma studio"
echo "2. Tester l'application :"
echo "   npm run dev"
echo ""
