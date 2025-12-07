import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

type FormField = {
  label: string;
  fieldType: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  options?: string;
  required: boolean;
  order: number;
};

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [address, setAddress] = useState("");
  const [registrationType, setRegistrationType] = useState<"open" | "approval">("open");
  const [bannerBase64, setBannerBase64] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [formFields, setFormFields] = useState<FormField[]>([
    { label: "Nome Completo", fieldType: "text", required: true, order: 0 },
    { label: "E-mail", fieldType: "email", required: true, order: 1 },
    { label: "Telefone", fieldType: "phone", required: false, order: 2 },
  ]);

  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Evento criado com sucesso!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(`Erro ao criar evento: ${error.message}`);
    },
  });

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setBannerBase64(result);
      setBannerPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const addFormField = () => {
    setFormFields([
      ...formFields,
      {
        label: "",
        fieldType: "text",
        required: false,
        order: formFields.length,
      },
    ]);
  };

  const removeFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const updateFormField = (index: number, updates: Partial<FormField>) => {
    setFormFields(
      formFields.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !eventDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createEventMutation.mutate({
      title,
      description,
      eventDate,
      address,
      registrationType,
      bannerBase64: bannerBase64 || undefined,
      formFields: formFields.map((f) => ({
        ...f,
        options: f.options || undefined,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Novo Evento</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Evento</CardTitle>
              <CardDescription>
                Preencha os detalhes básicos do seu evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="description">Descrição (HTML permitido)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="<p>Descrição do evento...</p>"
                  rows={6}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Data e Hora *</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationType">Tipo de Inscrição</Label>
                  <Select value={registrationType} onValueChange={(v: "open" | "approval") => setRegistrationType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberta (automática)</SelectItem>
                      <SelectItem value="approval">Com Aprovação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner">Banner do Evento</Label>
                <div className="flex items-center gap-4">
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
                  <div className="mt-4 aspect-video w-full max-w-md overflow-hidden rounded-lg border">
                    <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Inscrição */}
          <Card>
            <CardHeader>
              <CardTitle>Formulário de Inscrição</CardTitle>
              <CardDescription>
                Personalize as perguntas que os participantes devem responder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formFields.map((field, index) => (
                <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Pergunta</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateFormField(index, { label: e.target.value })}
                        placeholder="Ex: Qual sua área de interesse?"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Campo</Label>
                        <Select
                          value={field.fieldType}
                          onValueChange={(v: any) => updateFormField(index, { fieldType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="textarea">Texto Longo</SelectItem>
                            <SelectItem value="select">Seleção</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Obrigatório?</Label>
                        <Select
                          value={field.required ? "yes" : "no"}
                          onValueChange={(v) => updateFormField(index, { required: v === "yes" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Sim</SelectItem>
                            <SelectItem value="no">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(field.fieldType === "select" || field.fieldType === "checkbox") && (
                      <div className="space-y-2">
                        <Label>Opções (separadas por vírgula)</Label>
                        <Input
                          value={field.options || ""}
                          onChange={(e) => updateFormField(index, { options: e.target.value })}
                          placeholder="Opção 1, Opção 2, Opção 3"
                        />
                      </div>
                    )}
                  </div>

                  {index >= 3 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeFormField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addFormField} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Campo
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={createEventMutation.isPending} className="flex-1">
              {createEventMutation.isPending ? "Criando..." : "Criar Evento"}
            </Button>
            <Link href="/dashboard">
              <Button type="button" variant="outline" size="lg">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
