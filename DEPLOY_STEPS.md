# Étapes de déploiement - Guide rapide

## ✅ Étape 1 : Créer une nouvelle migration PostgreSQL

Les migrations SQLite existantes ne fonctionnent pas avec PostgreSQL. Il faut créer de nouvelles migrations.

```bash
# Option A : Supprimer les anciennes migrations SQLite et repartir de zéro
rm -rf prisma/migrations

# Créer une nouvelle migration initiale pour PostgreSQL
npx prisma migrate dev --name init_postgres
```

**OU** si vous voulez garder l'historique :

```bash
# Option B : Créer une nouvelle migration basée sur le schéma actuel
npx prisma migrate dev --name init_postgres --create-only
# Puis éditez le fichier SQL généré si nécessaire
npx prisma migrate dev
```

## ✅ Étape 2 : Tester localement (optionnel mais recommandé)

1. Créez un fichier `.env.local` avec vos variables Vercel :

```env
DATABASE_PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=VOTRE_CLE"
DATABASE_POSTGRES_URL="postgres://393c973208c9aaec6de6b19392a89b700d3cd4c2ed802b9d03aef988aa98f469:sk_571QDUGAkJl6omsD9-0pd@db.prisma.io:5432/postgres?sslmode=require"
AUTH_SECRET="votre-secret-ici"
```

2. Générez le client Prisma :

```bash
npx prisma generate
```

3. Testez que tout fonctionne :

```bash
npm run dev
```

## ✅ Étape 3 : Pousser le code sur GitHub

```bash
# Vérifiez que tous les fichiers sont bien commités
git status

# Ajoutez tous les fichiers modifiés
git add .

# Commitez
git commit -m "Configure for Vercel Postgres deployment"

# Poussez sur GitHub
git push origin main
```

## ✅ Étape 4 : Configurer les variables d'environnement dans Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet (ou créez-en un nouveau)
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez ces 3 variables :

### Variable 1 : DATABASE_PRISMA_DATABASE_URL
- **Valeur** : `prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza181NzFRRFVHQWtKbDZvbXNEOS0wcGQiLCJhcGlfa2V5IjoiMDFLRkpTUE0wSFQ2N1dKQUE0VFRNRkI3NDIiLCJ0ZW5hbnRfaWQiOiIzOTNjOTczMjA4YzlhYWVjNmRlNmIxOTM5MmE4OWI3MDBkM2NkNGMyZWQ4MDJiOWQwM2FlZjk4OGFhOThmNDY5IiwiaW50ZXJuYWxfc2VjcmV0IjoiYWVhODNjZGItZDNlNS00ZWRkLWI2MmMtM2JmOTU3ODIwODZhIn0.dtljW4RaaNuWv4tAS47xvrabwYHYAr4rRffaczlyFnI`
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development

### Variable 2 : DATABASE_POSTGRES_URL
- **Valeur** : `postgres://393c973208c9aaec6de6b19392a89b700d3cd4c2ed802b9d03aef988aa98f469:sk_571QDUGAkJl6omsD9-0pd@db.prisma.io:5432/postgres?sslmode=require`
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development

### Variable 3 : AUTH_SECRET
- **Valeur** : Générez-en un avec cette commande :
  ```bash
  openssl rand -base64 32
  ```
  Ou utilisez : https://generate-secret.vercel.app/32
- **Environnements** : ✅ Production, ✅ Preview, ✅ Development

### Variable 4 : NEXTAUTH_URL (optionnel)
- **Valeur** : L'URL de votre application Vercel (ex: `https://votre-app.vercel.app`)
- **Environnements** : ✅ Production uniquement

## ✅ Étape 5 : Déployer sur Vercel

### Si vous n'avez pas encore créé le projet Vercel :

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Cliquez sur **Add New** → **Project**
3. Importez votre dépôt GitHub
4. Vercel détectera automatiquement Next.js
5. Les variables d'environnement seront déjà configurées (si vous les avez ajoutées avant)
6. Cliquez sur **Deploy**

### Si le projet existe déjà :

1. Allez sur votre projet Vercel
2. Vercel redéploiera automatiquement si vous avez poussé sur GitHub
3. OU allez dans **Deployments** → Cliquez sur les **...** → **Redeploy**

## ✅ Étape 6 : Exécuter les migrations

Après le premier déploiement, vous devez exécuter les migrations :

### Option 1 : Via Vercel CLI (recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet (si pas déjà fait)
vercel link

# Exécuter les migrations
npx prisma migrate deploy
```

### Option 2 : Via le script de build automatique

Le script `vercel-build` dans `package.json` exécute automatiquement les migrations lors du build. Vérifiez les logs de déploiement dans Vercel pour confirmer.

## ✅ Étape 7 : Vérifier le déploiement

1. Visitez l'URL de votre application Vercel
2. Testez la création d'un compte
3. Testez la création d'un type de rendez-vous
4. Vérifiez que les données sont bien sauvegardées

## 🔧 Dépannage

### Erreur "DATABASE_PRISMA_DATABASE_URL is not defined"
- Vérifiez que la variable est bien configurée dans Vercel
- Vérifiez qu'elle est disponible pour tous les environnements

### Erreur de migration
- Vérifiez que `DATABASE_POSTGRES_URL` est bien configurée
- Exécutez manuellement : `npx prisma migrate deploy`

### Erreur de connexion
- Vérifiez que les URLs sont correctes (sans espaces)
- Vérifiez que la base de données Vercel Postgres est active

## 📝 Checklist finale

- [ ] Migration PostgreSQL créée
- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Projet déployé sur Vercel
- [ ] Migrations exécutées
- [ ] Application testée et fonctionnelle
