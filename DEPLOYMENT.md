# Guide de Déploiement Vercel

## Étapes rapides

### 1. Préparer Turso (Base de données)

1. Créer un compte sur [turso.tech](https://turso.tech)
2. Créer une nouvelle base de données
3. Récupérer:
   - L'URL de connexion (format: `libsql://xxx-xxx.turso.io`)
   - Le token d'authentification (dans les paramètres de la base de données)

### 2. Déployer sur Vercel

1. **Connecter le repository**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "Add New Project"
   - Importer votre repository GitHub/GitLab/Bitbucket

2. **Configurer les variables d'environnement**
   
   Dans Vercel → Settings → Environment Variables, ajouter:

   | Variable | Valeur | Description |
   |----------|--------|-------------|
   | `DATABASE_URL` | `libsql://xxx-xxx.turso.io` | URL de votre base Turso |
   | `TURSO_AUTH_TOKEN` | `your-token-here` | Token d'authentification Turso |
   | `AUTH_SECRET` | `[généré]` | Secret pour NextAuth (voir ci-dessous) |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` | URL de votre application (optionnel) |

   **Générer AUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

   ⚠️ **Important**: Ajouter ces variables pour **tous les environnements** (Production, Preview, Development)

3. **Déployer**
   - Vercel détectera automatiquement Next.js
   - Le build inclut `prisma generate` automatiquement
   - Après le premier déploiement, appliquer les migrations

4. **Appliquer les migrations Prisma**
   
   Option A - Via Vercel CLI:
   ```bash
   npm install -g vercel
   vercel login
   vercel env pull .env.local
   npx prisma migrate deploy
   ```
   
   Option B - Via Turso CLI:
   ```bash
   npm install -g @libsql/cli
   turso db shell your-database-name
   # Puis copier-coller le contenu de prisma/migrations/20260122094211_init/migration.sql
   ```

### 3. Vérifier le déploiement

1. ✅ L'application se charge sans erreur
2. ✅ La création de compte fonctionne
3. ✅ Les données sont persistées (créer un type de rendez-vous et vérifier dans Turso)
4. ✅ Le flux de réservation fonctionne

## Migration des données (optionnel)

Si vous avez des données en local que vous voulez migrer vers Turso:

1. Exporter les données de SQLite local
2. Importer dans Turso via leur interface ou CLI

## Dépannage

### Erreur: "DATABASE_URL is not defined"
- Vérifier que les variables d'environnement sont bien configurées dans Vercel
- Vérifier qu'elles sont ajoutées pour tous les environnements

### Erreur: "Prisma Client not generated"
- Le script `postinstall` devrait générer automatiquement
- Vérifier les logs de build dans Vercel
- Si nécessaire, ajouter manuellement `prisma generate` dans le build command

### Erreur de connexion à Turso
- Vérifier que `TURSO_AUTH_TOKEN` est bien configuré
- Vérifier que l'URL `DATABASE_URL` est correcte
- Vérifier que la base de données Turso est active

### Les migrations ne s'appliquent pas
- Exécuter manuellement: `npx prisma migrate deploy`
- Vérifier que le schéma Prisma est à jour
- Vérifier les logs dans Vercel pour voir les erreurs de migration
