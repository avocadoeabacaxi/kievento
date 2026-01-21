import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { toast } from "sonner";
import parse from "html-react-parser";
import { MaskedInput } from "@/components/MaskedInput";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const [, params] = useRoute("/register/:id");
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const eventId = params?.id ? parseInt(params.id) : 0;

  const { data: eventData, isLoading } = trpc.events.getById.useQuery({ eventId });
  const { data: activeTicketType } = trpc.ticketTypes.getActive.useQuery(
    { eventId },
    { enabled: !!eventData?.hasTicketTypes }
  );
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  
  // Cores personalizadas do evento (com fallback para cores padrão)
  const customColors = {
    sidebarBg: eventData?.customSidebarBg || "#dc2626",
    sidebarText: eventData?.customSidebarText || "#ffffff",
    buttonBg: eventData?.customButtonBg || "#dc2626",
    buttonHover: eventData?.customButtonHover || "#b91c1c",
    titleColor: eventData?.customTitleColor || "#1f2937",
    subtitleColor: eventData?.customSubtitleColor || "#6b7280",
    bgGradientStart: eventData?.customBgGradientStart || "#fef2f2",
    bgGradientEnd: eventData?.customBgGradientEnd || "#ffffff",
  };
  
  // Processar inscrição automática após login
  useEffect(() => {
    if (isAuthenticated && eventData) {
      const autoSubmitData = sessionStorage.getItem('autoSubmitRegistration');
      if (autoSubmitData) {
        sessionStorage.removeItem('autoSubmitRegistration');
        const { formData: savedFormData, ticketTypeId } = JSON.parse(autoSubmitData);
        
        // Preencher formulário com dados salvos
        setFormData(savedFormData);
        
        // Processar inscrição automaticamente
        const name = savedFormData["Nome Completo"] || savedFormData["Nome"] || "";
        const email = savedFormData["E-mail"] || savedFormData["Email"] || "";
        const phone = savedFormData["Telefone"] || "";
        
        registerMutation.mutate({
          eventId,
          name,
          email,
          phone,
          formData: savedFormData,
          ticketTypeId: ticketTypeId || undefined,
        });
      }
    }
  }, [isAuthenticated, eventData]);

  const registerMutation = trpc.registrations.create.useMutation({
    onSuccess: (data) => {
      setRegistrationResult(data);
      setSubmitted(true);
      toast.success("Cadastro realizado com sucesso! Você será redirecionado para seus ingressos...");
      // Redirecionar após 2 segundos
      setTimeout(() => {
        setLocation("/my-tickets");
      }, 2000);
    },
    onError: (error) => {
      toast.error(`Erro ao realizar inscrição: ${error.message}`);
    },
  });

  // Função para buscar endereço pelo CEP
  const handleCepBlur = async (cep: string, fieldLabel: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          toast.success("Endereço encontrado!");
          // Atualizar campos relacionados se existirem
          const addressInfo = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
          setFormData((prev) => ({
            ...prev,
            [fieldLabel]: cep,
            [`${fieldLabel}_endereco`]: addressInfo,
          }));
        } else {
          toast.error("CEP não encontrado");
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios primeiro
    const requiredFields = eventData!.formFields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!formData[field.label]) {
        toast.error(`O campo "${field.label}" é obrigatório`);
        return;
      }
    }

    // Se não estiver logado, salvar dados e redirecionar para login
    if (!isAuthenticated) {
      // Salvar dados da inscrição em sessionStorage
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        eventId,
        formData,
        ticketTypeId: activeTicketType?.id
      }));
      
      toast.info("Redirecionando para login...");
      setTimeout(() => {
        window.location.href = getLoginUrl();
      }, 1000);
      return;
    }



    // Extrair nome, email e telefone dos campos padrão
    const name = formData["Nome Completo"] || formData["Nome"] || "";
    const email = formData["E-mail"] || formData["Email"] || "";
    const phone = formData["Telefone"] || "";

    if (!name || !email) {
      toast.error("Nome e e-mail são obrigatórios");
      return;
    }

    registerMutation.mutate({
      eventId,
      name,
      email,
      phone,
      formData: JSON.stringify(formData),
      ticketTypeId: activeTicketType?.id,
    });
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{authLoading ? "Verificando autenticação..." : "Carregando evento..."}</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-semibold">Evento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se as inscrições estão encerradas
  const isRegistrationClosed = eventData?.registrationDeadline && new Date(eventData.registrationDeadline) < new Date();

  if (submitted && registrationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-6">
            {registrationResult.status === "approved" ? (
              <>
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Inscrição Confirmada!</h2>
                  <p className="text-muted-foreground">
                    Sua inscrição foi aprovada automaticamente. Você receberá seu convite com QR Code por e-mail.
                  </p>
                </div>
                <Button 
                  asChild 
                  className="w-full"
                  style={{
                    backgroundColor: customColors.buttonBg,
                    color: customColors.sidebarText,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = customColors.buttonHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = customColors.buttonBg}
                >
                  <a href={`/ticket/${registrationResult.qrCode}`} target="_blank">
                    Ver Meu Convite
                  </a>
                </Button>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Inscrição Recebida!</h2>
                  <p className="text-muted-foreground">
                    Sua inscrição está aguardando aprovação do organizador. Você receberá uma notificação por e-mail quando for aprovada.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Usar addressLink do banco
  const displayAddress = eventData.address || "";
  const addressLink = eventData.addressLink || "";

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${customColors.bgGradientStart} 0%, ${customColors.bgGradientEnd} 100%)`
      }}
    >
      {/* Logo Centralizada */}
      <div 
        className="w-full border-b py-3"
        style={{ backgroundColor: customColors.sidebarBg }}
      >
        <div className="container flex justify-center">
          <img src="/logo.png" alt="KiEvento" className="h-10" />
        </div>
      </div>

      {/* Event Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background pb-4">
        <div className="container max-w-2xl pt-4 space-y-4">
          {eventData.bannerUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-lg border shadow-lg">
              <img src={eventData.bannerUrl} alt={eventData.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-4">
            <h1 
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{ color: customColors.titleColor }}
            >
              {eventData.title}
            </h1>
            
            {/* Data e Horário */}
            <div 
              className="border-l-4 pl-4 py-2"
              style={{ borderColor: customColors.sidebarBg }}
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Data e Horário</div>
              <div className="flex items-center gap-2 text-base font-medium">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(eventData.eventDate), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>

            {/* Local */}
            {displayAddress && (
              <div 
                className="border-l-4 pl-4 py-2"
                style={{ borderColor: customColors.sidebarBg }}
              >
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Local</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-base font-medium">
                    <MapPin className="h-4 w-4" />
                    <span>{displayAddress}</span>
                  </div>
                  {addressLink && addressLink.startsWith('http') && (
                    <a 
                      href={addressLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: customColors.buttonBg,
                        color: customColors.sidebarText,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = customColors.buttonHover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = customColors.buttonBg}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ver no Mapa
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {eventData.description && (
            <div className="border-l-4 pl-4 py-2" style={{ borderColor: customColors.sidebarBg }}>
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Sobre o Evento</div>
              <Card>
                <CardContent className="pt-4 prose prose-sm max-w-none dark:prose-invert">
                  {parse(eventData.description)}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Registration Form */}
      <div className="container max-w-2xl py-6 space-y-6">
        {/* Tipo de Ingresso Disponível */}
        {!!eventData?.hasTicketTypes && activeTicketType && (
          <div className="border-l-4 pl-4 py-2" style={{ borderLeftColor: activeTicketType.color || '#ef4444' }}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">Ingresso Disponível</div>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{activeTicketType.name}</h3>
                      <span 
                        className="px-2 py-1 text-xs font-semibold text-white rounded"
                        style={{ backgroundColor: activeTicketType.color || '#ef4444' }}
                      >
                        {activeTicketType.price || "Gratuito"}
                      </span>
                    </div>
                    {activeTicketType.description && (
                      <p className="text-sm text-muted-foreground">{activeTicketType.description}</p>
                    )}
                    {activeTicketType.quantity && (
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground">Vagas disponíveis:</span>{" "}
                        <span className="text-primary">
                          {activeTicketType.quantity - (activeTicketType.quantitySold || 0)}
                        </span>
                      </p>
                    )}
                    {activeTicketType.validUntil && (
                      <p className="text-sm text-muted-foreground">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Válido até: {format(new Date(activeTicketType.validUntil), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mensagem se não houver lote disponível */}
        {!!eventData?.hasTicketTypes && !activeTicketType && !isRegistrationClosed && (
          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <Card>
              <CardContent className="pt-4 text-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Nenhum Lote Disponível</h3>
                  <p className="text-muted-foreground">
                    No momento não há ingressos disponíveis para este evento. Verifique novamente mais tarde.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        <div className="border-l-4 pl-4 py-2" style={{ borderColor: customColors.sidebarBg }}>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">Formulário de Inscrição</div>
          <Card className="relative">
            <CardHeader>
              <CardTitle>Formulário de Inscrição</CardTitle>
              <CardDescription>
                {isRegistrationClosed ? "As inscrições para este evento foram encerradas" : "Preencha os campos abaixo para se inscrever no evento"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRegistrationClosed ? (
                <div className="text-center py-8 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto">
                    <Clock className="h-8 w-8 text-red-600 dark:text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Inscrições Encerradas</h3>
                    <p className="text-muted-foreground">
                      O período de inscrições para este evento foi encerrado em {format(new Date(eventData!.registrationDeadline!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.
                    </p>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {eventData.formFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={`field-${field.id}`}>
                      {field.label}
                      {field.required === 1 && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {field.fieldType === "text" && (
                      <Input
                        id={`field-${field.id}`}
                        type="text"
                        value={formData[field.label] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                        required={field.required === 1}
                      />
                    )}

                    {field.fieldType === "email" && (
                      <Input
                        id={`field-${field.id}`}
                        type="email"
                        value={formData[field.label] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                        required={field.required === 1}
                      />
                    )}

                    {field.fieldType === "phone" && (
                      <MaskedInput
                        mask="phone"
                        value={formData[field.label] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.label]: e.target.value })
                        }
                        placeholder="(00) 00000-0000"
                        required={field.required === 1}
                      />
                    )}

                    {field.fieldType === "cpf" && (
                      <MaskedInput
                        mask="cpf"
                        value={formData[field.label] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.label]: e.target.value })
                        }
                        placeholder="000.000.000-00"
                        required={field.required === 1}
                      />
                    )}

                    {field.fieldType === "cnpj" && (
                      <MaskedInput
                        mask="cnpj"
                        value={formData[field.label] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.label]: e.target.value })
                        }
                        placeholder="00.000.000/0000-00"
                        required={field.required === 1}
                      />
                    )}

                    {field.fieldType === "cep" && (
                      <div className="space-y-2">
                        <MaskedInput
                          mask="cep"
                          value={formData[field.label] || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.label]: e.target.value })
                          }
                          onBlur={(e) =>
                            handleCepBlur(e.target.value, field.label)
                          }
                          placeholder="00000-000"
                          required={field.required === 1}
                        />
                        {formData[`${field.label}_endereco`] && (
                          <p className="text-sm text-muted-foreground">
                            {formData[`${field.label}_endereco`]}
                          </p>
                        )}
                      </div>
                    )}

                    {field.fieldType === "textarea" && (
                      <Textarea
                        id={`field-${field.id}`}
                        value={formData[field.label] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                        required={field.required === 1}
                        rows={4}
                      />
                    )}

                    {field.fieldType === "select" && field.options && (
                      <Select
                        value={formData[field.label] || ""}
                        onValueChange={(value) => setFormData({ ...formData, [field.label]: value })}
                        required={field.required === 1}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.split(",").map((option, idx) => (
                            <SelectItem key={idx} value={option.trim()}>
                              {option.trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.fieldType === "checkbox" && field.options && (
                      <div className="space-y-2">
                        {field.options.split(",").map((option, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${field.id}-${idx}`}
                              checked={formData[field.label]?.includes(option.trim())}
                              onCheckedChange={(checked) => {
                                const current = formData[field.label] || [];
                                const updated = checked
                                  ? [...current, option.trim()]
                                  : current.filter((v: string) => v !== option.trim());
                                setFormData({ ...formData, [field.label]: updated });
                              }}
                            />
                            <label
                              htmlFor={`${field.id}-${idx}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.trim()}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                  style={{
                    backgroundColor: customColors.buttonBg,
                    color: customColors.sidebarText,
                  }}
                  onMouseEnter={(e) => !registerMutation.isPending && (e.currentTarget.style.backgroundColor = customColors.buttonHover)}
                  onMouseLeave={(e) => !registerMutation.isPending && (e.currentTarget.style.backgroundColor = customColors.buttonBg)}
                >
                  {registerMutation.isPending ? "Enviando..." : "Confirmar Inscrição"}
                </Button>
              </form>
              )}
            </CardContent>

          </Card>
        </div>

        {/* FAQ Section */}
        {eventData.faq && (() => {
          try {
            const faqItems = JSON.parse(eventData.faq);
            if (faqItems && faqItems.length > 0) {
              return (
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Perguntas Frequentes</h2>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <CardTitle>Perguntas Frequentes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {faqItems.map((item: {question: string; answer: string}, index: number) => (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              );
            }
          } catch (e) {
            console.error("Error parsing FAQ:", e);
          }
          return null;
        })()}
      </div>
      
      <Footer />
      <CookieBanner />
    </div>
  );
}
