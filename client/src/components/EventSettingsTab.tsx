import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Palette } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EventSettingsTabProps {
  eventId: number;
  event: any;
  refetch: () => void;
}



export default function EventSettingsTab({ eventId, event, refetch }: EventSettingsTabProps) {
  // Estados para personalização visual
  const [customSidebarBg, setCustomSidebarBg] = useState(event?.customSidebarBg || "#dc2626");
  const [customSidebarText, setCustomSidebarText] = useState(event?.customSidebarText || "#ffffff");
  const [customButtonBg, setCustomButtonBg] = useState(event?.customButtonBg || "#dc2626");
  const [customButtonHover, setCustomButtonHover] = useState(event?.customButtonHover || "#b91c1c");
  const [customTitleColor, setCustomTitleColor] = useState(event?.customTitleColor || "#1f2937");
  const [customSubtitleColor, setCustomSubtitleColor] = useState(event?.customSubtitleColor || "#6b7280");
  const [customBgGradientStart, setCustomBgGradientStart] = useState(event?.customBgGradientStart || "#fef2f2");
  const [customBgGradientEnd, setCustomBgGradientEnd] = useState(event?.customBgGradientEnd || "#ffffff");

  
  const updateCustomizationMutation = trpc.events.updateCustomization.useMutation({
    onSuccess: () => {
      toast.success("Personalização atualizada com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar personalização: ${error.message}`);
    },
  });

  
  const handleSaveCustomization = () => {
    updateCustomizationMutation.mutate({
      eventId,
      customSidebarBg,
      customSidebarText,
      customButtonBg,
      customButtonHover,
      customTitleColor,
      customSubtitleColor,
      customBgGradientStart,
      customBgGradientEnd,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Personalização Visual da Página de Cadastro</CardTitle>
          </div>
          <CardDescription>
            Customize as cores da página de inscrição para combinar com a identidade visual do seu evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barra Lateral */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Barra Lateral</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sidebarBg">Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    id="sidebarBg"
                    type="color"
                    value={customSidebarBg}
                    onChange={(e) => setCustomSidebarBg(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customSidebarBg}
                    onChange={(e) => setCustomSidebarBg(e.target.value)}
                    placeholder="#dc2626"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sidebarText">Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    id="sidebarText"
                    type="color"
                    value={customSidebarText}
                    onChange={(e) => setCustomSidebarText(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customSidebarText}
                    onChange={(e) => setCustomSidebarText(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Botões</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buttonBg">Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    id="buttonBg"
                    type="color"
                    value={customButtonBg}
                    onChange={(e) => setCustomButtonBg(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customButtonBg}
                    onChange={(e) => setCustomButtonBg(e.target.value)}
                    placeholder="#dc2626"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonHover">Cor ao Passar o Mouse</Label>
                <div className="flex gap-2">
                  <Input
                    id="buttonHover"
                    type="color"
                    value={customButtonHover}
                    onChange={(e) => setCustomButtonHover(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customButtonHover}
                    onChange={(e) => setCustomButtonHover(e.target.value)}
                    placeholder="#b91c1c"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Títulos */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Títulos e Textos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titleColor">Cor dos Títulos</Label>
                <div className="flex gap-2">
                  <Input
                    id="titleColor"
                    type="color"
                    value={customTitleColor}
                    onChange={(e) => setCustomTitleColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customTitleColor}
                    onChange={(e) => setCustomTitleColor(e.target.value)}
                    placeholder="#1f2937"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitleColor">Cor dos Subtítulos</Label>
                <div className="flex gap-2">
                  <Input
                    id="subtitleColor"
                    type="color"
                    value={customSubtitleColor}
                    onChange={(e) => setCustomSubtitleColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customSubtitleColor}
                    onChange={(e) => setCustomSubtitleColor(e.target.value)}
                    placeholder="#6b7280"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gradiente de Fundo */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Fundo com Gradiente</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradientStart">Cor Inicial</Label>
                <div className="flex gap-2">
                  <Input
                    id="gradientStart"
                    type="color"
                    value={customBgGradientStart}
                    onChange={(e) => setCustomBgGradientStart(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customBgGradientStart}
                    onChange={(e) => setCustomBgGradientStart(e.target.value)}
                    placeholder="#fef2f2"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradientEnd">Cor Final</Label>
                <div className="flex gap-2">
                  <Input
                    id="gradientEnd"
                    type="color"
                    value={customBgGradientEnd}
                    onChange={(e) => setCustomBgGradientEnd(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customBgGradientEnd}
                    onChange={(e) => setCustomBgGradientEnd(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview do Gradiente</Label>
            <div 
              className="h-24 rounded-lg border"
              style={{
                background: `linear-gradient(135deg, ${customBgGradientStart} 0%, ${customBgGradientEnd} 100%)`
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveCustomization} 
              disabled={updateCustomizationMutation.isPending}
            >
              {updateCustomizationMutation.isPending ? "Salvando..." : "Salvar Personalização"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
