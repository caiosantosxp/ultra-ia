---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['product-brief-ultra-ia-2026-03-09.md']
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
workflowType: 'prd'
classification:
  projectType: web_app_saas
  domain: general_ai
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - ultra-ia

**Author:** Vinicius
**Date:** 2026-03-10

## Executive Summary

O ultra-ia é uma plataforma SaaS que oferece agentes de IA treinados como especialistas verticais, vendidos por assinatura mensal (~100€) a consumidores finais no mercado francês e europeu. O produto resolve o gap entre consultorias tradicionais caras (150-500€/hora) e ferramentas de IA genéricas como ChatGPT, que carecem de profundidade e metodologia em domínios específicos.

O público-alvo são empreendedores individuais, gestores de PMEs e profissionais que precisam de orientação especializada contínua mas não têm orçamento para consultores tradicionais. O primeiro nicho é mentoria em gestão empresarial, com expansão planejada para outros domínios.

A plataforma é construída com Next.js (full-stack), N8N para orquestração de IA, PostgreSQL, e integração Stripe Connect com modelo de comissão de 25%. Os agentes utilizam GPT 5.2 para respostas e Claude para assimilação de conteúdo de treinamento, com conformidade RGPD para o mercado europeu.

### What Makes This Special

- **IA que desafia antes de responder:** Diferente de chatbots genéricos, cada agente faz perguntas de contexto antes de fornecer orientação — simulando o comportamento de um consultor real que primeiro entende a situação
- **Especialização vertical rigorosa:** Cada agente se mantém estritamente dentro do seu domínio de expertise, recusando responder fora do escopo e redirecionando para profissionais humanos em decisões sensíveis (jurídicas, fiscais)
- **Posicionamento premium intencional:** O preço de ~100€/mês funciona como barreira qualificadora, atraindo profissionais comprometidos que valorizam orientação de qualidade
- **Disclaimer e responsabilidade:** Toda interação inclui aviso de que a IA não substitui profissionais certificados, protegendo legalmente a plataforma e estabelecendo confiança
- **Limite de uso controlado:** ~100 requisições/dia (média 25 mensagens/dia por usuário) mantém qualidade das respostas e controla custos operacionais

## Project Classification

- **Tipo de Projeto:** Web Application SaaS — aplicação web full-stack com interface de chat em tempo real e modelo de assinatura
- **Domínio:** IA/General — marketplace de especialistas IA para consumidores finais, sem regulamentação setorial específica
- **Complexidade:** Média — integração com múltiplos modelos de IA, processamento de pagamentos, conformidade RGPD, prompt engineering para controle de alucinações
- **Contexto:** Greenfield — produto novo construído do zero, inspirado no modelo Chatify.fr

## Success Criteria

### User Success

- **Orientação de valor real:** Usuários obtêm respostas contextualizadas que antes exigiriam consultor a 150-500€/hora, por ~100€/mês
- **Experiência de consultor:** O agente faz perguntas de contexto antes de responder, gerando momento "aha!" quando o usuário percebe que a IA entendeu sua situação
- **Confiança e segurança:** Disclaimers claros e redirecionamento para profissionais humanos em decisões sensíveis geram confiança no serviço
- **Retorno recorrente:** Usuários voltam regularmente ao longo do mês, indicando valor contínuo (não consulta única)

### Business Success

- **Primeiros 3 meses:** Validar que assinantes retornam após o primeiro mês + aquisição inicial de assinantes pagantes
- **3-6 meses:** Crescimento orgânico de assinantes, taxa de churn inferior à média SaaS (~5% mensal), receita recorrente previsível
- **6-12 meses:** Expansão para novos nichos de especialidade, comissão de 25% via Stripe Connect sustentando operação
- **Métrica norte-star:** Taxa de renovação mensal (retenção pós-mês 3 como ponto crítico)

### Technical Success

- **Performance:** Tempo de resposta da IA inferior a 5 segundos
- **Qualidade da IA:** Taxa de satisfação do usuário com respostas + taxa de renovação como proxy de qualidade
- **Controle de alucinações:** Agente se mantém dentro do escopo treinado, recusa responder fora do domínio
- **Conformidade RGPD:** Conversas armazenadas de forma anônima, dados pessoais protegidos
- **Disponibilidade:** Sistema estável com limites de 100 req/dia por usuário

### Measurable Outcomes

