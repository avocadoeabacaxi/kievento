import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import parse from "html-react-parser";

export default function PublicHome() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>();

  const { data: events, isLoading } = trpc.public.listEvents.useQuery({
    category: selectedCategory,
    city: selectedCity,
  });

  const { data: categories } = trpc.public.getCategories.useQuery();
  const { data: cities } = trpc.public.getCities.useQuery();

  const truncateHTML = (html: string, maxLength: number) => {
    const text = html.replace(/<[^>]*>/g, "");
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background py-24 md:py-40">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1>
              Descubra eventos incríveis
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Encontre experiências únicas, conecte-se com pessoas e crie memórias inesquecíveis
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  <a>Criar Meu Evento</a>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#eventos">
                  Explorar Eventos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-muted/30 sticky top-16 z-40 backdrop-blur">
        <div className="container py-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(undefined)}
            >
              Todos
            </Button>
            {categories?.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {cities && cities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-muted-foreground flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Cidades:
              </span>
              <Button
                variant={!selectedCity ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCity(undefined)}
              >
                Todas
              </Button>
              {cities.map((city) => (
                <Button
                  key={city}
                  variant={selectedCity === city ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section id="eventos" className="container py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events && events.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">
                {selectedCategory || selectedCity
                  ? "Eventos Filtrados"
                  : "Todos os Eventos"}
              </h2>
              <p className="text-muted-foreground">
                {events.length} {events.length === 1 ? "evento" : "eventos"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {events.map((event) => (
                <Link key={event.id} href={`/register/${event.id}`}>
                  <a className="group block">
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full border-0 shadow-md rounded-2xl">
                      {/* Banner */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-t-2xl">
                        {(event.cardImageUrl || event.bannerUrl) ? (
                          <img
                            src={event.cardImageUrl || event.bannerUrl || ""}
                            alt={event.title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-accent/20">
                            <Calendar className="h-16 w-16 text-primary/40" />
                          </div>
                        )}
                        {event.category && (
                          <Badge className="absolute top-4 right-4 bg-background/95 text-foreground hover:bg-background shadow-md">
                            {event.category}
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-5 space-y-3">
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>

                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {truncateHTML(event.description, 100)}
                          </p>
                        )}

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>
                              {format(new Date(event.eventDate), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>

                          {event.city && (
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="line-clamp-1">{event.city}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          className="w-full mt-4"
                          variant={event.registrationType === "open" ? "default" : "secondary"}
                        >
                          {event.registrationType === "open"
                            ? "Inscrever-se"
                            : "Solicitar Inscrição"}
                        </Button>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {selectedCategory || selectedCity
                ? "Tente ajustar os filtros ou explorar outras categorias"
                : "Seja o primeiro a criar um evento!"}
            </p>
            <Button asChild>
              <Link href="/dashboard">
                <a>Criar Meu Evento</a>
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">KiEvento</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 KiEvento. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
