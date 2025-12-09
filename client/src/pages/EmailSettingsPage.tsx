import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Server, Key, Send, Info, Save, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";

type Provider = "smtp" | "sendgrid" | "ses" | "resend";

export default function EmailSettingsPage() {
  const [provider, setProvider] = useState<Provider>("smtp");
  const [formData, setFormData] = useState({
    // SMTP
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: true,
    
    // SendGrid / Resend
    apiKey: "",
    
    // AWS SES
    awsRegion: "",
    awsAccessKey: "",
    awsSecretKey: "",
    
    // Geral
    senderEmail: "",
    senderName: "",
    replyToEmail: "",
    enabled: true,
  });

  const { data: settings, refetch } = trpc.emailSettings.list.useQuery();
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  const createSetting = trpc.emailSettings.create.useMutation();
  const updateSetting = trpc.emailSettings.update.useMutation();
  const deleteSetting = trpc.emailSettings.delete.useMutation();
  const sendTestEmail = trpc.emailSettings.sendTest.useMutation();
  const { data: emailLogs } = trpc.emailLogs.list.useQuery({ limit: 50 });

  const handleSave = async () => {
    try {
      const activeSetting = settings?.find(s => s.enabled === 1);
      
      if (activeSetting) {
        await updateSetting.mutateAsync({
          id: activeSetting.id,
          provider,
          ...formData,
        });
      } else {
        await createSetting.mutateAsync({
          provider,
          ...formData,
        });
      }
      
      alert("Configurações salvas com sucesso!");
      refetch();
    } catch (error) {
      alert("Erro ao salvar configurações.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta configuração?")) return;
    
    try {
      await deleteSetting.mutateAsync({ id });
      alert("Configuração deletada!");
      refetch();
    } catch (error) {
      alert("Erro ao deletar configuração.");
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      alert("Digite um email para teste");
      return;
    }

    setTestStatus("loading");
    try {
      await sendTestEmail.mutateAsync({ testEmail });
      setTestStatus("success");
      alert("✅ Email de teste enviado com sucesso!");
      setTimeout(() => setTestStatus("idle"), 3000);
    } catch (error) {
      setTestStatus("error");
      alert("❌ Erro ao enviar email de teste: " + (error instanceof Error ? error.message : "Erro desconhecido"));
      setTimeout(() => setTestStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 space-y-6">
        <Breadcrumb items={[
          { label: "Admin", href: "/admin" },
          { label: "Configurações de Email" },
        ]} />

        <div>
          <h1 className="text-3xl font-bold">Configurações de Email</h1>
          <p className="text-muted-foreground mt-2">
            Configure o serviço de envio de emails para os eventos
          </p>
        </div>

        <Tabs defaultValue="config">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">
              <Server className="h-4 w-4 mr-2" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Mail className="h-4 w-4 mr-2" />
              Logs de Envio
            </TabsTrigger>
          </TabsList>

          {/* Aba de Configuração */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Provedor de Email</CardTitle>
                <CardDescription>
                  Escolha o serviço que será usado para enviar emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <Select value={provider} onValueChange={(val) => setProvider(val as Provider)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP (Genérico)</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="ses">AWS SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Configurações SMTP */}
                {provider === "smtp" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Configurações SMTP</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Host SMTP</Label>
                        <Input
                          value={formData.smtpHost}
                          onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Porta</Label>
                        <Input
                          type="number"
                          value={formData.smtpPort}
                          onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Usuário SMTP</Label>
                      <Input
                        value={formData.smtpUser}
                        onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                        placeholder="seu-email@gmail.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Senha SMTP</Label>
                      <Input
                        type="password"
                        value={formData.smtpPassword}
                        onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Usar TLS/SSL</Label>
                      <Switch
                        checked={formData.smtpSecure}
                        onCheckedChange={(checked) => setFormData({ ...formData, smtpSecure: checked })}
                      />
                    </div>
                  </div>
                )}

                {/* Configurações SendGrid/Resend */}
                {(provider === "sendgrid" || provider === "resend") && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Chave de API</h3>
                    
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {provider === "sendgrid" && "Obtenha sua API Key em: https://app.sendgrid.com/settings/api_keys"}
                        {provider === "resend" && "Obtenha sua API Key em: https://resend.com/api-keys"}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Configurações AWS SES */}
                {provider === "ses" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Configurações AWS SES</h3>
                    
                    <div className="space-y-2">
                      <Label>Região AWS</Label>
                      <Input
                        value={formData.awsRegion}
                        onChange={(e) => setFormData({ ...formData, awsRegion: e.target.value })}
                        placeholder="us-east-1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Access Key ID</Label>
                      <Input
                        value={formData.awsAccessKey}
                        onChange={(e) => setFormData({ ...formData, awsAccessKey: e.target.value })}
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Secret Access Key</Label>
                      <Input
                        type="password"
                        value={formData.awsSecretKey}
                        onChange={(e) => setFormData({ ...formData, awsSecretKey: e.target.value })}
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      />
                    </div>
                  </div>
                )}

                {/* Configurações Gerais */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Configurações do Remetente</h3>
                  
                  <div className="space-y-2">
                    <Label>Email do Remetente *</Label>
                    <Input
                      type="email"
                      value={formData.senderEmail}
                      onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                      placeholder="noreply@seuevento.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nome do Remetente *</Label>
                    <Input
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                      placeholder="Sistema de Eventos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email de Resposta (Reply-To)</Label>
                    <Input
                      type="email"
                      value={formData.replyToEmail}
                      onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
                      placeholder="contato@seuevento.com"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Ativar envio de emails</Label>
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                  </div>
                </div>

                {/* Teste de Email */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Testar Configurações
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Envie um email de teste para verificar se suas configurações estão corretas.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="seu-email@exemplo.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendTest}
                      disabled={testStatus === "loading" || !testEmail}
                      variant="outline"
                    >
                      {testStatus === "loading" ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Enviando...
                        </>
                      ) : testStatus === "success" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                          Enviado!
                        </>
                      ) : testStatus === "error" ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Erro
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Teste
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full mt-6">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>

            {/* Configurações Existentes */}
            {settings && settings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Salvas</CardTitle>
                  <CardDescription>Gerenciar configurações existentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {settings.map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {setting.enabled === 1 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium">{setting.provider.toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">{setting.senderEmail}</p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(setting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba de Logs */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Emails Enviados</CardTitle>
                <CardDescription>Últimos 50 emails enviados pelo sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {emailLogs && emailLogs.length > 0 ? (
                  <div className="space-y-2">
                    {emailLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {log.status === "sent" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            {log.status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
                            {log.status === "pending" && <Mail className="h-4 w-4 text-yellow-600" />}
                            <span className="font-medium">{log.subject}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Para: {log.recipient} • {log.templateType}
                          </p>
                          {log.error && (
                            <p className="text-sm text-red-600 mt-1">{log.error}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {log.sentAt ? new Date(log.sentAt).toLocaleString() : "Pendente"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum email enviado ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
