import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CheckCircle, Clock, Plus, Edit } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";

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
              const eventDate = new Date(event.eventDate);
              const formattedDate = format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
              const formattedTime = format(eventDate, "HH:mm", { locale: ptBR });

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
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
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
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/events/edit/${event.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/events/${event.id}`);
                          }}
                        >
                          Gerenciar
                        </Button>
                      </div>
                    </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
