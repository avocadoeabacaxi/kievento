import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BasicInfoSectionProps {
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
  registrationType: "open" | "approval";
  setRegistrationType: (value: "open" | "approval") => void;
}

export default function BasicInfoSection({
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
  registrationType,
  setRegistrationType,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Informações Básicas</h2>
        <p className="text-gray-500 mt-1">Defina as informações principais do seu evento</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Nome do Evento *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Workshop de React Avançado"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Música">Música</SelectItem>
                  <SelectItem value="Teatro">Teatro</SelectItem>
                  <SelectItem value="Gastronomia">Gastronomia</SelectItem>
                  <SelectItem value="Esportes">Esportes</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Negócios">Negócios</SelectItem>
                  <SelectItem value="Arte">Arte</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visibility">Visibilidade</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")}>
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público (aparece no site)</SelectItem>
                  <SelectItem value="private">Privado (apenas com link)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="registrationType">Tipo de Inscrição</Label>
              <Select value={registrationType} onValueChange={(v) => setRegistrationType(v as "open" | "approval")}>
                <SelectTrigger id="registrationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberta (aprovação automática)</SelectItem>
                  <SelectItem value="approval">Com Aprovação Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição do Evento</Label>
            <RichTextEditor value={description} onChange={setDescription} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
