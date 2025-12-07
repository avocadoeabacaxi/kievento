import { useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "qrcode";

export default function TicketPage() {
  const [, params] = useRoute("/ticket/:qrCode");
  const qrCode = params?.qrCode || "";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data, isLoading } = trpc.registrations.getByQrCode.useQuery({ qrCode });

  useEffect(() => {
    if (canvasRef.current && qrCode) {
      QRCode.toCanvas(canvasRef.current, qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    }
  }, [qrCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <div>
              <h2 className="text-2xl font-bold">Convite não encontrado</h2>
              <p className="text-muted-foreground mt-2">
                Verifique se o link está correto ou entre em contato com o organizador.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { registration, event } = data;

  const getStatusBadge = () => {
    switch (registration.status) {
      case "approved":
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8 px-4">
      <div className="container max-w-2xl">
        <Card className="overflow-hidden shadow-xl">
          {/* Event Banner */}
          {event.bannerUrl && (
            <div className="aspect-video w-full overflow-hidden">
              <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
              <div className="flex items-center justify-center gap-2">
                {getStatusBadge()}
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-3 border-t border-b py-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Data e Hora</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.eventDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.eventDate), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {event.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Local</p>
                    <p className="text-sm text-muted-foreground">{event.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Participant Info */}
            <div className="space-y-3 border-b pb-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Participante</p>
                  <p className="text-sm text-muted-foreground">{registration.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">E-mail</p>
                  <p className="text-sm text-muted-foreground">{registration.email}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {registration.status === "approved" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">Seu QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Apresente este código na entrada do evento
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-inner">
                    <canvas ref={canvasRef} />
                  </div>
                </div>

                {registration.checkedIn ? (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Check-in realizado!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {registration.checkedInAt &&
                        format(new Date(registration.checkedInAt), "d/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      💡 Salve esta página ou tire um print do QR Code para facilitar na entrada
                    </p>
                  </div>
                )}
              </div>
            )}

            {registration.status === "pending" && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-500 mx-auto mb-2" />
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Aguardando Aprovação
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Seu convite com QR Code será liberado após a aprovação do organizador
                </p>
              </div>
            )}

            {registration.status === "rejected" && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-500 mx-auto mb-2" />
                <p className="font-medium text-red-900 dark:text-red-100">
                  Inscrição Não Aprovada
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Entre em contato com o organizador para mais informações
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
