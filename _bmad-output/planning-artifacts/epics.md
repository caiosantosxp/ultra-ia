---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments: ['prd.md', 'architecture.md', 'ux-design-specification.md']
---

# ultra-ia - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ultra-ia, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**User Discovery & Onboarding:**
- FR1: Visitantes podem visualizar a landing page com proposta de valor e catálogo de especialistas IA disponíveis
- FR2: Visitantes podem ver detalhes de cada especialista (domínio, descrição, preço) antes de criar conta
- FR3: Visitantes podem criar conta usando email/senha ou Google OAuth
- FR4: Novos usuários são redirecionados para o fluxo de assinatura após criação de conta

**Authentication & Account Management:**
- FR5: Usuários podem fazer login com email/senha ou Google OAuth
- FR6: Usuários podem redefinir sua senha via email
- FR7: Usuários podem visualizar e editar seu perfil (nome, email)
- FR8: Usuários podem gerenciar seu método de pagamento
- FR9: Usuários podem cancelar sua assinatura
- FR10: Usuários podem fazer logout

**Subscription & Payments:**
- FR11: Usuários podem assinar um especialista IA via checkout Stripe
- FR12: O sistema processa renovações automáticas mensais via Stripe
- FR13: O sistema detecta falhas de pagamento e notifica o usuário
- FR14: Usuários com pagamento falho mantêm acesso durante período de graça
- FR15: O sistema bloqueia acesso ao chat após expiração do período de graça sem pagamento
- FR16: Usuários podem atualizar método de pagamento para resolver falhas
- FR17: O sistema aplica comissão de 25% sobre cada transação via Stripe Connect

**AI Specialist Chat:**
- FR18: Usuários assinantes podem iniciar uma conversa com seu especialista IA
- FR19: O agente IA faz perguntas de contexto antes de fornecer orientação
- FR20: As respostas da IA são exibidas em streaming (palavra por palavra)
- FR21: Usuários podem visualizar o histórico de suas conversas anteriores
- FR22: Usuários podem iniciar novas conversas mantendo o histórico das anteriores
- FR23: O sistema limita o uso a 100 requisições por dia por usuário

**AI Knowledge & Behavior Control:**
- FR24: O agente IA se mantém dentro do domínio de expertise treinado
- FR25: O agente IA redireciona educadamente quando detecta pergunta fora do escopo
- FR26: Toda interação inclui disclaimer informando que a IA não substitui profissionais certificados
- FR27: O agente IA redireciona para profissionais humanos em decisões sensíveis (jurídicas, fiscais)
- FR28: As conversas são armazenadas de forma anônima em conformidade com RGPD

**Admin - Agent Management:**
- FR29: Admins podem criar novos agentes especialistas definindo nome, domínio e descrição
- FR30: Admins podem fazer upload de materiais para a base de conhecimento de um agente
- FR31: Admins podem configurar os limites de escopo e prompts de cada agente
- FR32: Admins podem ativar ou desativar agentes no catálogo público
- FR33: Admins podem editar informações de agentes existentes

**Admin - Platform Operations:**
- FR34: Admins podem visualizar dashboard com métricas (assinantes ativos, mensagens/dia, receita, retenção)
- FR35: Admins podem listar e pesquisar usuários da plataforma
- FR36: Admins podem visualizar detalhes de assinatura de cada usuário
- FR37: Admins podem resolver problemas de pagamento de usuários
- FR38: Admins podem visualizar métricas de uso por agente (mensagens, retenção, satisfação)

**Notifications & Communication:**
- FR39: O sistema envia email de boas-vindas após criação de conta
- FR40: O sistema envia email de confirmação de assinatura
- FR41: O sistema envia email de notificação quando pagamento falha
- FR42: O sistema envia email de confirmação quando pagamento é atualizado com sucesso

### NonFunctional Requirements

**Performance:**
- NFR1: O primeiro token da resposta da IA deve iniciar streaming em menos de 5 segundos após envio da mensagem
- NFR2: Páginas públicas (landing, catálogo) carregam em menos de 2 segundos (First Contentful Paint)
- NFR3: Navegação na área autenticada responde em menos de 500ms (transições de página)
- NFR4: O histórico de conversas carrega em menos de 1 segundo
- NFR5: O checkout Stripe completa o redirecionamento em menos de 3 segundos

**Security:**
- NFR6: Todas as comunicações utilizam HTTPS (TLS 1.2+)
- NFR7: Senhas armazenadas com hashing seguro (bcrypt ou equivalente)
- NFR8: Tokens de sessão expiram após período de inatividade
- NFR9: Dados de pagamento nunca são armazenados localmente — processados exclusivamente via Stripe
- NFR10: Conversas armazenadas de forma anônima (sem dados pessoais identificáveis no conteúdo)
- NFR11: Conformidade RGPD: usuários podem solicitar exportação e exclusão de seus dados
- NFR12: API routes protegidas por autenticação — sem acesso não autorizado a dados de outros usuários
- NFR13: Painel admin acessível apenas por usuários com role admin

**Scalability:**
- NFR14: Arquitetura suporta até 500 usuários simultâneos no MVP sem degradação
- NFR15: Sistema de chat suporta até 100 conversas simultâneas em streaming
- NFR16: Base de dados suporta crescimento para 10.000 usuários sem mudança de arquitetura
- NFR17: Integração N8N suporta processamento paralelo de múltiplas requisições

**Integration:**
- NFR18: Integração Stripe processa webhooks com retry automático em caso de falha
- NFR19: Comunicação com N8N possui timeout configurável e fallback em caso de indisponibilidade
- NFR20: Sistema de email transacional possui fila de retry para entregas falhadas
- NFR21: Integração com modelos IA (GPT 5.2) possui circuit breaker para evitar cascata de falhas

