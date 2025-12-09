import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, QrCode, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id);
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: event } = trpc.events.getById.useQuery({ eventId });
  const { data: registrations, refetch } = trpc.registrations.listByEvent.useQuery({ eventId });
  
  const checkinMutation = trpc.registrations.checkInById.useMutation({
    onSuccess: () => {
      refetch();
      setSearchTerm("");
    },
  });

  const filteredRegistrations = registrations?.filter(
    (reg) =>
      reg.status === "approved" &&
      (reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCheckin = (registrationId: number) => {
    checkinMutation.mutate({ registrationId });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href={`/events/${eventId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Check-in</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Scanner QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scanner QR Code
              </CardTitle>
              <CardDescription>
                Escaneie o QR Code do ingresso para dar presença
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/events/${eventId}/scan`}>
                <Button className="w-full" size="lg">
                  <QrCode className="h-5 w-5 mr-2" />
                  Abrir Scanner
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Busca Manual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Busca Manual
              </CardTitle>
              <CardDescription>
                Procure participante por nome ou email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Digite nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchTerm && filteredRegistrations?.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum participante encontrado
                  </p>
                )}
                
                {searchTerm && filteredRegistrations?.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{reg.name}</p>
                      <p className="text-sm text-muted-foreground">{reg.email}</p>
                    </div>
                    
                    {reg.checkedInAt ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Presente</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleCheckin(reg.id)}
                        disabled={checkinMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Dar Presença
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Estatísticas de Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {registrations?.filter((r) => r.checkedInAt).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Presentes</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">
                  {registrations?.filter((r) => r.status === "approved" && !r.checkedInAt).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold">
                  {registrations?.filter((r) => r.status === "approved").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
