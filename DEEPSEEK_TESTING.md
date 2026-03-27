# 🧠 Guide de Test — DeepSeek R1 Integration

## Prérequis

1. **Clé API DeepSeek** configurée dans `.env.local` :
   ```env
   DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
   ```

2. **Serveur dev en cours d'exécution** :
   ```bash
   npm run dev
   ```

3. **Données de test chargées** :
   ```bash
   node scripts/seed.js
   ```

## Test 1 : Analyser une correspondance simple

### Objectif
Vérifier que DeepSeek R1 peut analyser une correspondance et retourner des facteurs détectés.

### Étapes

1. **Connexion**
   - URL : `http://localhost:3000/auth/login`
   - Email : `agent@test.com`
   - Mot de passe : `agent123`

2. **Accéder à la page IA**
   - URL : `http://localhost:3000/ai-matching`
   - Voir le tableau avec 6 correspondances en attente

3. **Analyser la première correspondance**
   - Cliquer sur le bouton **"Analyser IA"** pour la première ligne (Jean Mukanda)
   - Attendre 10-30 secondes (DeepSeek R1 réfléchit)

4. **Vérifier les résultats**
   - ✅ Score IA devrait être **95-100%** (correspondance parfaite)
   - ✅ Facteurs positifs : nom identique, âge identique, localisation identique
   - ✅ Recommandation : "Correspondance très probable"

### Résultat attendu
```
Score IA: 98%
Facteurs:
  ✅ Nom identique (Jean Mukanda = Jean Mukanda)
  ✅ Âge identique (8 ans = 8 ans)
  ✅ Localisation identique (Kinshasa, Gombe)
Recommandation: Procéder à la vérification et confirmation
```

---

## Test 2 : Analyser une correspondance croisée

### Objectif
Vérifier que DeepSeek R1 détecte les liens potentiels malgré les différences d'âge.

### Étapes

1. **Accéder à la page IA**
   - URL : `http://localhost:3000/ai-matching`

2. **Chercher la correspondance Jean ↔ Pierre**
   - Scroller jusqu'à trouver "Jean Mukanda" → "Pierre Mukanda"
   - Score algo : 65%

3. **Cliquer "Analyser IA"**
   - Attendre la réponse

4. **Vérifier les résultats**
   - ✅ Score IA devrait être **60-75%** (correspondance probable)
   - ✅ Facteurs positifs : même famille (Mukanda), même localisation
   - ✅ Facteurs négatifs : âges très différents (8 vs 15 ans)
   - ✅ Recommandation : "Vérifier lien de parenté"

### Résultat attendu
```
Score IA: 68%
Facteurs:
  ✅ Même patronyme (Mukanda)
  ✅ Même localisation (Kinshasa, Gombe)
  ❌ Âges très différents (8 ans vs 15 ans)
  ✅ Disparitions rapprochées (5 jours)
Recommandation: Contacter les familles pour vérifier lien de parenté
```

---

## Test 3 : Analyser les liens croisés

### Objectif
Vérifier que DeepSeek R1 détecte les liens cachés entre personnes disparues.

### Étapes

1. **Accéder à une fiche personne disparue**
   - URL : `http://localhost:3000/missing` (liste)
   - Cliquer sur "Jean Mukanda"

2. **Scroller jusqu'à "Liens croisés — DeepSeek R1"**
   - Section violette avec bouton "Analyser les liens"

3. **Cliquer "Analyser les liens"**
   - Attendre 15-40 secondes (analyse complète)

4. **Vérifier les résultats**
   - ✅ Devrait détecter **Pierre Mukanda** comme lien potentiel
   - ✅ Confidence : 70-85%
   - ✅ Raisons : même famille, même localisation, disparitions rapprochées

### Résultat attendu
```
Liens croisés détectés: 1

Pierre Mukanda (Frère potentiel) — 78%
  • Même patronyme (Mukanda)
  • Même localisation (Kinshasa, Gombe)
  • Disparitions rapprochées (5 jours d'écart)
  • Âges cohérents avec une fratrie
```

---

## Test 4 : Analyser en batch

### Objectif
Vérifier que l'analyse batch génère des résumés pour plusieurs correspondances.

### Étapes

1. **Accéder à la page IA**
   - URL : `http://localhost:3000/ai-matching`

2. **Cliquer "Analyser les 6 non-analysées"**
   - Bouton en haut à droite

3. **Attendre la completion**
   - Peut prendre 2-3 minutes (6 correspondances × 20-30 sec)

4. **Vérifier les résultats**
   - ✅ Tous les résumés générés
   - ✅ Statistiques mises à jour : "6 analysées"
   - ✅ Chaque correspondance a un résumé IA