### Additional Requirements

**Da Arquitetura — Starter Template e Infraestrutura:**
- Starter template: `create-next-app` + `shadcn@latest init` (Next.js 16.1, TypeScript, Tailwind, App Router, src-dir)
- Dependências core: Prisma 6.x, Auth.js v5, Stripe, next-themes, Zustand 5.x, SWR 2.x, Zod 3.24, React Hook Form 7.x
- Hospedagem: Vercel Pro (Next.js) + Neon PostgreSQL (serverless, EU Frankfurt) + N8N Cloud
- CI/CD: GitHub Actions (lint + type-check + tests em PRs)
- Monitoring: Sentry (error tracking) + Vercel Analytics (Core Web Vitals)
- Session strategy: Database Sessions via Auth.js + Prisma Adapter
- Streaming protocol: SSE (Server-Sent Events) via ReadableStream em Route Handlers
- Rate limiting: Custom middleware com in-memory Map (por IP público, por userId autenticado)
- API pattern: Next.js Route Handlers (REST-like), sem tRPC
- Padrão de resposta API: `{ success, data, error }` com códigos de erro padronizados (9 tipos)
- Validação Zod em todas as API routes e Server Actions
- Server Actions pattern: auth → validate → authorize → execute
- Zustand stores: chat-store, ui-store, subscription-store
- Testes co-localizados ao lado do arquivo testado
- Pre-commit hook: lint + type-check
- Import order obrigatório: React/Next → Libs externas → Components → Lib/utils → Types → Stores
- Naming conventions: PascalCase (componentes), kebab-case (arquivos), camelCase (funções/vars), UPPER_SNAKE (constantes)

**Da Arquitetura — Estrutura de Projeto:**
- Route groups: (public), (auth), (dashboard), (admin) com layouts isolados
- Middleware: auth + rate limiting + redirects no `middleware.ts` raiz
- Prisma schema: User, Account, Session, Conversation, Message, Subscription, Specialist, Lead, Keyword
- Soft delete para conversas (RGPD)
- Timestamps `createdAt`/`updatedAt` em todos os modelos
- Índices em: userId, specialistId, conversationId, createdAt
- Environment variables documentadas em `.env.example`

**Da UX — Requisitos de Interface:**
- Dark + Light mode via next-themes com CSS custom properties (sem flicker no carregamento)
- 16 componentes ShadCN UI + 9 componentes custom (ChatMessage, StreamingIndicator, SpecialistCard, QuickPrompt, UsageMeter, DisclaimerBanner, ChatHeroPreview, PaymentBanner, MetricsCard)
- Desktop-first com suporte responsivo: 5 breakpoints (< 640px, 640-768px, 768-1024px, > 1024px, > 1280px)
- Sidebar colapsável: 280px (user) / 240px (admin), overlay abaixo de 1024px
- Tipografia: Poppins (headings) + Inter (body) — fontes self-hosted
- Color system com cores de acento por especialista (azul para gestão empresarial)
- Streaming indicator: avatar do especialista + 3 dots animados
- Quick prompts: sugestões clicáveis com emoji na primeira conversa e ao iniciar nova conversa
- Chat input auto-expanding (1-4 linhas), Enter para enviar, Shift+Enter para nova linha
- Toast notifications: bottom-right (desktop), bottom-center (mobile), max 3 simultâneos
- WCAG 2.1 AA compliance: contraste 4.5:1, touch targets 44x44px, focus-visible, aria-labels, semantic HTML
- Skip link, prefers-reduced-motion, prefers-color-scheme
- Landing page: Hero split (texto + chat preview) + Grid de cards especialistas + Footer RGPD
- Chat preview animado no hero para "show don't tell"
- Empty states com ilustrações e CTAs contextuais
- Keyboard shortcuts: Enter (enviar), Shift+Enter (nova linha), Ctrl+K (busca), Esc (fechar)
- Validação de formulários inline em tempo real (onBlur)
- Interface em francês (MVP), estrutura preparada para i18n (v2.0)

### FR Coverage Map

| FR | Épico | Descrição |
|-----|-------|-----------|
| FR1 | Epic 1 | Landing page com catálogo de especialistas |
| FR2 | Epic 1 | Detalhes do especialista (domínio, descrição, preço) |
| FR3 | Epic 2 | Criação de conta (email/senha + Google OAuth) |
| FR4 | Epic 3 | Redirecionamento pós-signup para assinatura |
| FR5 | Epic 2 | Login (email/senha + Google OAuth) |
| FR6 | Epic 2 | Reset de senha via email |
| FR7 | Epic 2 | Edição de perfil (nome, email) |
| FR8 | Epic 3 | Gestão de método de pagamento |
| FR9 | Epic 3 | Cancelamento de assinatura |
| FR10 | Epic 2 | Logout |
| FR11 | Epic 3 | Checkout Stripe para assinatura |
| FR12 | Epic 3 | Renovações automáticas mensais |
| FR13 | Epic 3 | Detecção de falha de pagamento + notificação |
| FR14 | Epic 3 | Período de graça para pagamento falho |
| FR15 | Epic 3 | Bloqueio pós-expiração do período de graça |
| FR16 | Epic 3 | Atualização de método de pagamento |
| FR17 | Epic 3 | Comissão 25% via Stripe Connect |
| FR18 | Epic 4 | Iniciar conversa com especialista IA |
| FR19 | Epic 4 | Perguntas de contexto da IA antes de orientar |
| FR20 | Epic 4 | Streaming palavra por palavra das respostas |
| FR21 | Epic 4 | Histórico de conversas anteriores |
| FR22 | Epic 4 | Novas conversas mantendo histórico |
| FR23 | Epic 4 | Limite 100 requisições/dia por usuário |
| FR24 | Epic 4 | IA dentro do domínio de expertise treinado |
| FR25 | Epic 4 | Redirecionamento educado fora do escopo |
| FR26 | Epic 4 | Disclaimer em toda interação |
| FR27 | Epic 4 | Redirecionamento para humanos em decisões sensíveis |
| FR28 | Epic 4 | Armazenamento anônimo RGPD |
| FR29 | Epic 5 | Criar agentes especialistas |
| FR30 | Epic 5 | Upload de base de conhecimento |
| FR31 | Epic 5 | Configurar limites de escopo e prompts |
| FR32 | Epic 5 | Ativar/desativar agentes no catálogo |
| FR33 | Epic 5 | Editar agentes existentes |
| FR34 | Epic 5 | Dashboard métricas (assinantes, mensagens, receita, retenção) |
| FR35 | Epic 5 | Listar e pesquisar usuários |
| FR36 | Epic 5 | Detalhes de assinatura por usuário |
| FR37 | Epic 5 | Resolver problemas de pagamento |
| FR38 | Epic 5 | Métricas de uso por agente |
| FR39 | Epic 6 | Email de boas-vindas |
| FR40 | Epic 6 | Email de confirmação de assinatura |
| FR41 | Epic 6 | Email de notificação de falha de pagamento |
| FR42 | Epic 6 | Email de confirmação de atualização de pagamento |

