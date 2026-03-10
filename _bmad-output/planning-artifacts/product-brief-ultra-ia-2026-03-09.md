---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - "documento para o projeto/Detalhe por imagem chatify.pdf"
  - "https://chatify.fr/ (web reference)"
  - "Transcrição de reunião com equipe Chatify (Paul Gee, Louis Bordeau)"
date: 2026-03-09
author: Vinicius
---

# Product Brief: ultra-ia

## Executive Summary

**ultra-ia** é uma plataforma SaaS que oferece agentes de inteligência artificial treinados como verdadeiros especialistas em nichos específicos de conhecimento. Enquanto ferramentas como ChatGPT entregam respostas genéricas e inconsistentes — podendo dar respostas diferentes para a mesma pergunta — cada agente do ultra-ia é treinado exclusivamente com bases de conhecimento curadas via workflows N8N, garantindo respostas consistentes, profundas e contextualizadas.

A IA não apenas responde: ela **desafia o usuário** com perguntas de contexto antes de dar orientação, replicando o comportamento de um consultor real que precisa entender a situação antes de aconselhar. Isso elimina a barreira social — usuários se sentem à vontade para fazer quantas perguntas quiserem, ir fundo nos problemas, sem a pressão de "parecer ignorante" que existe numa consultoria humana.

O modelo de receita é assinatura mensal por especialista, vendendo diretamente ao consumidor final. O timing é ideal: o mercado de IA conversacional está em expansão, consumidores já estão habituados a interagir com chatbots, e o custo de treinar modelos especializados está cada vez mais acessível.

---

## Core Vision

### Problem Statement

Profissionais e empreendedores que precisam de orientação especializada enfrentam um dilema sem solução adequada: pagar caro por consultorias humanas com agenda limitada, ou aceitar respostas genéricas e inconsistentes de ferramentas de IA que sabem "um pouco de tudo" mas não dominam nenhum assunto. Além disso, existe uma barreira psicológica — ninguém quer fazer 30 perguntas seguidas ao mesmo consultor e parecer incompetente. O resultado: as pessoas nunca vão fundo o suficiente nos seus problemas para realmente resolvê-los.

### Problem Impact

- Decisões de negócio baseadas em respostas genéricas que ignoram nuances do nicho
- Consultores cobram R$200-500/hora com disponibilidade limitada
- ChatGPT dá respostas diferentes para a mesma pergunta — zero consistência
- Barreira social impede que pessoas façam todas as perguntas necessárias a consultores humanos
- Cursos e conteúdo gravado não respondem ao contexto único de cada pessoa

### Why Existing Solutions Fall Short

| Solução Atual | Limitação Principal | O que falta |
|---|---|---|
| Consultores/Coaches | R$200-500/hora, agenda limitada | Acessibilidade 24/7 e escala |
| ChatGPT genérico | Respostas rasas e inconsistentes | Profundidade, consistência, especialização |
| Cursos online | Conteúdo estático e genérico | Interatividade e personalização |
| YouTube/Blogs | Fragmentado, qualidade inconsistente | Curadoria e respostas diretas |
| GPTs customizados | Sem interface dedicada, sem gestão | Experiência profissional completa |

### Proposed Solution

Uma plataforma web com interface profissional (Next.js + ShadCN) que disponibiliza agentes de IA especialistas. Cada agente é treinado via workflows N8N com bases de conhecimento específicas e curadas. O sistema é sustentado por PostgreSQL e autenticação via NextAuth (email/senha + Google).

**Comportamento da IA:**
- Desafia o usuário com perguntas de contexto antes de responder (qual sua indústria? como faz hoje?)
- Responde exclusivamente dentro do escopo do especialista — bloqueia temas fora do nicho
- Redireciona para profissional humano em decisões sensíveis
- Disclaimer transparente de que a IA pode cometer erros
- Consistência garantida: mesma pergunta = mesma resposta (diferente do ChatGPT)

**Experiência do usuário:**
- Página pública do especialista com banner, foto, bio e sugestões de perguntas
- Chat inteligente com histórico de conversas e busca
- Limite configurável de mensagens/dia (referência: 100/dia, média real: ~25)

**Painel administrativo:**
- Dashboard com métricas (conversas, mensagens, usuários únicos)
- Analytics detalhado (atividade 90 dias, sessões por país, atividade por hora)
- Gestão de conversas (anônimas por padrão, rastreáveis pelo admin)
- Sistema de leads com scoring por palavras-chave e mini CRM
- Hierarquia de acesso (admin vs usuário — cada usuário só vê suas conversas)
- Configurações de segurança e personalização

### Key Differentiators

