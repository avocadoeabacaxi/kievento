# Sistema de Gestão de Eventos - TODO

## Estrutura do Banco de Dados
- [x] Tabela de eventos (data, endereço, imagem banner, descrição HTML, tipo de inscrição)
- [x] Tabela de formulários personalizáveis (perguntas dinâmicas por evento)
- [x] Tabela de inscrições/participantes
- [x] Tabela de convites com QR Code
- [x] Tabela de permissões de validadores

## Backend API (tRPC)
- [x] CRUD de eventos (criar, listar, editar, deletar)
- [x] Sistema de upload de imagens para S3
- [x] API de formulários personalizáveis
- [x] API de inscrições (aberta e com aprovação)
- [x] API de aprovação de participantes
- [x] Geração de QR Code para convites
- [x] API de validação de entrada (scan QR Code)
- [x] Sistema de permissões para validadores

## Painel Admin (Organizador)
- [x] Dashboard com lista de eventos criados
- [x] Formulário de criação de evento (data, endereço, banner, descrição HTML)
- [x] Editor de formulário personalizado (adicionar/remover perguntas)
- [x] Lista de inscrições pendentes de aprovação
- [x] Painel de aprovação/rejeição de participantes
- [x] Visualização de estatísticas (total inscritos, aprovados, presentes)
- [x] Sistema de validação de entrada (scanner QR Code)
- [x] Busca de participantes por nome
- [ ] Gestão de permissões de validadores

## Painel Cliente (Criador de Eventos)
- [x] Visualização de todos os eventos criados
- [x] Acesso rápido às estatísticas de cada evento

## Página Pública de Inscrição
- [x] Design mobile-first responsivo
- [x] Exibição de detalhes do evento (banner, descrição, data, local)
- [x] Formulário dinâmico de inscrição
- [x] Feedback de inscrição enviada
- [x] Mensagem de aguardando aprovação (quando aplicável)

## Sistema de Convites e QR Code
- [x] Geração automática de QR Code único por participante
- [x] Página de convite digital com QR Code
- [x] Sistema de validação via scan de QR Code
- [x] Registro de entrada com timestamp
- [x] Contador de participantes presentes

## Design e UX
- [x] Interface minimalista e moderna
- [x] Paleta de cores e tipografia
- [x] Componentes reutilizáveis
- [x] Estados de loading e erro
- [x] Feedback visual para ações do usuário

## Testes
- [x] Testes unitários das procedures principais
- [x] Validação de fluxo completo

## Documentação
- [ ] README com instruções de uso
- [ ] Documentação das permissões e roles

## Painel Admin Geral (Super Admin)
- [x] Dashboard geral com estatísticas da plataforma
- [x] Visualização de todos os eventos de todos os usuários
- [x] Acesso a todas as inscrições de todos os eventos
- [x] Filtros e busca avançada
- [ ] Gestão de usuários (promover/rebaixar admins)
- [ ] Exportação de relatórios

## Melhorias Solicitadas
- [x] Renomear plataforma de EventoManager para KiEvento

## Novas Funcionalidades Solicitadas
- [x] Adicionar opção para excluir evento
- [x] Adicionar descrição do tamanho recomendado do banner
- [x] Implementar editor de texto rico (WYSIWYG) com negrito, itálico, inserir imagem
- [x] Adicionar campos especiais: CPF, CNPJ, CEP com auto-preenchimento
- [x] Adicionar campo de endereço com atalho/link
- [x] Reduzir tamanho do banner no painel de controle (manter grande apenas na página pública)
- [ ] Sistema de cadastro de usuário antes da inscrição no evento (não implementado - sistema já usa autenticação Manus)

## Redesign e Novas Funcionalidades (Inspirado no Fever)
- [ ] Analisar design do Fever (cores, tipografia, estrutura)
- [ ] Sistema - [x] Sistema de perfil de usuário
  - [x] Upload de foto de perfil
  - [x] Tipo de cadastro (Pessoa Física / Empresa)
  - [x] Campos para CPF, CNPJ, data de nascimento, etc.
  - [x] Endereço completo
  - [x] Editar informações pessoais/empresariais
- [x] Adicionar campos ao evento
  - [x] Categoria (Música, Teatro, Gastronomia, Esportes, etc.)
  - [x] Cidade
  - [x] Visibilidade (Público no site / Privado)
- [x] Redesign da home page
  - [x] Hero section atraente
  - [x] Cards de eventos públicos
  - [x] Filtros por categoria e cidade
  - [x] Layout moderno inspirado no Fever
- [x] Página de listagem de eventos públicos
- [x] Atualizar paleta de cores seguindo Fever (verde)
- [x] Melhorar navegação e estrutura geral (Header moderno com dropdown)geral

## Bugs Corrigidos
- [x] React Quill incompatível com React 19 - substituído por editor HTML customizado


## Sistema de Notificações por E-mail
- [x] Criar serviço de envio de e-mails
- [x] Template HTML para aprovação de inscrição (com link para convite QR Code)
- [x] Template HTML para rejeição de inscrição
- [x] Template HTML para confirmação de inscrição (eventos abertos)
- [x] Integrar envio automático na aprovação de inscrições
- [x] Integrar envio automático na rejeição de inscrições
- [x] Integrar envio automático na criação de inscrição (eventos abertos)
- [ ] Integrar com serviço real de e-mail (SendGrid, AWS SES, Resend)

## Bugs Encontrados
- [x] react-input-mask incompatível com React 19 - substituído por máscaras customizadas
- [x] Erro TypeScript: frontendUrl não existe em ENV - corrigido

## Melhorias de Navegação
- [ ] Adicionar Header com menu do usuário em todas as páginas
- [ ] Garantir navegação consistente em todo o sistema

