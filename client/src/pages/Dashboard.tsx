import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CheckCircle, Clock, Plus, Edit, Link as LinkIcon, Copy, QrCode, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: events, isLoading } = trpc.events.myEvents.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Breadcrumb items={[{ label: "Meus Eventos" }]} />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meus Eventos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os seus eventos em um só lugar
            </p>
          </div>
          <Link href="/events/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Novo Evento
            </Button>
          </Link>
        </div>

        {!events || events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Calendar className="h-16 w-16 text-muted-foreground/50" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Nenhum evento criado</h3>
                <p className="text-muted-foreground max-w-md">
                  Comece criando seu primeiro evento e gerencie inscrições de forma simples e eficiente
                </p>
              </div>
              <Link href="/events/new">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              // Exibir horário literal sem conversão
              const eventDateStr = typeof event.eventDate === 'string' ? event.eventDate : new Date(event.eventDate).toISOString();
              const [datePart, timePart] = eventDateStr.split('T');
              const [year, month, day] = datePart.split('-');
              const formattedDate = `${day}/${month}/${year}`;
              const formattedTime = timePart.substring(0, 5); // HH:mm

              return (
                <Card 
                  key={event.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                  onClick={() => setLocation(`/events/${event.id}`)}
                >
                    {event.bannerUrl && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={event.bannerUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="line-clamp-2 flex-1">{event.title}</CardTitle>
                        {event.status === 'draft' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full whitespace-nowrap">
                            Rascunho
                          </span>
                        )}
                      </div>
                      <CardDescription className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{formattedDate} às {formattedTime}</span>
                        </div>
                        {event.category && (
                          <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {event.category}
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {event.stats?.total || 0}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Users className="h-3 w-3" />
                            Inscritos
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {event.stats?.approved || 0}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Aprovados
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {event.stats?.pending || 0}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            Pendentes
                          </div>
                        </div>
                      </div>
                      
                      {/* URL Amigável */}
                      {event.slug && (
                        <div className="mt-3 p-2 bg-gray-50 rounded-md flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <LinkIcon className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-600 truncate">
                              /e/{event.slug}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${window.location.origin}/e/${event.slug}`;
                              navigator.clipboard.writeText(url);
                              toast.success("URL copiada!");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/events/edit/${event.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/events/${event.id}/scan`);
                            }}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            Scanner
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const registerUrl = event.slug 
                                ? `/e/${event.slug}` 
                                : `/register/${event.id}`;
                              window.open(registerUrl, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Evento
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/events/${event.id}`);
                            }}
                          >
                            Gerenciar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
