import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Eye, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PublicEvent() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();

  const { data: event, isLoading, error } = trpc.events.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Evento não encontrado</h1>
          <p className="text-gray-600 mb-6">
            O evento que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Home
          </Button>
        </Card>
      </div>
    );
  }

  const eventDate = event.eventDate ? new Date(event.eventDate) : null;
  const formattedDate = eventDate
    ? format(eventDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    : "Data não definida";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="KiEvento" className="h-8" />
          </a>
          <Button variant="outline" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      {/* Banner */}
      {event.bannerUrl && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Título e Informações Básicas */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{formattedDate}</span>
            </div>

            {event.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{event.address}</span>
              </div>
            )}

            {event.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{event.city}</span>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {event.category && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {event.category}
              </span>
            )}
            {event.visibility === "public" && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Público
              </span>
            )}
            {event.registrationType === "open" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Users className="h-3 w-3" />
                Inscrição Aberta
              </span>
            )}
            {event.registrationType === "approval" && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Requer Aprovação
              </span>
            )}
          </div>
        </div>

        {/* Descrição */}
        {event.description && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre o Evento</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </Card>
        )}

        {/* FAQ */}
        {event.faq && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
            <div className="space-y-4">
              {JSON.parse(event.faq).map((item: { question: string; answer: string }, index: number) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Botão de Inscrição */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Interessado em participar?
            </h3>
            <p className="text-gray-600 mb-6">
              Clique no botão abaixo para se inscrever neste evento
            </p>
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={() => setLocation(`/event/${event.id}`)}
            >
              <Users className="h-5 w-5 mr-2" />
              Inscrever-se Agora
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
