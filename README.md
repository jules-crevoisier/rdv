# Reservy : plateforme de prise de rendez-vous

Next.js 16 · React 19 · Prisma 7 (PostgreSQL) · NextAuth v5 · Tailwind 4.

## Développement

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

## Déploiement

Docker / Dokploy : voir [DEPLOY.md](./DEPLOY.md).

## Design

Le front suit **tasteskill** (skill Claude `design-taste-frontend`, dans `.claude/skills`). Voir [CLAUDE.md](./CLAUDE.md).
