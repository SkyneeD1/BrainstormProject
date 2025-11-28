import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Shield, BarChart3, LogIn, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginAsync, isLoggingIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      await loginAsync({ username, password });
    } catch (err: any) {
      const message = err?.message || "Erro ao fazer login";
      if (message.includes("401") || message.includes("Unauthorized")) {
        setError("Usuário ou senha incorretos");
      } else {
        setError(message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-black dark:bg-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-white dark:text-black">Contencioso V.tal</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Gestão de Contencioso
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema integrado para gerenciamento de passivo trabalhista com dashboards interativos e análise de risco.
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <LogIn className="w-5 h-5" />
                Entrar no Sistema
              </CardTitle>
              <CardDescription>
                Digite suas credenciais para acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário"
                    required
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    data-testid="input-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoggingIn}
                  data-testid="button-login"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Dashboards</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Visualize dados agregados por fase processual, risco e origem empresarial.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Scale className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Análise de Risco</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Classificação automática de processos por nível de risco: Remoto, Possível e Provável.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Controle de Acesso</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Permissões diferenciadas para administradores e visualizadores.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 border-t">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          V.tal - Ecossistema de Gestão Contenciosa | Base Dez/24
        </div>
      </footer>
    </div>
  );
}
