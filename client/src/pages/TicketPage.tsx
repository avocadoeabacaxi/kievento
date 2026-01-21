import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { XCircle, Printer, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import QRCode from "qrcode";

export default function TicketPage() {
  const [, params] = useRoute("/ticket/:qrCode");
  const qrCode = params?.qrCode || "";
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const { data, isLoading } = trpc.registrations.getByQrCode.useQuery({ qrCode });
  const { data: ticketType } = trpc.ticketTypes.getById.useQuery(
    { id: data?.registration?.ticketTypeId || 0 },
    { enabled: !!data?.registration?.ticketTypeId }
  );

  useEffect(() => {
    if (qrCode && qrCanvasRef.current && data) {
      // Pequeno delay para garantir que o canvas está montado no DOM
      setTimeout(() => {
        if (qrCanvasRef.current) {
          QRCode.toCanvas(qrCanvasRef.current, qrCode, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          }).catch(err => {
            console.error("Erro ao gerar QR Code:", err);
          });
        }
      }, 100);
    }
  }, [qrCode, data]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando ingresso...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <XCircle className="h-16 w-16 text-destructive mx-auto" />
          <div>
            <h2 className="text-2xl font-bold">Ingresso não encontrado</h2>
            <p className="text-muted-foreground mt-2">
              O código do ingresso não é válido ou foi removido.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { registration, event } = data;
  const [addressName, fullAddress] = event.address?.split('|') || ['', ''];
  const eventDate = format(new Date(event.eventDate), "dd 'de' MMMM 'de' yyyy, HH'h'mm", { locale: ptBR });
  const purchaseDate = format(new Date(registration.createdAt), "dd 'set.' yyyy '-' HH'h'mm", { locale: ptBR });

  return (
    <>
      {/* Ingresso */}
      <div className="min-h-screen bg-gray-100 print:bg-white flex items-center justify-center p-4 print:p-0">
        <div className="max-w-3xl w-full bg-white shadow-2xl print:shadow-none rounded-lg print:rounded-none overflow-hidden">
          {/* Header com fundo preto */}
          <div className="bg-black p-6 sm:p-8 text-white">
            {/* Layout Mobile: Logo primeiro, depois conteúdo */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              {/* Logo - centralizada em mobile, à direita em desktop */}
              <div className="flex justify-center sm:order-2 sm:justify-end">
                <img 
                  src="/logo-white.png" 
                  alt="KiEvento" 
                  className="h-12 sm:h-16"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/logo.png';
                  }}
                />
              </div>
              
              {/* Conteúdo - abaixo da logo em mobile, à esquerda em desktop */}
              <div className="flex-1 sm:order-1 space-y-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-center sm:text-left">
                  {event.title}
                </h1>
                
                {/* Data */}
                <div className="flex items-start gap-2 justify-center sm:justify-start">
                  <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  <div className="text-sm sm:text-base">
                    {eventDate}
                  </div>
                </div>
                
                {/* Local */}
                <div className="flex items-start gap-2 justify-center sm:justify-start">
                  <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm sm:text-base text-center sm:text-left flex-1">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <div className="font-semibold">{addressName}</div>
                      {fullAddress && fullAddress.startsWith('http') && (
                        <a 
                          href={fullAddress} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded transition-colors"
                        >
                          Ir
                        </a>
                      )}
                    </div>
                    {fullAddress && !fullAddress.startsWith('http') && (
                      <div className="text-gray-300 mt-1">{fullAddress}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Corpo do ingresso */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Grid com informações e QR Code */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Coluna esquerda - Informações */}
              <div className="space-y-4">
                {/* Seção Participante */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                    Participante
                  </div>
                  <div className="text-lg font-bold text-gray-900 uppercase">
                    {registration.name}
                  </div>
                  {ticketType && (
                    <div className="mt-2">
                      <span 
                        className="inline-block px-3 py-1 text-xs font-semibold text-white rounded-full"
                        style={{ backgroundColor: ticketType.color || '#ef4444' }}
                      >
                        {ticketType.name}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Inscrito dia {purchaseDate}
                  </div>
                </div>
              </div>

              {/* Coluna direita - QR Code */}
              <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg">
                <div className="w-full max-w-[300px] flex items-center justify-center mb-4">
                  <canvas 
                    ref={qrCanvasRef}
                    width={300}
                    height={300}
                    className="w-full h-auto border border-gray-200 rounded"
                  />
                </div>
                <div className="text-center w-full">
                  <div className="text-sm font-mono font-bold text-gray-900 tracking-wider break-all px-2">
                    {qrCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Status da inscrição */}
            {registration.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 font-medium">
                  ⏳ Aguardando aprovação do organizador
                </p>
              </div>
            )}

            {registration.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-800 font-medium">
                  ❌ Inscrição não aprovada
                </p>
              </div>
            )}

            {registration.checkedIn && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800 font-medium">
                  ✅ Check-in realizado em {format(new Date(registration.checkedInAt!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 sm:px-8 py-4 text-center text-xs text-gray-500 border-t print:border-gray-300">
            © {new Date().getFullYear()} KiEvento By Lab485/Avocado. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Rodapé fixo com botões - oculto na impressão */}
      <div className="print:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="container py-4 flex flex-wrap justify-center gap-3">
          <Button onClick={handlePrint} size="lg" className="shadow-md">
            <Printer className="h-5 w-5 mr-2" />
            Imprimir Ingresso
          </Button>
          <Button 
            onClick={() => window.open(`/api/wallet/pass/${qrCode}`, '_blank')} 
            size="lg" 
            variant="outline" 
            className="shadow-md"
          >
            <Wallet className="h-5 w-5 mr-2" />
            Adicionar à Carteira
          </Button>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}
