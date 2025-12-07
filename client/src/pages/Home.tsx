import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Calendar, CheckCircle, QrCode, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">KiEvento</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Olá, {user?.name}
                </span>
                <Link href="/dashboard">
                  <Button>Meus Eventos</Button>
                </Link>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Gerencie seus eventos com{" "}
              <span className="text-primary">facilidade</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Crie eventos, personalize formulários de inscrição, aprove participantes
              e valide entradas com QR Code. Tudo em uma plataforma simples e moderna.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    Acessar Dashboard
                  </Button>
                </Link>
              ) : (
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <a href={getLoginUrl()}>Começar Agora</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recursos Principais
            </h2>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para gerenciar eventos profissionalmente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Criação Fácil</h3>
              <p className="text-muted-foreground">
                Crie eventos em minutos com formulários personalizáveis e banner customizado
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Gestão de Participantes</h3>
              <p className="text-muted-foreground">
                Aprove inscrições, gerencie listas e acompanhe estatísticas em tempo real
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">QR Code Automático</h3>
              <p className="text-muted-foreground">
                Convites digitais com QR Code único para cada participante aprovado
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Validação de Entrada</h3>
              <p className="text-muted-foreground">
                Valide entradas via QR Code ou busca por nome com controle de presença
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para começar?
            </h2>
            <p className="text-lg text-muted-foreground">
              Crie sua conta gratuitamente e comece a gerenciar seus eventos hoje mesmo
            </p>
            {!isAuthenticated && (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>Criar Conta Grátis</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-background mt-auto">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">KiEvento</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 KiEvento. Plataforma de gestão de eventos.        </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
