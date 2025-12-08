import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface FAQStepProps {
  faqItems: { question: string; answer: string }[];
  setFaqItems: (items: { question: string; answer: string }[]) => void;
}

export default function FAQStep({ faqItems, setFaqItems }: FAQStepProps) {
  const addFAQ = () => {
    setFaqItems([...faqItems, { question: "", answer: "" }]);
  };

  const removeFAQ = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...faqItems];
    updated[index] = { ...updated[index], [field]: value };
    setFaqItems(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
        <CardDescription>
          Adicione perguntas e respostas que serão exibidas na página pública do evento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma pergunta adicionada. Clique no botão abaixo para adicionar.
          </p>
        ) : (
          faqItems.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <Label>Pergunta {index + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFAQ(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <Input
                value={item.question}
                onChange={(e) => updateFAQ(index, "question", e.target.value)}
                placeholder="Ex: Qual o horário do evento?"
              />

              <div className="space-y-2">
                <Label>Resposta</Label>
                <Textarea
                  value={item.answer}
                  onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                  placeholder="Digite a resposta..."
                  rows={3}
                />
              </div>
            </div>
          ))
        )}

        <Button type="button" variant="outline" onClick={addFAQ} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Pergunta
        </Button>
      </CardContent>
    </Card>
  );
}
