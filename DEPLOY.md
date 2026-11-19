# Déploiement Docker / Dokploy

## Ce qui est fourni

- `Dockerfile` multi-stage sur `node:24-alpine`, build Next.js **standalone**, utilisateur non-root, `HEALTHCHECK` sur `/api/health`.
  - cible `runner` (par défaut) : l'app seule, ~280 Mo au total dont ~70 Mo propres à l'app (sharp retiré, pas de CLI Prisma).
  - cible `migrate` : lance `prisma migrate deploy` puis s'arrête.
- `docker-compose.yml` : `migrate` tourne d'abord, `app` ne démarre que si les migrations ont réussi.
- `.dockerignore` : exclut `.git`, `node_modules`, `.env*`, les skills Claude (`.claude`, ~40 Mo), etc.

## Dokploy (recommandé : type « Docker Compose »)

1. Créer une base **PostgreSQL** dans Dokploy (ou utiliser une base existante) et copier son URL interne.
2. Créer un service **Compose** → source GitHub `jules-crevoisier/rdv`, branche `main`, fichier `docker-compose.yml`.
3. Onglet **Environment** :
   ```
   DATABASE_URL=postgresql://user:password@<host-interne>:5432/rdv
   AUTH_SECRET=<openssl rand -base64 32>
   AUTH_URL=https://ton-domaine.fr
   ```
4. Onglet **Domains** : ajouter le domaine sur le service `app`, port `3000` (HTTPS via Let's Encrypt).
5. Activer **Autodeploy** (webhook GitHub) : chaque push sur `main` rebuild, migre puis redémarre.

### Variante type « Application » (Dockerfile seul)

Build type `Dockerfile`, port `3000`, mêmes variables. Les migrations ne sont alors pas lancées
automatiquement : les lancer une fois par changement de schéma avec
`docker build --target migrate -t rdv-migrate . && docker run --rm -e DATABASE_URL=... rdv-migrate`.

## Santé

- `GET /api/health` → liveness (utilisé par Docker, ne touche pas la base).
- `GET /api/health?db=1` → vérifie aussi PostgreSQL (503 si la base est injoignable).

## En local

```bash
cp .env.example .env   # adapter DATABASE_URL (host accessible depuis Docker)
docker compose up -d --build
```
