import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ArrowLeft, Plus, Trash2, Upload, Info } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import RichTextEditor from "@/components/RichTextEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import TicketTypesManager from "@/components/TicketTypesManager";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import EventCreationSidebar, { Step } from "@/components/EventCreationSidebar";
import ReviewStep from "@/components/event-steps/ReviewStep";
import { EventEmailSettings } from "@/components/EventEmailSettings";

type FormFieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "cpf" | "cnpj" | "cep";

type FormField = {
  label: string;
  fieldType: FormFieldType;
  options?: string;
  required: boolean;
  order: number;
};

export default function CreateEvent() {
  const params = useParams<{ id?: string }>();
  const eventId = params.id ? parseInt(params.id) : undefined;
  const isEditing = !!eventId;
  
  const [, setLocation] = useLocation();
  
  // Query para carregar dados do evento se estiver editando
  const { data: existingEvent } = trpc.events.getById.useQuery(
    { eventId: eventId! },
    { enabled: isEditing }
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [address, setAddress] = useState("");
  const [addressLink, setAddressLink] = useState("");
  const [registrationType, setRegistrationType] = useState<"open" | "approval">("open");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [bannerBase64, setBannerBase64] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [cardImageBase64, setCardImageBase64] = useState<string>("");
  const [cardImagePreview, setCardImagePreview] = useState<string>("");
  const [formFields, setFormFields] = useState<FormField[]>([
    { label: "Nome Completo", fieldType: "text", required: true, order: 0 },
    { label: "E-mail", fieldType: "email", required: true, order: 1 },
    { label: "Telefone", fieldType: "phone", required: false, order: 2 },
  ]);
  const [faqItems, setFaqItems] = useState<{question: string; answer: string}[]>([]);
  const [hasTicketTypes, setHasTicketTypes] = useState(false);  const [currentStepId, setCurrentStepId] = useState<string>("basic");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Função de validação por etapa
  const validateStep = (stepId: string): boolean => {
    switch (stepId) {
      case "basic":
        return !!title && !!description && !!eventDate && !!category && !!city;
      case "images":
        return true; // Banner é opcional
      case "form":
        return formFields.length >= 3; // Mínimo 3 campos (nome, email, telefone)
      case "tickets":
        return true; // Sistema de ingressos é opcional
      case "faq":
        return true; // FAQ é opcional
      default:
        return true;
    }
  };

  // Função para avançar para próxima etapa
  const goToNextStep = () => {
    if (!validateStep(currentStepId)) {
      toast.error("Preencha todos os campos obrigatórios antes de continuar");
      return;
    }
    
    // Marca etapa atual como completa
    setCompletedSteps(prev => new Set(prev).add(currentStepId));
    
    // Avança para próxima etapa
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    if (currentIndex < steps.length - 1) {
      setCurrentStepId(steps[currentIndex + 1].id);
    }
  };

  // Função para voltar para etapa anterior
  const goToPreviousStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStepId(steps[currentIndex - 1].id);
    }
  };

  const [ticketTypes, setTicketTypes] = useState<{
    id?: number;
    name: string;
    description: string;
    price: string;
    quantity: string;
    validFrom: string;
    validUntil: string;
    color: string;
    order: number;
  }[]>([]);

  const createTicketTypeMutation = trpc.ticketTypes.create.useMutation();

  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: async (data) => {
      const eventId = data.eventId;
      
      // Salvar tipos de ingressos se habilitado
      if (hasTicketTypes && ticketTypes.length > 0) {
        try {
          for (const tt of ticketTypes) {
            if (!tt.name) continue; // Pular lotes sem nome
            await createTicketTypeMutation.mutateAsync({
              eventId,
              name: tt.name,
              description: tt.description || undefined,
              price: tt.price || undefined,
              quantity: tt.quantity ? parseInt(tt.quantity) : undefined,
              validFrom: tt.validFrom || undefined,
              validUntil: tt.validUntil || undefined,
              color: tt.color || undefined,
              order: tt.order,
            });
          }
        } catch (error) {
          console.error("Erro ao salvar tipos de ingressos:", error);
        }
      }
      
      toast.success("Evento criado com sucesso!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(`Erro ao criar evento: ${error.message}`);
    },
  });

  const updateEventMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success("Evento atualizado com sucesso!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar evento: ${error.message}`);
    },
  });

  // Carregar dados do evento existente
  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title);
      setDescription(existingEvent.description || "");
      // Usar string diretamente sem conversão (já está no formato ISO)
      setEventDate(existingEvent.eventDate.slice(0, 16)); // Remove segundos se existir
      setRegistrationDeadline(existingEvent.registrationDeadline ? existingEvent.registrationDeadline.slice(0, 16) : "");
      setAddress(existingEvent.address || "");
      setAddressLink(existingEvent.addressLink || "");
      setCategory(existingEvent.category || "");
      setCity(existingEvent.city || "");
      setRegistrationType(existingEvent.registrationType);
      setVisibility(existingEvent.visibility);
      if (existingEvent.bannerUrl) {
        setBannerPreview(existingEvent.bannerUrl);
      }
      if (existingEvent.cardImageUrl) {
        setCardImagePreview(existingEvent.cardImageUrl);
      }
      if (existingEvent.formFields) {
        setFormFields(existingEvent.formFields.map(f => ({
          label: f.label,
          fieldType: f.fieldType,
          options: f.options || undefined,
          required: f.required === 1,
          order: f.order
        })));
      }
      if (existingEvent.faq) {
        try {
          setFaqItems(JSON.parse(existingEvent.faq));
        } catch (e) {
          console.error("Error parsing FAQ:", e);
        }
      }
    }
  }, [existingEvent]);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
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

  const handleCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: "", answer: "" }]);
  };

  const removeFaqItem = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqItems(faqItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent, status: 'draft' | 'published' = 'published') => {
    e.preventDefault();

    if (!title || !eventDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const eventData = {
      title,
      description,
      eventDate,
      registrationDeadline: registrationDeadline || undefined,
      address,
      addressLink: addressLink || undefined,
      registrationType,
      category: category || undefined,
      city: city || undefined,
      visibility,
      status,
      bannerBase64: bannerBase64 || undefined,
      cardImageBase64: cardImageBase64 || undefined,
      faq: faqItems.length > 0 ? JSON.stringify(faqItems.filter(item => item.question && item.answer)) : undefined,
      formFields: formFields.map((f) => ({
        ...f,
        options: f.options || undefined,
      })),
    };

    if (isEditing) {
      updateEventMutation.mutate({
        eventId: eventId!,
        ...eventData,
      });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const steps: Step[] = [
    { id: "basic", title: "Informações do Evento", completed: !!title && !!eventDate },
    { id: "images", title: "Banner e Imagens", completed: !!bannerBase64 },
    { id: "form", title: "Formulário de Inscrição", completed: formFields.length >= 2 },
    { id: "tickets", title: "Sistema de Ingressos", completed: true },
    { id: "emails", title: "Configurações de Email", completed: true },
    { id: "faq", title: "Perguntas Frequentes", completed: true },
    { id: "review", title: "Publicar", completed: false },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
        {/* Menu Lateral Fixo */}
        <div className="w-80 flex-shrink-0 border-r bg-white sticky top-0 h-[calc(100vh-64px)] overflow-y-auto">
          <EventCreationSidebar
            steps={steps}
            currentStepId={currentStepId}
            onStepClick={setCurrentStepId}
            completedSteps={completedSteps}
          />
        </div>
      
        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloco 1: Informações do Evento */}
          {currentStepId === "basic" && (
          <Card id="basic">
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
                <Label htmlFor="description">Descrição do Evento</Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Descreva seu evento com formatação rica..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Data e Hora do Evento *</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Data Limite de Inscrição</Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    placeholder="Deixe vazio para sempre aberto"
                  />
                  <p className="text-xs text-muted-foreground">Após essa data, a página mostrará \"Inscrições Encerradas\"</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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

              <AddressAutocomplete
                value={address}
                onChange={(newAddress, newAddressLink) => {
                  setAddress(newAddress);
                  setAddressLink(newAddressLink);
                }}
                placeholder="Digite o endereço do evento..."
              />

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
          )}

          {/* Bloco 2: Banner e Imagens */}
          {currentStepId === "images" && (
          <Card id="images">
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
          )}

          {/* Bloco 3: Formulário de Inscrição */}
          {currentStepId === "form" && (
          <Card id="form">
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
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="cep">CEP</SelectItem>
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
                Adicionar Camp              </Button>
            </CardContent>
          </Card>
          )}

          {/* Bloco 4: Sistema de Ingressos (Opcional) */}
          {currentStepId === "tickets" && (      <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sistema de Ingressos (Opcional)</CardTitle>
                  <CardDescription>
                    Ative para criar diferentes tipos de ingressos com preços e datas de validade
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasTicketTypes"
                    checked={hasTicketTypes}
                    onCheckedChange={(checked) => setHasTicketTypes(checked as boolean)}
                  />
                  <Label htmlFor="hasTicketTypes" className="cursor-pointer">
                    Habilitar
                  </Label>
                </div>
              </div>
            </CardHeader>
            {hasTicketTypes && (
              <CardContent>
                <TicketTypesManager
                  ticketTypes={ticketTypes}
                  onChange={setTicketTypes}
                />
              </CardContent>
            )}
          </Card>
          )}

          {/* Bloco 5: Configurações de Email */}
          {currentStepId === "emails" && eventId && (
            <EventEmailSettings eventId={eventId} />
          )}

          {currentStepId === "emails" && !eventId && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Email</CardTitle>
                <CardDescription>
                  Salve o evento primeiro para configurar os templates de email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    As configurações de email estarão disponíveis após salvar o evento.
                    Você poderá personalizar os emails enviados aos participantes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Bloco 6: Perguntas Frequentes (FAQ) */}
          {currentStepId === "faq" && (
          <Card id="faq">
            <CardHeader>
              <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
              <CardDescription>
                Adicione perguntas e respostas que serão exibidas na página pública do evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label>Pergunta {index + 1}</Label>
                      <Input
                        value={item.question}
                        onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                        placeholder="Ex: Qual o horário do evento?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Resposta</Label>
                      <Input
                        value={item.answer}
                        onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                        placeholder="Ex: O evento começa às 19h"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeFaqItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addFaqItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </CardContent>
          </Card>
          )}

          {/* Etapa 6: Revisão Final */}
          {currentStepId === "review" && (
            <ReviewStep
              title={title}
              description={description}
              eventDate={eventDate}
              registrationDeadline={registrationDeadline}
              registrationType={registrationType}
              address={address}
              addressLink={addressLink}
              category={category}
              city={city}
              visibility={visibility}
              bannerUrl={bannerPreview}
              cardImageUrl={cardImagePreview}
              formFields={formFields.map(f => ({ label: f.label, type: f.fieldType, required: f.required }))}
              hasTicketTypes={hasTicketTypes}
              ticketTypes={ticketTypes.map(tt => ({
                name: tt.name,
                description: tt.description,
                price: parseFloat(tt.price) || 0,
                quantity: parseInt(tt.quantity) || 0,
                validUntil: tt.validUntil,
                color: tt.color,
              }))}
              faqItems={faqItems}
              onEditStep={setCurrentStepId}
            />
          )}

          {/* Botões de Navegação */}
          <div className="flex justify-between mt-8">
            <Button 
              type="button" 
              variant="outline" 
              size="lg"
              onClick={goToPreviousStep}
              disabled={currentStepId === "basic"}
            >
              Anterior
            </Button>
            
            {currentStepId === "review" ? (
              <div className="flex gap-4">
                <Link href="/dashboard">
                  <Button type="button" variant="outline" size="lg">
                    Cancelar
                  </Button>
                </Link>
                {(!isEditing || existingEvent?.status === 'draft') && (
                  <Button 
                    type="button"
                    variant="outline"
                    size="lg" 
                    disabled={createEventMutation.isPending || updateEventMutation.isPending}
                    onClick={(e) => handleSubmit(e, 'draft')}
                  >
                    {createEventMutation.isPending || updateEventMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
                  </Button>
                )}
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                  onClick={(e) => handleSubmit(e, 'published')}
                >
                  {isEditing 
                    ? (updateEventMutation.isPending ? "Atualizando..." : (existingEvent?.status === 'draft' ? "Publicar Evento" : "Atualizar Evento"))
                    : (createEventMutation.isPending ? "Publicando..." : "Publicar Evento")}
                </Button>
              </div>
            ) : (
              <Button 
                type="button" 
                size="lg"
                onClick={goToNextStep}
              >
                Próximo
              </Button>
            )}
          </div>
        </form>
        </div>
        </div>
      </div>
    </>
  );
}
