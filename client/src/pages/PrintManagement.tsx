import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Printer, Search, User, Building2, CheckCircle2, AlertCircle, Camera, CameraOff, UserCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

interface Participant {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  formData?: string | null;
  status: string;
  checkedIn: number;
  qrCode: string | null;
}

// Função para tocar som
const playSound = (type: 'success' | 'error') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  if (type === 'success') {
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
  } else {
    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';
    gainNode.gain.value = 0.3;
    oscillator.start();
    setTimeout(() => oscillator.stop(), 300);
  }
};

export default function PrintManagement() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const eventId = parseInt(id || "0");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanBorderState, setScanBorderState] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastScannedCode, setLastScannedCode] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const autoModeRef = useRef(autoMode);

  // Manter ref atualizado com o estado
  useEffect(() => {
    autoModeRef.current = autoMode;
  }, [autoMode]);

  // Buscar evento
  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  // Buscar participantes aprovados
  const { data: registrations, refetch: refetchRegistrations } = trpc.registrations.listByEvent.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  // Mutation para check-in
  const checkInMutation = trpc.registrations.checkInById.useMutation({
    onSuccess: () => {
      refetchRegistrations();
    },
  });

  // Mutation para validar QR Code
  const checkInByQrCodeMutation = trpc.registrations.checkInByQrCode.useMutation();

  // Filtrar apenas aprovados
  const approvedParticipants = registrations?.filter(
    (r: Participant) => r.status === "approved"
  ) || [];

  // Filtrar por busca
  const filteredParticipants = approvedParticipants.filter((p: Participant) => {
    const searchLower = searchTerm.toLowerCase();
    const formData = p.formData ? JSON.parse(p.formData) : {};
    const company = formData["Empresa"] || formData["empresa"] || "";
    
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.email.toLowerCase().includes(searchLower) ||
      company.toLowerCase().includes(searchLower)
    );
  });

  // Extrair empresa do formData
  const getCompany = (participant: Participant): string => {
    if (!participant.formData) return "";
    try {
      const formData = JSON.parse(participant.formData);
      return formData["Empresa"] || formData["empresa"] || formData["EMPRESA"] || "";
    } catch {
      return "";
    }
  };

  // Função para imprimir etiqueta
  const handlePrint = useCallback(async (participant: Participant, doCheckIn: boolean = true) => {
    setSelectedParticipant(participant);
    setIsPrinting(true);

    // Fazer check-in se ainda não foi feito e doCheckIn é true
    if (doCheckIn && !participant.checkedIn) {
      try {
        await checkInMutation.mutateAsync({ registrationId: participant.id });
        toast.success("Check-in realizado!");
        playSound('success');
      } catch (error) {
        console.error("Erro no check-in:", error);
        playSound('error');
      }
    }

    // Aguardar renderização e imprimir
    setTimeout(() => {
      const printWindow = window.open("", "_blank", "width=302,height=113");
      if (!printWindow) {
        toast.error("Popup bloqueado. Permita popups para imprimir.");
        setIsPrinting(false);
        return;
      }

      const company = getCompany(participant);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Etiqueta - ${participant.name}</title>
          <style>
            @page {
              size: 100mm 20mm;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 100mm;
              height: 20mm;
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 1mm 2mm;
              overflow: hidden;
            }
            .name {
              font-size: 16pt;
              font-weight: bold;
              text-align: center;
              line-height: 1.1;
              max-width: 96mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .company {
              font-size: 12pt;
              text-align: center;
              margin-top: 0.5mm;
              max-width: 96mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="name">${participant.name.toUpperCase()}</div>
          ${company ? `<div class="company">${company}</div>` : ""}
        </body>
        </html>
      `);

      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        setIsPrinting(false);
        toast.success("Etiqueta enviada para impressão!");
      };

      // Fallback se onload não disparar
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
        setIsPrinting(false);
      }, 1000);
    }, 100);
  }, [checkInMutation]);

  // Função para fazer apenas check-in (sem imprimir)
  const handleCheckInOnly = async (participant: Participant) => {
    if (participant.checkedIn) {
      toast.info("Participante já fez check-in");
      return;
    }

    try {
      await checkInMutation.mutateAsync({ registrationId: participant.id });
      toast.success(`Check-in realizado para ${participant.name}!`);
      playSound('success');
      refetchRegistrations();
    } catch (error) {
      console.error("Erro no check-in:", error);
      toast.error("Erro ao fazer check-in");
      playSound('error');
    }
  };

  // Processar QR Code escaneado
  const handleQRCodeScan = useCallback(async (qrCode: string) => {
    // Evitar processar o mesmo código repetidamente
    if (qrCode === lastScannedCode) return;
    setLastScannedCode(qrCode);

    // Limpar código após 3 segundos para permitir re-scan
    setTimeout(() => setLastScannedCode(""), 3000);

    try {
      // Validar QR Code
      const result = await checkInByQrCodeMutation.mutateAsync({ qrCode });
      
      if (result.success && result.registration) {
        setScanBorderState('success');
        playSound('success');
        
        // Usar o participante retornado pelo check-in
        const participant = result.registration as unknown as Participant;
        setSelectedParticipant(participant);
        
        // Se modo automático, imprimir automaticamente
        if (autoModeRef.current) {
          toast.success(`${participant.name} - Imprimindo etiqueta...`);
          handlePrint(participant, false); // Check-in já foi feito
        } else {
          toast.success(`${participant.name} - Check-in realizado!`);
        }
        
        refetchRegistrations();
      }
    } catch (error: any) {
      setScanBorderState('error');
      playSound('error');
      toast.error(error.message || "Erro ao validar QR Code");
    }

    // Resetar estado da borda após 2 segundos
    setTimeout(() => setScanBorderState('idle'), 2000);
  }, [lastScannedCode, checkInByQrCodeMutation, handlePrint, refetchRegistrations]);

  // Iniciar scanner
  const startScanning = async () => {
    console.log("[Camera] Iniciando scanner...");
    
    if (!videoRef.current) {
      console.error("[Camera] videoRef não encontrado");
      toast.error("Erro: Elemento de vídeo não encontrado");
      return;
    }

    // Verificar se o navegador suporta getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("[Camera] getUserMedia não suportado");
      toast.error("Seu navegador não suporta acesso à câmera");
      return;
    }

    try {
      // Primeiro, solicitar permissão explícita para a câmera
      console.log("[Camera] Solicitando permissão...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Parar o stream temporário (só usamos para obter permissão)
      stream.getTracks().forEach(track => track.stop());
      console.log("[Camera] Permissão concedida");

      readerRef.current = new BrowserMultiFormatReader();
      setIsScanning(true);
      toast.info("Iniciando câmera...");

      // Listar dispositivos de vídeo
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      console.log("[Camera] Dispositivos encontrados:", videoDevices.map(d => d.label));
      
      // Preferir câmera traseira
      const backCamera = videoDevices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('traseira') ||
        d.label.toLowerCase().includes('rear')
      );

      const deviceId = backCamera?.deviceId || (videoDevices[0]?.deviceId || undefined);
      console.log("[Camera] Usando dispositivo:", deviceId || "padrão");

      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log("[Camera] QR Code lido:", result.getText());
            handleQRCodeScan(result.getText());
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error("[Camera] Erro de scan:", error);
          }
        }
      );
      
      toast.success("Câmera ativada! Aponte para o QR Code.");
    } catch (err: any) {
      console.error("[Camera] Erro ao iniciar:", err);
      setIsScanning(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error("Permissão negada. Clique no ícone de câmera na barra de endereço para permitir.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error("Nenhuma câmera encontrada neste dispositivo.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast.error("Câmera em uso por outro aplicativo.");
      } else if (err.name === 'OverconstrainedError') {
        toast.error("Câmera não suporta as configurações solicitadas.");
      } else {
        toast.error(`Erro ao iniciar câmera: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  // Parar scanner
  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Selecionar participante ao clicar
  const handleSelectParticipant = (participant: Participant) => {
    setSelectedParticipant(participant);
  };

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Evento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation(`/events/${eventId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Gestão de Impressão
                </h1>
                <p className="text-sm text-muted-foreground">{event.title}</p>
              </div>
            </div>
            
            {/* Toggle Modo Automático */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-mode"
                checked={autoMode}
                onCheckedChange={setAutoMode}
              />
              <Label htmlFor="auto-mode" className="text-sm font-medium">
                Impressão Automática
              </Label>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Scanner e Busca */}
          <div className="space-y-4">
            {/* Scanner de QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Scanner de QR Code
                </CardTitle>
                <CardDescription>
                  {autoMode 
                    ? "Modo automático: Escaneia, faz check-in e imprime" 
                    : "Escaneia e faz check-in automaticamente"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vídeo da câmera */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Câmera desligada</p>
                      </div>
                    </div>
                  )}
                  {isScanning && (
                    <div className={`absolute inset-0 border-4 pointer-events-none transition-colors ${
                      scanBorderState === 'success' ? 'border-green-500 animate-pulse' :
                      scanBorderState === 'error' ? 'border-red-500 animate-pulse' :
                      'border-blue-500'
                    }`} />
                  )}
                </div>

                {/* Botão de controle da câmera */}
                <Button
                  onClick={isScanning ? stopScanning : startScanning}
                  className={`w-full h-12 ${isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isScanning ? (
                    <>
                      <CameraOff className="h-5 w-5 mr-2" />
                      Desligar Câmera
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5 mr-2" />
                      Ligar Câmera
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Busca Manual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar Participante
                </CardTitle>
                <CardDescription>
                  Digite o nome ou empresa para buscar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Nome, e-mail ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-lg h-12"
                />
              </CardContent>
            </Card>

            {/* Lista de Participantes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Participantes Aprovados ({filteredParticipants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredParticipants.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchTerm ? "Nenhum participante encontrado" : "Nenhum participante aprovado"}
                    </div>
                  ) : (
                    filteredParticipants.map((participant: Participant) => {
                      const company = getCompany(participant);
                      const isSelected = selectedParticipant?.id === participant.id;
                      
                      return (
                        <div
                          key={participant.id}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                            isSelected ? "bg-primary/5 border-l-4 border-l-primary" : ""
                          }`}
                          onClick={() => handleSelectParticipant(participant)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium truncate">{participant.name}</span>
                                {participant.checkedIn ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : null}
                              </div>
                              {company && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm text-muted-foreground truncate">{company}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {/* Botão Check-in */}
                              <Button
                                size="sm"
                                variant={participant.checkedIn ? "outline" : "default"}
                                className={participant.checkedIn ? "text-green-600" : "bg-blue-600 hover:bg-blue-700"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckInOnly(participant);
                                }}
                                disabled={participant.checkedIn === 1}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              {/* Botão Imprimir */}
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrint(participant);
                                }}
                                disabled={isPrinting}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Preview da Etiqueta
                </CardTitle>
                <CardDescription>
                  Impressora: Tomate MDK2054L | Etiqueta: 100x20mm
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedParticipant ? (
                  <div className="space-y-4">
                    {/* Preview da Etiqueta */}
                    <div
                      ref={printRef}
                      className="mx-auto bg-white border-2 border-dashed border-gray-300 rounded"
                      style={{
                        width: "378px",
                        height: "76px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "8px",
                      }}
                    >
                    <div
                      className="font-bold text-center"
                      style={{ fontSize: "22px", lineHeight: "1.1" }}
                    >
                      {selectedParticipant.name.toUpperCase()}
                    </div>
                    {getCompany(selectedParticipant) && (
                      <div
                        className="text-gray-600 text-center mt-1"
                        style={{ fontSize: "16px" }}
                      >
                        {getCompany(selectedParticipant)}
                      </div>
                    )}
                    </div>

                    {/* Informações do Participante */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedParticipant.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedParticipant.email}
                      </div>
                      {selectedParticipant.phone && (
                        <div className="text-sm text-muted-foreground">
                          {selectedParticipant.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        {selectedParticipant.checkedIn ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                            <CheckCircle2 className="h-4 w-4" />
                            Check-in realizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <AlertCircle className="h-4 w-4" />
                            Aguardando check-in
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => handleCheckInOnly(selectedParticipant)}
                        disabled={selectedParticipant.checkedIn === 1}
                      >
                        <UserCheck className="h-5 w-5 mr-2" />
                        Apenas Check-in
                      </Button>
                      <Button
                        className="h-12"
                        onClick={() => handlePrint(selectedParticipant)}
                        disabled={isPrinting}
                      >
                        <Printer className="h-5 w-5 mr-2" />
                        {isPrinting ? "Imprimindo..." : "Imprimir"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Printer className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Selecione um participante ou escaneie um QR Code</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Instruções</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Modo Manual:</strong></p>
                <p>1. Busque o participante ou escaneie o QR Code</p>
                <p>2. Clique no ícone <UserCheck className="h-4 w-4 inline" /> para fazer apenas check-in</p>
                <p>3. Clique no ícone <Printer className="h-4 w-4 inline" /> para imprimir etiqueta</p>
                
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-green-800">
                  <p className="font-medium">Modo Automático (ativar no topo):</p>
                  <p>Ao escanear o QR Code, o sistema faz check-in e imprime automaticamente!</p>
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 rounded-lg text-amber-800">
                  <p className="font-medium">Configuração da Impressora:</p>
                  <p>Selecione a impressora "Tomate MDK2054L" na janela de impressão</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
