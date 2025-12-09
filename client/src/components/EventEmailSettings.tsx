import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Info, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";


interface EventEmailSettingsProps {
  eventId: number;
}

const TEMPLATE_TYPES = [
  { value: "approval", label: "Aprovação de Inscrição", icon: "✅", description: "Enviado quando uma inscrição é aprovada" },
  { value: "rejection", label: "Reprovação de Inscrição", icon: "❌", description: "Enviado quando uma inscrição é rejeitada" },
  { value: "pending", label: "Aguardando Aprovação", icon: "⏳", description: "Enviado quando uma inscrição está pendente" },
  { value: "purchase", label: "Compra Concluída", icon: "💰", description: "Enviado quando um pagamento é confirmado" },
  { value: "confirmation", label: "Confirmação de Inscrição", icon: "✉️", description: "Enviado ao confirmar inscrição (eventos abertos)" },
] as const;

const AVAILABLE_VARIABLES = [
  { var: "{{nome}}", desc: "Nome do participante" },
  { var: "{{email}}", desc: "Email do participante" },
  { var: "{{evento}}", desc: "Nome do evento" },
  { var: "{{data}}", desc: "Data do evento" },
  { var: "{{local}}", desc: "Local do evento" },
  { var: "{{qrcode}}", desc: "Link do QR Code" },
  { var: "{{convite_url}}", desc: "URL do convite digital" },
];

const DEFAULT_TEMPLATES = {
  approval: {
    subject: "✅ Sua inscrição foi aprovada - {{evento}}",
    htmlBody: `<h2>Olá, {{nome}}!</h2>
<p>Sua inscrição para o evento <strong>{{evento}}</strong> foi aprovada com sucesso!</p>
<p><strong>Data:</strong> {{data}}<br>
<strong>Local:</strong> {{local}}</p>
<p>Acesse seu ingresso: <a href="{{convite_url}}">Clique aqui</a></p>
<p>Nos vemos lá!</p>`,
  },
  rejection: {
    subject: "Sobre sua inscrição - {{evento}}",
    htmlBody: `<h2>Olá, {{nome}}!</h2>
<p>Infelizmente não foi possível aprovar sua inscrição para o evento <strong>{{evento}}</strong>.</p>
<p>Agradecemos seu interesse e esperamos vê-lo em futuros eventos!</p>`,
  },
  pending: {
    subject: "Inscrição recebida - {{evento}}",
    htmlBody: `<h2>Olá, {{nome}}!</h2>
<p>Recebemos sua inscrição para o evento <strong>{{evento}}</strong>!</p>
<p>Sua inscrição está em análise. Você receberá um email assim que for aprovada.</p>
<p>Obrigado!</p>`,
  },
  purchase: {
    subject: "Pagamento confirmado - {{evento}}",
    htmlBody: `<h2>Olá, {{nome}}!</h2>
<p>Seu pagamento para o evento <strong>{{evento}}</strong> foi confirmado!</p>
<p><strong>Data:</strong> {{data}}<br>
<strong>Local:</strong> {{local}}</p>
<p>Acesse seu ingresso: <a href="{{convite_url}}">Clique aqui</a></p>`,
  },
  confirmation: {
    subject: "Inscrição confirmada - {{evento}}",
    htmlBody: `<h2>Olá, {{nome}}!</h2>
<p>Sua inscrição para o evento <strong>{{evento}}</strong> foi confirmada!</p>
<p><strong>Data:</strong> {{data}}<br>
<strong>Local:</strong> {{local}}</p>
<p>Acesse seu ingresso: <a href="{{convite_url}}">Clique aqui</a></p>
<p>Nos vemos lá!</p>`,
  },
};

