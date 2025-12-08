# Análise Detalhada: Tipografia e Estrutura do Fever

## Tipografia

### Fontes
- **Logo**: Fonte customizada "Fever" em lowercase, moderna e arredondada
- **Títulos principais**: Sans-serif bold, muito grande e impactante
  - Hero title "São Paulo": Fonte muito grande, bold, branca sobre imagem
  - Subtítulo: Fonte menor, regular weight, branca
- **Títulos de seção**: Sans-serif bold, tamanho médio
- **Corpo de texto**: Sans-serif regular, legível
- **Cards de eventos**: 
  - Número ranking: Fonte muito grande, bold, branca
  - Nome do evento: Sans-serif medium, tamanho médio

### Hierarquia Visual
1. **Hero Section**: Título gigante + subtítulo médio
2. **Seções**: Título bold + link "See all"
3. **Cards**: Imagem predominante + número + título

### Tamanhos Aproximados
- Hero title: ~72-80px
- Hero subtitle: ~20-24px
- Section titles: ~28-32px
- Card titles: ~16-18px
- Body text: ~14-16px

## Estrutura e Layout

### Header
- **Altura**: ~60-70px
- **Elementos**: Logo (esquerda) | Cidade + Categorias + Busca (centro) | Idioma + Favoritos + Conta (direita)
- **Fundo**: Branco com sombra sutil
- **Sticky**: Fixo no topo ao rolar

### Hero Section
- **Altura**: ~400-500px
- **Imagem**: Full-width, com overlay escuro
- **Texto**: Centralizado verticalmente, alinhado à esquerda
- **Tipografia**: Branca, bold, muito grande

### Grid de Cards
- **Desktop**: 4 colunas
- **Tablet**: 2-3 colunas
- **Mobile**: 1 coluna
- **Gap**: ~20-24px entre cards
- **Aspect ratio**: ~3:4 (vertical)

### Cards de Eventos
- **Estrutura**:
  - Imagem: 100% width, aspect ratio 3:4
  - Número ranking: Overlay no canto superior esquerdo, muito grande
  - Botão favorito: Overlay no canto superior direito
  - Título: Abaixo da imagem
  - Local/data: Texto menor, cor secundária
- **Hover**: Leve zoom na imagem, sombra aumentada
- **Border radius**: ~12-16px

### Espaçamentos
- **Container padding**: ~40-60px laterais
- **Section spacing**: ~60-80px vertical
- **Card spacing**: ~20-24px
- **Element spacing**: ~12-16px

### Cores
- **Fundo**: Branco (#FFFFFF)
- **Texto primário**: Preto (#000000)
- **Texto secundário**: Cinza (#666666)
- **Accent**: Verde Fever (já substituído por vermelho no KiEvento)

## Padrões de Design

### Navegação
- Breadcrumbs visuais (cidade > seção)
- Filtros horizontais (categorias, cidades)
- Busca proeminente no header

### Interatividade
- Hover effects suaves
- Transições rápidas (200-300ms)
- Feedback visual imediato

### Responsividade
- Mobile-first approach
- Breakpoints bem definidos
- Imagens otimizadas

## Aplicações para KiEvento

### Melhorias Prioritárias
1. **Aumentar tamanho do hero title** (atualmente muito pequeno)
2. **Melhorar hierarquia visual** dos títulos
3. **Ajustar grid de cards** para 4 colunas desktop
4. **Adicionar números de ranking** nos cards (opcional)
5. **Melhorar espaçamentos** entre seções
6. **Aumentar border-radius** dos cards
7. **Adicionar hover effects** mais pronunciados
8. **Melhorar tipografia** dos cards de eventos