**Cobertura: 42/42 FRs (100%)**

## Epic List

### Epic 1: Fundação do Projeto & Experiência Pública
Visitantes podem descobrir a plataforma ultra-ia e conhecer os especialistas IA disponíveis. Inclui setup do projeto (create-next-app, ShadCN, Prisma schema, Neon DB, estrutura de pastas), landing page com hero split + chat preview, catálogo de especialistas com cards, e páginas legais (privacy, terms).
**FRs cobertos:** FR1, FR2

### Epic 2: Autenticação & Gestão de Conta
Usuários podem criar conta, fazer login, gerenciar perfil e controlar seus dados (RGPD). Registro email/senha + Google OAuth via Auth.js v5, login/logout, reset de senha, edição de perfil, middleware de auth, Database Sessions com Prisma Adapter.
**FRs cobertos:** FR3, FR5, FR6, FR7, FR10

### Epic 3: Assinatura & Sistema de Pagamentos
Usuários podem assinar especialistas, gerenciar pagamentos e resolver falhas — o fluxo completo de monetização funciona. Stripe Checkout + Subscriptions + Webhooks + Connect (comissão 25%), redirecionamento pós-signup, período de graça, subscription gating via middleware, portal Stripe para gestão de pagamento.
**FRs cobertos:** FR4, FR8, FR9, FR11, FR12, FR13, FR14, FR15, FR16, FR17

### Epic 4: Chat IA & Interação com Especialista
Usuários assinantes podem ter conversas significativas com especialistas IA — o core do produto funciona. Chat com streaming SSE via N8N, perguntas de contexto da IA, histórico de conversas, sidebar com histórico, rate limiting (100 req/dia), controle de escopo, disclaimers, redirecionamento fora do escopo, armazenamento anônimo RGPD. Inclui componentes custom: ChatMessage, StreamingIndicator, QuickPrompt, DisclaimerBanner, UsageMeter.
**FRs cobertos:** FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28

### Epic 5: Painel Administrativo & Gestão de Agentes
Admins podem gerenciar a plataforma completa — agentes, usuários, assinaturas e métricas. CRUD de agentes com upload de base de conhecimento, configuração de prompts/escopo, ativação/desativação no catálogo, dashboard de métricas, gestão de usuários e assinaturas. Layout admin com sidebar 240px.
**FRs cobertos:** FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38

### Epic 6: Notificações & Comunicação
Usuários recebem comunicações automáticas oportunas sobre conta, assinatura e pagamentos. Emails transacionais (boas-vindas, confirmação assinatura, falha pagamento, atualização pagamento), sistema de email com retry.
**FRs cobertos:** FR39, FR40, FR41, FR42

---

## Epic 1: Fundação do Projeto & Experiência Pública

Visitantes podem descobrir a plataforma ultra-ia e conhecer os especialistas IA disponíveis.

### Story 1.1: Inicialização do Projeto & Design System

As a **developer**,
I want **the project initialized with Next.js 16.1, ShadCN UI, Prisma, and the design system configured**,
So that **all subsequent stories can be built on a solid, consistent foundation**.

**Acceptance Criteria:**