export function EventEmailSettings({ eventId }: EventEmailSettingsProps) {

  const [activeTab, setActiveTab] = useState<string>("approval");
  
  const { data: templates, refetch } = trpc.emailTemplates.listByEvent.useQuery({ eventId });
  const createTemplate = trpc.emailTemplates.create.useMutation();
  const updateTemplate = trpc.emailTemplates.update.useMutation();

  const [formData, setFormData] = useState<Record<string, {
    id?: number;
    subject: string;
    htmlBody: string;
    attachmentFormat: "jpg" | "pdf" | "none";
    enabled: boolean;
  }>>({});

  // Carregar templates existentes ou usar defaults
  useEffect(() => {
    const newFormData: typeof formData = {};
    
    TEMPLATE_TYPES.forEach(({ value }) => {
      const existing = templates?.find(t => t.templateType === value);
      if (existing) {
        newFormData[value] = {
          id: existing.id,
          subject: existing.subject,
          htmlBody: existing.htmlBody,
          attachmentFormat: existing.attachmentFormat as "jpg" | "pdf" | "none",
          enabled: existing.enabled === 1,
        };
      } else {
        newFormData[value] = {
          subject: DEFAULT_TEMPLATES[value as keyof typeof DEFAULT_TEMPLATES].subject,
          htmlBody: DEFAULT_TEMPLATES[value as keyof typeof DEFAULT_TEMPLATES].htmlBody,
          attachmentFormat: "none",
          enabled: true,
        };
      }
    });
    
    setFormData(newFormData);
  }, [templates]);

  const handleSave = async (templateType: string) => {
    const data = formData[templateType];
    if (!data) return;

    try {
      if (data.id) {
        await updateTemplate.mutateAsync({
          id: data.id,
          subject: data.subject,
          htmlBody: data.htmlBody,
          attachmentFormat: data.attachmentFormat,
          enabled: data.enabled,
        });
      } else {
        await createTemplate.mutateAsync({
          eventId,
          templateType: templateType as any,
          subject: data.subject,
          htmlBody: data.htmlBody,
          attachmentFormat: data.attachmentFormat,
          enabled: data.enabled,
        });
      }
      
      alert("Template salvo com sucesso!");
      
      refetch();
    } catch (error) {
      alert("Erro ao salvar template de email.");
    }
  };

  const updateField = (templateType: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [templateType]: {
        ...prev[templateType],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de Email
          </CardTitle>
          <CardDescription>
            Personalize os emails enviados automaticamente aos participantes deste evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Variáveis disponíveis:</strong> {AVAILABLE_VARIABLES.map(v => v.var).join(", ")}
              <br />
              Use essas variáveis nos seus templates para personalizar os emails.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              {TEMPLATE_TYPES.map(({ value, icon }) => (
                <TabsTrigger key={value} value={value}>
                  <span className="mr-1">{icon}</span>
                  <span className="hidden sm:inline">{value}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TEMPLATE_TYPES.map(({ value, label, description }) => (
              <TabsContent key={value} value={value} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{label}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`enabled-${value}`}>Ativar este email</Label>
                  <Switch
                    id={`enabled-${value}`}
                    checked={formData[value]?.enabled ?? true}
                    onCheckedChange={(checked) => updateField(value, "enabled", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`subject-${value}`}>Assunto do Email</Label>
                  <Input
                    id={`subject-${value}`}
                    value={formData[value]?.subject ?? ""}
                    onChange={(e) => updateField(value, "subject", e.target.value)}
                    placeholder="Ex: Sua inscrição foi aprovada!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`body-${value}`}>Corpo do Email (HTML)</Label>
                  <Textarea
                    id={`body-${value}`}
                    value={formData[value]?.htmlBody ?? ""}
                    onChange={(e) => updateField(value, "htmlBody", e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="<h2>Olá, {{nome}}!</h2>..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`attachment-${value}`}>Formato do Anexo (Convite)</Label>
                  <Select
                    value={formData[value]?.attachmentFormat ?? "none"}
                    onValueChange={(val) => updateField(value, "attachmentFormat", val)}
                  >
                    <SelectTrigger id={`attachment-${value}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem anexo</SelectItem>
                      <SelectItem value="jpg">Imagem JPG</SelectItem>
                      <SelectItem value="pdf">Documento PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => handleSave(value)} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Template
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variáveis Disponíveis</CardTitle>
          <CardDescription>Use essas variáveis para personalizar seus emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {AVAILABLE_VARIABLES.map(({ var: variable, desc }) => (
              <div key={variable} className="flex items-start gap-3 text-sm">
                <code className="bg-muted px-2 py-1 rounded font-mono">{variable}</code>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
