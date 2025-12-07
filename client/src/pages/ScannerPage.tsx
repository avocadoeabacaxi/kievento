import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, CheckCircle, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

export default function ScannerPage() {
  const [, params] = useRoute("/events/:id/scan");
  const eventId = params?.id ? parseInt(params.id) : 0;
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [searchName, setSearchName] = useState("");
  const [lastResult, setLastResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: event } = trpc.events.getById.useQuery({ eventId });
  const { data: searchResults } = trpc.registrations.searchByName.useQuery(
    { eventId, searchTerm: searchName },
    { enabled: searchName.length >= 2 }
  );

  const checkInByQrCodeMutation = trpc.registrations.checkInByQrCode.useMutation({
    onSuccess: (data) => {
      setLastResult({ success: true, registration: data.registration });
      toast.success(`Check-in realizado: ${data.registration.name}`);
      setQrCodeInput("");
      // Auto-focus para próximo scan
      setTimeout(() => inputRef.current?.focus(), 1000);
    },
    onError: (error) => {
      setLastResult({ success: false, error: error.message });
      toast.error(error.message);
      setQrCodeInput("");
      setTimeout(() => inputRef.current?.focus(), 1000);
    },
  });

  const checkInByIdMutation = trpc.registrations.checkInById.useMutation({
    onSuccess: () => {
      toast.success("Check-in realizado com sucesso!");
      setSearchName("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    // Auto-focus no input quando a página carrega
    inputRef.current?.focus();
  }, []);

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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center gap-4">
          <Link href={`/events/${eventId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="font-semibold">Validação de Entrada</h1>
            {event && <p className="text-sm text-muted-foreground">{event.title}</p>}
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="container py-8 max-w-4xl space-y-6">
        {/* QR Code Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan QR Code
            </CardTitle>
            <CardDescription>
              Use um leitor de QR Code ou digite o código manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQrCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qrcode">Código QR</Label>
                <Input
                  ref={inputRef}
                  id="qrcode"
                  type="text"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  placeholder="Escaneie ou digite o código..."
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={checkInByQrCodeMutation.isPending}>
                {checkInByQrCodeMutation.isPending ? "Validando..." : "Validar Entrada"}
              </Button>
            </form>

            {/* Last Result */}
            {lastResult && (
              <div className="mt-6">
                {lastResult.success ? (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          Check-in Realizado!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {lastResult.registration.name}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {lastResult.registration.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-900 dark:text-red-100">Erro na Validação</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
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

        {/* Search by Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar por Nome
            </CardTitle>
            <CardDescription>
              Pesquise participantes pelo nome ou e-mail
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Nome ou E-mail</Label>
                <Input
                  id="search"
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Digite pelo menos 2 caracteres..."
                />
              </div>

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{reg.name}</p>
                        <p className="text-sm text-muted-foreground">{reg.email}</p>
                        {reg.status !== "approved" && (
                          <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                            Status: {reg.status === "pending" ? "Pendente" : "Rejeitado"}
                          </p>
                        )}
                        {reg.checkedIn === 1 && (
                          <p className="text-sm text-green-600 dark:text-green-500 mt-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Já fez check-in
                          </p>
                        )}
                      </div>

                      {reg.status === "approved" && reg.checkedIn === 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckInById(reg.id)}
                          disabled={checkInByIdMutation.isPending}
                        >
                          Fazer Check-in
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchName.length >= 2 && searchResults && searchResults.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum participante encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">💡 Instruções</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Use um leitor de QR Code para escanear os convites dos participantes</li>
              <li>Ou digite o código manualmente no campo acima</li>
              <li>Você também pode buscar participantes pelo nome para fazer check-in manual</li>
              <li>Apenas participantes aprovados podem fazer check-in</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
