import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, ArrowUpCircle, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface EventCollaboratorsProps {
  eventId: number;
}

export default function EventCollaborators({ eventId }: EventCollaboratorsProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"coordinator" | "supervisor" | "checkin">("supervisor");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: collaborators, refetch } = trpc.collaborators.listByEvent.useQuery({ eventId });

  const inviteMutation = trpc.collaborators.invite.useMutation({
    onSuccess: () => {
      setEmail("");
      refetch();
    },
    onError: (error) => {
      alert(`Erro ao convidar: ${error.message}`);
    },
  });

  const updateRoleMutation = trpc.collaborators.updateRole.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => alert(`Erro ao atualizar: ${error.message}`),
  });

  const removeMutation = trpc.collaborators.remove.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => alert(`Erro ao remover: ${error.message}`),
  });

  const handleInvite = () => {
    if (!email) return;
    inviteMutation.mutate({ eventId, email, role });
  };

  const handleCopyLink = async (inviteLink: string, id: number) => {
    await navigator.clipboard.writeText(inviteLink);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "coordinator": return "Coordenador";
      case "supervisor": return "Supervisor";
      case "checkin": return "Check-in";
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "coordinator": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "supervisor": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "checkin": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Convidar Colaborador</CardTitle>
          <CardDescription>
            Envie um convite para alguém colaborar neste evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="colaborador@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role">Nível</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordinator">Coordenador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="checkin">Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleInvite} disabled={inviteMutation.isPending || !email}>
            <UserPlus className="mr-2 h-4 w-4" />
            {inviteMutation.isPending ? "Enviando..." : "Enviar Convite"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colaboradores</CardTitle>
          <CardDescription>
            Gerencie os colaboradores deste evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!collaborators || collaborators.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum colaborador convidado ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaborators.map((collab) => (
                  <TableRow key={collab.id}>
                    <TableCell className="font-medium">{collab.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(collab.role)}>
                        {getRoleLabel(collab.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {collab.status === "active" ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Ativo
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Pendente</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const baseUrl = window.location.origin;
                              const link = `${baseUrl}/invite/${collab.inviteToken}`;
                              handleCopyLink(link, collab.id);
                            }}
                          >
                            {copiedId === collab.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newRole = collab.role === "checkin" ? "supervisor" : 
                                        collab.role === "supervisor" ? "coordinator" : "checkin";
                          updateRoleMutation.mutate({ id: collab.id, role: newRole });
                        }}
                        title="Promover/Rebaixar"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remover ${collab.email}?`)) {
                            removeMutation.mutate({ id: collab.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
