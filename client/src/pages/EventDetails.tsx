import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, CheckCircle, Clock, XCircle, Search, QrCode as QrCodeIcon, ExternalLink, Trash2, Download, Plus, Eye, Mail, UserCog } from "lucide-react";
import EventCollaborators from "@/components/EventCollaborators";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [bulkEmailTemplate, setBulkEmailTemplate] = useState<'approval' | 'confirmation'>('confirmation');
  const [bulkEmailStatus, setBulkEmailStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('approved');
  const [manualFormData, setManualFormData] = useState<Record<string, any>>({});

  const { data: event, isLoading } = trpc.events.getById.useQuery({ eventId });
  const { data: registrations, refetch: refetchRegistrations } = trpc.registrations.listByEvent.useQuery({ eventId });
  const { data: stats } = trpc.events.getStats.useQuery({ eventId });
  const { data: permissions } = trpc.collaborators.getPermissions.useQuery({ eventId });

  const sendBulkEmailsMutation = trpc.registrations.sendBulkEmails.useMutation({
    onSuccess: (data) => {
      toast.success(`Emails enviados! ${data.sent} enviados, ${data.failed} falharam.`);
      setIsBulkEmailOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao enviar emails: " + error.message);
    },
  });

  const updateStatusMutation = trpc.registrations.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetchRegistrations();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const createManualMutation = trpc.registrations.createManual.useMutation({
    onSuccess: () => {
      toast.success("Participante cadastrado com sucesso!");
      refetchRegistrations();
      setIsAddOpen(false);
      setManualFormData({});
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const { data: csvData, refetch: refetchCsv } = trpc.registrations.exportToCsv.useQuery(
    { eventId, status: 'all' },
    { enabled: false }
  );

  const handleExportCsv = async () => {
    const result = await refetchCsv();
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = result.data.filename;
      link.click();
      toast.success("Lista exportada com sucesso!");
    }
  };

  const handleManualSubmit = () => {
    if (!manualFormData['Nome Completo'] || !manualFormData['E-mail']) {
      toast.error("Nome e e-mail são obrigatórios");
      return;
    }

    createManualMutation.mutate({
      eventId,
      name: manualFormData['Nome Completo'],
      email: manualFormData['E-mail'],
      phone: manualFormData['Telefone'] || '',
      formData: JSON.stringify(manualFormData),
      status: 'approved',
    });
  };

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

          <div className="space-y-4">
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            
            {/* Data e Hora */}
            <div className="border-l-4 border-primary pl-4 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Data e Horário</div>
              <div className="text-lg font-medium">
                {format(new Date(event.eventDate), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>

            {/* Endereço */}
            {event.address && (() => {
              const [addressName, mapUrl] = event.address.split('|');
              return (
                <div className="border-l-4 border-primary pl-4 py-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Local</div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-lg font-medium">📍 {addressName}</div>
                    {mapUrl && mapUrl.startsWith('http') && (
                      <a 
                        href={mapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ver no Mapa
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Tipo de Inscrição */}
            <div className="border-l-4 border-primary pl-4 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Tipo de Inscrição</div>
              <div className="text-lg font-medium">
                <Badge variant={event.registrationType === "open" ? "default" : "secondary"} className="text-sm">
                  {event.registrationType === "open" ? "Inscrição Aberta" : "Com Aprovação"}
                </Badge>
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white" 
                  onClick={handleExportCsv}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
                {permissions?.canCreateParticipants && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={() => setIsAddOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Participante
                  </Button>
                )}
                {permissions?.canSendEmails && (
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white" 
                    onClick={() => setIsBulkEmailOpen(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Emails
                  </Button>
                )}
                <Link href={`/events/${eventId}/scan`} className="w-full">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    <QrCodeIcon className="h-4 w-4 mr-2" />
                    Scanner QR Code
                  </Button>
                </Link>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                  <a href={`/register/${eventId}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Página de Inscrição
                  </a>
                </Button>
                {permissions?.canDeleteEvent && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700 text-white">
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
                )}
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
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">
                    Pendentes ({pendingRegistrations.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="text-xs sm:text-sm">
                    Aprovados ({approvedRegistrations.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                    Rejeitados ({rejectedRegistrations.length})
                  </TabsTrigger>
                  <TabsTrigger value="collaborators" className="text-xs sm:text-sm">
                    <UserCog className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Colaboradores
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-4">
                  {pendingRegistrations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhuma inscrição pendente</p>
                  ) : (
                    pendingRegistrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{reg.name}</p>
                          <p className="text-sm text-muted-foreground">{reg.email}</p>
                          {reg.phone && <p className="text-sm text-muted-foreground">{reg.phone}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRegistration(reg);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                          </Button>
                          {permissions?.canApproveRegistrations && (
                            <div className="flex flex-col sm:flex-row gap-2">
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
                          )}
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
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRegistration(reg);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
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

                <TabsContent value="collaborators" className="mt-4">
                  <EventCollaborators eventId={eventId} />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
      
      <Footer />

      {/* Modal de Detalhes do Participante */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Participante</DialogTitle>
            <DialogDescription>Informações completas da inscrição</DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <p className="font-medium">{selectedRegistration.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedRegistration.email}</p>
                </div>
                {selectedRegistration.phone && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                    <p className="font-medium">{selectedRegistration.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="font-medium">
                    {selectedRegistration.status === 'approved' ? 'Aprovado' : 
                     selectedRegistration.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Check-in</Label>
                  <p className="font-medium">{selectedRegistration.checkedIn ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Inscrição</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRegistration.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {selectedRegistration.formData && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-2 block">Dados do Formulário</Label>
                  <div className="space-y-3">
                    {Object.entries(JSON.parse(selectedRegistration.formData)).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <Label className="text-xs text-muted-foreground col-span-1">{key}</Label>
                        <p className="text-sm col-span-2">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro Manual */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Participante Manualmente</DialogTitle>
            <DialogDescription>Cadastre um participante diretamente sem formulário público</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {event?.formFields && event.formFields.map((field: any) => (
              <div key={field.label}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={manualFormData[field.label] || ''}
                    onChange={(e) => setManualFormData({ ...manualFormData, [field.label]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={manualFormData[field.label] || ''}
                    onChange={(e) => setManualFormData({ ...manualFormData, [field.label]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
              <Button onClick={handleManualSubmit} disabled={createManualMutation.isPending}>
                {createManualMutation.isPending ? 'Cadastrando...' : 'Cadastrar Participante'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Envio em Massa */}
      <Dialog open={isBulkEmailOpen} onOpenChange={setIsBulkEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Emails em Massa</DialogTitle>
            <DialogDescription>Envie emails personalizados para os participantes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Email</Label>
              <select
                className="w-full mt-2 p-2 border rounded"
                value={bulkEmailTemplate}
                onChange={(e) => setBulkEmailTemplate(e.target.value as any)}
              >
                <option value="confirmation">✉️ Confirmação de Inscrição</option>
                <option value="approval">🎉 Aprovação de Inscrição</option>
              </select>
            </div>

            <div>
              <Label>Filtrar por Status</Label>
              <select
                className="w-full mt-2 p-2 border rounded"
                value={bulkEmailStatus}
                onChange={(e) => setBulkEmailStatus(e.target.value as any)}
              >
                <option value="all">📊 Todos</option>
                <option value="approved">✅ Apenas Aprovados</option>
                <option value="pending">⏳ Apenas Pendentes</option>
                <option value="rejected">❌ Apenas Rejeitados</option>
              </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
              <p className="font-semibold mb-1">💡 Informação</p>
              <p className="text-muted-foreground">
                {bulkEmailStatus === 'all' ? 'Todos os participantes' : 
                 bulkEmailStatus === 'approved' ? 'Apenas participantes aprovados' :
                 bulkEmailStatus === 'pending' ? 'Apenas participantes pendentes' :
                 'Apenas participantes rejeitados'} receberão o email.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsBulkEmailOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => {
                  sendBulkEmailsMutation.mutate({
                    eventId,
                    templateType: bulkEmailTemplate,
                    status: bulkEmailStatus,
                  });
                }}
                disabled={sendBulkEmailsMutation.isPending}
              >
                {sendBulkEmailsMutation.isPending ? 'Enviando...' : '📧 Enviar Emails'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
