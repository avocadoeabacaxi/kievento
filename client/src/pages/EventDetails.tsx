import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, CheckCircle, Clock, XCircle, Search, QrCode as QrCodeIcon, ExternalLink, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import parse from "html-react-parser";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";

export default function EventDetails() {
  const [, params] = useRoute("/events/:id");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;
  const [searchTerm, setSearchTerm] = useState("");

  const { data: event, isLoading } = trpc.events.getById.useQuery({ eventId });
  const { data: registrations, refetch: refetchRegistrations } = trpc.registrations.listByEvent.useQuery({ eventId });
  const { data: stats } = trpc.events.getStats.useQuery({ eventId });

  const updateStatusMutation = trpc.registrations.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetchRegistrations();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const checkInMutation = trpc.registrations.checkInById.useMutation({
    onSuccess: () => {
      toast.success("Check-in realizado!");
      refetchRegistrations();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteEventMutation = trpc.events.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Evento excluído com sucesso!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir evento: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold">Evento não encontrado</p>
          <Link href="/dashboard">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredRegistrations = registrations?.filter((reg) =>
    reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRegistrations = filteredRegistrations?.filter((r) => r.status === "pending") || [];
  const approvedRegistrations = filteredRegistrations?.filter((r) => r.status === "approved") || [];
  const rejectedRegistrations = filteredRegistrations?.filter((r) => r.status === "rejected") || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Evento
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O evento e todas as inscrições associadas serão permanentemente excluídos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteEventMutation.mutate({ eventId })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="container py-8">
        <Breadcrumb 
          items={[
            { label: "Meus Eventos", href: "/dashboard" },
            { label: event?.title || "Detalhes do Evento" }
          ]} 
        />
        
        <div className="space-y-6">
        {/* Event Header */}
        <div className="space-y-4">
          {event.bannerUrl && (
            <div className="h-32 w-full max-w-md overflow-hidden rounded-lg border">
              <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{format(new Date(event.eventDate), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
              {event.address && <span>📍 {event.address}</span>}
              <Badge variant={event.registrationType === "open" ? "default" : "secondary"}>
                {event.registrationType === "open" ? "Inscrição Aberta" : "Com Aprovação"}
              </Badge>
            </div>
          </div>

          {event.description && (
            <Card>
              <CardContent className="pt-6 prose prose-sm max-w-none">
                {parse(event.description)}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Inscritos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Presentes</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.checkedIn}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Registrations Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Gerenciar Inscrições</CardTitle>
                <CardDescription>Aprove, rejeite e faça check-in dos participantes</CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href={`/events/${eventId}/scan`}>
                  <Button variant="outline">
                    <QrCodeIcon className="h-4 w-4 mr-2" />
                    Scanner QR Code
                  </Button>
                </Link>
                <Button variant="outline" asChild>
                  <a href={`/register/${eventId}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Página de Inscrição
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">
                    Pendentes ({pendingRegistrations.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Aprovados ({approvedRegistrations.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejeitados ({rejectedRegistrations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-4">
                  {pendingRegistrations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhuma inscrição pendente</p>
                  ) : (
                    pendingRegistrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{reg.name}</p>
                          <p className="text-sm text-muted-foreground">{reg.email}</p>
                          {reg.phone && <p className="text-sm text-muted-foreground">{reg.phone}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ registrationId: reg.id, status: "approved" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatusMutation.mutate({ registrationId: reg.id, status: "rejected" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="approved" className="space-y-4 mt-4">
                  {approvedRegistrations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhuma inscrição aprovada</p>
                  ) : (
                    approvedRegistrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{reg.name}</p>
                          <p className="text-sm text-muted-foreground">{reg.email}</p>
                          {reg.phone && <p className="text-sm text-muted-foreground">{reg.phone}</p>}
                        </div>
                        <div className="flex items-center gap-4">
                          {reg.checkedIn ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Presente
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => checkInMutation.mutate({ registrationId: reg.id })}
                              disabled={checkInMutation.isPending}
                            >
                              Fazer Check-in
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/ticket/${reg.qrCode}`} target="_blank">
                              <QrCodeIcon className="h-4 w-4 mr-1" />
                              Ver Convite
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4 mt-4">
                  {rejectedRegistrations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhuma inscrição rejeitada</p>
                  ) : (
                    rejectedRegistrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                        <div>
                          <p className="font-medium">{reg.name}</p>
                          <p className="text-sm text-muted-foreground">{reg.email}</p>
                          {reg.phone && <p className="text-sm text-muted-foreground">{reg.phone}</p>}
                        </div>
                        <Badge variant="destructive">Rejeitado</Badge>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
