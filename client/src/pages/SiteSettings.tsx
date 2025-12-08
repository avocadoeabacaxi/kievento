import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Settings } from "lucide-react";

export default function SiteSettings() {
  const [cookieBannerText, setCookieBannerText] = useState("Utilizamos cookies para melhorar a sua experiência.");
  const [cookieTermsLink, setCookieTermsLink] = useState("/termos");
  const [privacyPolicyLink, setPrivacyPolicyLink] = useState("/privacidade");

  const { data: settings, refetch } = trpc.siteSettings.getAll.useQuery();
  const updateMutation = trpc.siteSettings.updateMultiple.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar configurações: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings) {
      const textSetting = settings.find(s => s.key === "cookie_banner_text");
      const termsLinkSetting = settings.find(s => s.key === "cookie_terms_link");
      const privacyLinkSetting = settings.find(s => s.key === "privacy_policy_link");

      if (textSetting?.value) setCookieBannerText(textSetting.value);
      if (termsLinkSetting?.value) setCookieTermsLink(termsLinkSetting.value);
      if (privacyLinkSetting?.value) setPrivacyPolicyLink(privacyLinkSetting.value);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate([
      { key: "cookie_banner_text", value: cookieBannerText },
      { key: "cookie_terms_link", value: cookieTermsLink },
      { key: "privacy_policy_link", value: privacyPolicyLink },
    ]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1">
        <div className="container max-w-4xl py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Configurações do Site</h1>
            </div>
            <p className="text-muted-foreground">
              Gerencie as configurações globais da plataforma KiEvento
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Banner de Cookies</CardTitle>
              <CardDescription>
                Configure o texto e os links exibidos no banner de cookies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cookieBannerText">Texto do Banner</Label>
                  <Textarea
                    id="cookieBannerText"
                    value={cookieBannerText}
                    onChange={(e) => setCookieBannerText(e.target.value)}
                    placeholder="Utilizamos cookies para melhorar a sua experiência."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Texto principal exibido no banner de cookies
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cookieTermsLink">Link "Termos & Políticas"</Label>
                  <Input
                    id="cookieTermsLink"
                    type="text"
                    value={cookieTermsLink}
                    onChange={(e) => setCookieTermsLink(e.target.value)}
                    placeholder="/termos"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL da página de termos e políticas (pode ser relativo ou absoluto)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacyPolicyLink">Link "Política de Privacidade"</Label>
                  <Input
                    id="privacyPolicyLink"
                    type="text"
                    value={privacyPolicyLink}
                    onChange={(e) => setPrivacyPolicyLink(e.target.value)}
                    placeholder="/privacidade"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL da página de política de privacidade
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preview do Banner</CardTitle>
              <CardDescription>
                Visualize como o banner aparecerá para os usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-4xl">🍪</span>
                        <span className="text-4xl">🥑</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {cookieBannerText}{" "}
                        <a 
                          href={cookieTermsLink} 
                          className="text-primary hover:underline font-semibold"
                        >
                          Termos & Políticas
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                      type="button"
                    >
                      Definições
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      type="button"
                    >
                      Aceitar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
