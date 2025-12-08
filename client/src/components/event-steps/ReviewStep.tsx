import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Ticket, HelpCircle, Edit, Image as ImageIcon, Eye, CheckCircle } from "lucide-react";

interface ReviewStepProps {
  title: string;
  description: string;
  eventDate: string;
  registrationDeadline?: string;
  registrationType: string;
  address: string;
  addressLink: string;
  category: string;
  city: string;
  visibility: string;
  bannerUrl?: string;
  cardImageUrl?: string;
  formFields: Array<{ label: string; type: string; required: boolean }>;
  hasTicketTypes: boolean;
  ticketTypes: Array<{ name: string; description?: string; price: number; quantity: number; validUntil?: string; color?: string }>;
  faqItems: Array<{ question: string; answer: string }>;
  onEditStep: (stepId: string) => void;
}

export default function ReviewStep({
  title,
  description,
  eventDate,
  registrationDeadline,
  registrationType,
  address,
  addressLink,
  category,
  city,
  visibility,
  bannerUrl,
  cardImageUrl,
  formFields,
  hasTicketTypes,
  ticketTypes,
  faqItems,
  onEditStep,
}: ReviewStepProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Não definido";
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Tudo Pronto para Publicar!
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Revise as informações do seu evento abaixo. Quando estiver satisfeito, clique em <strong>"Publicar Evento"</strong> para torná-lo disponível.
        </p>
      </div>

      {/* Preview do Evento como ficará para o público */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Preview - Como seu evento aparecerá
            </span>
          </div>
          <CardTitle className="text-3xl">{title || "Título do Evento"}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Banner Preview */}
          {bannerUrl && (
            <div className="rounded-xl overflow-hidden shadow-md">
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Informações Principais */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Data e Horário
                </p>
                <p className="font-medium text-gray-900">{formatDate(eventDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Local
                </p>
                <p className="font-medium text-gray-900">{address || "Não definido"}</p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="border-l-4 border-primary pl-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Sobre o Evento
            </p>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: description || "Sem descrição" }}
            />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm">
              {category || "Sem categoria"}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {city || "Sem cidade"}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {visibility === "public" ? "Público" : "Privado"}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {registrationType === "open" ? "Inscrição Aberta" : "Com Aprovação"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes Técnicos - Accordion Style */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Configurações Detalhadas</h2>

        {/* Informações Básicas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep("basic")}
              className="text-primary hover:text-primary/80"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-gray-600">Categoria:</span>
                <span className="ml-2">{category || "Não definido"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Cidade:</span>
                <span className="ml-2">{city || "Não definido"}</span>
              </div>
            </div>
            {registrationDeadline && (
              <div>
                <span className="font-semibold text-gray-600">Prazo de Inscrição:</span>
                <span className="ml-2">{formatDate(registrationDeadline)}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-600">Tipo de Inscrição:</span>
              <span className="ml-2">
                {registrationType === "open" ? "Aberta (automática)" : "Com Aprovação"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Visibilidade:</span>
              <span className="ml-2">
                {visibility === "public" ? "Público (aparece na página inicial)" : "Privado (apenas com link)"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Banner e Imagens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Banner e Imagens</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep("images")}
              className="text-primary hover:text-primary/80"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Banner do Evento</p>
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 text-sm">
                    Nenhum banner
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Imagem do Card</p>
                {cardImageUrl ? (
                  <img
                    src={cardImageUrl}
                    alt="Card"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 text-sm">
                    Nenhuma imagem
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Inscrição */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Formulário de Inscrição</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep("form")}
              className="text-primary hover:text-primary/80"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              {formFields.length} campo(s) configurado(s)
            </p>
            <div className="space-y-2">
              {formFields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-medium">{field.label}</span>
                    <span className="text-gray-500 ml-2">({field.type})</span>
                  </div>
                  {field.required && (
                    <Badge variant="secondary" className="text-xs">
                      Obrigatório
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Ingressos */}
        {hasTicketTypes && ticketTypes.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Sistema de Ingressos</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep("tickets")}
                className="text-primary hover:text-primary/80"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                {ticketTypes.length} tipo(s) de ingresso
              </p>
              <div className="space-y-3">
                {ticketTypes.map((ticket, index) => (
                  <div
                    key={index}
                    className="p-4 border-l-4 rounded-lg bg-gray-50"
                    style={{ borderLeftColor: ticket.color || "#C72227" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{ticket.name}</h4>
                      <Badge variant="secondary" className="text-sm">
                        {ticket.price > 0 ? `R$ ${ticket.price.toFixed(2)}` : "Gratuito"}
                      </Badge>
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• {ticket.quantity} vagas disponíveis</p>
                      {ticket.validUntil && (
                        <p>• Válido até: {formatDate(ticket.validUntil)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Perguntas Frequentes */}
        {faqItems.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Perguntas Frequentes</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep("faq")}
                className="text-primary hover:text-primary/80"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                {faqItems.length} pergunta(s) configurada(s)
              </p>
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">{item.question}</p>
                    <p className="text-sm text-gray-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Call to Action Final */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Pronto para Publicar?
        </h3>
        <p className="text-gray-600 mb-6">
          Clique no botão "Publicar Evento" abaixo para tornar seu evento disponível.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Você poderá editar o evento a qualquer momento após a publicação</span>
        </div>
      </div>
    </div>
  );
}
