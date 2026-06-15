🟢 GreenLight — Capim
> Dashboard interno de Customer Success · Eficiência Operacional BNPL · Junho 2026
---
O Problema
O time de Customer Success da Capim acompanha milhares de clínicas dentárias parceiras, mas não tinha uma forma rápida de visualizar o status real de cada uma: quem ainda não fez o credenciamento, qual o score de crédito, quantas pré-análises (C1) e contratos (C2) realizou no mês, valor originado e ticket médio.
Sem essa visão consolidada, cada CS precisava abrir várias queries no Metabase, cruzar planilhas e perder horas até identificar quais clínicas precisavam de atenção. Resultado: ações reativas, oportunidades perdidas e tempo gasto em tarefas operacionais em vez de relacionamento.
---
A Solução
GreenLight é um dashboard interno que conecta direto ao Snowflake da Capim e oferece, em uma única tela, todas as métricas críticas de engajamento de cada clínica — atualizadas em tempo real.
Quatro visões organizadas por aba
Aba	Descrição
C1s — 7 dias	Clínicas com assinatura ativa e credenciamento aprovado que fizeram menos de 5 pré-análises na semana (alvo de reativação)
C2 no mês	Contratos fechados no mês com valor originado e ticket médio
Ficha da Clínica	Perfil completo por ID — score, C1s (7/30 dias), total de C2s, valor originado, ticket médio, status de credenciamento e engajamento
Por Responsável CS	Carteira consolidada de cada pessoa do time, com totais e pendências
Funcionalidades
Filtros por status de credenciamento, faixa de C1s, range de IDs, IDs múltiplos, datas e responsável CS
Score colorido por faixa de risco (🟢 verde / 🔵 azul / 🟠 laranja / 🔴 vermelho)
Botão de WhatsApp direto para a clínica
~50 mil clínicas indexadas, com dados carregados em segundos
---
Stack Técnica
Backend: Node.js + Express + Snowflake SDK
Frontend: HTML + JavaScript vanilla + TailwindCSS-like styling
Banco de dados: Snowflake (`CAPIM_DATA.CAPIM_ANALYTICS`)
Distribuição: Executável standalone via `pkg` + instalador NSIS
---
Estrutura do Projeto
```
capim-credenciamento/
├── server.js               # Backend Node.js/Express
├── dashboard_capim.html    # Interface do dashboard
├── clinicas_sem_credenciamento.js  # Lógica auxiliar
├── .env                    # Credenciais Snowflake (não versionar)
├── installer.nsi           # Script do instalador NSIS
├── package.json
└── node_modules/
```
---
Instalação e Configuração
Pré-requisitos
Node.js 18+
Acesso ao Snowflake com as credenciais corretas
1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/greenlight-capim.git
cd greenlight-capim
npm install
```
2. Configure o `.env`
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
SNOWFLAKE_ACCOUNT=eddoqmu-ch97144
SNOWFLAKE_USER=seu_usuario
SNOWFLAKE_PASSWORD=sua_senha
SNOWFLAKE_ROLE=GREENLIGHT_READONLY
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=CAPIM_DATA
SNOWFLAKE_SCHEMA=CAPIM_ANALYTICS
```
> ⚠️ **Nunca versione o `.env`** — ele contém credenciais sensíveis.
3. Rode localmente
```bash
node server.js
```
Acesse: http://localhost:3000/dashboard_capim.html
---
Distribuição (Executável)
Para gerar o executável standalone (não requer Node.js na máquina destino):
```bash
pkg server.js --target node18-win-x64 --output greenlight.exe
```
Para gerar o instalador `.exe` (requer NSIS):
```bash
"C:\Program Files (x86)\NSIS\makensis.exe" installer.nsi
```
O instalador gerado (`GreenLight_Instalador.exe`) empacota automaticamente:
`greenlight.exe`
`dashboard_capim.html`
`.env`
Atalho na área de trabalho
---
Papel da IA
Este projeto foi construído por uma profissional de CS sem background técnico, em parceria contínua com Claude (Anthropic). A IA conduziu todo o ciclo: entendimento do problema, arquitetura técnica, queries SQL no Snowflake, código Node.js/Express, interface HTML/CSS/JS, debug e refinamento visual iterativo. Nenhuma linha de código foi escrita à mão — a IA traduziu intenções de negócio em produto funcional.
---
Status e Próximos Passos
Status atual: MVP funcional conectado ao Snowflake, em teste com a CS responsável.
4.4k clínicas com plano ativo em alerta de baixo C1
~100 C2s do mês mapeados em segundos
Roadmap:
[ ] Expandir para o time de CS inteiro
[ ] Mensagens-padrão de WhatsApp por perfil de clínica (vazia, em ramp-up, dropping)
[ ] Empacotar em aplicação Rails para acesso multi-usuário
---
Autor
Projeto desenvolvido por Millena (Customer Success · Capim) com suporte de IA · 2026
