# Déploiement Docker / Dokploy

## Ce qui est fourni

- `Dockerfile` multi-stage sur `node:24-alpine`, build Next.js **standalone**, utilisateur non-root, `HEALTHCHECK` sur `/api/health`.
  - cible `runner` (par défaut) : l'app seule, ~280 Mo au total dont ~70 Mo propres à l'app (sharp retiré, pas de CLI Prisma).
  - cible `migrate` : lance `prisma migrate deploy` puis s'arrête.
- `docker-compose.yml` : `migrate` tourne d'abord, `app` ne démarre que si les migrations ont réussi.
- `.dockerignore` : exclut `.git`, `node_modules`, `.env*`, les skills Claude (`.claude`, ~40 Mo), etc.

## Dokploy (recommandé : type « Docker Compose »)

1. Créer une base **PostgreSQL** dans Dokploy (ou utiliser une base existante) et copier son URL interne.
2. Créer un service **Compose** → source GitHub `jules-crevoisier/rdv`, branche `master`, fichier `docker-compose.yml`.
3. Onglet **Environment** :
   ```
   DATABASE_URL=postgresql://user:password@<host-interne>:5432/rdv
   AUTH_SECRET=<openssl rand -base64 32>
   AUTH_URL=https://ton-domaine.fr
   ```
   (+ les variables Resend, voir « Emails » plus bas)
4. Onglet **Domains** : ajouter le domaine sur le service `app`, port `3000` (HTTPS via Let's Encrypt).
5. Activer **Autodeploy** (webhook GitHub) : chaque push sur `master` rebuild, migre puis redémarre.

### Variante type « Application » (Dockerfile seul)

Build type `Dockerfile`, port `3000`, mêmes variables. Les migrations ne sont alors pas lancées
automatiquement : les lancer une fois par changement de schéma avec
`docker build --target migrate -t rdv-migrate . && docker run --rm -e DATABASE_URL=... rdv-migrate`.

## Build sur GitHub (CI)

Le serveur n'a pas assez de mémoire pour compiler Next.js : à chaque push sur `master`, GitHub Actions
(`.github/workflows/deploy.yml`) construit les images `ghcr.io/jules-crevoisier/rdv` et `rdv-migrate`, les publie,
puis appelle l'API Dokploy (`compose.deploy`). Dokploy ne fait plus que télécharger les images et relancer.

- Secrets du dépôt GitHub : `DOKPLOY_URL` (https://srko.fr), `DOKPLOY_API_KEY` (Dokploy > Settings > Profile > API),
  `DOKPLOY_COMPOSE_ID` (id du compose rdv-app).
- Dans Dokploy, désactiver l'**Autodeploy** du compose : c'est la CI qui déclenche le déploiement, une fois les images prêtes.
- Les paquets ghcr.io doivent être **publics** (le dépôt l'est), sinon ajouter ghcr.io dans Dokploy > Registry.
- Relancer à la main : onglet Actions > Build et déploiement > Run workflow.
- Local : `docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build`.

## Emails (Resend)

Les emails (confirmation d'adresse, mot de passe oublié, notifications et rappels de rendez-vous) partent via [Resend](https://resend.com).

1. Dans Resend : **Domains → Add domain** (ex. `srko.fr`), ajouter chez le registrar les enregistrements DNS affichés (SPF, DKIM, et idéalement DMARC), attendre le statut *Verified*.
2. **API Keys → Create API key**, permission *Sending access*, limitée au domaine.
3. Dans Dokploy, onglet **Environment** du compose, ajouter :
   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM=Reservy <rdv@srko.fr>
   APP_URL=https://rdv.srko.fr
   CRON_SECRET=<openssl rand -hex 32>
   ```
   puis redéployer.

Sans `RESEND_API_KEY`, l'app fonctionne comme avant : aucun email ne part (leur contenu est écrit dans les logs) et
la confirmation d'adresse n'est pas exigée. Dès que Resend est configuré, les nouveaux comptes doivent confirmer leur
email avant de se connecter (`REQUIRE_EMAIL_VERIFICATION=false` pour désactiver). Les comptes existants sont marqués
confirmés par la migration.

### Rappels J-1

`/api/cron/reminders` envoie un rappel aux clients dont le rendez-vous confirmé est dans les 24 h. À appeler toutes
les heures. Dans Dokploy : **Schedules** (sur le compose, service `app`) → cron `0 * * * *`, commande :

```sh
wget -qO- --header="Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/reminders
```

### Bot Discord NDS

`/api/integrations/entretiens?event=Entretien%20NDS` renvoie les entretiens à venir de ce type de rendez-vous avec
leurs responsables (sans email ni téléphone des candidats). Il faut l'en-tête `Authorization: Bearer $INTEGRATION_TOKEN`.
Dans Dokploy, ajouter `INTEGRATION_TOKEN=<openssl rand -hex 32>` et mettre la même valeur dans `RDV_TOKEN` du bot.

## Connexion Google et Discord

Les boutons « Google » et « Discord » n'apparaissent que si leurs deux variables sont définies. Les comptes sont
retrouvés par email (adresse vérifiée chez le fournisseur) ou créés sans mot de passe ; « Mot de passe oublié »
permet d'en ajouter un plus tard.

1. **Google** : [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → OAuth consent screen
   (External, publié en production), puis Credentials → Create credentials → OAuth client ID → *Web application*.
   - Authorized JavaScript origins : `https://rdv.srko.fr`
   - Authorized redirect URIs : `https://rdv.srko.fr/api/auth/callback/google` et `https://rdv.srko.fr/api/auth/client/callback/google`
2. **Discord** : [Developer Portal](https://discord.com/developers/applications) → New Application → OAuth2.
   - Redirects : `https://rdv.srko.fr/api/auth/callback/discord` et `https://rdv.srko.fr/api/auth/client/callback/discord`
3. Dans Dokploy, onglet **Environment** du compose, ajouter puis redéployer :
   ```
   AUTH_GOOGLE_ID=...
   AUTH_GOOGLE_SECRET=...
   AUTH_DISCORD_ID=...
   AUTH_DISCORD_SECRET=...
   ```

Google exige une politique de confidentialité publique pour publier l'app : c'est `https://rdv.srko.fr/confidentialite`
(page d'accueil de l'app : `https://rdv.srko.fr`). Son adresse de contact vient de `CONTACT_EMAIL` (sinon `EMAIL_REPLY_TO`).

Deux URLs de retour par fournisseur : l'espace pro (`/api/auth`) et l'espace client (`/api/auth/client`) sont deux
sessions séparées.

## Santé

- `GET /api/health` → liveness (utilisé par Docker, ne touche pas la base).
- `GET /api/health?db=1` → vérifie aussi PostgreSQL (503 si la base est injoignable).

## En local

```bash
cp .env.example .env   # adapter DATABASE_URL (host accessible depuis Docker)
docker compose up -d --build
```
