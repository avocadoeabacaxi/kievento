import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";

interface BasicInfoStepProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  visibility: "public" | "private";
  setVisibility: (value: "public" | "private") => void;
}

export default function BasicInfoStep({
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  city,
  setCity,
  visibility,
  setVisibility,
}: BasicInfoStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Básicas</CardTitle>
        <CardDescription>
          Preencha os detalhes principais do seu evento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Título do Evento *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Workshop de React"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição do Evento</Label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Descreva seu evento com formatação rica..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Música, Teatro, Gastronomia..."
            />
            <p className="text-xs text-muted-foreground">
              Ajuda os participantes a encontrar seu evento
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: São Paulo, Rio de Janeiro..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Visibilidade do Evento</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Privado (apenas com link)</SelectItem>
              <SelectItem value="public">Público (aparece no site)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Eventos públicos aparecem na página inicial do KiEvento
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
