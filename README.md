# Application de Gestion de Rendez-vous

Application Next.js pour la gestion de rendez-vous en ligne avec authentification, types d'événements, disponibilités et réservations.

## Technologies

- **Next.js 16** - Framework React
- **Prisma** - ORM pour la base de données
- **NextAuth.js** - Authentification
- **Turso (LibSQL)** - Base de données pour la production
- **SQLite** - Base de données pour le développement local
- **TailwindCSS** - Styling
- **TypeScript** - Typage statique

## Getting Started

### Prérequis

- Node.js 18+ 
- npm, yarn, pnpm ou bun

### Installation locale

1. Cloner le repository
```bash
git clone <repository-url>
cd rdv
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Éditer `.env` et configurer:
- `DATABASE_URL="file:./dev.db"` pour SQLite local
- `AUTH_SECRET` - Générer avec: `openssl rand -base64 32`

4. Initialiser la base de données
```bash
npx prisma migrate deploy
npx prisma generate
```

5. Lancer le serveur de développement
```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Déploiement sur Vercel

### Préparation

1. **Créer une base de données Turso** (recommandé pour la production)
   - Aller sur [turso.tech](https://turso.tech)
   - Créer un compte et une nouvelle base de données
   - Récupérer l'URL de connexion (format: `libsql://...`)
   - Récupérer le token d'authentification

2. **Préparer les migrations**
   - Les migrations Prisma sont déjà dans `prisma/migrations/`
   - Elles seront appliquées automatiquement lors du déploiement

### Déploiement

1. **Connecter le projet à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Importer votre projet GitHub/GitLab/Bitbucket
   - Vercel détectera automatiquement Next.js

2. **Configurer les variables d'environnement dans Vercel**
   
   Dans les paramètres du projet Vercel → Environment Variables, ajouter:

   ```
   DATABASE_URL=libsql://your-database-url.turso.io
   TURSO_AUTH_TOKEN=your-turso-auth-token
   AUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

   **Important**: 
   - Générer `AUTH_SECRET` avec: `openssl rand -base64 32`
   - Remplacer `your-app.vercel.app` par votre domaine Vercel réel
   - Ajouter ces variables pour tous les environnements (Production, Preview, Development)

3. **Appliquer les migrations**
   
   Après le premier déploiement, exécuter les migrations:
   ```bash
   npx prisma migrate deploy
   ```
   
   Ou via Vercel CLI:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

4. **Déployer**
   - Vercel déploiera automatiquement à chaque push sur la branche principale
   - Le build inclut automatiquement `prisma generate` grâce au script `postinstall`

### Configuration Vercel

Le fichier `vercel.json` est déjà configuré avec:
- Build command: `prisma generate && next build`
- Framework: Next.js
- Région: `cdg1` (Paris)

### Vérification post-déploiement

1. Vérifier que l'application se charge correctement
2. Tester la création de compte
3. Vérifier que les données sont bien persistées dans Turso
4. Tester le flux complet de réservation

## Structure du projet

```
├── app/                    # Pages et routes Next.js
│   ├── api/               # Routes API
│   ├── book/              # Pages de réservation publique
│   ├── event-types/        # Gestion des types de rendez-vous
│   └── appointments/       # Gestion des rendez-vous
├── components/             # Composants React réutilisables
├── lib/                    # Utilitaires et configuration
│   ├── db.ts              # Fonctions d'accès à la base de données
│   ├── prisma.ts          # Client Prisma configuré
│   └── utils.ts           # Fonctions utilitaires
├── prisma/                 # Configuration Prisma
│   ├── schema.prisma      # Schéma de la base de données
│   └── migrations/        # Migrations de base de données
└── public/                 # Fichiers statiques
```

## Scripts disponibles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Build de production (inclut `prisma generate`)
- `npm run start` - Lancer le serveur de production
- `npm run lint` - Lancer ESLint
- `npx prisma studio` - Ouvrir l'interface Prisma Studio pour la base de données
- `npx prisma migrate dev` - Créer une nouvelle migration (développement)
- `npx prisma migrate deploy` - Appliquer les migrations (production)

## Support

Pour plus d'informations:
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Turso](https://docs.turso.tech)
- [Documentation Vercel](https://vercel.com/docs)