1. **Especialização profunda vs Generalismo** — Cada agente treinado exclusivamente num nicho com base de conhecimento curada via N8N. Não é ChatGPT com prompt — é um sistema dedicado com respostas consistentes
2. **IA que desafia, não só responde** — Replica comportamento de consultor real fazendo perguntas de contexto antes de orientar, levando o usuário mais fundo na resolução do problema
3. **Zero barreira social** — Usuários fazem quantas perguntas quiserem sem constrangimento, indo ao fundo dos problemas — algo impossível com consultoria humana
4. **Consultoria 24/7 acessível** — Custo de assinatura mensal equivale a minutos de consultoria tradicional, disponível a qualquer hora
5. **Timing de mercado** — Posicionamento no espaço inexplorado entre IA genérica (gratuita mas rasa) e consultoria humana (profunda mas cara)

---

## Target Users

### Primary Users

#### Persona 1: Pierre — Solopreneur / Empreendedor Solo

- **Perfil:** Pierre, 34 anos, fundador de uma agência de marketing digital em Lyon. Fatura ~150K€/ano, trabalha sozinho.
- **Contexto:** Precisa tomar decisões estratégicas (contratar? investir? pivotar?) mas não tem sócios nem mentor. Orçamento limitado para coach executivo a 300-500€/hora.
- **Dor principal:** Isolamento nas decisões. ChatGPT dá respostas genéricas e inconsistentes. Grupos LinkedIn são superficiais. Precisa de profundidade e consistência.
- **Workaround atual:** YouTube, LinkedIn, sessões pontuais com consultores, masterminds presenciais mensais.
- **Momento de uso:** 22h, sozinho no escritório após o dia de trabalho. Abre o ultra-ia e pergunta "Comment structurer mon offre pour passer de freelance à agence ?" A IA faz perguntas de contexto antes de responder.
- **Motivação emocional:** Solidão do empreendedor solo. Quer se sentir ouvido e orientado sem julgamento.
- **Sucesso:** "Enfin quelqu'un qui comprend ma situation et qui me pousse à réfléchir plus loin"
- **Retenção:** No mês 3, a IA já conhece seu negócio, histórico de decisões e contexto — trocar para qualquer outra solução significaria recomeçar do zero.

#### Persona 2: Marie — Gestora de PME em crescimento

- **Perfil:** Marie, 42 anos, diretora geral de uma PME de 25 funcionários em Paris. Fatura ~2M€/ano.
- **Contexto:** Empresa crescendo rápido, problemas de gestão se acumulando — RH, processos, delegação, fluxo de caixa. Precisa de orientação constante, não pontual.
- **Dor principal:** Tem acesso a consultores mas não pode ligar a cada dúvida. Decisões se acumulam por falta de um "sparring partner" disponível.
- **Workaround atual:** Masterminds presenciais (1x/mês), consultores para projetos específicos, conteúdo americano adaptado à realidade francesa.
- **Momento de uso:** Terça-feira, 14h, entre duas reuniões — precisa decidir sobre um gerente que não performa. A IA faz perguntas de contexto e orienta com base em frameworks de gestão.
- **Motivação emocional:** Pressão de ser a pessoa que decide tudo. Quer um conselheiro silencioso, disponível, sem ego.
- **Sucesso:** "C'est comme avoir un directeur conseil disponible 24h/24 pour une fraction du prix"
- **Retenção:** Usa 3-4x por semana. A IA se torna parte do processo decisório da empresa.

### Secondary Users (Futuro)

- **Thomas (28 anos, primeira startup)** — Perfil de expansão futura com plano mais acessível. Grande potencial mas budget limitado no momento do lançamento.
- **Empresas (B2B)** — Compram acesso para equipes inteiras.
- **Especialistas parceiros** — Disponibilizam expertise na plataforma.

### User Journey

**1. Descoberta** → Pierre está scrollando o LinkedIn às 21h, cansado. Vê um anúncio com um exemplo de conversa real com a IA — a IA fazendo perguntas inteligentes, não só respondendo. Ele pensa "espera, isso é diferente..." e clica.

**2. Landing/Perfil** → Chega na página do especialista IA: banner profissional, credenciais, bio, frase de destaque e 3 sugestões clicáveis (ex: "Comment doubler mon CA en 12 mois ?").

**3. Primeiro contato (Trial)** → Pierre clica numa sugestão. A IA responde com perguntas de contexto: "Dans quel secteur es-tu ? Quel est ton CA actuel ?" — Nos primeiros 30 segundos, Pierre percebe que não é um chatbot genérico. Este é o momento mágico. 2-3 trocas gratuitas que precisam ser excepcionais.

