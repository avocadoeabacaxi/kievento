import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Info } from "lucide-react";

interface ImagesStepProps {
  bannerPreview: string;
  cardImagePreview: string;
  handleBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCardImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImagesStep({
  bannerPreview,
  cardImagePreview,
  handleBannerUpload,
  handleCardImageUpload,
}: ImagesStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Banner e Imagens</CardTitle>
        <CardDescription>
          Adicione imagens atraentes para seu evento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="banner">Banner do Evento</Label>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Tamanho recomendado: <strong>1920x1080 pixels</strong> (proporção 16:9). Máximo: 5MB
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-4 mt-2">
            <Input
              id="banner"
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("banner")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Escolher Imagem
            </Button>
            {bannerPreview && (
              <span className="text-sm text-muted-foreground">Imagem carregada</span>
            )}
          </div>
          {bannerPreview && (
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg border">
              <img src={bannerPreview} alt="Preview Banner" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardImage">Imagem para Página Principal (Opcional)</Label>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Tamanho recomendado: <strong>1200x1600 pixels</strong> (proporção 3:4 vertical). Máximo: 5MB. Se não enviar, o banner será usado.
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-4 mt-2">
            <Input
              id="cardImage"
              type="file"
              accept="image/*"
              onChange={handleCardImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("cardImage")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Escolher Imagem do Card
            </Button>
            {cardImagePreview && (
              <span className="text-sm text-muted-foreground">Imagem carregada</span>
            )}
          </div>
          {cardImagePreview && (
            <div className="mt-4 aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg border">
              <img src={cardImagePreview} alt="Preview Card" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
