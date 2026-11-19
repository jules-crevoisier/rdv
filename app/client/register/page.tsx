import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function ClientRegisterPage() {
  return (
    <AuthShell
      title="Créer un compte client"
      description="Un compte pour retrouver tous vos rendez-vous et recevoir les confirmations par email."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/client/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterForm type="client" redirectTo="/client/appointments" />
    </AuthShell>
  );
}
