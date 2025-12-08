import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import parse from "html-react-parser";

export default function PrivacyPage() {
  const { data: settings, isLoading } = trpc.siteSettings.getAll.useQuery();

  useEffect(() => {
    document.title = "Política de Privacidade - KiEvento";
  }, []);

  const privacyContent = settings?.find(s => s.key === "privacy_policy")?.value || "";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <Card>
            <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
              {privacyContent ? (
                parse(privacyContent)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Conteúdo da Política de Privacidade não disponível.</p>
                  <p className="text-sm mt-2">Entre em contato com o administrador.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
