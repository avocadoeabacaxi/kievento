import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock } from "lucide-react";

interface EventSettingsTabProps {
  eventId: number;
  event: any;
  refetch: () => void;
}

// Lista dos principais fusos horários do Brasil e mundo
const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "America/New_York", label: "Nova York (GMT-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "Europe/Paris", label: "Paris (GMT+1)" },
  { value: "Europe/Moscow", label: "Moscou (GMT+3)" },
  { value: "Asia/Tokyo", label: "Tóquio (GMT+9)" },
  { value: "Asia/Shanghai", label: "Xangai (GMT+8)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Australia/Sydney", label: "Sydney (GMT+11)" },
  { value: "Pacific/Auckland", label: "Auckland (GMT+13)" },
];

export default function EventSettingsTab({ eventId, event, refetch }: EventSettingsTabProps) {
  const [timezone, setTimezone] = useState(event?.timezone || "America/Sao_Paulo");

  const updateTimezoneMutation = trpc.events.updateTimezone.useMutation({
    onSuccess: () => {
      toast.success("Fuso horário atualizado com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar fuso horário: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateTimezoneMutation.mutate({ eventId, timezone });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Fuso Horário do Evento</CardTitle>
          </div>
          <CardDescription>
            Configure o fuso horário correto para garantir que todas as datas e horários sejam exibidos corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Selecione o fuso horário" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Fuso horário atual: <strong>{timezone}</strong>
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={updateTimezoneMutation.isPending || timezone === event?.timezone}
            >
              {updateTimezoneMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • O fuso horário afeta como as datas e horários são exibidos para você e para os participantes
          </p>
          <p>
            • Mesmo que o servidor esteja em outro país, as datas serão convertidas automaticamente
          </p>
          <p>
            • Recomendamos usar o fuso horário onde o evento será realizado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