| Métrica | Indicador | Alvo MVP |
|---------|-----------|----------|
| Retenção mês 1→2 | % usuários que renovam | A definir após lançamento |
| Retenção mês 3 | % usuários ativos no mês 3 | Ponto crítico a monitorar |
| Mensagens/dia/usuário | Média de uso diário | ~25 mensagens |
| Tempo de resposta | Latência da IA | < 5 segundos |
| Satisfação | Feedback do usuário | Qualitativo inicialmente |
| Churn mensal | % cancelamentos | < 5% (objetivo) |

## User Journeys

### Jornada 1: Pierre — O Solopreneur que Precisa de Orientação (Caminho Feliz)

**Cena de abertura:** Pierre, 45 anos, gere sozinho sua micro-empresa de consultoria em Lyon. Faturamento estagnado há 6 meses, ele sabe que precisa reestruturar sua estratégia comercial mas não tem orçamento para um consultor (mínimo 200€/hora). Pesquisa no Google "mentor gestão empresarial IA" e encontra o ultra-ia.

**Ação crescente:** Pierre acessa a landing page, vê o especialista em gestão empresarial. O preço de 99€/mês o faz hesitar — mas compara com uma única hora de consultor. Cria conta com Google OAuth, assina via Stripe, e inicia sua primeira conversa.

**Clímax:** Pierre digita "preciso aumentar meu faturamento". Em vez de uma resposta genérica, o agente pergunta: "Qual é o seu faturamento atual? Quantos clientes ativos você tem? Qual o seu ticket médio?" Pierre percebe que está diante de algo diferente — a IA está tentando entender sua situação real antes de aconselhar.

**Resolução:** Após 3 semanas de conversas regulares (~5 por semana), Pierre implementou um reajuste de preços e uma estratégia de upsell sugerida pelo agente. Renova a assinatura sem hesitar. O ultra-ia se tornou seu "consultor de bolso".

### Jornada 2: Marie — A Gestora de PME com Decisão Urgente (Caminho Feliz)

**Cena de abertura:** Marie, 38 anos, dirige uma PME de 15 funcionários em Paris. Um cliente importante quer renegociar contrato e ela precisa de orientação sobre posicionamento estratégico — agora, não daqui a 2 semanas quando seu consultor tiver agenda.

**Ação crescente:** Marie já é assinante há 2 meses. Abre o ultra-ia no navegador, inicia uma conversa com o especialista em gestão. Descreve a situação do cliente e as condições propostas.

**Clímax:** O agente faz perguntas sobre margem atual, dependência desse cliente no faturamento, e alternativas disponíveis. Marie percebe que nunca tinha calculado o impacto real de perder esse cliente — o agente a ajuda a ver o quadro completo antes de decidir.

**Resolução:** Marie negocia com confiança, mantém o cliente com ajuste de 5% (em vez dos 15% pedidos). Passa a usar o agente semanalmente para decisões estratégicas. No mês 3, continua ativa.

### Jornada 3: Pierre — Pergunta Fora do Escopo (Edge Case)

**Cena de abertura:** Pierre está satisfeito com o agente de gestão e decide perguntar sobre questões fiscais da sua empresa.

**Ação crescente:** Pierre pergunta: "Como declaro o IVA trimestral da minha micro-empresa?" O agente detecta que a pergunta está fora do domínio de gestão empresarial e entra no protocolo de redirecionamento.

**Clímax:** O agente responde: "Essa questão envolve aspectos fiscais específicos que estão fora da minha área de especialidade. Para orientação fiscal precisa, recomendo consultar um contabilista certificado. ⚠️ Lembre-se: sou uma IA especialista em gestão empresarial e não substituo profissionais certificados em áreas regulamentadas."

**Resolução:** Pierre entende os limites do serviço. Volta a usar o agente para gestão e aprecia a honestidade — aumenta sua confiança na qualidade das respostas dentro do escopo.

### Jornada 4: Admin — Gestão da Plataforma (Equipe Interna)

**Cena de abertura:** A equipe admin precisa configurar um novo agente especialista (nicho: marketing digital) e monitorar a saúde da plataforma.

**Ação crescente:** O admin acessa o painel, vê o dashboard com métricas: total de assinantes ativos, mensagens/dia, receita mensal, taxa de renovação. Identifica que o agente de gestão tem 85% de retenção no mês 2.

**Clímax:** Através do painel, o admin cria o novo agente, configura a base de conhecimento via upload de materiais do especialista, define os limites de escopo e ativa o agente no catálogo.

**Resolução:** O novo especialista fica disponível na landing page. O admin monitora os primeiros dias de uso, verifica a qualidade das respostas e ajusta prompts se necessário. Gerencia assinaturas e resolve eventuais problemas de pagamento pelo painel.

