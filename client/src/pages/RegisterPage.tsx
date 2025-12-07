import { useState } from "react";
import { useRoute } from "wouter";
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

export default function RegisterPage() {
  const [, params] = useRoute("/register/:id");
  const eventId = params?.id ? parseInt(params.id) : 0;

  const { data: eventData, isLoading } = trpc.events.getById.useQuery({ eventId });
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  const registerMutation = trpc.registrations.create.useMutation({
    onSuccess: (data) => {
      setRegistrationResult(data);
      setSubmitted(true);
      toast.success("Inscrição realizada com sucesso!");
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando evento...</p>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios
    const requiredFields = eventData.formFields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!formData[field.label]) {
        toast.error(`O campo "${field.label}" é obrigatório`);
        return;
      }
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
    });
  };

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
                <Button asChild className="w-full">
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

  // Separar endereço e link se existir
  const addressParts = eventData.address?.split("|") || [];
  const displayAddress = addressParts[0] || "";
  const addressLink = addressParts[1] || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Event Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background pb-8">
        <div className="container max-w-2xl pt-8 space-y-4">
          {eventData.bannerUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-lg border shadow-lg">
              <img src={eventData.bannerUrl} alt={eventData.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">{eventData.title}</h1>
            <div className="flex flex-col gap-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(eventData.eventDate), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {displayAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {addressLink ? (
                    <a href={addressLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {displayAddress}
                    </a>
                  ) : (
                    <span>{displayAddress}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {eventData.description && (
            <Card>
              <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
                {parse(eventData.description)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Registration Form */}
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Inscrição</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para se inscrever no evento
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <Button type="submit" size="lg" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Enviando..." : "Confirmar Inscrição"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        {eventData.faq && (() => {
          try {
            const faqItems = JSON.parse(eventData.faq);
            if (faqItems && faqItems.length > 0) {
              return (
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
              );
            }
          } catch (e) {
            console.error("Error parsing FAQ:", e);
          }
          return null;
        })()}
      </div>
    </div>
  );
}
