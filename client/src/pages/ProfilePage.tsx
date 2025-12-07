import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });
  const updateProfile = trpc.profile.update.useMutation();

  const [userType, setUserType] = useState<"individual" | "company">("individual");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    cpf: "",
    birthDate: "",
    cnpj: "",
    companyName: "",
    tradeName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUserType(profile.userType || "individual");
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        cpf: profile.cpf || "",
        birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split("T")[0] : "",
        cnpj: profile.cnpj || "",
        companyName: profile.companyName || "",
        tradeName: profile.tradeName || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        zipCode: profile.zipCode || "",
      });
      setProfilePhotoPreview(profile.profilePhoto || null);
    }
  }, [profile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let profilePhotoBase64: string | undefined;
      if (profilePhotoFile) {
        const reader = new FileReader();
        profilePhotoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(profilePhotoFile);
        });
      }

      await updateProfile.mutateAsync({
        ...formData,
        userType,
        profilePhotoBase64,
      });

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
      console.error(error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {/* Foto de Perfil */}
              <Card>
                <CardHeader>
                  <CardTitle>Foto de Perfil</CardTitle>
                  <CardDescription>Atualize sua foto de perfil</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profilePhotoPreview || undefined} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {getInitials(formData.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("photo-upload")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Escolher Foto
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG ou GIF (máx. 5MB)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tipo de Usuário */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Cadastro</CardTitle>
                  <CardDescription>Você é pessoa física ou empresa?</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={userType} onValueChange={(v) => setUserType(v as "individual" | "company")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Pessoa Física</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Dados Pessoais/Empresariais */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {userType === "individual" ? "Dados Pessoais" : "Dados da Empresa"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={userType} className="w-full">
                    <TabsContent value="individual" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nome Completo</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="birthDate">Data de Nascimento</Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="company" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyName">Razão Social</Label>
                          <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tradeName">Nome Fantasia</Label>
                          <Input
                            id="tradeName"
                            value={formData.tradeName}
                            onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <Input
                            id="cnpj"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone-company">Telefone</Label>
                          <Input
                            id="phone-company"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(00) 0000-0000"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botão Salvar */}
              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
