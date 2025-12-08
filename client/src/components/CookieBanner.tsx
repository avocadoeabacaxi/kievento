import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [cookieText, setCookieText] = useState("Utilizamos cookies para melhorar a sua experiência.");
  const [termsLink, setTermsLink] = useState("/termos");

  const { data: settings } = trpc.siteSettings.getAll.useQuery();

  useEffect(() => {
    // Verificar se o usuário já aceitou os cookies
    const cookiesAccepted = localStorage.getItem("cookiesAccepted");
    if (!cookiesAccepted) {
      setIsVisible(true);
    }

    // Carregar textos das configurações
    if (settings) {
      const textSetting = settings.find(s => s.key === "cookie_banner_text");
      const linkSetting = settings.find(s => s.key === "cookie_terms_link");
      
      if (textSetting?.value) setCookieText(textSetting.value);
      if (linkSetting?.value) setTermsLink(linkSetting.value);
    }
  }, [settings]);

  const handleAccept = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t shadow-lg">
      <div className="container max-w-6xl py-4 px-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-4xl">🍪</span>
              <span className="text-4xl">🥑</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              {cookieText}{" "}
              <a 
                href={termsLink} 
                className="text-primary hover:underline font-semibold"
                target="_blank"
                rel="noopener noreferrer"
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
            onClick={handleClose}
            className="border-gray-300"
          >
            Definições
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="bg-primary hover:bg-primary/90"
          >
            Aceitar
          </Button>
        </div>

        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
