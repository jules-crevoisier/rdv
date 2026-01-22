"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Calendar } from "lucide-react";

function ClientLoginContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Utiliser signIn avec le basePath correct via le SessionProvider
      // Le SessionProvider avec basePath devrait gérer cela automatiquement
      const result = await signIn("ClientCredentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/client/appointments",
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else if (result?.ok) {
        router.push("/client/appointments");
        router.refresh();
      } else {
        setError("Une erreur est survenue lors de la connexion");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Connexion client</CardTitle>
            <CardDescription>Connectez-vous pour voir vos rendez-vous</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link href="/client/register" className="text-primary hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>
            <div className="mt-4 text-center text-sm">
              <Link href="/" className="text-muted-foreground hover:underline">
                Retour à l'accueil
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <SessionProvider basePath="/api/auth/client">
      <ClientLoginContent />
    </SessionProvider>
  );
}
