import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ExternalLink } from "lucide-react";
import { MapView } from "@/components/Map";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, addressLink: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  label = "Endereço do Evento",
  placeholder = "Digite o endereço...",
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  // Inicializar autocomplete quando o mapa estiver pronto
  const handleMapReady = (map: google.maps.Map) => {
    setIsMapReady(true);
    
    if (!inputRef.current) return;

    // Criar autocomplete
    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment", "geocode"],
      componentRestrictions: { country: "br" }, // Restringir ao Brasil
      fields: ["formatted_address", "geometry", "place_id", "name"],
    });

    // Listener para quando um lugar é selecionado
    autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        console.error("Nenhuma geometria encontrada para este lugar");
        return;
      }

      setSelectedPlace(place);

      // Endereço formatado
      const address = place.formatted_address || "";
      
      // Gerar link do Google Maps
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const placeId = place.place_id || "";
      const mapsLink = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

      // Chamar callback com endereço e link
      onChange(address, mapsLink);
    });

    setAutocomplete(autocompleteInstance);
  };

  // Limpar autocomplete ao desmontar
  useEffect(() => {
    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [autocomplete]);

  return (
    <div className="space-y-2">
      <Label htmlFor="address">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="address"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, "")}
          placeholder={placeholder}
          required={required}
          className="pl-9"
          disabled={!isMapReady}
        />
      </div>

      {selectedPlace && selectedPlace.geometry && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <span>Endereço selecionado e link gerado automaticamente</span>
        </div>
      )}

      {!isMapReady && (
        <p className="text-xs text-muted-foreground">
          Carregando Google Maps...
        </p>
      )}

      {/* Mapa invisível apenas para inicializar a API */}
      <div className="hidden">
        <MapView onMapReady={handleMapReady} />
      </div>
    </div>
  );
}
