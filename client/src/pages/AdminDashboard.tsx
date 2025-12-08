import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar, Users, Search, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Footer from "@/components/Footer";

export default function AdminDashboard() {
  const [eventSearch, setEventSearch] = useState("");
  const [registrationSearch, setRegistrationSearch] = useState("");

  const { data: allEvents, isLoading: eventsLoading } = trpc.events.allEvents.useQuery();
  const { data: allRegistrations, isLoading: registrationsLoading } = trpc.registrations.allRegistrations.useQuery();

  const filteredEvents = allEvents?.filter(
    (event) =>
      event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      event.address?.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredRegistrations = allRegistrations?.filter(
    (reg) =>
      reg.name.toLowerCase().includes(registrationSearch.toLowerCase()) ||
      reg.email.toLowerCase().includes(registrationSearch.toLowerCase())
  );

  // Calcular estatísticas gerais
  const totalEvents = allEvents?.length || 0;
  const totalRegistrations = allRegistrations?.length || 0;
  const totalApproved = allRegistrations?.filter((r) => r.status === "approved").length || 0;
  const totalCheckedIn = allRegistrations?.filter((r) => r.checkedIn === 1).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Geral</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Visualização completa de todos os eventos e inscrições da plataforma
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApproved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Realizados</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCheckedIn}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="events">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events">Todos os Eventos</TabsTrigger>
            <TabsTrigger value="registrations">Todas as Inscrições</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Eventos da Plataforma</CardTitle>
                <CardDescription>
                  Visualize todos os eventos criados por todos os usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar eventos..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {eventsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : filteredEvents && filteredEvents.length > 0 ? (
                    <div className="space-y-3">
                      {filteredEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{event.title}</h3>
                              {event.bannerUrl && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Com banner
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.eventDate), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {event.address && (
                              <p className="text-sm text-muted-foreground">📍 {event.address}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span>👥 {event.stats.total} inscritos</span>
                              <span>✅ {event.stats.approved} aprovados</span>
                              <span>📍 {event.stats.checkedIn} presentes</span>
                            </div>
                          </div>
                          <Link href={`/events/${event.id}`}>
                            <Button size="sm" variant="outline">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum evento encontrado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Inscrições da Plataforma</CardTitle>
                <CardDescription>
                  Visualize todas as inscrições de todos os eventos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar inscrições..."
                      value={registrationSearch}
                      onChange={(e) => setRegistrationSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {registrationsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : filteredRegistrations && filteredRegistrations.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {filteredRegistrations.map((reg) => (
                        <div key={reg.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">{reg.name}</h3>
                              <p className="text-sm text-muted-foreground">{reg.email}</p>
                              {reg.phone && (
                                <p className="text-sm text-muted-foreground">{reg.phone}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {reg.status === "approved" && (
                                  <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                    Aprovado
                                  </span>
                                )}
                                {reg.status === "pending" && (
                                  <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                                    Pendente
                                  </span>
                                )}
                                {reg.status === "rejected" && (
                                  <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                                    Rejeitado
                                  </span>
                                )}
                                {reg.checkedIn === 1 && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                    Check-in feito
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>Evento ID: {reg.eventId}</p>
                              <p className="text-xs mt-1">
                                {format(new Date(reg.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma inscrição encontrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
