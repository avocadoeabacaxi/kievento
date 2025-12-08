import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Ticket } from "lucide-react";

interface ReviewStepProps {
  title: string;
  eventDate: string;
  address: string;
  category: string;
  city: string;
  visibility: "public" | "private";
  registrationType: "open" | "approval";
  hasTicketTypes: boolean;
  ticketTypesCount: number;
  formFieldsCount: number;
  faqItemsCount: number;
}

export default function ReviewStep({
  title,
  eventDate,
  address,
  category,
  city,
  visibility,
  registrationType,
  hasTicketTypes,
  ticketTypesCount,
  formFieldsCount,
  faqItemsCount,
}: ReviewStepProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Não definida";
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
    <Card>
      <CardHeader>
        <CardTitle>Revisão e Publicar</CardTitle>
        <CardDescription>
          Revise todas as informações antes de criar o evento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">{title || "Sem título"}</p>
              <p className="text-sm text-muted-foreground">{formatDate(eventDate)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Local</p>
              <p className="text-sm text-muted-foreground">{address || "Não definido"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Categoria e Cidade</p>
              <p className="text-sm text-muted-foreground">
                {category || "Sem categoria"} • {city || "Sem cidade"}
              </p>
            </div>
          </div>

          {hasTicketTypes && (
            <div className="flex items-start gap-3">
              <Ticket className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Tipos de Ingressos</p>
                <p className="text-sm text-muted-foreground">
                  {ticketTypesCount} {ticketTypesCount === 1 ? "tipo configurado" : "tipos configurados"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Visibilidade:</span>
            <span className="font-medium">
              {visibility === "public" ? "Público (aparece no site)" : "Privado (apenas com link)"}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tipo de Inscrição:</span>
            <span className="font-medium">
              {registrationType === "open" ? "Aberta (automática)" : "Com Aprovação"}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Campos do Formulário:</span>
            <span className="font-medium">{formFieldsCount} campos</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Perguntas Frequentes:</span>
            <span className="font-medium">{faqItemsCount} perguntas</span>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            ✓ Todas as informações estão corretas? Clique em <strong>Criar Evento</strong> para publicar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
