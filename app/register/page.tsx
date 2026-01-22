"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Rediriger vers /login avec l'onglet register
    router.replace("/login?tab=register");
  }, [router]);

  return null;
}
