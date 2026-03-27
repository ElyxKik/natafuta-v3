# Troubleshooting Supabase - Natafuta V3

## Erreur P1001: Can't reach database server

### Cause probable
La connexion au serveur Supabase est bloquée par :
- Un pare-feu local ou réseau
- Une restriction ISP
- Une configuration VPN
- Une restriction Supabase (IP whitelist)

### Solutions à essayer

#### 1. Vérifier la connectivité réseau
```bash
# Tester la résolution DNS
nslookup lmqmvtjegttakmymlgvv.supabase.co

# Tester la connectivité TCP
nc -zv lmqmvtjegttakmymlgvv.supabase.co 5432

# Ou avec telnet
telnet lmqmvtjegttakmymlgvv.supabase.co 5432
```

#### 2. Vérifier les paramètres réseau Supabase
1. Aller sur https://lmqmvtjegttakmymlgvv.supabase.co
2. Aller à **Settings** → **Network**
3. Vérifier que les restrictions IP ne bloquent pas ta connexion
4. Ajouter ton IP publique à la whitelist si nécessaire

#### 3. Utiliser un VPN ou proxy
Si ta connexion est bloquée, essayer :
- Un VPN public (NordVPN, ExpressVPN, etc.)
- Un proxy SOCKS5

#### 4. Alternative : Utiliser Supabase depuis le cloud
Si la connexion locale ne fonctionne pas, tu peux :
- Déployer l'application sur Vercel/Netlify (qui peut se connecter à Supabase)
- Utiliser GitHub Codespaces pour développer dans le cloud
- Utiliser un serveur VPS pour exécuter les migrations

#### 5. Vérifier les logs Supabase
1. Dans le dashboard Supabase, aller à **Logs**
2. Vérifier s'il y a des erreurs de connexion
3. Vérifier que le projet n'est pas suspendu

### Configuration alternative : Mode développement local

Si tu ne peux pas te connecter à Supabase depuis ta machine locale, tu peux :

1. **Revenir à SQLite pour le développement local** :
```bash
# Changer DATABASE_URL dans .env
DATABASE_URL="file:./prisma/dev.db"
```

2. **Utiliser Supabase en production** :
   - Configurer Supabase dans `.env.production`
   - Déployer l'application sur Vercel/Netlify
   - Les migrations s'exécuteront lors du déploiement

### Configuration recommandée

**Pour le développement local** :
```env
# .env.local
DATABASE_URL="file:./prisma/dev.db"
```

**Pour la production** :
```env
# .env.production
DATABASE_URL="postgresql://postgres:nat82000COngo@lmqmvtjegttakmymlgvv.supabase.co:5432/natafuta"
```

### Prochaines étapes

1. Tester la connectivité réseau avec les commandes ci-dessus
2. Vérifier les paramètres réseau Supabase
3. Si la connexion ne fonctionne pas, revenir à SQLite pour le développement local
4. Déployer l'application en production avec Supabase

### Contacts support
- Supabase Support : https://supabase.com/support
- Prisma Issues : https://github.com/prisma/prisma/issues
