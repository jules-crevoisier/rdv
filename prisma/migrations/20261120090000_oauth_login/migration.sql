-- Comptes créés via Google ou Discord : pas de mot de passe tant que la personne n'en définit pas un.
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "password" DROP NOT NULL;
