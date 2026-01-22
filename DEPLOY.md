# Guide de déploiement sur Vercel

Ce guide vous explique comment déployer Reservy sur Vercel avec Vercel Postgres.

## Prérequis

1. Un compte Vercel (gratuit)
2. Un compte GitHub (pour le dépôt)

## Étapes de déploiement

### 1. Préparer le dépôt Git

Assurez-vous que votre code est poussé sur GitHub :

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Créer un projet Vercel Postgres

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Cliquez sur **Storage** dans le menu de gauche
3. Cliquez sur **Create Database** → **Postgres**
4. Choisissez un nom pour votre base de données (ex: `reservy-db`)
5. Sélectionnez une région proche de vos utilisateurs
6. Cliquez sur **Create**

### 3. Créer un projet Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Cliquez sur **Add New** → **Project**
3. Importez votre dépôt GitHub
4. Vercel détectera automatiquement Next.js

### 4. Configurer les variables d'environnement

Dans les paramètres du projet Vercel :

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez les variables suivantes :

#### DATABASE_PRISMA_DATABASE_URL (requis)
- **Valeur** : URL Prisma Accelerate pour le client Prisma
  - Allez dans **Storage** → Votre base de données → **.env.local**
  - Copiez la valeur de `DATABASE_PRISMA_DATABASE_URL` (commence par `prisma+postgres://`)
- **Environnements** : Production, Preview, Development
- **Note** : Cette URL est utilisée par le client Prisma pour les requêtes (avec Accelerate)

#### DATABASE_POSTGRES_URL (requis pour les migrations)
- **Valeur** : URL PostgreSQL standard (nécessaire pour les migrations)
  - Allez dans **Storage** → Votre base de données → **.env.local**
  - Copiez la valeur de `DATABASE_POSTGRES_URL` (commence par `postgres://`)
- **Environnements** : Production, Preview, Development
- **Note** : Cette URL est utilisée uniquement pour les migrations Prisma (via `prisma.config.ts`)

#### AUTH_SECRET
- **Valeur** : Générez un secret sécurisé :
  ```bash
  openssl rand -base64 32
  ```
  Ou utilisez : https://generate-secret.vercel.app/32
- **Environnements** : Production, Preview, Development

#### NEXTAUTH_URL (optionnel mais recommandé)
- **Valeur** : L'URL de votre application Vercel (ex: `https://votre-app.vercel.app`)
- **Environnements** : Production

### 5. Exécuter les migrations Prisma

Après le premier déploiement, vous devez exécuter les migrations :

#### Option 1 : Via Vercel CLI (recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link

# Exécuter les migrations
npx prisma migrate deploy
```

#### Option 2 : Via Vercel Dashboard

1. Allez dans votre projet Vercel
2. Ouvrez l'onglet **Deployments**
3. Cliquez sur les trois points du dernier déploiement
4. Sélectionnez **Redeploy**
5. Dans les logs, vérifiez que les migrations s'exécutent

#### Option 3 : Via le script de build

Les migrations peuvent être exécutées automatiquement en ajoutant un script dans `package.json` :

```json
"scripts": {
  "vercel-build": "prisma migrate deploy && next build"
}
```

### 6. Vérifier le déploiement

1. Vercel déploiera automatiquement votre application
2. Une fois terminé, visitez l'URL fournie (ex: `https://votre-app.vercel.app`)
3. Testez la création d'un compte et la création de types de rendez-vous

## Configuration locale pour le développement

Pour développer localement avec Vercel Postgres :

1. Créez un fichier `.env.local` :

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
AUTH_SECRET="votre-secret-local"
```

2. Récupérez la `DATABASE_URL` depuis Vercel Dashboard → Storage → Votre DB → **.env.local**

3. Exécutez les migrations :

```bash
npx prisma migrate deploy
```

4. Générez le client Prisma :

```bash
npx prisma generate
```

5. Lancez le serveur de développement :

```bash
npm run dev
```

## Commandes utiles

```bash
# Générer le client Prisma
npx prisma generate

# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations (production)
npx prisma migrate deploy

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio
```

## Dépannage

### Erreur "DATABASE_URL is not defined"
- Vérifiez que les variables d'environnement sont bien configurées dans Vercel
- Assurez-vous que `DATABASE_URL` est disponible pour tous les environnements

### Erreur de connexion à la base de données
- Vérifiez que vous utilisez la bonne URL (avec SSL)
- Vérifiez que votre base de données Vercel Postgres est active

### Les migrations ne s'exécutent pas
- Vérifiez les logs de build dans Vercel
- Exécutez manuellement `npx prisma migrate deploy` via Vercel CLI

## Support

Pour plus d'informations :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Documentation Prisma](https://www.prisma.io/docs)
