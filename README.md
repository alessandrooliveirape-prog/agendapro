# AgendaPro — Sistema de Agendamento SaaS

Sistema completo de agendamento para profissionais de serviços (barbeiros, cabeleireiros, dentistas, personal trainers, etc.).

## 📁 Estrutura do Projeto

```
agendapro/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── config/         # Database, WhatsApp, Email
│   │   ├── database/       # Schema SQL, setup, seed
│   │   ├── middleware/     # Autenticação JWT
│   │   ├── routes/         # Rotas da API
│   │   └── server.js       # Servidor principal
│   ├── .env.example        # Template de configuração
│   └── package.json
├── landing/                 # Página de vendas
│   └── index.html
└── app/                     # Painel administrativo
    └── index.html
```

## 🚀 Início Rápido

### 1. Configurar banco de dados (Supabase)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor** e cole o conteúdo de `backend/src/database/schema.sql`
4. Execute para criar todas as tabelas
5. Copie as credenciais para o `.env`

### 2. Configurar backend

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais do Supabase
```

### 3. Popular dados de teste

```bash
npm run db:seed
```

### 4. Iniciar o servidor

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

## 📡 Endpoints da API

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Verificar token |

### Negócio

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/business` | Dados do negócio |
| PUT | `/api/business` | Atualizar negócio |
| GET | `/api/dashboard` | Estatísticas |

### Serviços

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/services` | Listar serviços |
| POST | `/api/services` | Criar serviço |
| PUT | `/api/services/:id` | Atualizar serviço |
| DELETE | `/api/services/:id` | Remover serviço |

### Profissionais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/professionals` | Listar profissionais |
| POST | `/api/professionals` | Criar profissional |
| PUT | `/api/professionals/:id` | Atualizar profissional |
| GET | `/api/professionals/:id/schedule` | Agenda do profissional |

### Agendamentos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/appointments` | Listar agendamentos |
| POST | `/api/appointments` | Criar agendamento |
| PATCH | `/api/appointments/:id/status` | Atualizar status |
| DELETE | `/api/appointments/:id` | Remover agendamento |
| POST | `/api/appointments/send-reminders` | Enviar lembretes |

### Clientes

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clients` | Listar clientes |
| POST | `/api/clients` | Criar cliente |
| PUT | `/api/clients/:id` | Atualizar cliente |
| DELETE | `/api/clients/:id` | Remover cliente |

### Rotas Públicas (para clientes)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/public/:slug` | Página de agendamento |
| GET | `/api/public/:slug/available-times` | Horários disponíveis |
| POST | `/api/public/:slug/book` | Criar agendamento público |

## 🔐 Autenticação

Todas as rotas (exceto `/api/public/*`) requerem token JWT no header:

```
Authorization: Bearer <token>
```

## 📱 WhatsApp Integration

Configure sua instância de WhatsApp (Z-API ou Evolution API):

```env
WHATSAPP_API_URL=https://api.z-api.io
WHATSAPP_INSTANCE_ID=sua_instancia
WHATSAPP_TOKEN=seu_token
```

## 💰 Monetização

| Plano | Preço | Features |
|-------|-------|----------|
| Básico | R$49/mês | 1 profissional, SMS |
| Pro | R$99/mês | 5 profissionais, WhatsApp |
| Business | R$199/mês | Ilimitado, API |

## 🚀 Deploy

### Backend (Railway/Render)

1. Crie conta no [Railway](https://railway.app) ou [Render](https://render.com)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. Deploy automático

### Frontend (Vercel/Netlify)

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório
3. Deploy automático

## 📋 Próximos Passos

- [x] Integrar pagamento (Stripe/Mercado Pago)
- [x] Dashboard completo no React
- [x] App mobile (PWA)
- [x] Notificações push
- [x] Relatórios avançados
- [x] Multi-unidades
