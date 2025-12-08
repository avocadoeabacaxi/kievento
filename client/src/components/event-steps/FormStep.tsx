import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

type FormFieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "cpf" | "cnpj" | "cep";

type FormField = {
  label: string;
  fieldType: FormFieldType;
  required: boolean;
  order: number;
};

interface FormStepProps {
  formFields: FormField[];
  setFormFields: (fields: FormField[]) => void;
}

export default function FormStep({ formFields, setFormFields }: FormStepProps) {
  const addField = () => {
    setFormFields([
      ...formFields,
      { label: "", fieldType: "text", required: false, order: formFields.length },
    ]);
  };

  const removeField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], ...updates };
    setFormFields(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulário de Inscrição</CardTitle>
        <CardDescription>
          Personalize as perguntas que os participantes devem responder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formFields.map((field, index) => (
          <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label>Pergunta</Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Ex: Nome Completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Campo</Label>
                  <Select
                    value={field.fieldType}
                    onValueChange={(v: FormFieldType) => updateField(index, { fieldType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="textarea">Texto Longo</SelectItem>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="cep">CEP</SelectItem>
                      <SelectItem value="select">Seleção</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Obrigatório?</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Checkbox
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                    />
                    <span className="text-sm">{field.required ? "Sim" : "Não"}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removeField(index)}
              disabled={formFields.length <= 2}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addField} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Campo
        </Button>
      </CardContent>
    </Card>
  );
}
