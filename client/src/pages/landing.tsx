import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, LogIn, Loader2, AlertCircle, Building2, ArrowLeft, ChevronRight } from "lucide-react";
import { useAuth, type Tenant } from "@/hooks/useAuth";

export default function Landing() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginAsync, isLoggingIn } = useAuth();

  const { data: tenants, isLoading: isLoadingTenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  useEffect(() => {
    if (selectedTenant) {
      document.documentElement.style.setProperty('--tenant-primary', selectedTenant.primaryColor);
      document.documentElement.style.setProperty('--tenant-background', selectedTenant.backgroundColor);
    }
  }, [selectedTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!selectedTenant) {
      setError("Selecione uma empresa primeiro");
      return;
    }
    
    try {
      await loginAsync({ username, password, tenantCode: selectedTenant.code });
    } catch (err: any) {
      const message = err?.message || "Erro ao fazer login";
      if (message.includes("401") || message.includes("Unauthorized")) {
        setError("Usuário ou senha incorretos");
      } else {
        setError(message);
      }
    }
  };

  const handleBackToTenantSelection = () => {
    setSelectedTenant(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  if (isLoadingTenants) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{
        backgroundColor: selectedTenant ? selectedTenant.backgroundColor : undefined,
      }}
    >
      <header 
        className="py-4 px-6 transition-colors duration-500"
        style={{
          backgroundColor: selectedTenant ? selectedTenant.backgroundColor : '#000',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{
                backgroundColor: selectedTenant?.primaryColor || '#ffd700',
              }}
            >
              <Scale className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white">
              {selectedTenant ? `Contencioso ${selectedTenant.name}` : 'Contencioso'}
            </span>
          </div>
          {selectedTenant && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBackToTenantSelection}
              className="text-white hover:bg-white/10"
              data-testid="button-back-tenant"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Trocar empresa
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        {!selectedTenant ? (
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Gestão de Contencioso
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Selecione a empresa para acessar o sistema
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {tenants?.map((tenant) => (
                <Card 
                  key={tenant.id}
                  className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 hover:border-primary"
                  onClick={() => setSelectedTenant(tenant)}
                  data-testid={`card-tenant-${tenant.code}`}
                >
                  <CardHeader className="text-center pb-2">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: tenant.backgroundColor }}
                    >
                      <Building2 
                        className="w-8 h-8" 
                        style={{ color: tenant.primaryColor }}
                      />
                    </div>
                    <CardTitle className="text-2xl">{tenant.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <span>Acessar sistema</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <div 
                      className="mt-4 h-2 rounded-full"
                      style={{ backgroundColor: tenant.primaryColor }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto w-full">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedTenant.backgroundColor }}
                  >
                    <Building2 
                      className="w-5 h-5" 
                      style={{ color: selectedTenant.primaryColor }}
                    />
                  </div>
                  <span 
                    className="text-lg font-semibold"
                    style={{ color: selectedTenant.primaryColor }}
                  >
                    {selectedTenant.name}
                  </span>
                </div>
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
                    style={{
                      backgroundColor: selectedTenant.primaryColor,
                      color: selectedTenant.code === 'nio' ? '#000' : '#000',
                    }}
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
          </div>
        )}
      </main>

      <footer className="py-6 px-8 border-t bg-background">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          Ecossistema de Gestão Contenciosa | Base Dez/24
        </div>
      </footer>
    </div>
  );
}
