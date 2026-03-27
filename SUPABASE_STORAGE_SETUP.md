# Configuration Supabase Storage - Natafuta V3

## Étapes de configuration

### 1. Créer un bucket Supabase Storage
1. Aller sur https://lmqmvtjegttakmymlgvv.supabase.co
2. Aller à **Storage** → **Buckets**
3. Cliquer sur **Create a new bucket**
4. Nom : `natafuta-images`
5. Cocher **Public bucket** (pour accès public aux images)
6. Cliquer **Create bucket**

### 2. Obtenir les clés API Supabase
1. Aller à **Settings** → **API**
2. Copier :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Mettre à jour `.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://lmqmvtjegttakmymlgvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key_ici
```

### 4. Configurer les permissions du bucket
Dans le dashboard Supabase, aller à **Storage** → **natafuta-images** → **Policies**

Ajouter une politique pour permettre les uploads :
```sql
-- Permettre les uploads authentifiés
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'natafuta-images'
  AND auth.role() = 'authenticated'
);

-- Permettre la lecture publique
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'natafuta-images');

-- Permettre la suppression par l'uploader
CREATE POLICY "Allow delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'natafuta-images'
  AND auth.uid() = owner
);
```

## Structure du bucket

```
natafuta-images/
├── missing-persons/
│   ├── [missing-person-id]-[timestamp].jpg
│   └── [missing-person-id]-[timestamp].png
└── temp/
    └── [temp-file-id].jpg
```

## Utilisation dans l'application

### Upload d'image
```typescript
import { uploadImage, MISSING_PERSON_FOLDER } from '@/lib/supabase';

const file = new File([...], 'photo.jpg');
const result = await uploadImage(file, MISSING_PERSON_FOLDER, `${personId}-${Date.now()}.jpg`);

if (result) {
  console.log('URL publique:', result.publicUrl);
  console.log('Chemin:', result.path);
}
```

### Affichage d'image
```typescript
import { getPublicUrl } from '@/lib/supabase';

const publicUrl = getPublicUrl('missing-persons/person-id-123.jpg');
// Utiliser dans une balise <img>
<img src={publicUrl} alt="Photo" />
```

### Suppression d'image
```typescript
import { deleteImage } from '@/lib/supabase';

await deleteImage('missing-persons/person-id-123.jpg');
```

## Variables d'environnement

### Publiques (visibles dans le navigateur)
- `NEXT_PUBLIC_SUPABASE_URL` — URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clé anonyme (lecture/upload seulement)

### Privées (serveur uniquement)
- `SUPABASE_SERVICE_ROLE_KEY` — Clé de service (admin, optionnel)

## Limites et quotas

- **Taille max par fichier** : 5 GB (configurable)
- **Stockage total** : Dépend du plan Supabase
- **Bande passante** : Illimitée pour les buckets publics

## Troubleshooting

### Erreur : "Bucket does not exist"
- Vérifier que le bucket `natafuta-images` existe
- Vérifier le nom du bucket (sensible à la casse)

### Erreur : "Invalid API key"
- Vérifier que `NEXT_PUBLIC_SUPABASE_ANON_KEY` est correct
- Vérifier que `NEXT_PUBLIC_SUPABASE_URL` est correct

### Images ne s'affichent pas
- Vérifier que le bucket est **public**
- Vérifier les politiques d'accès
- Vérifier l'URL publique générée

### Uploads échouent
- Vérifier les politiques d'accès du bucket
- Vérifier que l'utilisateur est authentifié
- Vérifier la taille du fichier

## Prochaines étapes

1. Créer le bucket `natafuta-images`
2. Obtenir les clés API
3. Mettre à jour `.env`
4. Configurer les politiques d'accès
5. Tester l'upload et l'affichage
