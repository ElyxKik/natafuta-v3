# 📋 Données de Test — Natafuta V3

## Aperçu

La base de données a été remplie avec des données de test réalistes pour tester l'intégration DeepSeek R1 et toutes les fonctionnalités de matching familial.

## Identifiants de test

### Comptes utilisateurs

| Email | Mot de passe | Rôle | Permissions |
|---|---|---|---|
| `agent@test.com` | `agent123` | Agent | Créer fiches, analyser IA, vérifier correspondances |
| `visitor@test.com` | `visitor123` | Visiteur | Soumettre signalements, ajouter membres de famille |

## Données créées

### 1. Personnes disparues (4 fiches)

#### Jean Mukanda (8 ans) — 🔴 CRITIQUE
- **Localisation** : Kinshasa, Quartier Gombe
- **Disparu le** : 15 mars 2026
- **Conditions médicales** : Asthme léger
- **Description** : Petit pour son âge, uniforme bleu
- **Lien potentiel** : Pierre Mukanda (frère) — même famille, même quartier

#### Pierre Mukanda (15 ans) — 🟠 ÉLEVÉE
- **Localisation** : Kinshasa, Quartier Gombe
- **Disparu le** : 10 mars 2026
- **Description** : Grand, cicatrice sur la joue gauche
- **Lien potentiel** : Jean Mukanda (frère) — même famille, même quartier

#### Fatima Kasongo (32 ans) — 🟠 ÉLEVÉE
- **Localisation** : Lubumbashi, Quartier Katuba
- **Disparu le** : 28 février 2026
- **Conditions médicales** : Diabète type 2
- **Description** : Mère de trois enfants
- **Lien potentiel** : Amara Kasongo (enfant) — même famille, même quartier

#### Amara Kasongo (7 ans) — 🔴 CRITIQUE
- **Localisation** : Lubumbashi, Quartier Katuba
- **Disparu le** : 1er mars 2026
- **Description** : Petite fille avec natte
- **Lien potentiel** : Fatima Kasongo (mère) — même famille, même quartier

### 2. Correspondances familiales (6 matches)

#### Correspondances directes (scores algorithmiques élevés)
1. **Jean Mukanda** ↔ **Jean Mukanda** (recherche) — **95%** ✅
2. **Pierre Mukanda** ↔ **Pierre Mukanda** (recherche) — **92%** ✅
3. **Fatima Kasongo** ↔ **Fatima Kasongo** (recherche) — **88%** ✅
4. **Amara Kasongo** ↔ **Amara Kasongo** (recherche) — **90%** ✅

#### Correspondances croisées (à analyser par IA)
5. **Jean Mukanda** ↔ **Pierre Mukanda** (recherche) — **65%** 🔄
   - Même famille (Mukanda), même localisation (Gombe), âges différents
   
6. **Fatima Kasongo** ↔ **Amara Kasongo** (recherche) — **72%** 🔄
   - Même famille (Kasongo), même localisation (Katuba), disparitions rapprochées

### 3. Signalements (2 sightings)

1. **Jean Mukanda** — Gare routière, Kinshasa (16 mars) — ⏳ En attente
2. **Pierre Mukanda** — Marché Kasavubu, Kinshasa (18 mars) — ✅ Vérifié

## Scénarios de test

### Scénario 1 : Tester l'analyse IA d'une correspondance
1. Se connecter avec `agent@test.com` / `agent123`
2. Aller à `/family-matches`
3. Cliquer sur **"Analyse IA"** (lien en haut à droite)
4. Cliquer sur le bouton **"Analyser IA"** pour une correspondance
5. Attendre la réponse de DeepSeek R1
6. Voir les facteurs détectés, le score IA, et la recommandation

