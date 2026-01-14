# Guia de Instalação em VPS - Debian 12

Este guia mostra como instalar o sistema Contencioso em uma VPS com Debian 12.
**Todas as senhas já estão configuradas - é só copiar e colar!**

## Requisitos Mínimos
- 2 GB RAM (3 GB recomendado)
- 2 vCPUs
- 20 GB de disco
- Debian 12

---

## PASSO 1 - Conectar na VPS via SSH

```bash
ssh root@SEU_IP_DA_VPS
```

---

## PASSO 2 - Atualizar o Sistema

```bash
apt update && apt upgrade -y
```

---

## PASSO 3 - Instalar Dependências Básicas

```bash
apt install -y curl sudo git
```

---

## PASSO 4 - Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
```

```bash
apt install -y nodejs
```

Verificar instalação:
```bash
node --version
npm --version
```

---

## PASSO 5 - Instalar PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
```

```bash
systemctl start postgresql
systemctl enable postgresql
```

Verificar se está rodando:
```bash
systemctl status postgresql
```

---

## PASSO 6 - Criar Banco de Dados

Acessar o PostgreSQL:
```bash
sudo -u postgres psql
```

**Dentro do psql, copie e cole TUDO de uma vez:**
```sql
CREATE USER contencioso WITH PASSWORD 'Daniel@1012';
CREATE DATABASE contencioso_db OWNER contencioso;
GRANT ALL PRIVILEGES ON DATABASE contencioso_db TO contencioso;
\q
```

---

## PASSO 7 - Clonar o Repositório

```bash
mkdir -p /var/www
cd /var/www
```

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git contencioso
cd contencioso
```

---

## PASSO 8 - Criar Arquivo de Configuração

```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://contencioso:Daniel@1012@localhost:5432/contencioso_db
PGHOST=localhost
PGPORT=5432
PGUSER=contencioso
PGPASSWORD=Daniel@1012
PGDATABASE=contencioso_db
SESSION_SECRET=Daniel1012SecretKeyContencioso2024SuperSeguro
NODE_ENV=production
PORT=5000
EOF
```

---

## PASSO 9 - Instalar Dependências do Projeto

```bash
npm install
```

---

## PASSO 10 - Criar Tabelas no Banco

```bash
npm run db:push
```

---

## PASSO 11 - Compilar o Frontend

```bash
npm run build
```

---

## PASSO 12 - Instalar PM2 e Iniciar Aplicação

```bash
npm install -g pm2
```

```bash
pm2 start npm --name "contencioso" -- run start
```

Configurar para iniciar automaticamente no boot:
```bash
pm2 startup
pm2 save
```

---

## PASSO 13 - Instalar e Configurar Nginx

```bash
apt install -y nginx
```

Criar configuração do site:
```bash
cat > /etc/nginx/sites-available/contencioso << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

Ativar o site:
```bash
ln -s /etc/nginx/sites-available/contencioso /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## PASSO 14 - Configurar Firewall

```bash
apt install -y ufw
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
```

---

## PRONTO! Sistema Instalado!

Acesse no navegador: `http://SEU_IP_DA_VPS`

### Credenciais de Acesso:
- **Usuário:** `admin`
- **Senha:** `123456`

---

## Comandos Úteis

### Atualizar o Sistema (via Git)
```bash
cd /var/www/contencioso
git pull origin main
npm install
npm run build
pm2 restart contencioso
```

### Ver Logs da Aplicação
```bash
pm2 logs contencioso
```

### Reiniciar Aplicação
```bash
pm2 restart contencioso
```

### Ver Status
```bash
pm2 status
```

### Acessar Banco de Dados
```bash
PGPASSWORD='Daniel@1012' psql -h localhost -U contencioso -d contencioso_db
```

---

## Backup do Banco de Dados

### Criar backup
```bash
PGPASSWORD='Daniel@1012' pg_dump -h localhost -U contencioso contencioso_db > /var/www/backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
PGPASSWORD='Daniel@1012' psql -h localhost -U contencioso contencioso_db < /var/www/backup_XXXXXXXX.sql
```

---

## (Opcional) Instalar SSL com Let's Encrypt

Se você tiver um domínio apontando para sua VPS:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seu_dominio.com.br
```

---

## Solução de Problemas

### Aplicação não inicia
```bash
pm2 logs contencioso --lines 50
```

### Erro de conexão com banco
```bash
systemctl status postgresql
PGPASSWORD='Daniel@1012' psql -h localhost -U contencioso -d contencioso_db -c "SELECT 1"
```

### Nginx não funciona
```bash
nginx -t
journalctl -u nginx
```