**4. Conversão** → Após o trial, cadastro via email/senha ou Google (NextAuth) e assinatura do plano mensal de ~100€. Posicionamento premium intencional — filtra quem leva a sério.

**5. Uso recorrente** → Pierre usa 3-4x por semana. Histórico de conversas salvo e organizável. Média de ~25 mensagens/dia nos dias de uso.

**6. Momento "Aha!" (Semana 3)** → A IA referencia contexto de conversas anteriores e conecta dois problemas diferentes. Pierre pensa: "C'est mieux qu'un vrai consultant."

**7. Retenção (Mês 3+)** → O histórico acumulado de contexto torna a IA insubstituível — trocar significaria recomeçar do zero. O limite de mensagens/dia cria percepção de valor premium. **KPI alvo: >60% de retenção no mês 3.**

---

## Success Metrics

### User Success Metrics

| Métrica | Indicador | Como medir |
|---|---|---|
| **Engajamento ativo** | Usuário envia mensagens 3+ dias por semana | Frequência de uso semanal por usuário |
| **Profundidade da interação** | Média de 15+ mensagens por sessão de conversa | Contagem de mensagens por sessão |
| **Valor percebido** | Usuário renova assinatura no mês 2 | Taxa de renovação mensal |
| **Momento "Aha!"** | Usuário inicia nova conversa diferente dentro de 7 dias | Diversidade de temas por usuário |
| **Retenção crítica** | Usuário ativo no mês 3+ | Taxa de retenção no marco de 90 dias |
| **Trial → Conversão** | Usuário que fez trial converte em assinante | Taxa de conversão trial → pago |

### Business Objectives

**Curto prazo (0-3 meses):**
- Lançar primeiro especialista IA (gestão empresarial) com base de conhecimento completa
- Validar o modelo de assinatura a ~100€/mês com os primeiros assinantes pagantes
- Atingir taxa de conversão trial → pago funcional e mensurável
- Churn mensal abaixo de 15% (referência Chatify: 10-15%)

**Médio prazo (3-6 meses):**
- Expandir catálogo com novos especialistas em outros nichos
- Construir base de assinantes recorrentes com crescimento mensal consistente
- Otimizar o trial com base em dados reais de conversão
- Identificar os padrões de uso que predizem retenção de longo prazo

**Longo prazo (6-12 meses):**
- Múltiplos especialistas ativos com assinantes independentes
- Receita recorrente mensal (MRR) em crescimento sustentável
- Potencial abertura para modelo B2B (empresas comprando acesso para equipes)
- Explorar novos mercados francófonos (Bélgica, Suíça, Canadá)

### Key Performance Indicators

| KPI | Descrição | Referência de mercado |
|---|---|---|
| **MRR** | Receita recorrente mensal total | Acompanhar crescimento mês a mês |
| **Churn Rate** | % de assinantes que cancelam por mês | Alvo: <15% (ref. Chatify: 10-15%) |
| **Retenção M3** | % de assinantes ativos após 3 meses | Alvo: >60% |
| **Conversão Trial** | % de trials que viram assinantes | Benchmark SaaS: 5-15% |
| **DAU/MAU** | Razão usuários ativos diários vs mensais | Indicador de stickiness — alvo: >30% |
| **Msgs/Usuário/Dia** | Média de mensagens por usuário ativo por dia | Referência: ~25 (dados Chatify) |
| **Tempo até primeiro valor** | Tempo entre cadastro e momento "aha!" | Alvo: <7 dias |
| **LTV** | Receita total por assinante ao longo do tempo | LTV > 3x custo de aquisição |
| **NPS** | Net Promoter Score | Alvo: >40 |

**Métricas de vaidade a evitar:**
- Total de cadastros (sem considerar ativação)
- Page views da landing page (sem correlação com conversão)
- Total de mensagens brutas (sem contexto de qualidade)

---

## MVP Scope

### Core Features

**1. Autenticação e Gestão de Usuários**
- Cadastro e login via email/senha ou Google (NextAuth)
- Perfil do usuário com dados básicos
- Hierarquia de acesso: admin vs usuário final
- Cada usuário só visualiza suas próprias conversas

**2. Página Pública do Especialista IA**
- Banner com degradê, foto do especialista, nome, cargo e credenciais
- Bio/descrição e frase de destaque
- 3 sugestões de perguntas clicáveis para iniciar interação
- Contador de membros/assinantes
- Botão de CTA para cadastro/assinatura
- Interface em francês

