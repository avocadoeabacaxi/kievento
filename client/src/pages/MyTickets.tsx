import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function MyTickets() {
  const { data, isLoading } = trpc.registrations.myRegistrations.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando seus ingressos...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const activeEvents = data?.active || [];
  const pastEvents = data?.past || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Meus Ingressos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os seus ingressos de eventos
          </p>
        </div>

        {/* Eventos Ativos */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            Eventos Ativos
          </h2>
          
          {activeEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Você não possui ingressos para eventos futuros
                </p>
                <Button asChild>
                  <Link href="/">Explorar Eventos</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeEvents.map((reg: any) => (
                <Card key={reg.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{reg.event?.title}</CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {reg.event?.eventDate && format(new Date(reg.event.eventDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm line-clamp-2">
                          {reg.event?.address?.split('|')[0]}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          reg.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                          reg.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}>
                          {reg.status === 'approved' ? 'Aprovado' :
                           reg.status === 'pending' ? 'Aguardando Aprovação' :
                           'Rejeitado'}
                        </span>
                      </div>
                      
                      {reg.status === 'approved' && (
                        <Button asChild className="w-full">
                          <Link href={`/ticket/${reg.qrCode}`}>
                            <Ticket className="h-4 w-4 mr-2" />
                            Ver Ingresso
                          </Link>
                        </Button>
                      )}
                      
                      {reg.status === 'pending' && (
                        <div className="text-xs text-muted-foreground text-center py-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                          Aguardando aprovação do organizador
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Eventos Passados */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Eventos Passados
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((reg: any) => (
                <Card key={reg.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{reg.event?.title}</CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {reg.event?.eventDate && format(new Date(reg.event.eventDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm line-clamp-2">
                          {reg.event?.address?.split('|')[0]}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/ticket/${reg.qrCode}`}>
                        <Ticket className="h-4 w-4 mr-2" />
                        Ver Ingresso
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
