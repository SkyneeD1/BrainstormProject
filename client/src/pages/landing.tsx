import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, LogIn, Loader2, AlertCircle, Building2, ChevronRight } from "lucide-react";
import { useAuth, type Tenant, type LoginResponse } from "@/hooks/useAuth";

type Step = "login" | "select-tenant";

export default function Landing() {
  const [step, setStep] = useState<Step>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  const { loginAsync, isLoggingIn, selectTenantAsync, isSelectingTenant } = useAuth();

  useEffect(() => {
    if (selectedTenant) {
      document.documentElement.style.setProperty('--tenant-primary', selectedTenant.primaryColor);
      document.documentElement.style.setProperty('--tenant-background', selectedTenant.backgroundColor);
    }
  }, [selectedTenant]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const result: LoginResponse = await loginAsync({ username, password });
      
      if (result.requiresTenantSelection && result.availableTenants) {
        setAvailableTenants(result.availableTenants);
        setStep("select-tenant");
      }
    } catch (err: any) {
      const message = err?.message || "Erro ao fazer login";
      if (message.includes("401") || message.includes("Unauthorized")) {
        setError("Usuário ou senha incorretos");
      } else if (message.includes("403")) {
        setError("Usuário não tem acesso a nenhuma empresa");
      } else {
        setError(message);
      }
    }
  };

  const handleSelectTenant = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setError("");
    
    try {
      await selectTenantAsync(tenant.id);
    } catch (err: any) {
      setError(err?.message || "Erro ao selecionar empresa");
    }
  };

  const handleBackToLogin = () => {
    setStep("login");
    setUsername("");
    setPassword("");
    setError("");
    setAvailableTenants([]);
    setSelectedTenant(null);
  };

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
              Contencioso
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        {step === "login" && (
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Gestão de Contencioso
              </h1>
              <p className="text-muted-foreground mt-2">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center">
                  <LogIn className="w-5 h-5" />
                  Entrar no Sistema
                </CardTitle>
                <CardDescription>
                  Digite seu usuário e senha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
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
          </div>
        )}

        {step === "select-tenant" && (
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">
                Olá, {username}!
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Selecione a empresa que deseja acessar
              </p>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md max-w-md mx-auto">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {availableTenants.map((tenant) => (
                <Card 
                  key={tenant.id}
                  className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 hover:border-primary"
                  onClick={() => handleSelectTenant(tenant)}
                  data-testid={`card-tenant-${tenant.code}`}
                >
                  <CardHeader className="text-center pb-2">
                    {tenant.logoUrl ? (
                      <div className="h-24 mx-auto mb-4 flex items-center justify-center">
                        <img 
                          src={tenant.logoUrl} 
                          alt={`${tenant.name} Logo`}
                          className="max-h-full w-auto object-contain"
                          style={{ maxWidth: tenant.code === 'nio' ? '120px' : '100px' }}
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: tenant.backgroundColor }}
                      >
                        <Building2 
                          className="w-8 h-8" 
                          style={{ color: tenant.primaryColor }}
                        />
                      </div>
                    )}
                    <CardTitle className="text-2xl">{tenant.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      {isSelectingTenant && selectedTenant?.id === tenant.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Carregando...</span>
                        </>
                      ) : (
                        <>
                          <span>Acessar sistema</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </div>
                    <div 
                      className="mt-4 h-2 rounded-full"
                      style={{ backgroundColor: tenant.primaryColor }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button 
              variant="ghost" 
              onClick={handleBackToLogin}
              className="text-muted-foreground"
              data-testid="button-back-login"
            >
              Voltar para login
            </Button>
          </div>
        )}
      </main>

      <footer className="py-6 px-8 border-t bg-background">
      </footer>
    </div>
  );
}