**3. Chat Inteligente com IA (Core do produto)**
- Interface de chat limpa e minimalista (ShadCN)
- Integração com agente IA via N8N (primeiro nicho: gestão empresarial)
- IA desafia o usuário com perguntas de contexto antes de responder
- IA responde exclusivamente dentro do escopo do especialista
- IA redireciona para profissional humano em decisões sensíveis
- Disclaimer de que a IA pode cometer erros
- Histórico de conversas salvo e organizável por data
- Busca em conversas anteriores
- Botão "Nova conversa"
- Sidebar com lista de conversas anteriores (foto do especialista + título)
- Limite configurável de mensagens/dia (padrão: 100)

**4. Sistema de Pagamento**
- Integração Stripe para assinatura mensal (~100€/mês)
- Gestão de assinatura (ativar, cancelar, renovar)
- Controle de acesso baseado no status da assinatura
- Página de planos/pricing

**5. Painel Administrativo**
- **Dashboard:** Boas-vindas, contador de mensagens usadas/limite, métricas (conversas, mensagens trocadas, usuários únicos), gráfico de crescimento de assinantes
- **Conversas:** Lista de todas as conversas (anônimas por padrão), visualização detalhada de interações usuário-IA, busca e filtros, contagem de mensagens por conversa
- **Analytics:** Gráfico de atividade detalhada (90 dias), sessões por país (mapa-múndi), atividade por hora (gráfico de barras)
- **Leads:** Tabela com nome, contato, origem, tipo, score, status, última mensagem, objeções. Filtros (todos, novos). Busca. Import/export
- **Palavras-chave:** Lista de keywords com multiplicadores de pontuação, adição manual e automática (análise de página web), visualização de temas
- **Personalização:** Perfil do especialista (editar banner, foto, bio, primeira mensagem, sugestões de perguntas)
- **Segurança:** Mostrar/ocultar fontes nas respostas, branding personalizado, exigir telefone na inscrição, remover sidebar em integrações

### Out of Scope for MVP

| Feature | Razão para adiar | Fase planejada |
|---|---|---|
| App mobile nativo | Web responsivo suficiente para validação | v2.0 |
| Integração WhatsApp/Telegram | Complexidade de integração, foco na experiência web primeiro | v2.0 |
| Widget embed para sites | Requer SDK adicional, foco na plataforma própria | v2.0 |
| Marketplace de especialistas (terceiros criando IAs) | Modelo atual é controlado pelo admin, marketplace exige sistema de onboarding, revenue share, moderação | v3.0 |
| Trial gratuito com mensagens limitadas | Lançar com modelo direto landing → cadastro → assinatura, iterar depois | v1.5 |
| Sistema de chamadas/voz | Foco 100% em chat texto | v2.0+ |
| Feedbacks/ratings por conversa | Nice-to-have, NPS manual suficiente no início | v1.5 |
| Multi-idioma | Lançamento em francês apenas | v2.0 |
| Planos diferenciados (básico/premium) | Plano único a ~100€ para simplificar | v1.5 |

### MVP Success Criteria

O MVP é considerado validado quando:

1. **Produto funcional** — Especialista IA de gestão empresarial ativo, respondendo com qualidade e consistência dentro do escopo
2. **Primeiros assinantes pagantes** — Pelo menos os primeiros usuários convertendo e pagando via Stripe
3. **Engajamento real** — Assinantes usando o chat de forma recorrente (3+ dias/semana)
4. **Retenção mínima** — Primeiros assinantes renovando no mês 2
5. **Feedback qualitativo** — Usuários reportando valor real nas interações ("isso é diferente do ChatGPT")
6. **Infra estável** — N8N, PostgreSQL e Next.js rodando sem falhas críticas em produção

**Decisão de escalar além do MVP:** Quando houver evidência de retenção recorrente e feedback positivo consistente, expandir catálogo de especialistas e implementar features da v1.5.

### Future Vision

**v1.5 (3-6 meses pós-lançamento):**
- Trial gratuito otimizado com 2-3 mensagens
- Planos diferenciados (básico/premium)
- Feedbacks e ratings por conversa
- Novos especialistas em outros nichos (vendas, marketing, finanças)

**v2.0 (6-12 meses):**
- App mobile nativo (iOS/Android)
- Integrações WhatsApp e Telegram
- Widget embed para sites de terceiros
- Multi-idioma (inglês, português, espanhol)
- Expansão para mercados francófonos (Bélgica, Suíça, Canadá)
- Modelo B2B (empresas comprando acesso para equipes)

**v3.0 (12-24 meses):**
- Marketplace aberto — especialistas externos criam seus clones IA na plataforma
- Sistema de revenue share com especialistas parceiros
- Onboarding automatizado para novos especialistas
- Sistema de avaliação e ranking de especialistas
- API pública para integrações corporativas
