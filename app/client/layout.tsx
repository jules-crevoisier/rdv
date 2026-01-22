import { ClientProviders } from "@/components/client-providers";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientProviders>{children}</ClientProviders>;
}
