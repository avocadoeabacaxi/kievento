# Análise de Design - Fever

## Cores Principais
- **Primária**: Verde vibrante (#00FF00 / similar) - usado no logo e destaques
- **Secundária**: Amarelo (#FFD700) - usado em badges e highlights
- **Background**: Branco limpo (#FFFFFF)
- **Texto**: Preto/Cinza escuro para contraste
- **Hero Background**: Imagem de cidade com overlay escuro

## Tipografia
- **Títulos**: Sans-serif moderna, bold, grande
- **Hero Title**: "Experience your city" - muito grande, branco, bold
- **Subtítulos**: Médio, regular weight
- **Corpo**: Sans-serif limpa e legível

## Estrutura de Layout

### Header (Top Navigation)
- Logo à esquerda
- Seletor de cidade (com ícone de localização)
- Idioma (EN) à direita
- Ícone de usuário/conta à direita
- Background branco, fixo no topo
- Clean e minimalista

### Hero Section
- Imagem full-width de cidade (background)
- Overlay escuro para contraste
- Título grande centralizado: "Experience your city"
- Subtítulo: "Music, sports, culture, pop-ups, and much more"
- Campo de busca grande e proeminente: "Find your city"
- Altura generosa (viewport completo)

### Cards de Eventos
- Grid responsivo
- Imagem grande no topo
- Título do evento
- Informações (data, local)
- Preço destacado
- Hover effects suaves
- Bordas arredondadas
- Sombra sutil

### Seções
- "Unforgettable experiences" - com ícones e texto
- "Top worldwide experiences" - grid de cards
- "The thrill is near" - eventos próximos
- "Popular cities" - lista de cidades

## Elementos de UI

### Botões
- Primário: Verde vibrante, arredondado
- Secundário: Outline ou ghost
- Hover: Efeitos suaves
- Tamanhos generosos (fácil de clicar)

### Cards
- Imagem predominante
- Informação organizada
- Espaçamento generoso
- Sombras sutis
- Hover: Elevação

### Busca
- Campo grande e proeminente
- Ícone de lupa
- Placeholder claro
- Background branco
- Bordas arredondadas

## Princípios de Design
1. **Visual First**: Imagens grandes e atraentes
2. **Hierarquia Clara**: Títulos grandes, informação organizada
3. **Espaçamento Generoso**: Breathing room entre elementos
4. **Cores Vibrantes**: Verde e amarelo para energia
5. **Minimalismo**: Interface limpa, sem poluição visual
6. **Mobile-First**: Responsivo e touch-friendly
7. **Confiança**: Reviews, ratings, números (milhões de usuários)

## Aplicação no KiEvento

### Cores para KiEvento
- Primária: Verde vibrante (#10B981 ou #00D68F)
- Secundária: Amarelo/Dourado (#FCD34D)
- Accent: Azul (#3B82F6) para CTAs
- Background: Branco/Cinza muito claro
- Texto: Cinza escuro (#1F2937)

### Estrutura
- Header fixo com logo, seletor de cidade, perfil
- Hero com imagem de fundo + busca
- Grid de eventos públicos
- Filtros por categoria e cidade
- Footer com informações

### Navegação
- Categorias no header ou abaixo do hero
- Filtros laterais ou top
- Breadcrumbs quando necessário


## Página de Cidade (São Paulo)

### Header
- Logo à esquerda
- **Seletor de cidade** com ícone de localização (destaque)
- **Botão "Categories"** com ícone de grid
- **Campo de busca** central grande
- **Idioma (EN)** à direita
- **Ícone de favoritos** (coração)
- **Ícone de perfil/conta** à direita
- Background branco, sticky

### Hero Section
- **Imagem de fundo** da cidade (balões de ar quente no caso de São Paulo)
- **Título grande**: "São Paulo" em branco
- **Subtítulo**: "Things to Do: Events, Experiences, and Much More"
- Overlay escuro para contraste
- Altura média (não full viewport)

### Seção "Top 10 in São Paulo"
- Título à esquerda
- Link "See all" à direita
- **Grid de cards horizontais** (scroll horizontal)
- Cards grandes com:
  - Imagem predominante
  - Número do ranking (1, 2, 3...)
  - Título do evento
  - Ícone de favorito no canto superior direito
  - Bordas arredondadas
  - Sombra sutil

### Estrutura de Navegação
1. Seletor de cidade (dropdown)
2. Categorias (modal/dropdown)
3. Busca (campo de texto)
4. Favoritos
5. Perfil

### Categorias Observadas
- Candlelight
- Live shows
- Exhibitions
- City tours
- Concerts
- Restaurants
- Cinema
- Experiences

## Aplicação no KiEvento

### Header do KiEvento
```
[Logo KiEvento] [Cidade ▼] [Categorias] [Busca...........] [Favoritos] [Perfil ▼]
```

### Dropdown de Perfil
- Nome do usuário
- Foto de perfil pequena
- Menu:
  - Meu Perfil
  - Meus Eventos
  - Configurações
  - Sair

### Categorias para KiEvento
- Música
- Teatro
- Gastronomia
- Esportes
- Networking
- Educação
- Arte & Cultura
- Tecnologia
- Outros