### Scénario 2 : Analyser les liens croisés entre personnes disparues
1. Se connecter avec `agent@test.com` / `agent123`
2. Aller à `/missing/[id]` (par exemple, la fiche de Jean Mukanda)
3. Scroller jusqu'à la section **"Liens croisés — DeepSeek R1"**
4. Cliquer sur **"Analyser les liens"**
5. Attendre que DeepSeek R1 compare avec les autres fiches
6. Voir les liens détectés (ex: Pierre Mukanda comme frère potentiel)

### Scénario 3 : Analyser en batch
1. Se connecter avec `agent@test.com` / `agent123`
2. Aller à `/ai-matching`
3. Cliquer sur **"Analyser les 6 non-analysées"**
4. Attendre que tous les résumés soient générés
5. Voir les statistiques mises à jour

### Scénario 4 : Comparer scores algo vs IA
1. Se connecter avec `agent@test.com` / `agent123`
2. Aller à `/family-matches`
3. Voir la colonne **"Score Algo"** vs **"Score IA"** (🧠)
4. Cliquer sur **"Analyse IA"** pour voir les détails complets

## Points clés à tester

### ✅ Matching algorithmique
- Les 4 correspondances directes (Jean↔Jean, Pierre↔Pierre, etc.) ont des scores élevés (88-95%)
- Les correspondances croisées (Jean↔Pierre, Fatima↔Amara) ont des scores moyens (65-72%)

### 🧠 Analyse DeepSeek R1
- **Facteurs positifs** : Même nom, même âge, même localisation
- **Facteurs négatifs** : Âges très différents (Jean 8 ans ↔ Pierre 15 ans)
- **Recommandations** : Vérifier les liens de parenté, contacter les familles

### 🔗 Liens croisés
- DeepSeek R1 devrait détecter que Jean et Pierre sont probablement frères
- DeepSeek R1 devrait détecter que Fatima et Amara sont probablement mère et enfant
- Les raisons : même famille (patronyme), même localisation, disparitions rapprochées

## Commandes utiles

### Réinitialiser la base de données
```bash
node scripts/seed.js
```

### Accéder à la base de données SQLite
```bash
sqlite3 prisma/dev.db
```

### Voir les correspondances en attente
```sql
SELECT * FROM FamilyMatch WHERE status = 'pending';
```

### Voir les personnes disparues actives
```sql
SELECT id, fullName, lastKnownLocation, urgencyLevel FROM MissingPerson WHERE status = 'active';
```

## Notes importantes

1. **Clé API DeepSeek** : Assure-toi que `DEEPSEEK_API_KEY` est configurée dans `.env.local`
2. **Modèle** : Le script utilise `deepseek-reasoner` (R1) par défaut
3. **Coûts** : Chaque appel à l'API DeepSeek a un coût. Teste d'abord avec une seule correspondance
4. **Temps de réponse** : DeepSeek R1 peut prendre 5-30 secondes pour répondre (reasoning)

## Résultats attendus

### Analyse d'une correspondance (Jean ↔ Jean)
```
Score IA: 95-100%
Facteurs positifs:
  ✅ Nom identique
  ✅ Âge identique
  ✅ Localisation identique
Recommandation: Correspondance très probable, procéder à la vérification
```

### Analyse de lien croisé (Jean ↔ Pierre)
```
Confidence: 70-85%
Relationship: Frère potentiel
Reasons:
  - Même patronyme (Mukanda)
  - Même localisation (Kinshasa, Gombe)
  - Disparitions rapprochées (5 jours d'écart)
  - Âges cohérents avec une fratrie
```

## Troubleshooting

### Erreur : "DEEPSEEK_API_KEY non configurée"
→ Ajoute ta clé dans `.env.local` ligne 4

### Erreur : "Réponse IA invalide"
→ DeepSeek a peut-être retourné un format inattendu. Vérifier les logs du serveur

### Les correspondances n'apparaissent pas
→ Vérifier que tu es connecté en tant qu'agent (`agent@test.com`)

### L'analyse IA prend trop longtemps
→ C'est normal pour `deepseek-reasoner`. Attendre 10-30 secondes
