import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de confidentialité - Reservy",
  description: "Quelles données Reservy collecte, pourquoi, et comment les faire supprimer.",
};
// Lue à l'exécution : l'adresse de contact vient de l'environnement Dokploy.
export const dynamic = "force-dynamic";

const UPDATED = "20 novembre 2026";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-base font-semibold tracking-tight">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

export default function PrivacyPage() {
  const contact = process.env.CONTACT_EMAIL || process.env.EMAIL_REPLY_TO || "";
  const contactEmail = contact.match(/<([^>]+)>/)?.[1] ?? contact;

  return (
    <main className="min-h-dvh bg-background px-4 py-12 sm:py-16">
      <article className="mx-auto max-w-2xl space-y-10">
        <header className="space-y-6">
          <Link
            href="/login"
            className="flex w-fit items-center gap-2 rounded-md text-sm font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarCheck className="size-4" aria-hidden />
            </span>
            Reservy
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Politique de confidentialité</h1>
            <p className="text-sm text-muted-foreground">Mise à jour le {UPDATED}</p>
          </div>
        </header>

        <Section title="Les données collectées">
          <p>
            Reservy sert à prendre et gérer des rendez-vous. Pour cela, nous enregistrons votre nom, votre adresse email,
            votre téléphone si vous le donnez, et les rendez-vous que vous prenez ou recevez (date, type, notes).
          </p>
          <p>
            Si vous vous connectez avec Google ou Discord, nous recevons seulement votre nom, votre adresse email et la
            confirmation que cette adresse est vérifiée. Nous n&apos;avons accès ni à vos contacts, ni à vos messages,
            ni à vos fichiers, et nous ne publions rien en votre nom.
          </p>
        </Section>

        <Section title="Pourquoi nous les utilisons">
          <p>
            Uniquement pour faire fonctionner le service : vous connecter, enregistrer vos rendez-vous et vous envoyer
            les emails qui vont avec (confirmation, rappel, annulation, mot de passe oublié). Pas de publicité, pas de
            revente, pas de partage avec des tiers en dehors des prestataires techniques ci-dessous.
          </p>
        </Section>

        <Section title="Où elles sont stockées">
          <p>
            Les données sont stockées dans une base PostgreSQL sur notre serveur. Les emails partent via Resend. Les
            mots de passe sont chiffrés (bcrypt) et ne sont jamais lisibles, même par nous.
          </p>
        </Section>

        <Section title="Vos droits">
          <p>
            Vous pouvez demander à consulter, corriger ou supprimer vos données à tout moment
            {contactEmail ? (
              <>
                {" "}en écrivant à{" "}
                <a href={`mailto:${contactEmail}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {contactEmail}
                </a>
              </>
            ) : null}
            . Sur demande, nous supprimons votre compte et les informations personnelles liées à vos rendez-vous.
          </p>
          <p>Vous pouvez aussi retirer l&apos;accès de Reservy depuis les réglages de votre compte Google ou Discord.</p>
        </Section>
      </article>
    </main>
  );
}
