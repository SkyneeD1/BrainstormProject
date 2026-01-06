import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, Eye, Key, Loader2, CheckCircle } from "lucide-react";

export default function Profile() {
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      const response = await apiRequest("PATCH", "/api/profile/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso. Você será desconectado.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFormError("");
      setTimeout(() => logout(), 2000);
    },
    onError: async (error: any) => {
      const message = error?.message || "Erro ao alterar senha";
      if (message.includes("401")) {
        setFormError("Senha atual incorreta");
      } else if (message.includes("400")) {
        setFormError("Dados inválidos. Verifique se as senhas coincidem.");
      } else {
        setFormError(message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!currentPassword) {
      setFormError("Informe sua senha atual");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setFormError("Nova senha deve ter pelo menos 4 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("As senhas não coincidem");
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword });
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || "Usuário";
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações e senha</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{getUserName()}</p>
              <p className="text-muted-foreground">@{user?.username}</p>
              <div className="mt-1">
                {isAdmin ? (
                  <Badge variant="default">
                    <Shield className="w-3 h-3 mr-1" />
                    Administrador
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Eye className="w-3 h-3 mr-1" />
                    Visualizador
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                data-testid="input-current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha (mínimo 4 caracteres)"
                data-testid="input-new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                data-testid="input-confirm-password"
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <Button 
              type="submit" 
              disabled={changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Alterar Senha
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