### Résultat attendu
```
Statistiques:
  Correspondances: 6
  Analysées par IA: 6
  En attente d'analyse: 0
```

---

## Test 5 : Comparer scores algo vs IA

### Objectif
Vérifier que les scores IA complètent bien les scores algorithmiques.

### Étapes

1. **Accéder à la page correspondances**
   - URL : `http://localhost:3000/family-matches`

2. **Observer les colonnes**
   - **Score Algo** : score algorithmique (0.4 nom + 0.3 âge + 0.3 lieu)
   - **Score IA** : score DeepSeek R1 (analyse contextuelle)

3. **Comparer pour chaque correspondance**
   - Jean ↔ Jean : Algo 95% vs IA ~98%
   - Jean ↔ Pierre : Algo 65% vs IA ~70%
   - Fatima ↔ Amara : Algo 72% vs IA ~75%

### Résultat attendu
```
Correspondance          | Algo | IA  | Écart
Jean ↔ Jean            | 95%  | 98% | +3%
Pierre ↔ Pierre        | 92%  | 96% | +4%
Fatima ↔ Fatima        | 88%  | 92% | +4%
Amara ↔ Amara          | 90%  | 94% | +4%
Jean ↔ Pierre          | 65%  | 70% | +5%
Fatima ↔ Amara         | 72%  | 76% | +4%
```

---

## Dépannage

### Erreur : "DEEPSEEK_API_KEY non configurée"
```
Solution: Ajouter la clé dans .env.local
DEEPSEEK_API_KEY="sk-..."
Redémarrer le serveur: npm run dev
```

### Erreur : "Réponse IA invalide"
```
Cause: DeepSeek a retourné un format inattendu
Solution: 
  1. Vérifier les logs du serveur
  2. Vérifier que la clé API est valide
  3. Essayer une autre correspondance
```

### L'analyse prend trop longtemps (>60 sec)
```
Cause: DeepSeek R1 est lent (c'est normal)
Solution:
  1. Attendre 30-60 secondes
  2. Si timeout, vérifier la connexion internet
  3. Essayer avec deepseek-chat au lieu de deepseek-reasoner
```

### Les correspondances n'apparaissent pas
```
Cause: Pas connecté en tant qu'agent
Solution:
  1. Vérifier que tu es connecté avec agent@test.com
  2. Vérifier que userType = 'agent' dans la base
  3. Redémarrer la session
```

### Aucun lien croisé détecté
```
Cause: DeepSeek n'a pas trouvé de liens significatifs
Solution:
  1. C'est normal si confidence < 40%
  2. Vérifier les données de test (même famille, même lieu?)
  3. Essayer avec d'autres fiches
```

---

## Métriques de succès

### ✅ Tous les tests réussis si :
1. **Test 1** : Score IA > 90% pour correspondance directe
2. **Test 2** : Score IA 60-75% pour correspondance croisée
3. **Test 3** : Liens croisés détectés avec confiance > 70%
4. **Test 4** : Tous les résumés générés sans erreur
5. **Test 5** : Scores IA > scores algo (amélioration contextuelle)

### 📊 Métriques attendues
- **Temps d'analyse** : 10-30 sec par correspondance
- **Taux de succès** : 100% (pas d'erreurs)
- **Amélioration IA** : +3-5% par rapport à l'algo
- **Liens détectés** : 2 liens croisés (Jean↔Pierre, Fatima↔Amara)

---

## Notes techniques

### Prompts utilisés

#### Analyse (analyze)
```
Tu es un expert en recherche de personnes disparues en Afrique centrale.
Analyse ces deux profils et évalue la probabilité qu'ils soient liés.
Considère: noms, âge, localisation, description physique, conditions médicales.
Retourne: confidence (0-100), factors (positifs/négatifs), summary, recommendation
```

#### Prédiction (predict)
```
Voici une liste de personnes disparues. Identifie celles qui pourraient être liées.
Cherche: même famille, même zone, mêmes circonstances, même ethnie.
Retourne: crossLinks avec confidence >= 40
```

### Modèles disponibles
- `deepseek-reasoner` (R1) : Plus lent, meilleure qualité, avec reasoning
- `deepseek-chat` (V3) : Plus rapide, qualité acceptable

### Coûts API (estimation)
- **Analyze** : ~500 tokens input, ~300 tokens output = $0.0005
- **Predict** : ~2000 tokens input, ~1000 tokens output = $0.002
- **Summarize** : ~400 tokens input, ~200 tokens output = $0.0003

---

## Prochaines étapes

1. **Configurer la vraie clé API DeepSeek**
2. **Exécuter tous les tests**
3. **Ajuster les prompts si nécessaire**
4. **Monitorer les coûts API**
5. **Déployer en production**