## FAQ (Perguntas Frequentes)
- [x] Adicionar campo de FAQ no formulário de criação de evento
- [x] Interface para adicionar/remover perguntas e respostas
- [x] Exibir FAQs na página pública de inscrição do evento

## Bugs a Corrigir
- [x] Erro de `<a>` aninhado no Dashboard - removido Link wrapper, usando onClick no Card

## Novas Funcionalidades e Melhorias
- [x] Implementar edição de eventos
- [x] Atualizar Header: remover texto, usar logo centralizada
- [x] Adicionar logo KiEvento ao projeto
- [x] Logo centralizada no topo da página pública de eventos

## Simplificação do Header
- [x] Remover links de navegação (Eventos, Meus Eventos, Admin) do header
- [x] Manter apenas logo centralizada e menu dropdown do usuário
- [x] Adicionar opções de navegação dentro do menu dropdown

## Bugs a Corrigir
- [x] Erro de `<a>` aninhado no menu dropdown do Header - removidas tags `<a>` desnecessárias

## Tarefas Pendentes
- [ ] Gestão de permissões de validadores
- [x] Analisar tipografia e estrutura do Fever em profundidade
- [x] Aplicar melhorias de tipografia no KiEvento (h1-h4 com tamanhos maiores)
- [x] Melhorar estrutura e layout das páginas (hero maior, grid 4 colunas, cards 3:4, border-radius 2xl, espaçamentos maiores)
- [x] Atualizar paleta de cores de verde para vermelho RGB(199, 34, 39)

## Novas Funcionalidades Solicitadas
- [x] Adicionar campo de imagem separada para página principal (aspect ratio 3:4)
- [x] Adicionar botão "Editar" nos cards de eventos do Dashboard
- [x] Atualizar PublicHome para usar imagem otimizada 3:4

## Melhorias na Página de Evento (RegisterPage)
- [x] Reduzir tamanho da logo KiEvento (de h-8 para h-10)
- [x] Diminuir espaçamentos entre as informações (reduzidos gaps e paddings)
- [x] Adicionar títulos/labels para cada seção (Data e Hora, Local, Sobre o Evento, FAQ, Formulário de Inscrição)

## Banner de Cookies e Rodapé
- [x] Criar tabela de configurações do site no banco de dados (siteSettings)
- [x] API tRPC para gerenciar configurações (get, getAll, update, updateMultiple)
- [x] Componente de banner de cookies (com botões Definições e Aceitar, emojis 🍪🥑)
- [x] Componente de rodapé padronizado (© 2025 KiEvento By Lab485/Avocado - ano dinâmico)
- [x] Painel Admin para editar textos do banner e links de políticas (/admin/settings)
- [x] Integrar banner de cookies em páginas públicas (PublicHome, RegisterPage)
- [x] Integrar rodapé em todas as páginas do sistema (PublicHome, RegisterPage, TicketPage, Dashboard, CreateEvent, EventDetails, ProfilePage, AdminDashboard, ScannerPage, SiteSettings)
- [x] Sistema de localStorage para lembrar aceitação de cookies

## Páginas de Termos e Privacidade
- [x] Criar página pública de Termos de Serviço (/termos)
- [x] Criar página pública de Política de Privacidade (/privacidade)
- [x] Adicionar editor de texto rico no painel admin para Termos (RichTextEditor)
- [x] Adicionar editor de texto rico no painel admin para Política de Privacidade (RichTextEditor)
- [x] Inserir conteúdo padrão de exemplo no banco de dados (via testes)
- [x] Adicionar rotas no App.tsx (/termos e /privacidade)
- [x] Testar funcionalidades de edição e visualização (32 testes passando)

## Sistema de Breadcrumb para Admin
- [x] Criar componente Breadcrumb reutilizável com design elegante (com ícone Home e navegação)
- [x] Adicionar breadcrumb no Dashboard (Meus Eventos)
- [x] Adicionar breadcrumb no CreateEvent (Meus Eventos > Criar/Editar Evento)
- [x] Adicionar breadcrumb no EventDetails (Meus Eventos > Nome do Evento)
- [x] Adicionar breadcrumb no AdminDashboard (Painel Administrativo)
- [x] Adicionar breadcrumb no SiteSettings (Configurações do Site)
- [x] Adicionar breadcrumb no ScannerPage (Meus Eventos > Evento > Validação)
- [x] Garantir consistência visual em todas as páginas admin

## Remover Botões "Voltar" Redundantes
- [x] Remover botão "Voltar" do CreateEvent (já tem breadcrumb)
- [x] Remover botão "Voltar" do EventDetails (mantido botão Excluir)
- [x] Remover botão "Voltar" do AdminDashboard (já tem breadcrumb)
- [x] Remover botão "Voltar" do ScannerPage (já tem breadcrumb)

## Botão "Evento" e Otimização Mobile da Validação
- [x] Adicionar botão "Evento" no card de eventos do Dashboard (grid 3 colunas: Editar, Evento, Gerenciar)
- [x] Botão direciona para /events/:id/scan (página de Validação de Entrada)
- [x] Otimizar ScannerPage para responsividade mobile (100% mobile-friendly)
- [x] Melhorar layout do scanner QR para dispositivos móveis (inputs maiores h-12, texto maior)
- [x] Melhorar layout da busca por nome para dispositivos móveis (cards flex-col em mobile)
- [x] Garantir que todos os elementos sejam facilmente clicáveis em telas pequenas (botões h-10/h-12)
- [x] Breadcrumb oculto em mobile para layout mais limpo
- [x] Header otimizado com padding responsivo e texto centralizado