### Jornada 5: Usuário — Falha de Pagamento (Edge Case Técnico)

**Cena de abertura:** A assinatura de Marie tenta renovar automaticamente mas o cartão foi recusado pelo banco.

**Ação crescente:** O Stripe detecta a falha e notifica o sistema. Marie recebe um email informando que seu pagamento falhou e que precisa atualizar seu método de pagamento.

**Clímax:** Marie acessa sua conta, vê um aviso no topo da interface indicando o problema. Atualiza os dados do cartão via portal Stripe integrado.

**Resolução:** O pagamento é processado com sucesso. O acesso de Marie nunca foi interrompido durante o período de graça. Se não atualizar em X dias, o acesso ao chat é bloqueado mas a conta permanece ativa.

### Journey Requirements Summary

| Jornada | Capacidades Reveladas |
|---------|----------------------|
| Pierre (feliz) | Landing page, catálogo, OAuth, Stripe checkout, chat IA, perguntas de contexto, resposta < 5s |
| Marie (feliz) | Acesso rápido para assinantes, histórico de conversas, orientação contextualizada |
| Pierre (edge case) | Detecção de escopo, redirecionamento educado, disclaimer, manutenção de confiança |
| Admin | Dashboard métricas, gestão agentes, upload base conhecimento, config prompts, gestão assinaturas |
| Pagamento (edge case) | Webhook Stripe, email notificação, período de graça, atualização método pagamento, bloqueio gracioso |

## Technical Requirements

### Project-Type Overview

O ultra-ia é uma aplicação web SaaS construída com Next.js em arquitetura híbrida:
- **SSR (Server-Side Rendering)** para landing page e páginas de catálogo — otimizadas para SEO e aquisição orgânica
- **SPA (Single Page Application)** para a área logada — chat, dashboard, painel admin com navegação client-side fluida

### Technical Architecture Considerations

**Renderização e Performance:**
- Next.js App Router com SSR para páginas públicas (landing, catálogo de especialistas)
- Client-side rendering para área autenticada (chat, configurações, admin)
- Streaming de respostas da IA em tempo real (palavra por palavra, similar ao ChatGPT)
- Tempo de resposta da IA: < 5 segundos para início do streaming

**Suporte a Navegadores:**
- Navegadores modernos: Chrome, Firefox, Safari, Edge (últimas 2 versões)
- Sem suporte a IE11 ou navegadores legados
- Design responsivo (desktop-first, com suporte mobile via browser)

**SEO:**
- Landing page otimizada para SEO (meta tags, structured data, sitemap)
- Páginas de catálogo de especialistas indexáveis
- Área autenticada não indexada (noindex)

**Acessibilidade:**
- WCAG 2.1 nível A (conformidade básica)
- Navegação por teclado, contraste adequado, alt text em imagens
- Labels em formulários e elementos interativos

### Modelo de Dados e Permissões

**Arquitetura:**
- Banco de dados único (PostgreSQL) — sem multi-tenancy complexo
- Dados de todos os agentes e usuários no mesmo schema
- Separação lógica por agente/especialista via foreign keys

**Modelo de Permissões (2 níveis):**
- **Usuário:** Acesso ao chat dos agentes assinados, perfil, histórico de conversas, gestão de pagamento
- **Admin:** Acesso completo — gestão de agentes, base de conhecimento, usuários, assinaturas, dashboard de métricas

**Assinatura:**
- Plano único por agente (~100€/mês) no MVP
- Cada assinatura dá acesso a um especialista específico
- Futuro: possibilidade de tiers (básico/premium) ou bundles de especialistas

### Implementation Considerations

**Stack Técnica Confirmada:**
- **Frontend/Backend:** Next.js (App Router, API Routes)
- **UI Components:** ShadCN (Tailwind CSS)
- **Autenticação:** NextAuth (email/senha + Google OAuth)
- **Banco de Dados:** PostgreSQL (Prisma ORM recomendado)
- **Pagamentos:** Stripe (Checkout, Subscriptions, Webhooks)
- **IA Orquestração:** N8N (workflows para chat com agentes)
- **Modelos IA:** GPT 5.2 (respostas) + Claude (treinamento/assimilação)

**Integrações Críticas:**
- Stripe Webhooks para eventos de pagamento (subscription.created, invoice.payment_failed, etc.)
- N8N API para orquestração de conversas com agentes IA
- Email transacional para notificações (pagamento, boas-vindas, recuperação)

