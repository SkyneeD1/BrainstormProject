import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Eye } from "lucide-react";
import type { User } from "@shared/schema";

export default function AdminUsers() {
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return await apiRequest("PATCH", `/api/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Permissão atualizada",
        description: "A permissão do usuário foi alterada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar permissão",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Acesso Restrito</p>
            <p className="text-muted-foreground">
              Apenas administradores podem acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ id: userId, role: newRole });
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissões de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user) => (
              <div
                key={user.id}
                data-testid={`row-user-${user.id}`}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.profileImageUrl || undefined} className="object-cover" />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email || "Usuário"}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {user.id === currentUser?.id && (
                    <Badge variant="secondary">Você</Badge>
                  )}

                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                    disabled={user.id === currentUser?.id || updateRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-36" data-testid={`select-role-${user.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Viewer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            {(!users || users.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Níveis de Permissão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-3 border rounded-lg">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Admin</p>
              <p className="text-sm text-muted-foreground">
                Acesso completo: pode visualizar dashboards, fazer upload de dados, exportar PDFs e gerenciar permissões de outros usuários.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 border rounded-lg">
            <Eye className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Viewer</p>
              <p className="text-sm text-muted-foreground">
                Acesso de leitura: pode visualizar dashboards e exportar PDFs, mas não pode fazer upload de dados ou gerenciar usuários.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
