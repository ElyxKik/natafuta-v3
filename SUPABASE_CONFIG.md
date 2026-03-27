# Configuration Supabase - Natafuta V3

## Projet Supabase
- **URL** : https://lmqmvtjegttakmymlgvv.supabase.co
- **Projet ID** : lmqmvtjegttakmymlgvv

## Configuration DATABASE_URL

### Étape 1 : Obtenir le mot de passe de la base de données
1. Aller sur https://lmqmvtjegttakmymlgvv.supabase.co
2. Se connecter au dashboard Supabase
3. Aller à **Settings** → **Database**
4. Copier la **Connection string** ou le mot de passe

### Étape 2 : Mettre à jour .env.local
Remplacer `[PASSWORD]` dans `.env.local` par le mot de passe réel :

**Avant** :
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@lmqmvtjegttakmymlgvv.supabase.co:5432/postgres?schema=public"
```

**Après** (exemple) :
```env
DATABASE_URL="postgresql://postgres:your_actual_password_here@lmqmvtjegttakmymlgvv.supabase.co:5432/postgres?schema=public"
```

### Étape 3 : Exécuter les migrations
```bash
npx prisma migrate deploy
```

### Étape 4 : Générer le client Prisma
```bash
npx prisma generate
```

### Étape 5 : Tester la connexion
```bash
npx prisma db execute --stdin < /dev/null
```

### Étape 6 : Démarrer l'application
```bash
npm run dev
```

## Informations de connexion
- **Host** : lmqmvtjegttakmymlgvv.supabase.co
- **Port** : 5432
- **Database** : postgres
- **User** : postgres
- **Password** : [À obtenir du dashboard Supabase]

## Troubleshooting

### Erreur : "password authentication failed"
- Vérifier que le mot de passe est correct
- Vérifier qu'il n'y a pas d'espaces avant/après le mot de passe
- Vérifier que les caractères spéciaux sont correctement échappés

### Erreur : "could not connect to server"
- Vérifier la connexion internet
- Vérifier que le projet Supabase est actif
- Vérifier que l'URL du projet est correcte

### Erreur : "relation does not exist"
- Exécuter `npx prisma migrate deploy`
- Vérifier que la migration s'est bien appliquée
- Vérifier que `DATABASE_URL` pointe vers la bonne base de données
