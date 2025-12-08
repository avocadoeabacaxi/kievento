import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

export type TicketType = {
  id?: number;
  name: string;
  description: string;
  price: string;
  quantity: string;
  validFrom: string;
  validUntil: string;
  color: string;
  order: number;
};

type Props = {
  ticketTypes: TicketType[];
  onChange: (ticketTypes: TicketType[]) => void;
};

export default function TicketTypesManager({ ticketTypes, onChange }: Props) {
  const addTicketType = () => {
    const newTicketType: TicketType = {
      name: "",
      description: "",
      price: "",
      quantity: "",
      validFrom: "",
      validUntil: "",
      color: "#ef4444",
      order: ticketTypes.length,
    };
    onChange([...ticketTypes, newTicketType]);
  };

  const updateTicketType = (index: number, field: keyof TicketType, value: any) => {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeTicketType = (index: number) => {
    const updated = ticketTypes.filter((_, i) => i !== index);
    // Reordenar
    updated.forEach((tt, i) => tt.order = i);
    onChange(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...ticketTypes];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((tt, i) => tt.order = i);
    onChange(updated);
  };

  const moveDown = (index: number) => {
    if (index === ticketTypes.length - 1) return;
    const updated = [...ticketTypes];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((tt, i) => tt.order = i);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tipos de Ingressos</h3>
          <p className="text-sm text-muted-foreground">
            Configure diferentes lotes com preços e datas de validade
          </p>
        </div>
        <Button onClick={addTicketType} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Lote
        </Button>
      </div>

      {ticketTypes.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhum tipo de ingresso configurado. Clique em "Adicionar Lote" para começar.
          </CardContent>
        </Card>
      )}

      {ticketTypes.map((ticketType, index) => (
        <Card key={index} className="border-l-4" style={{ borderLeftColor: ticketType.color }}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveDown(index)}
                    disabled={index === ticketTypes.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    ↓
                  </Button>
                </div>
                <CardTitle className="text-base">
                  Lote #{index + 1} {ticketType.name && `- ${ticketType.name}`}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTicketType(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`ticket-name-${index}`}>Nome do Lote *</Label>
                <Input
                  id={`ticket-name-${index}`}
                  placeholder="Ex: 1º Lote - Early Bird"
                  value={ticketType.name}
                  onChange={(e) => updateTicketType(index, "name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ticket-price-${index}`}>Preço</Label>
                <Input
                  id={`ticket-price-${index}`}
                  placeholder="Ex: R$ 100,00 ou Gratuito"
                  value={ticketType.price}
                  onChange={(e) => updateTicketType(index, "price", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`ticket-description-${index}`}>Descrição dos Benefícios</Label>
              <Textarea
                id={`ticket-description-${index}`}
                placeholder="Ex: Acesso completo + coffee break premium + kit exclusivo"
                value={ticketType.description}
                onChange={(e) => updateTicketType(index, "description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`ticket-quantity-${index}`}>Quantidade Disponível</Label>
                <Input
                  id={`ticket-quantity-${index}`}
                  type="number"
                  placeholder="Deixe vazio para ilimitado"
                  value={ticketType.quantity}
                  onChange={(e) => updateTicketType(index, "quantity", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ticket-color-${index}`}>Cor do Badge</Label>
                <div className="flex gap-2">
                  <Input
                    id={`ticket-color-${index}`}
                    type="color"
                    value={ticketType.color}
                    onChange={(e) => updateTicketType(index, "color", e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={ticketType.color}
                    onChange={(e) => updateTicketType(index, "color", e.target.value)}
                    placeholder="#ef4444"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`ticket-validFrom-${index}`}>Válido A Partir De</Label>
                <Input
                  id={`ticket-validFrom-${index}`}
                  type="datetime-local"
                  value={ticketType.validFrom}
                  onChange={(e) => updateTicketType(index, "validFrom", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ticket-validUntil-${index}`}>Válido Até</Label>
                <Input
                  id={`ticket-validUntil-${index}`}
                  type="datetime-local"
                  value={ticketType.validUntil}
                  onChange={(e) => updateTicketType(index, "validUntil", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
