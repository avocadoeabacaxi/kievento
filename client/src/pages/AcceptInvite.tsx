import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, UserPlus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AcceptInvite() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: inviteData, isLoading, error } = trpc.collaborators.getByToken.useQuery(
    { token: params?.token || "" },
    { enabled: !!params?.token }
  );

  const acceptMutation = trpc.collaborators.acceptInvite.useMutation({
    onSuccess: (data) => {
      setLocation(`/events/${data.eventId}`);
    },
    onError: (error) => {
      alert(`Erro ao aceitar convite: ${error.message}`);
      setIsAccepting(false);
    },
  });

  const handleAccept = async () => {
    if (!params?.token) return;
    setIsAccepting(true);
    acceptMutation.mutate({ token: params.token });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando convite...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Convite Inválido</CardTitle>
                  <CardDescription>Este link de convite não é válido ou expirou</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/")} className="w-full">
                Voltar para Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (inviteData.status === "active") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle>Convite Já Aceito</CardTitle>
                  <CardDescription>Você já aceitou este convite anteriormente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation(`/events/${inviteData.eventId}`)} className="w-full">
                Ir para o Evento
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "coordinator": return "Coordenador";
      case "supervisor": return "Supervisor";
      case "checkin": return "Check-in";
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-20">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Convite para Colaborar</CardTitle>
                <CardDescription>Você foi convidado para colaborar em um evento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Evento:</p>
              <p className="text-lg font-semibold">{inviteData.eventTitle}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Nível de Acesso:</p>
              <p className="text-lg font-semibold">{getRoleLabel(inviteData.role)}</p>
            </div>

            <Alert>
              <AlertDescription>
                {inviteData.role === "coordinator" && "Como Coordenador, você terá acesso completo ao evento, exceto gerenciar colaboradores."}
                {inviteData.role === "supervisor" && "Como Supervisor, você poderá cadastrar participantes e fazer check-in."}
                {inviteData.role === "checkin" && "Como Check-in, você terá acesso apenas ao scanner QR Code e consulta de participantes."}
              </AlertDescription>
            </Alert>

            {!user ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Você precisa fazer login para aceitar este convite
                </p>
                <Button 
                  onClick={() => window.location.href = getLoginUrl()} 
                  className="w-full"
                >
                  Fazer Login
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleAccept} 
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  "Aceitar Convite"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
