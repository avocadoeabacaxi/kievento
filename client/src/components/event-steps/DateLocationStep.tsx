import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateLocationStepProps {
  eventDate: string;
  setEventDate: (value: string) => void;
  registrationDeadline: string;
  setRegistrationDeadline: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  addressLink: string;
  setAddressLink: (value: string) => void;
  registrationType: "open" | "approval";
  setRegistrationType: (value: "open" | "approval") => void;
}

export default function DateLocationStep({
  eventDate,
  setEventDate,
  registrationDeadline,
  setRegistrationDeadline,
  address,
  setAddress,
  addressLink,
  setAddressLink,
  registrationType,
  setRegistrationType,
}: DateLocationStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data e Local</CardTitle>
        <CardDescription>
          Defina quando e onde seu evento acontecerá
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventDate">Data e Hora do Evento *</Label>
            <Input
              id="eventDate"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationDeadline">Data Limite de Inscrição</Label>
            <Input
              id="registrationDeadline"
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              placeholder="Deixe vazio para sempre aberto"
            />
            <p className="text-xs text-muted-foreground">Após essa data, a página mostrará "Inscrições Encerradas"</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço do Evento</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número, cidade"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLink">Link do Endereço (Google Maps, Waze, etc.)</Label>
          <Input
            id="addressLink"
            type="url"
            value={addressLink}
            onChange={(e) => setAddressLink(e.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationType">Tipo de Inscrição</Label>
          <Select value={registrationType} onValueChange={(v: "open" | "approval") => setRegistrationType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Aberta (automática)</SelectItem>
              <SelectItem value="approval">Com Aprovação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