**Given** um repositório vazio
**When** o projeto é inicializado
**Then** o projeto Next.js 16.1 está criado com TypeScript, Tailwind, ESLint, App Router, src-dir e import alias @/*
**And** ShadCN UI está inicializado com componentes base disponíveis
**And** Prisma está instalado e configurado com conexão ao Neon PostgreSQL
**And** a estrutura de pastas segue a arquitetura definida (route groups: public, auth, dashboard, admin; components, lib, stores, types, hooks, actions)
**And** o design system está configurado: CSS custom properties para light/dark mode, cores primárias (#2563EB), tipografia (Poppins headings + Inter body) self-hosted
**And** next-themes está configurado com toggle dark/light mode sem flicker
**And** root layout inclui ThemeProvider, Toaster e structure HTML semântica
**And** `.env.example` documenta todas as variáveis de ambiente necessárias
**And** ESLint e Prettier estão configurados conforme padrões da arquitetura
**And** o projeto roda localmente com `npm run dev` sem erros

### Story 1.2: Landing Page com Catálogo de Especialistas

As a **visitor**,
I want **to see the landing page with the value proposition and specialist catalog**,
So that **I can understand what ultra-ia offers and discover available AI specialists**.

**Acceptance Criteria:**

**Given** um visitante acessa a URL raiz do site
**When** a landing page carrega
**Then** o hero split é exibido com texto de proposta de valor à esquerda e preview de chat à direita (ChatHeroPreview component)
**And** abaixo do hero, o catálogo de especialistas é exibido em grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)
**And** cada SpecialistCard mostra avatar com cor de acento, nome, título, tags de expertise, 3 sugestões de perguntas com emoji, e CTA "Démarrer une conversation"
**And** o header fixo contém logo + nav links + CTA login
**And** o footer contém links legais, RGPD, e informações de contato
**And** a página é renderizada via SSR para SEO (meta tags, structured data)
**And** o FCP é inferior a 2 segundos (NFR2)
**And** a página é responsiva em todos os breakpoints (mobile, tablet, desktop)
**And** o modelo Specialist existe no Prisma com campos: id, name, slug, domain, description, price, accentColor, avatarUrl, tags, quickPrompts, isActive
**And** dados seed do especialista "Gestão Empresarial" estão carregados via `prisma/seed.ts`

### Story 1.3: Página Pública do Especialista

As a **visitor**,
I want **to see detailed information about a specific specialist**,
So that **I can evaluate the specialist's expertise and decide if the service is worth subscribing to**.

**Acceptance Criteria:**

**Given** um visitante clica no card de um especialista na landing page
**When** a página do especialista carrega (`/specialist/[slug]`)
**Then** o perfil completo é exibido: avatar grande com cor de acento, nome, título, descrição detalhada do domínio, tags de expertise
**And** sugestões de perguntas clicáveis (QuickPrompt components) são exibidas com emoji
**And** o preço da assinatura (~99€/mês) é claramente visível
**And** um CTA proeminente "Démarrer une conversation" redireciona para signup/login
**And** a página é renderizada via SSR para SEO (meta tags, Open Graph)
**And** a página é responsiva (card centralizado max-width 720px desktop, full-width mobile)
**And** acessibilidade: `role="article"`, alt text no avatar, link semântico no CTA

### Story 1.4: Páginas Legais & Conformidade RGPD Base

As a **visitor**,
I want **to access the privacy policy and terms of use**,
So that **I can understand how my data is handled before creating an account (RGPD compliance)**.

**Acceptance Criteria:**

**Given** um visitante acessa `/privacy` ou `/terms`
**When** a página carrega
**Then** o conteúdo legal é exibido em formato legível com tipografia clara
**And** a política de privacidade inclui: dados coletados, base legal, direitos do usuário (acesso, retificação, exclusão), contact DPO
**And** os termos de uso incluem: descrição do serviço, responsabilidades, disclaimers sobre IA, condições de cancelamento
**And** o banner de cookie consent (CookieConsent component) é exibido na primeira visita em todas as páginas públicas
**And** o consentimento é armazenado em localStorage e respeita a preferência do usuário
**And** links para privacy e terms estão presentes no footer de todas as páginas

---

## Epic 2: Autenticação & Gestão de Conta

Usuários podem criar conta, fazer login, gerenciar perfil e controlar seus dados (RGPD).

### Story 2.1: Registro de Usuário (Email/Senha + Google OAuth)

As a **visitor**,
I want **to create an account using email/password or Google OAuth**,
So that **I can access the platform and subscribe to AI specialists**.

**Acceptance Criteria:**

**Given** um visitante acessa `/register`
**When** preenche o formulário de registro (nome, email, senha) e submete
**Then** a conta é criada com senha hasheada via bcrypt (salt rounds 12)
**And** o usuário é autenticado automaticamente e redirecionado para a área logada
**And** validação inline (onBlur): email válido, senha mínima 8 caracteres, nome obrigatório
**And** erros de validação exibidos com border vermelha + mensagem abaixo do campo

**Given** um visitante clica em "Continuer avec Google"
**When** o fluxo OAuth completa com sucesso
**Then** a conta é criada (ou vinculada se já existente) e o usuário é autenticado

**Given** um visitante tenta registrar com email já existente
**When** submete o formulário
**Then** uma mensagem de erro é exibida: "Cet email est déjà utilisé"

**And** os modelos User, Account e Session existem no Prisma com Prisma Adapter configurado
**And** Auth.js v5 está configurado com providers Credentials + Google
**And** Database Sessions com Prisma Adapter estão funcionando
**And** layout auth é centrado e minimal conforme UX spec

### Story 2.2: Login & Logout

As a **user**,
I want **to log in and log out of my account**,
So that **I can securely access and leave the platform**.

**Acceptance Criteria:**

**Given** um usuário registrado acessa `/login`
**When** preenche email e senha corretos e submete
**Then** é autenticado e redirecionado para a área de chat (ou último especialista)

**Given** um usuário clica em "Continuer avec Google"
**When** o fluxo OAuth completa com sucesso
**Then** é autenticado e redirecionado

**Given** um usuário preenche credenciais incorretas
**When** submete o formulário
**Then** uma mensagem de erro genérica é exibida: "Email ou mot de passe incorrect"

**Given** um usuário autenticado
**When** clica em logout
**Then** a sessão é invalidada no banco de dados e o usuário é redirecionado para a landing page

**And** middleware.ts protege rotas (dashboard) e (admin) — redireciona para login se não autenticado
**And** tokens de sessão expiram após período de inatividade (NFR8)
**And** API routes protegidas retornam 401 AUTH_REQUIRED para requisições não autenticadas (NFR12)

### Story 2.3: Reset de Senha

As a **user**,
I want **to reset my password via email**,
So that **I can recover access to my account if I forget my password**.

**Acceptance Criteria:**

**Given** um usuário acessa `/login` e clica "Mot de passe oublié ?"
**When** insere seu email e submete
**Then** um email com link de reset é enviado (token com expiração de 1 hora)
**And** mensagem de confirmação: "Si cet email existe, un lien de réinitialisation a été envoyé"

**Given** um usuário clica no link de reset válido
**When** define uma nova senha (mínimo 8 caracteres)
**Then** a senha é atualizada com bcrypt hash e o usuário é redirecionado para login
**And** o token é invalidado após uso

**Given** um usuário clica num link de reset expirado
**When** tenta definir nova senha
**Then** uma mensagem de erro é exibida: "Ce lien a expiré. Veuillez demander un nouveau lien."

### Story 2.4: Gestão de Perfil

As a **user**,
I want **to view and edit my profile information**,
So that **I can keep my account details up to date**.

**Acceptance Criteria:**

**Given** um usuário autenticado acessa `/settings`
**When** a página carrega
**Then** os dados atuais são exibidos: nome, email, método de autenticação (email ou Google)

**Given** um usuário edita seu nome ou email
**When** submete as alterações
**Then** os dados são atualizados no banco e uma toast de sucesso é exibida
**And** validação Zod no server action: nome obrigatório, email formato válido

**Given** um usuário com login Google
**When** visualiza o perfil
**Then** a seção de senha não é exibida (não aplicável para OAuth)

### Story 2.5: Exportação & Exclusão de Dados (RGPD)

As a **user**,
I want **to export or delete my personal data**,
So that **I can exercise my RGPD rights**.

**Acceptance Criteria:**

**Given** um usuário autenticado acessa `/settings`
**When** clica em "Exporter mes données"
**Then** a API `/api/user/data-export` gera um JSON com todos os dados do usuário (perfil, conversas anonimizadas, assinaturas) e inicia o download

**Given** um usuário autenticado acessa `/settings`
**When** clica em "Supprimer mon compte"
**Then** um Dialog de confirmação é exibido com aviso sobre irreversibilidade
**And** ao confirmar, a API `/api/user/data-delete` anonimiza conversas, remove dados pessoais e invalida a sessão
**And** o usuário é redirecionado para a landing page com toast "Votre compte a été supprimé"

**And** as APIs user/data-export e user/data-delete verificam ownership (self-only check)
**And** conformidade NFR11 (RGPD: exportação e exclusão de dados)

---

## Epic 3: Assinatura & Sistema de Pagamentos

Usuários podem assinar especialistas, gerenciar pagamentos e resolver falhas — o fluxo completo de monetização funciona.

### Story 3.1: Checkout & Criação de Assinatura Stripe

As a **authenticated user**,
I want **to subscribe to an AI specialist via Stripe Checkout**,
So that **I can start using the specialist's AI chat service**.

**Acceptance Criteria:**

**Given** um usuário autenticado clica no CTA de um especialista
**When** é redirecionado para o Stripe Checkout
**Then** o checkout exibe o plano do especialista (~99€/mês) com informações claras
**And** após pagamento bem-sucedido, o usuário é redirecionado para o chat do especialista
**And** o modelo Subscription é criado no Prisma com campos: id, userId, specialistId, stripeSubscriptionId, stripeCustomerId, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd
**And** o redirecionamento do checkout completa em menos de 3 segundos (NFR5)

**Given** um novo usuário que acabou de criar conta (FR4)
**When** completa o registro
**Then** é redirecionado automaticamente para o fluxo de assinatura do especialista selecionado

**Given** um usuário cancela o checkout
**When** clica em voltar
**Then** retorna à página do especialista sem alterações na conta

**And** Stripe Connect está configurado com comissão de 25% sobre cada transação (FR17)
**And** dados de pagamento processados exclusivamente via Stripe, nunca armazenados localmente (NFR9)

### Story 3.2: Webhooks Stripe & Gestão de Estado de Assinatura

As a **system**,
I want **to process Stripe webhook events reliably**,
So that **subscription states are always synchronized between Stripe and the platform**.

**Acceptance Criteria:**

**Given** o Stripe envia um webhook `checkout.session.completed`
**When** o handler processa o evento
**Then** a Subscription é criada/atualizada no banco com status `active`

**Given** o Stripe envia um webhook `invoice.paid`
**When** o handler processa o evento
**Then** a Subscription é renovada com novo `currentPeriodEnd` (FR12)

**Given** o Stripe envia um webhook `invoice.payment_failed`
**When** o handler processa o evento
**Then** a Subscription é marcada como `past_due` (FR13)
**And** o período de graça é iniciado (FR14)

**Given** o Stripe envia um webhook `customer.subscription.deleted`
**When** o handler processa o evento
**Then** a Subscription é marcada como `canceled`

**And** o endpoint `/api/webhooks/stripe` verifica a assinatura do webhook via `stripe.webhooks.constructEvent()`
**And** idempotência garantida via `event.id` (NFR18)
**And** webhooks processados com retry automático em caso de falha

### Story 3.3: Subscription Gating & Controle de Acesso

As a **system**,
I want **to control access based on subscription status**,
So that **only active subscribers can access the AI chat**.

**Acceptance Criteria:**

**Given** um usuário com assinatura `active` acessa `/chat`
**When** a página carrega
**Then** o chat é exibido normalmente

**Given** um usuário com assinatura `past_due` acessa `/chat`
**When** a página carrega
**Then** o chat é acessível (período de graça ativo) com PaymentBanner no topo alertando sobre a falha (FR14)

**Given** um usuário com assinatura `canceled` ou sem assinatura acessa `/chat`
**When** a página carrega
**Then** o acesso ao chat é bloqueado (FR15)
**And** é exibida mensagem com CTA para assinar/reativar

**Given** o período de graça expira sem pagamento
**When** o sistema verifica o status
**Then** o acesso ao chat é bloqueado automaticamente (FR15)

**And** subscription gating implementado via middleware no route group (dashboard)
**And** Zustand subscription-store mantém cache client-side do status da assinatura

### Story 3.4: Gestão de Pagamento & Portal Stripe

As a **subscriber**,
I want **to manage my payment method and subscription**,
So that **I can update my card, resolve payment failures, or cancel my plan**.

**Acceptance Criteria:**

**Given** um assinante acessa `/billing`
**When** a página carrega
**Then** o status da assinatura é exibido (ativa, pendente, cancelada)
**And** a data de próxima renovação é visível
**And** o método de pagamento atual é mostrado (últimos 4 dígitos do cartão)

**Given** um assinante clica em "Gérer le paiement"
**When** o portal Stripe abre
**Then** o usuário pode atualizar seu método de pagamento via portal Stripe integrado (FR8, FR16)

**Given** um assinante com pagamento falho
**When** acessa `/billing`
**Then** o PaymentBanner é exibido com CTA "Mettre à jour le paiement" direcionando ao portal Stripe

**Given** um assinante clica em "Annuler l'abonnement"
**When** confirma a ação via Dialog
**Then** a assinatura é marcada para cancelamento no fim do período atual (cancelAtPeriodEnd = true) (FR9)
**And** o acesso permanece ativo até o fim do período pago

### Story 3.5: Página de Pricing

As a **visitor**,
I want **to see clear pricing information**,
So that **I can understand the cost before creating an account**.

**Acceptance Criteria:**

**Given** um visitante acessa `/pricing`
**When** a página carrega
**Then** o plano de assinatura é exibido: ~99€/mês por especialista
**And** os benefícios incluídos estão listados (acesso 24/7, perguntas ilimitadas dentro do limite diário, histórico de conversas)
**And** CTA "Commencer" redireciona para signup
**And** FAQ sobre pagamento, cancelamento e reembolso está disponível
**And** a página é renderizada via SSR para SEO

---

## Epic 4: Chat IA & Interação com Especialista

Usuários assinantes podem ter conversas significativas com especialistas IA — o core do produto funciona.

### Story 4.1: Interface de Chat & Envio de Mensagens

As a **subscriber**,
I want **to open a chat interface and send messages to my AI specialist**,
So that **I can start conversations and receive guidance**.

**Acceptance Criteria:**

**Given** um assinante acessa `/chat`
**When** a página carrega
**Then** o layout dashboard é exibido com sidebar colapsável (280px) à esquerda e área de chat à direita
**And** a sidebar mostra o avatar do especialista e botão "+ Nouvelle conversation"
**And** ao iniciar nova conversa, uma welcome message do especialista é exibida com 3 quick prompts clicáveis (QuickPrompt components)

**Given** um assinante digita uma mensagem no chat input
**When** pressiona Enter ou clica no botão enviar
**Then** a mensagem é exibida como ChatMessage (bolha azul, alinhada à direita, com avatar do usuário e timestamp)
**And** o StreamingIndicator é exibido (avatar do especialista + 3 dots animados)
**And** o chat auto-scroll para a última mensagem

**And** o modelo Conversation existe no Prisma com campos: id, title, userId, specialistId, createdAt, updatedAt, isDeleted
**And** o modelo Message existe no Prisma com campos: id, conversationId, role (user/assistant), content, createdAt
**And** o chat input é auto-expanding (1-4 linhas), com Shift+Enter para nova linha
**And** focus automático no input ao abrir o chat
**And** placeholder contextual: "Posez votre question au spécialiste..."
**And** layout responsivo: sidebar overlay no mobile, sidebar fixa no desktop

### Story 4.2: Streaming SSE & Integração N8N

As a **subscriber**,
I want **to see AI responses appear word by word in real-time**,
So that **I have a fluid, engaging conversation experience like talking to a real consultant**.

**Acceptance Criteria:**

**Given** um assinante envia uma mensagem
**When** o servidor processa via `/api/chat/stream`
**Then** a resposta da IA é exibida em streaming palavra por palavra via SSE (FR20)
**And** o primeiro token aparece em menos de 5 segundos (NFR1)
**And** o StreamingIndicator transiciona para ChatMessage quando o streaming começa
**And** a mensagem completa é persistida no banco de dados após o stream finalizar

**Given** o N8N não responde dentro do timeout configurável
**When** o timeout é atingido
**Then** uma mensagem de erro amigável é exibida: "Le spécialiste est temporairement indisponible. Veuillez réessayer."
**And** o erro é logado via Sentry (NFR19)

**Given** múltiplos usuários enviam mensagens simultaneamente
**When** o sistema processa as requisições
**Then** até 100 streams simultâneos são suportados (NFR15)

**And** a rota `/api/chat/stream` implementa: auth check → rate limit check → subscription check → Zod validation → N8N webhook call → ReadableStream SSE proxy
**And** o hook `useStreaming` gerencia a conexão EventSource no client
**And** Zustand `useChatStore` atualiza messages token por token
**And** o `lib/n8n.ts` encapsula a comunicação com N8N (webhook URL, headers, timeout)
**And** circuit breaker implementado para evitar cascata de falhas (NFR21)

### Story 4.3: Histórico de Conversas & Sidebar

As a **subscriber**,
I want **to view my conversation history and switch between conversations**,
So that **I can continue previous discussions and access accumulated context**.

**Acceptance Criteria:**

**Given** um assinante com conversas anteriores acessa `/chat`
**When** a sidebar carrega
**Then** as conversas são listadas em ordem cronológica reversa (mais recente primeiro)
**And** cada item mostra título auto-gerado e data
**And** o histórico carrega em menos de 1 segundo (NFR4)

**Given** um assinante clica em uma conversa na sidebar
**When** a conversa é selecionada
**Then** todas as mensagens da conversa são exibidas na área de chat (`/chat/[conversationId]`)
**And** o scroll posiciona na última mensagem

**Given** um assinante clica em "+ Nouvelle conversation" (FR22)
**When** a nova conversa é criada
**Then** o chat abre limpo com welcome message e quick prompts
**And** a conversa anterior permanece no histórico da sidebar

**Given** um assinante busca no histórico (Ctrl+K)
**When** digita um termo de busca
**Then** as conversas são filtradas por título ou conteúdo

**And** API `/api/conversations` (GET: lista, POST: criar) com paginação
**And** API `/api/conversations/[conversationId]` (GET: detalhes com mensagens)
**And** infinite scroll para histórico longo na sidebar
**And** SWR para data fetching com revalidação automática
**And** conversas armazenadas com soft delete (isDeleted flag) para RGPD

### Story 4.4: Controle de Escopo, Disclaimers & Rate Limiting

As a **subscriber**,
I want **the AI to stay within its expertise domain and show appropriate disclaimers**,
So that **I receive trustworthy guidance and understand the service's limitations**.

**Acceptance Criteria:**

**Given** um assinante faz uma pergunta dentro do domínio do especialista
**When** a IA responde
**Then** a resposta é contextualizada e dentro do escopo de expertise (FR24)
**And** a IA faz perguntas de contexto antes de fornecer orientação (FR19)

**Given** um assinante faz uma pergunta fora do escopo (ex: questão fiscal para especialista de gestão)
**When** a IA detecta o desvio
**Then** responde educadamente redirecionando: "Cette question concerne un domaine en dehors de mon expertise..." (FR25)
**And** sugere consultar profissional humano adequado (FR27)
**And** oferece quick prompts dentro do escopo para continuar a conversa

**Given** qualquer interação no chat
**When** mensagens são exibidas
**Then** o DisclaimerBanner é visível na base do chat: "Je suis une IA spécialisée et ne remplace pas un professionnel certifié." (FR26)

**Given** um assinante atinge 90% do limite diário
**When** o UsageMeter atualiza
**Then** o indicador muda para amarelo/warning com contagem "X/100 messages aujourd'hui"

**Given** um assinante atinge 100 requisições no dia (FR23)
**When** tenta enviar nova mensagem
**Then** uma mensagem informativa é exibida: "Vous avez atteint la limite quotidienne. Revenez demain!"
**And** o input é desabilitado até o reset (meia-noite UTC)

**And** rate limiting implementado no middleware via in-memory Map por userId
**And** contagem de mensagens armazenada por dia no banco (ou cache)

### Story 4.5: Armazenamento Anônimo & Conformidade RGPD do Chat

As a **subscriber**,
I want **my conversations stored anonymously**,
So that **my personal data is protected in compliance with RGPD**.

**Acceptance Criteria:**

**Given** uma mensagem é enviada no chat
**When** o sistema persiste a mensagem
**Then** o conteúdo é armazenado sem dados pessoais identificáveis no campo de conteúdo (FR28, NFR10)
**And** a associação user ↔ conversa existe via foreign key mas o conteúdo em si não contém PII

**Given** um usuário solicita exclusão de dados (via Story 2.5)
**When** o processo de exclusão executa
**Then** as conversas são anonimizadas (userId removido) mas o conteúdo pode ser mantido para análise agregada
**And** ou deletadas completamente conforme preferência do usuário

**Given** as conversas são armazenadas
**When** o sistema persiste dados
**Then** soft delete é implementado (isDeleted flag) permitindo anonimização vs exclusão permanente
**And** timestamps createdAt/updatedAt estão presentes em Conversation e Message
**And** índices em userId, specialistId, conversationId, createdAt para queries de analytics

---

## Epic 5: Painel Administrativo & Gestão de Agentes

Admins podem gerenciar a plataforma completa — agentes, usuários, assinaturas e métricas.

### Story 5.1: Layout Admin & Dashboard de Métricas

As a **admin**,
I want **to access an admin dashboard with key platform metrics**,
So that **I can monitor the health and performance of the platform at a glance**.

**Acceptance Criteria:**

**Given** um admin autenticado acessa `/admin/dashboard`
**When** a página carrega
**Then** o layout admin é exibido com sidebar fixa (240px) contendo: Dashboard, Agentes, Usuários, Analytics, Config
**And** o dashboard exibe MetricsCards com: assinantes ativos, mensagens/dia, receita mensal, taxa de retenção (FR34)
**And** cada MetricsCard mostra ícone, label, valor e trend (seta + %)

**Given** um usuário sem role ADMIN tenta acessar `/admin/*`
**When** a rota é requisitada
**Then** o middleware redireciona para `/chat` com erro 403 FORBIDDEN (NFR13)

**And** layout admin com breadcrumbs navegáveis
**And** APIs `/api/admin/analytics` com queries agregadas no Prisma
**And** SWR para data fetching com revalidação
**And** skeleton loading states nos MetricsCards

### Story 5.2: Gestão de Agentes Especialistas

As a **admin**,
I want **to create, edit, and manage AI specialist agents**,
So that **I can control which specialists are available on the platform and how they behave**.

**Acceptance Criteria:**

**Given** um admin acessa a seção de Agentes
**When** clica em "Créer un agent"
**Then** um formulário é exibido com campos: nome, domínio, slug, descrição, preço, cor de acento, tags, quick prompts (FR29)
**And** ao submeter, o agente é criado no banco e aparece na lista

**Given** um admin seleciona um agente existente
**When** acessa a página de edição
**Then** pode modificar todos os campos do agente (FR33)
**And** pode fazer upload de materiais para a base de conhecimento (documentos, PDFs) (FR30)
**And** pode configurar os limites de escopo e system prompt do agente (FR31)

**Given** um admin quer controlar a visibilidade de um agente
**When** clica no toggle de ativar/desativar
**Then** o agente é ativado ou desativado no catálogo público (FR32)
**And** agentes desativados não aparecem na landing page nem estão disponíveis para novas assinaturas

**And** validação Zod em todos os campos do formulário
**And** upload de arquivos com limite de tamanho e tipos aceitos (PDF, TXT, DOCX)
**And** server actions para CRUD de agentes com role ADMIN check

### Story 5.3: Gestão de Usuários & Assinaturas

As a **admin**,
I want **to view and manage platform users and their subscriptions**,
So that **I can provide support and resolve account issues**.

**Acceptance Criteria:**

**Given** um admin acessa a seção de Usuários
**When** a lista carrega
**Then** os usuários são exibidos em tabela com: nome, email, data de criação, status da assinatura (FR35)
**And** busca por nome ou email funciona com filtragem em tempo real

**Given** um admin clica em um usuário
**When** os detalhes são exibidos
**Then** mostra informações do perfil, histórico de assinaturas, status do pagamento e contagem de mensagens (FR36)

**Given** um admin identifica problema de pagamento de um usuário
**When** acessa os detalhes de assinatura
**Then** pode visualizar o status Stripe e tomar ações corretivas (reenviar link de pagamento, estender período de graça) (FR37)

**And** API `/api/admin/conversations` para listar conversas de qualquer usuário
**And** paginação na tabela de usuários (limit 20, offset)
**And** todas as APIs admin verificam role ADMIN

### Story 5.4: Métricas de Uso por Agente

As a **admin**,
I want **to view usage metrics per specialist agent**,
So that **I can evaluate agent performance and make data-driven decisions**.

**Acceptance Criteria:**

**Given** um admin acessa a seção de Analytics
**When** seleciona um agente específico
**Then** métricas detalhadas são exibidas: total de mensagens, mensagens/dia, assinantes ativos, taxa de retenção, conversas/semana (FR38)

**Given** um admin quer comparar agentes
**When** visualiza o analytics geral
**Then** uma tabela comparativa mostra todos os agentes com métricas chave lado a lado

**Given** um admin quer analisar tendências
**When** seleciona um período (7 dias, 30 dias, 90 dias)
**Then** os gráficos e métricas se atualizam para o período selecionado

**And** queries agregadas otimizadas com índices em createdAt, specialistId
**And** dados cacheados via `unstable_cache` para queries frequentes
**And** loading skeleton durante carregamento de dados

---

## Epic 6: Notificações & Comunicação

Usuários recebem emails transacionais relevantes sobre conta e pagamentos — a comunicação do sistema é profissional e confiável.

### Story 6.1: Infraestrutura de Email Transacional

As a **system**,
I want **to have a reliable email sending infrastructure**,
So that **all transactional emails are delivered consistently and professionally**.

**Acceptance Criteria:**

**Given** o sistema precisa enviar um email transacional
**When** a função `lib/email.ts` é chamada com tipo, destinatário e variáveis
**Then** o email é enviado via Resend (ou serviço configurado) com template HTML responsivo
**And** todos os emails usam o domínio verificado da plataforma
**And** o remetente é consistente: "ultra-ia <noreply@ultra-ia.com>"

**Given** o envio de um email falha
**When** o serviço de email retorna erro
**Then** o sistema faz retry automático (até 3 tentativas com backoff exponencial)
**And** o erro é logado via Sentry para monitoramento (NFR19)

**Given** qualquer email é enviado
**When** o destinatário recebe
**Then** o email contém header, footer com logo, e link de unsubscribe conforme RGPD (NFR11)
**And** o conteúdo é em francês, consistente com a interface da plataforma

**And** `lib/email.ts` exporta função genérica `sendEmail({ to, template, variables })` reutilizável
**And** templates definidos como constantes tipadas com Zod validation nas variáveis

### Story 6.2: Emails Transacionais de Conta & Pagamento

As a **user**,
I want **to receive email notifications about important account and payment events**,
So that **I stay informed about my subscription status and can take action when needed**.

**Acceptance Criteria:**

**Given** um novo usuário completa o registro
**When** a conta é criada
**Then** um email de boas-vindas é enviado com: saudação personalizada, próximos passos, link para o dashboard (FR39)

**Given** um usuário completa o checkout e a assinatura é ativada
**When** o webhook `checkout.session.completed` é processado (Story 3.2)
**Then** um email de confirmação de assinatura é enviado com: nome do especialista, valor, data de próxima cobrança, link para o chat (FR40)

**Given** o pagamento de renovação de um assinante falha
**When** o webhook `invoice.payment_failed` é processado (Story 3.2)
**Then** um email de alerta é enviado com: explicação da falha, prazo do período de graça, CTA "Mettre à jour le paiement" linkando para `/billing` (FR41)

**Given** um assinante atualiza seu método de pagamento com sucesso
**When** o pagamento pendente é cobrado
**Then** um email de confirmação é enviado com: confirmação do pagamento, próxima data de cobrança, link para o chat (FR42)

**And** todos os emails são disparados via server actions ou webhook handlers existentes (não cron jobs)
**And** cada template usa variáveis tipadas (userName, specialistName, amount, nextBillingDate, etc.)
**And** conformidade RGPD: emails incluem link de gestão de preferências
