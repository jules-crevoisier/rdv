"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthFormProps = {
  defaultTab?: "login" | "register";
  defaultEmail?: string;
  notice?: string | null;
  /** Page à ouvrir une fois connecté. */
  redirectTo?: string;
};

export const AuthForm = ({ defaultTab = "login", defaultEmail, notice, redirectTo = "/" }: AuthFormProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl text-center">Reservy</CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm">
          Gérez vos rendez-vous en toute simplicité
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="text-xs sm:text-sm">Connexion</TabsTrigger>
            <TabsTrigger value="register" className="text-xs sm:text-sm">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <LoginForm type="user" redirectTo={redirectTo} defaultEmail={defaultEmail} notice={notice} />
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <RegisterForm type="user" redirectTo={redirectTo} defaultEmail={defaultEmail} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
