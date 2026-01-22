# Base de données

## État actuel

**Actuellement, l'application utilise localStorage** (stockage dans le navigateur). Cela signifie que :
- ✅ Les données sont stockées localement dans le navigateur
- ✅ Aucune configuration de base de données nécessaire pour démarrer
- ❌ Les données sont perdues si vous videz le cache du navigateur
- ❌ Les données ne sont pas partagées entre différents appareils/navigateurs
- ❌ Non adapté pour un usage en production avec plusieurs utilisateurs

## Structure des données

Les données sont stockées dans localStorage avec les clés suivantes :
- `appointlet_event_types` : Types de rendez-vous
- `appointlet_availabilities` : Disponibilités par type de rendez-vous
- `appointlet_appointments` : Tous les rendez-vous

## Migration vers une vraie base de données

Pour passer en production, vous devrez :

1. **Choisir une base de données** :
   - PostgreSQL (recommandé)
   - MySQL / MariaDB
   - MongoDB
   - SQLite (pour petits projets)

2. **Créer les tables/schémas** :
   - `event_types` : Types de rendez-vous
   - `availabilities` : Disponibilités
   - `appointments` : Rendez-vous

3. **Remplacer les fonctions dans `lib/storage.ts`** :
   - Remplacer les appels localStorage par des appels API
   - Créer des routes API Next.js (`app/api/...`)
   - Utiliser un ORM comme Prisma, Drizzle, ou des requêtes SQL directes

4. **Exemple de structure avec Prisma** :
```prisma
model EventType {
  id            String   @id @default(cuid())
  name          String
  description   String
  duration      Int
  color         String
  bufferTime    Int
  minimumNotice Int
  requiresApproval Boolean
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  availabilities Availability[]
  appointments  Appointment[]
}

model Availability {
  id          String   @id @default(cuid())
  eventTypeId String
  eventType   EventType @relation(fields: [eventTypeId], references: [id])
  timeSlots   Json
  dateOverrides Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Appointment {
  id            String   @id @default(cuid())
  eventTypeId   String
  eventType     EventType @relation(fields: [eventTypeId], references: [id])
  startTime     DateTime
  endTime       DateTime
  clientName    String
  clientEmail   String
  clientPhone   String?
  notes         String?
  status        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Pour l'instant

L'application fonctionne parfaitement avec localStorage pour :
- Tests et développement
- Démonstrations
- Usage personnel sur un seul appareil

Pour un usage professionnel avec plusieurs utilisateurs, une migration vers une base de données est nécessaire.
