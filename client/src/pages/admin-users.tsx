import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Shield, Eye, UserPlus, Key, Loader2, AlertCircle, Trash2, Settings } from "lucide-react";
import { AVAILABLE_MODULES } from "@shared/schema";

interface UserWithPermissions {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  modulePermissions: string[];
  createdAt: Date | null;
}

interface UserFormData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  modulePermissions: string[];
}

export default function AdminUsers() {
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "viewer",
    modulePermissions: [],
  });
  const [formError, setFormError] = useState("");

  const { data: users, isLoading } = useQuery<UserWithPermissions[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
      setCreateDialogOpen(false);
      setFormData({ username: "", password: "", firstName: "", lastName: "", role: "viewer", modulePermissions: [] });
      setFormError("");
    },
    onError: async (error: any) => {
      const message = error?.message || "Erro ao criar usuário";
      if (message.includes("400")) {
        setFormError("Nome de usuário já existe ou dados inválidos");
      } else {
        setFormError(message);
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, role, modulePermissions }: { id: string; role?: string; modulePermissions?: string[] }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, { role, modulePermissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário atualizado",
        description: "As permissões do usuário foram alteradas com sucesso.",
      });
      setPermissionsDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      return await apiRequest("PATCH", `/api/users/${id}/password`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Senha atualizada",
        description: "A senha do usuário foi alterada com sucesso.",
      });
      setPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar senha",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir usuário",
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
    const user = users?.find(u => u.id === userId);
    if (user) {
      updateUserMutation.mutate({ 
        id: userId, 
        role: newRole,
        modulePermissions: newRole === "admin" ? [] : user.modulePermissions 
      });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!formData.username || formData.username.length < 3) {
      setFormError("Nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setFormError("Senha deve ter pelo menos 4 caracteres");
      return;
    }
    if (formData.role === "viewer" && formData.modulePermissions.length === 0) {
      setFormError("Selecione pelo menos um módulo para o usuário viewer");
      return;
    }
    
    createUserMutation.mutate(formData);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 4) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 4 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    updatePasswordMutation.mutate({ id: selectedUser.id, newPassword });
  };

  const handlePermissionsChange = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ 
      id: selectedUser.id, 
      modulePermissions: editPermissions 
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const openPasswordDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setNewPassword("");
    setPasswordDialogOpen(true);
  };

  const openPermissionsDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setEditPermissions(user.modulePermissions || []);
    setPermissionsDialogOpen(true);
  };

  const openDeleteDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const toggleFormPermission = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      modulePermissions: prev.modulePermissions.includes(moduleId)
        ? prev.modulePermissions.filter(id => id !== moduleId)
        : [...prev.modulePermissions, moduleId]
    }));
  };

  const toggleEditPermission = (moduleId: string) => {
    setEditPermissions(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getInitials = (user: UserWithPermissions) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    return "U";
  };

  const getModuleName = (moduleId: string) => {
    const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
    return module?.name || moduleId;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Nome"
                    data-testid="input-firstName"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Sobrenome"
                    data-testid="input-lastName"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="usuario"
                  required
                  data-testid="input-create-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 4 caracteres"
                  required
                  data-testid="input-create-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value, modulePermissions: value === "admin" ? [] : formData.modulePermissions })}
                >
                  <SelectTrigger data-testid="select-create-role">
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

              {formData.role === "viewer" && (
                <div className="space-y-3">
                  <Label>Módulos Permitidos *</Label>
                  <div className="space-y-2 border rounded-md p-3">
                    {AVAILABLE_MODULES.map((module) => (
                      <div key={module.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-${module.id}`}
                          checked={formData.modulePermissions.includes(module.id)}
                          onCheckedChange={() => toggleFormPermission(module.id)}
                          data-testid={`checkbox-create-${module.id}`}
                        />
                        <label
                          htmlFor={`create-${module.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {module.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-create">
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Usuários do Sistema
          </CardTitle>
          <CardDescription>
            Gerencie as permissões, senhas e módulos de acesso dos usuários
          </CardDescription>
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
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.username}
                    </p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.role === "viewer" && user.modulePermissions && user.modulePermissions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.modulePermissions.map((moduleId) => (
                          <Badge key={moduleId} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {getModuleName(moduleId)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.id === currentUser?.id && (
                    <Badge variant="secondary">Você</Badge>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPasswordDialog(user)}
                    data-testid={`button-change-password-${user.id}`}
                  >
                    <Key className="w-4 h-4 mr-1" />
                    Senha
                  </Button>

                  {user.role === "viewer" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermissionsDialog(user)}
                      data-testid={`button-permissions-${user.id}`}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Módulos
                    </Button>
                  )}

                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                    disabled={user.id === currentUser?.id || updateUserMutation.isPending}
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

                  {user.id !== currentUser?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(user)}
                      data-testid={`button-delete-${user.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
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

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para {selectedUser?.firstName || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                required
                data-testid="input-new-password"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updatePasswordMutation.isPending} data-testid="button-submit-password">
                {updatePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Módulos</DialogTitle>
            <DialogDescription>
              Selecione os módulos que {selectedUser?.firstName || selectedUser?.username} pode acessar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {AVAILABLE_MODULES.map((module) => (
              <div key={module.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`edit-${module.id}`}
                  checked={editPermissions.includes(module.id)}
                  onCheckedChange={() => toggleEditPermission(module.id)}
                  data-testid={`checkbox-edit-${module.id}`}
                />
                <label
                  htmlFor={`edit-${module.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {module.name}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handlePermissionsChange} 
              disabled={updateUserMutation.isPending || editPermissions.length === 0}
              data-testid="button-submit-permissions"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.firstName || selectedUser?.username}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                Acesso completo a todos os módulos: pode visualizar dashboards, fazer upload de dados, exportar PDFs, criar usuários e gerenciar permissões.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 border rounded-lg">
            <Eye className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Viewer</p>
              <p className="text-sm text-muted-foreground">
                Acesso limitado: pode visualizar apenas os módulos permitidos pelo administrador. Não pode fazer upload de dados ou gerenciar usuários.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
