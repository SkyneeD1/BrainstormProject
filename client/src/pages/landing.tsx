import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Shield, BarChart3 } from "lucide-react";

export default function Landing() {
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
          <a href="/api/login">
            <Button data-testid="button-login">Entrar</Button>
          </a>
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

          <div className="pt-8">
            <a href="/api/login">
              <Button size="lg" data-testid="button-login-hero">
                Acessar o Sistema
              </Button>
            </a>
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