**Chat em Streaming:**
- Server-Sent Events (SSE) ou WebSocket para streaming de respostas
- Buffer de resposta para exibição palavra por palavra
- Indicador visual de "agente digitando" durante processamento

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Validação de conceito — provar que profissionais franceses pagam ~100€/mês por um especialista IA vertical em gestão empresarial. O foco é aprendizado validado, não receita máxima.

**Resource Requirements:** Equipe pequena (2-4 pessoas). Stack moderna (Next.js + N8N) permite desenvolvimento rápido com poucos devs. O N8N será primeira experiência da equipe — prever curva de aprendizado na integração.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Pierre (solopreneur) — descoberta → assinatura → chat → valor
- Admin — gestão básica de agentes e usuários

**Must-Have Capabilities:**

| Feature | Justificativa |
|---------|--------------|
| Landing page com catálogo | Ponto de entrada + SEO |
| Auth (email/senha + Google) | Barreira mínima para signup |
| Stripe Checkout + Subscriptions | Receita = validação |
| Chat com streaming | Core do produto — experiência de consultor IA |
| Agente gestão empresarial | Primeiro nicho para validação |
| Painel Admin básico | Gestão de agentes, usuários, métricas essenciais |
| Disclaimers e limites de escopo | Proteção legal + confiança |
| Conformidade RGPD básica | Obrigatório para mercado europeu |

**Explicitamente fora do MVP:**
- Trial/freemium
- Múltiplos nichos de especialistas
- App mobile
- Integrações externas (WhatsApp, Telegram)
- Sistema de avaliação/reviews
- Analytics avançados

### Post-MVP Features

**Phase 2 — Growth (após validação):**
- Segundo e terceiro nichos de especialidade
- Analytics de uso e qualidade (dashboard admin avançado)
- Sistema de avaliação de especialistas
- Onboarding otimizado baseado em dados do MVP
- Emails de retenção automatizados (mês 2-3)

**Phase 3 — Expansion:**
- Marketplace completo com múltiplos nichos
- App mobile (iOS/Android)
- Integrações: WhatsApp, Telegram, widget embeddable
- Expansão geográfica: Bélgica, Suíça, Canadá francófono
- Tiers de assinatura (básico/premium) ou bundles

### Risk Mitigation Strategy

**Technical Risks:**

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Primeira experiência com N8N | Alto — core do produto depende disso | Spike técnico antes do dev principal. PoC de chat streaming via N8N nos primeiros dias |
| Streaming IA (SSE/WebSocket) | Médio — UX crítica | Prototipar cedo. Fallback: resposta completa sem streaming |
| Controle de alucinações | Alto — confiança do produto | Investir em prompt engineering. Testes com cenários edge case antes do lançamento |
| Integração Stripe webhooks | Baixo — bem documentado | Seguir docs oficiais. Usar Stripe CLI para testes locais |

**Market Risks:**

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Usuários não renovam após mês 1 | Crítico | Monitorar uso nas primeiras semanas. Intervir com melhorias na IA se uso cair |
| Preço de 100€ alto demais | Alto | Se validação falhar, testar 49€ ou modelo por mensagem antes de pivotar |
| Nicho gestão empresarial fraco | Médio | Feedback dos primeiros usuários guia decisão de manter ou trocar nicho |

**Resource Risks:**

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Equipe pequena, muitas integrações | Alto | MVP enxuto. Priorizar chat + pagamento. Admin pode ser mínimo |
| Curva N8N + streaming | Médio | Alocar 1-2 semanas para PoC técnico antes do sprint principal |
| Manutenção da base de conhecimento | Baixo | Processo manual inicialmente, automatizar depois |

## Functional Requirements

### User Discovery & Onboarding

- FR1: Visitantes podem visualizar a landing page com proposta de valor e catálogo de especialistas IA disponíveis
- FR2: Visitantes podem ver detalhes de cada especialista (domínio, descrição, preço) antes de criar conta
- FR3: Visitantes podem criar conta usando email/senha ou Google OAuth
- FR4: Novos usuários são redirecionados para o fluxo de assinatura após criação de conta

### Authentication & Account Management

- FR5: Usuários podem fazer login com email/senha ou Google OAuth
- FR6: Usuários podem redefinir sua senha via email
- FR7: Usuários podem visualizar e editar seu perfil (nome, email)
- FR8: Usuários podem gerenciar seu método de pagamento
- FR9: Usuários podem cancelar sua assinatura
- FR10: Usuários podem fazer logout

### Subscription & Payments

