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
