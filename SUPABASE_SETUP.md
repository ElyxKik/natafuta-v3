# Configuration Supabase pour Natafuta V3

## Étapes de configuration

### 1. Créer un compte Supabase
1. Aller sur https://supabase.com
2. Cliquer sur "Start your project"
3. S'inscrire avec email ou GitHub
4. Créer une nouvelle organisation et un nouveau projet

### 2. Obtenir la DATABASE_URL
1. Dans le dashboard Supabase, aller à **Settings** → **Database**
2. Copier la **Connection string** (URI)
3. Remplacer `[YOUR-PASSWORD]` par le mot de passe de la base de données
4. Format : `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?schema=public`

### 3. Mettre à jour .env.local
Remplacer la ligne `DATABASE_URL` dans `.env.local` :

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="natafuta-v3-secret-2026-rotate"
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-reasoner"
```

### 4. Exécuter les migrations Prisma
```bash
npx prisma migrate deploy
```

Cela va :
- Créer toutes les tables dans PostgreSQL
- Appliquer tous les schémas et relations
- Synchroniser avec les migrations existantes

### 5. Générer le client Prisma
```bash
npx prisma generate
```

### 6. Vérifier la connexion
```bash
npx prisma db push
```

### 7. Tester localement
```bash
npm run dev
```

## Points importants

- **Schéma changé** : SQLite → PostgreSQL (déjà fait dans `prisma/schema.prisma`)
- **Migrations** : Toutes les migrations SQLite seront appliquées à PostgreSQL
- **Fichiers locaux** : Les migrations historiques restent dans `prisma/migrations/`
- **Variables d'environnement** : Assurez-vous que `DATABASE_URL` est correctement configurée

## Troubleshooting

### Erreur : "password authentication failed"
- Vérifier le mot de passe dans la connection string
- Vérifier que le mot de passe ne contient pas de caractères spéciaux non échappés

### Erreur : "could not connect to server"
- Vérifier que le host Supabase est correct
- Vérifier la connexion internet
- Vérifier que le projet Supabase est actif

### Erreur : "relation does not exist"
- Exécuter `npx prisma migrate deploy` pour appliquer les migrations
- Vérifier que `DATABASE_URL` pointe vers la bonne base de données

## Après la configuration

1. Créer le premier utilisateur admin en base de données :
```sql
UPDATE "User" SET "isAdmin" = true, "userType" = 'agent' WHERE email = 'your@email.com';
```

2. Vérifier que les uploads de fichiers fonctionnent :
   - Les fichiers sont stockés dans `/public/uploads/` (local)
   - Pour la production, configurer un service de stockage (Supabase Storage ou AWS S3)

3. Configurer les variables d'environnement pour la production dans Vercel/Netlify