- FR11: Usuários podem assinar um especialista IA via checkout Stripe
- FR12: O sistema processa renovações automáticas mensais via Stripe
- FR13: O sistema detecta falhas de pagamento e notifica o usuário
- FR14: Usuários com pagamento falho mantêm acesso durante período de graça
- FR15: O sistema bloqueia acesso ao chat após expiração do período de graça sem pagamento
- FR16: Usuários podem atualizar método de pagamento para resolver falhas
- FR17: O sistema aplica comissão de 25% sobre cada transação via Stripe Connect

### AI Specialist Chat

- FR18: Usuários assinantes podem iniciar uma conversa com seu especialista IA
- FR19: O agente IA faz perguntas de contexto antes de fornecer orientação
- FR20: As respostas da IA são exibidas em streaming (palavra por palavra)
- FR21: Usuários podem visualizar o histórico de suas conversas anteriores
- FR22: Usuários podem iniciar novas conversas mantendo o histórico das anteriores
- FR23: O sistema limita o uso a 100 requisições por dia por usuário

### AI Knowledge & Behavior Control

- FR24: O agente IA se mantém dentro do domínio de expertise treinado
- FR25: O agente IA redireciona educadamente quando detecta pergunta fora do escopo
- FR26: Toda interação inclui disclaimer informando que a IA não substitui profissionais certificados
- FR27: O agente IA redireciona para profissionais humanos em decisões sensíveis (jurídicas, fiscais)
- FR28: As conversas são armazenadas de forma anônima em conformidade com RGPD

### Admin - Agent Management

- FR29: Admins podem criar novos agentes especialistas definindo nome, domínio e descrição
- FR30: Admins podem fazer upload de materiais para a base de conhecimento de um agente
- FR31: Admins podem configurar os limites de escopo e prompts de cada agente
- FR32: Admins podem ativar ou desativar agentes no catálogo público
- FR33: Admins podem editar informações de agentes existentes

### Admin - Platform Operations

- FR34: Admins podem visualizar dashboard com métricas (assinantes ativos, mensagens/dia, receita, retenção)
- FR35: Admins podem listar e pesquisar usuários da plataforma
- FR36: Admins podem visualizar detalhes de assinatura de cada usuário
- FR37: Admins podem resolver problemas de pagamento de usuários
- FR38: Admins podem visualizar métricas de uso por agente (mensagens, retenção, satisfação)

### Notifications & Communication

- FR39: O sistema envia email de boas-vindas após criação de conta
- FR40: O sistema envia email de confirmação de assinatura
- FR41: O sistema envia email de notificação quando pagamento falha
- FR42: O sistema envia email de confirmação quando pagamento é atualizado com sucesso

## Non-Functional Requirements

### Performance

- NFR1: O primeiro token da resposta da IA deve iniciar streaming em menos de 5 segundos após envio da mensagem
- NFR2: Páginas públicas (landing, catálogo) carregam em menos de 2 segundos (First Contentful Paint)
- NFR3: Navegação na área autenticada responde em menos de 500ms (transições de página)
- NFR4: O histórico de conversas carrega em menos de 1 segundo
- NFR5: O checkout Stripe completa o redirecionamento em menos de 3 segundos

### Security

- NFR6: Todas as comunicações utilizam HTTPS (TLS 1.2+)
- NFR7: Senhas armazenadas com hashing seguro (bcrypt ou equivalente)
- NFR8: Tokens de sessão expiram após período de inatividade
- NFR9: Dados de pagamento nunca são armazenados localmente — processados exclusivamente via Stripe
- NFR10: Conversas armazenadas de forma anônima (sem dados pessoais identificáveis no conteúdo)
- NFR11: Conformidade RGPD: usuários podem solicitar exportação e exclusão de seus dados
- NFR12: API routes protegidas por autenticação — sem acesso não autorizado a dados de outros usuários
- NFR13: Painel admin acessível apenas por usuários com role admin

### Scalability

- NFR14: Arquitetura suporta até 500 usuários simultâneos no MVP sem degradação
- NFR15: Sistema de chat suporta até 100 conversas simultâneas em streaming
- NFR16: Base de dados suporta crescimento para 10.000 usuários sem mudança de arquitetura
- NFR17: Integração N8N suporta processamento paralelo de múltiplas requisições

### Integration

- NFR18: Integração Stripe processa webhooks com retry automático em caso de falha
- NFR19: Comunicação com N8N possui timeout configurável e fallback em caso de indisponibilidade
- NFR20: Sistema de email transacional possui fila de retry para entregas falhadas
- NFR21: Integração com modelos IA (GPT 5.2) possui circuit breaker para evitar cascata de falhas
