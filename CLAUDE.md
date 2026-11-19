# CLAUDE.md

Plateforme de prise de rendez-vous (Next.js 16 App Router, React 19, Prisma 7 + PostgreSQL, NextAuth v5, Tailwind 4, shadcn/ui).

## Design : tasteskill obligatoire

Ce projet utilise **tasteskill** (https://www.tasteskill.dev/, skill `design-taste-frontend`, installé dans `.claude/skills/design-taste-frontend`).

- **Toujours** charger et suivre le skill `design-taste-frontend` avant de créer, modifier, restyler ou relire une page, un composant UI, un écran du dashboard ou de la réservation.
- Respecter le design system existant (Tailwind 4 + shadcn/ui dans `components/ui`) en appliquant les règles du skill.
- Mettre à jour le skill : `npx skills add Leonxlnx/taste-skill --agent claude-code -y` (version figée dans `skills-lock.json`).

## Commandes

- `npm run dev` : serveur de dev
- `npm run build` : `prisma generate` + build Next (sortie `standalone`)
- `npm run lint` : ESLint
- `npx prisma migrate dev` : nouvelle migration en local

## Base de données

- `lib/prisma.ts` : client Prisma paresseux. PostgreSQL classique via `@prisma/adapter-pg` (`DATABASE_URL` ou `DATABASE_POSTGRES_URL`), ou Prisma Accelerate si `DATABASE_PRISMA_DATABASE_URL` commence par `prisma+`.
- Les migrations sont dans `prisma/migrations` et s'appliquent avec `prisma migrate deploy`.

## Déploiement

Docker + Dokploy : voir `DEPLOY.md`. Ne pas ajouter `next/image` sans retirer `images.unoptimized` et l'exclusion de `sharp` dans `next.config.ts`.
