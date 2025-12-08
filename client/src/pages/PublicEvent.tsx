import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export default function PublicEvent() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();

  const { data: event, isLoading, error } = trpc.events.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  // Redirecionar para a página de detalhes do evento assim que carregar
  useEffect(() => {
    if (event?.id) {
      setLocation(`/events/${event.id}`);
    }
  }, [event, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Evento não encontrado</h1>
          <p className="text-gray-600 mb-6">
            O evento que você está procurando não existe ou foi removido.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  // Enquanto redireciona, mostrar loading
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
