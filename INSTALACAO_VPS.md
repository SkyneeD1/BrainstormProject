# Guia de Instalação em VPS

Este guia mostra como instalar o sistema Contencioso em uma VPS com Ubuntu 20.04 ou Debian 12.

## Requisitos Mínimos
- 2 GB RAM (3 GB recomendado)
- 2 vCPUs
- 20 GB de disco
- Ubuntu 20.04 LTS ou Debian 12

## 1. Conectar na VPS via SSH

```bash
ssh root@SEU_IP_DA_VPS
```

## 2. Atualizar o Sistema

```bash
apt update && apt upgrade -y
```

## 3. Instalar Node.js 20

```bash
# Instalar curl se não tiver
apt install -y curl

# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Instalar Node.js
apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

## 4. Instalar PostgreSQL

```bash
# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Iniciar e habilitar serviço
systemctl start postgresql
systemctl enable postgresql

# Verificar status
systemctl status postgresql
```

## 5. Configurar Banco de Dados

```bash
# Acessar como usuário postgres
sudo -u postgres psql

# Dentro do psql, executar:
CREATE USER contencioso WITH PASSWORD 'SuaSenhaSegura123';
CREATE DATABASE contencioso_db OWNER contencioso;
GRANT ALL PRIVILEGES ON DATABASE contencioso_db TO contencioso;
\q
```

## 6. Instalar Git e Clonar o Repositório

```bash
# Instalar git
apt install -y git

# Criar pasta para o projeto
mkdir -p /var/www
cd /var/www

# Clonar o repositório (substitua pela URL do seu repositório)
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git contencioso
cd contencioso
```

## 7. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano .env
```

Adicione o seguinte conteúdo (ajuste os valores):

```env
DATABASE_URL=postgresql://contencioso:SuaSenhaSegura123@localhost:5432/contencioso_db
PGHOST=localhost
PGPORT=5432
PGUSER=contencioso
PGPASSWORD=SuaSenhaSegura123
PGDATABASE=contencioso_db
SESSION_SECRET=gere_uma_senha_aleatoria_longa_aqui_123456789
NODE_ENV=production
PORT=5000
```

Para gerar uma senha aleatória para SESSION_SECRET:
```bash
openssl rand -base64 32
```

## 8. Instalar Dependências e Configurar Banco

```bash
# Instalar dependências
npm install

# Criar tabelas no banco de dados
npm run db:push
```

## 9. Compilar o Frontend

```bash
# Build de produção
npm run build
```

## 10. Instalar PM2 (Gerenciador de Processos)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar a aplicação
pm2 start npm --name "contencioso" -- run start

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

## 11. Instalar Nginx (Proxy Reverso)

```bash
# Instalar Nginx
apt install -y nginx

# Criar configuração
nano /etc/nginx/sites-available/contencioso
```

Adicione o seguinte conteúdo:

```nginx
server {
    listen 80;
    server_name seu_dominio.com.br;  # ou IP da VPS

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
```

```bash
# Ativar o site
ln -s /etc/nginx/sites-available/contencioso /etc/nginx/sites-enabled/

# Remover configuração padrão
rm /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

## 12. Configurar Firewall (UFW)

```bash
# Instalar UFW
apt install -y ufw

# Configurar regras
ufw allow ssh
ufw allow http
ufw allow https

# Ativar firewall
ufw enable
```

## 13. (Opcional) Instalar SSL com Let's Encrypt

Se você tiver um domínio apontando para sua VPS:

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d seu_dominio.com.br

# Renovação automática já está configurada
```

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
sudo -u postgres psql -d contencioso_db
```

## Credenciais Padrão

Após a instalação, acesse o sistema com:
- Usuário: `admin`
- Senha: `123456`

**IMPORTANTE**: Troque a senha do admin após o primeiro login!

## Solução de Problemas

### Aplicação não inicia
```bash
pm2 logs contencioso --lines 50
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
psql -h localhost -U contencioso -d contencioso_db
```

### Nginx não funciona
```bash
# Ver erros
nginx -t
journalctl -u nginx
```

## Backup do Banco de Dados

```bash
# Criar backup
pg_dump -U contencioso -h localhost contencioso_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U contencioso -h localhost contencioso_db < backup_20240115.sql
```
