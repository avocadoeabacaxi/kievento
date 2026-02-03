import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, CheckCircle, Clock, XCircle, Search, QrCode as QrCodeIcon, ExternalLink, Trash2, Download, Plus, Eye, Mail, UserCog, Settings as SettingsIcon, Send, RefreshCw, History, FileSpreadsheet } from "lucide-react";
import EventCollaborators from "@/components/EventCollaborators";
import EventSettingsTab from "@/components/EventSettingsTab";
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
import { exportCheckInHistory, exportParticipants } from "@/lib/exportXls";
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
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; registration: any } | null>(null);

  const { data: event, isLoading } = trpc.events.getById.useQuery({ eventId });
  const { data: registrations, refetch: refetchRegistrations } = trpc.registrations.listByEvent.useQuery({ eventId });
  const { data: stats } = trpc.events.getStats.useQuery({ eventId });
  const { data: permissions } = trpc.collaborators.getPermissions.useQuery({ eventId });
  const { data: checkInHistory, refetch: refetchCheckInHistory } = trpc.registrations.checkInHistory.useQuery({ eventId });

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
    onSuccess: (_, variables) => {
      const action = variables.status === 'approved' ? 'aprovada' : 'recusada';
      toast.success(`Inscrição ${action}! E-mail enviado para o participante.`);
      refetchRegistrations();
      setConfirmAction(null);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const createManualMutation = trpc.registrations.createManual.useMutation({
    onSuccess: (data) => {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">✅ Participante cadastrado com sucesso!</span>
          <span className="text-sm text-muted-foreground">Status: {data.status === 'approved' ? 'Aprovado' : 'Pendente'}</span>
        </div>,
        { duration: 5000 }
      );
      refetchRegistrations();
      setIsAddOpen(false);
      setManualFormData({});
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resendInviteMutation = trpc.registrations.resendInvite.useMutation({
    onSuccess: (data) => {
      toast.success(`Convite reenviado! (${data.emailSentCount}x enviado)`);
      refetchRegistrations();
    },
    onError: (error) => {
      toast.error(`Erro ao reenviar: ${error.message}`);
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

  const deleteRegistrationMutation = trpc.registrations.delete.useMutation({
    onSuccess: () => {
      toast.success("Participante excluído com sucesso!");
      refetchRegistrations();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
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
        {/* Event Header - Simplificado */}
        <div className="space-y-4">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            
            {/* Data e Hora */}
            <div className="border-l-4 border-primary pl-4 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Data e Horário</div>
              <div className="text-lg font-medium">
                {(() => {
                  if (!event.eventDate) return 'Data não definida';
                  const eventDateStr = typeof event.eventDate === 'string' ? event.eventDate : new Date(event.eventDate).toISOString();
                  const [datePart = '', timePart = ''] = eventDateStr.split('T');
                  if (!datePart) return 'Data não definida';
                  const [year, month, day] = datePart.split('-');
                  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                  const monthName = monthNames[parseInt(month) - 1] || 'janeiro';
                  const time = timePart ? timePart.substring(0, 5) : '00:00';
                  return `${parseInt(day) || 1} de ${monthName} de ${year || '2025'} às ${time}`;
                })()}
              </div>
            </div>


          </div>
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
                <Link href={`/events/${eventId}/print`} className="w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Imprimir Etiquetas
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
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 gap-1">
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
                  <TabsTrigger value="settings" className="text-xs sm:text-sm">
                    <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Configurações
                  </TabsTrigger>
                  <TabsTrigger value="checkin-history" className="text-xs sm:text-sm">
                    <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Histórico ({checkInHistory?.length || 0})
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
                                onClick={() => setConfirmAction({ type: 'approve', registration: reg })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setConfirmAction({ type: 'reject', registration: reg })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Participante</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir <strong>{reg.name}</strong>? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => deleteRegistrationMutation.mutate({ registrationId: reg.id })}
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                      <div key={reg.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{reg.name}</p>
                          <p className="text-sm text-muted-foreground">{reg.email}</p>
                          {reg.phone && <p className="text-sm text-muted-foreground">{reg.phone}</p>}
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                          <Button
                            size="sm"
                            variant={(reg as any).emailSentCount > 0 ? "outline" : "default"}
                            className={(reg as any).emailSentCount > 0 ? "" : "bg-blue-600 hover:bg-blue-700 text-white"}
                            onClick={() => {
                              console.log('Reenviando convite para:', reg.id, reg.email);
                              resendInviteMutation.mutate({ registrationId: reg.id });
                            }}
                            disabled={resendInviteMutation.isPending}
                            title={(reg as any).emailSentCount > 0 ? `Enviado ${(reg as any).emailSentCount}x - Clique para reenviar` : 'Enviar convite por e-mail'}
                          >
                            {resendInviteMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            {(reg as any).emailSentCount > 0 ? 'Reenviar' : 'Enviar'}
                            {(reg as any).emailSentCount > 0 ? (
                              <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-800">
                                {(reg as any).emailSentCount}x
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="ml-1 text-xs bg-yellow-100 text-yellow-800">
                                Pendente
                              </Badge>
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Participante</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir <strong>{reg.name}</strong>? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteRegistrationMutation.mutate({ registrationId: reg.id })}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

                <TabsContent value="settings" className="mt-4">
                  <EventSettingsTab eventId={eventId} event={event} refetch={() => {}} />
                </TabsContent>

                <TabsContent value="checkin-history" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Histórico de Check-ins</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!checkInHistory || checkInHistory.length === 0) {
                          toast.error('Nenhum check-in para exportar');
                          return;
                        }
                        // Gerar XLS
                        const headers = ['Nome', 'Email', 'Telefone', 'Check-in Em', 'Check-in Por'];
                        const rows = checkInHistory.map((item: any) => [
                          item.name,
                          item.email,
                          item.phone || '',
                          item.checkedInAt ? new Date(item.checkedInAt).toLocaleString('pt-BR') : '',
                          item.operatorName || 'Sistema'
                        ]);
                        
                        // Criar CSV (compatível com Excel)
                        const BOM = '\uFEFF';
                        const csv = BOM + [headers.join(';'), ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `historico-checkins-${event?.title?.replace(/\s+/g, '-') || 'evento'}-${Date.now()}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Histórico exportado com sucesso!');
                      }}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exportar XLS
                    </Button>
                  </div>
                  
                  {!checkInHistory || checkInHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum check-in realizado ainda</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Participante</th>
                            <th className="text-left p-3 text-sm font-medium hidden sm:table-cell">Email</th>
                            <th className="text-left p-3 text-sm font-medium">Check-in Em</th>
                            <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Realizado Por</th>
                          </tr>
                        </thead>
                        <tbody>
                          {checkInHistory.map((item: any, index: number) => (
                            <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-sm">{item.name}</p>
                                  <p className="text-xs text-muted-foreground sm:hidden">{item.email}</p>
                                </div>
                              </td>
                              <td className="p-3 text-sm hidden sm:table-cell">{item.email}</td>
                              <td className="p-3 text-sm">
                                {item.checkedInAt ? new Date(item.checkedInAt).toLocaleString('pt-BR') : '-'}
                              </td>
                              <td className="p-3 text-sm hidden md:table-cell">
                                <Badge variant="outline">{item.operatorName || 'Sistema'}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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

      {/* Dialog de Confirmação de Aprovação/Recusa */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'approve' ? 'Aprovar Inscrição' : 'Recusar Inscrição'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {confirmAction?.type === 'approve' 
                  ? `Você está prestes a APROVAR a inscrição de:`
                  : `Você está prestes a RECUSAR a inscrição de:`}
              </p>
              <p className="font-semibold text-foreground">
                {confirmAction?.registration?.name} ({confirmAction?.registration?.email})
              </p>
              <p className="mt-4">
                {confirmAction?.type === 'approve' 
                  ? `Um e-mail será enviado automaticamente com o link para acessar o ingresso/convite.`
                  : `Um e-mail será enviado automaticamente informando que a inscrição não foi aprovada.`}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  updateStatusMutation.mutate({
                    registrationId: confirmAction.registration.id,
                    status: confirmAction.type === 'approve' ? 'approved' : 'rejected',
                  });
                }
              }}
              className={confirmAction?.type === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {updateStatusMutation.isPending 
                ? 'Processando...' 
                : confirmAction?.type === 'approve' 
                  ? 'Sim, Aprovar e Enviar E-mail' 
                  : 'Sim, Recusar e Enviar E-mail'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
