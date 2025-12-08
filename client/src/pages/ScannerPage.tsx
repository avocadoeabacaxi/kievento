import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, CheckCircle, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";

export default function ScannerPage() {
  const [, params] = useRoute("/events/:id/scan");
  const eventId = params?.id ? parseInt(params.id) : 0;
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [searchName, setSearchName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: event } = trpc.events.getById.useQuery({ eventId });
  const { data: searchResults } = trpc.registrations.searchByName.useQuery(
    { eventId, searchTerm: searchName },
    { enabled: searchName.length >= 2 }
  );

  const [lastResult, setLastResult] = useState<{
    success: boolean;
    registration?: any;
    error?: string;
  } | null>(null);

  const checkInByQrCodeMutation = trpc.registrations.checkInByQrCode.useMutation({
    onSuccess: (data) => {
      setLastResult({ success: true, registration: data.registration });
      setQrCodeInput("");
      toast.success(`Check-in realizado: ${data.registration.name}`);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    onError: (error) => {
      setLastResult({ success: false, error: error.message });
      setQrCodeInput("");
      toast.error(error.message);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
  });

  const checkInByIdMutation = trpc.registrations.checkInById.useMutation({
    onSuccess: (data) => {
      if (data.registration) {
        toast.success(`Check-in realizado: ${data.registration.name}`);
      }
      setSearchName("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleQrCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrCodeInput.trim()) {
      checkInByQrCodeMutation.mutate({ qrCode: qrCodeInput.trim() });
    }
  };

  const handleCheckInById = (registrationId: number) => {
    checkInByIdMutation.mutate({ registrationId });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Mobile-optimized header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <h1 className="text-lg sm:text-xl font-semibold text-center">Validação de Entrada</h1>
            {event && <p className="text-xs sm:text-sm text-muted-foreground text-center">{event.title}</p>}
          </div>
        </div>
      </header>

      <main className="container px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
        {/* Breadcrumb - hidden on mobile for cleaner look */}
        <div className="hidden sm:block mb-6">
          <Breadcrumb 
            items={[
              { label: "Meus Eventos", href: "/dashboard" },
              { label: event?.title || "Evento", href: `/events/${eventId}` },
              { label: "Validação de Entrada" }
            ]} 
          />
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* QR Code Scanner - Mobile optimized */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use um leitor de QR Code ou digite o código manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleQrCodeSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qrcode" className="text-sm sm:text-base">Código QR</Label>
                  <Input
                    ref={inputRef}
                    id="qrcode"
                    type="text"
                    value={qrCodeInput}
                    onChange={(e) => setQrCodeInput(e.target.value)}
                    placeholder="Escaneie ou digite o código..."
                    autoComplete="off"
                    autoFocus
                    className="text-base h-12 sm:h-10"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 sm:h-10 text-base sm:text-sm" 
                  disabled={checkInByQrCodeMutation.isPending}
                >
                  {checkInByQrCodeMutation.isPending ? "Validando..." : "Validar Entrada"}
                </Button>
              </form>

              {/* Last Result - Mobile optimized */}
              {lastResult && (
                <div className="mt-4">
                  {lastResult.success ? (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-green-900 dark:text-green-100 text-sm sm:text-base">
                            Check-in Realizado!
                          </p>
                          <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1 truncate">
                            {lastResult.registration.name}
                          </p>
                          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 truncate">
                            {lastResult.registration.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-red-900 dark:text-red-100 text-sm sm:text-base">Erro na Validação</p>
                          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1 break-words">
                            {lastResult.error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search by Name - Mobile optimized */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                Buscar por Nome
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Pesquise participantes pelo nome ou e-mail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm sm:text-base">Nome ou E-mail</Label>
                  <Input
                    id="search"
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Digite pelo menos 2 caracteres..."
                    className="text-base h-12 sm:h-10"
                  />
                </div>

                {/* Search Results - Mobile optimized */}
                {searchName.length >= 2 && (
                  <div className="space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                    {!searchResults || searchResults.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 text-sm sm:text-base">
                        Nenhum participante encontrado
                      </p>
                    ) : (
                      searchResults.map((reg) => (
                        <div
                          key={reg.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{reg.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{reg.email}</p>
                            {reg.phone && (
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{reg.phone}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {reg.status === "approved" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                                  <CheckCircle className="h-3 w-3" />
                                  Aprovado
                                </span>
                              ) : reg.status === "pending" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                  Pendente
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                                  Rejeitado
                                </span>
                              )}
                              {reg.checkedIn === 1 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                  <CheckCircle className="h-3 w-3" />
                                  Check-in feito
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleCheckInById(reg.id)}
                            disabled={reg.checkedIn === 1 || reg.status !== "approved" || checkInByIdMutation.isPending}
                            className="w-full sm:w-auto h-10 sm:h-9 text-sm"
                          >
                            {reg.checkedIn === 1 ? "Já fez check-in" : "Fazer Check-in"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
