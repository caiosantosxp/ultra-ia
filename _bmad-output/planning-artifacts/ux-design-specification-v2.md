---
stepsCompleted: ['init']
lastStep: 1
inputDocuments: ['prd.md', 'product-brief-ultra-ia-2026-03-09.md', 'design-system.html']
designSystemReference: 'NexAgent (Webflow Template)'
version: '2.0'
---

# UX Design Specification ultra-ia v2.0

**Author:** Vinicius
**Date:** 2026-03-23
**Design System Base:** NexAgent

---

## Executive Summary

### Project Vision

O ultra-ia e uma plataforma SaaS premium (~100EUR/mes) que oferece agentes IA especialistas verticais para o mercado frances e europeu. O primeiro nicho e mentoria em gestao empresarial. O diferencial central da experiencia e que a IA desafia o usuario com perguntas de contexto antes de aconselhar -- replicando o comportamento de um consultor real.

**Nova Direcao Visual:** Adocao do Design System NexAgent com estetica premium, paleta azul vibrante (#0367fb), tipografia moderna (Plus Jakarta Sans + Inter Tight), efeitos de glass morphism e animacoes sofisticadas.

### Target Users

**Pierre (Solopreneur):** 34-45 anos, empreendedor solo em cidades francesas. Tech-savvy profissional mas nao tecnico. Usa predominantemente a noite, sozinho, busca profundidade e orientacao sem julgamento.

**Marie (Gestora PME):** 38-45 anos, diretora de PME com 15-50 funcionarios. Precisa de decisoes rapidas e orientacao estrategica constante. Usa durante horario comercial entre reunioes.

---

## Design System Foundation

### Typography

**Font Stack:**
- **Display/Headlines:** Inter Tight (weight 800)
- **Body/UI:** Plus Jakarta Sans (weights 300-800)

**Type Scale:**

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display-1` | 94px | 800 | 110% | -2.82px | Hero headlines |
| `display-2` | 64px | 800 | 110% | -1.92px | Section titles |
| `heading-1` | 44px | 800 | 120% | -1.32px | Page titles |
| `heading-2` | 28px | 700 | 120% | -0.84px | Card titles, pricing |
| `heading-3` | 24px | 600 | 120% | -0.72px | Subsections |
| `body-lg` | 20px | 400 | 150% | 0 | Hero subtitles |
| `body` | 16px | 400 | 150% | 0 | Paragraphs, buttons |
| `body-sm` | 14px | 400 | 150% | 0 | Descriptions, meta |
| `caption` | 12px | 500 | 150% | 0.5px | Labels, tags |

### Color Palette

**Primary Colors (Blue Scale):**

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary-01` | #0367fb | 3, 103, 251 | Primary actions, links, accents |
| `primary-02` | #5f9cff | 95, 156, 255 | Hover states, secondary accents |
| `primary-03` | #b5d1ff | 181, 209, 255 | Backgrounds, highlights |
| `primary-04` | #deebff | 222, 235, 255 | Light backgrounds, cards |
| `primary-05` | #0061ff | 0, 97, 255 | Active states |
| `primary-06` | #90bafe | 144, 186, 254 | Borders, dividers |

**Neutral Colors (Gray Scale):**

| Token | Hex | Usage |
|-------|-----|-------|
| `black-01` | #161616 | Primary text, headings |
| `black-02` | #444444 | Secondary text |
| `black-03` | #787878 | Muted text, placeholders |
| `black-04` | #d9d9d9 | Borders, dividers |
| `black-05` | #f3f3f3 | Backgrounds, cards |
| `black-06` | #2d2d2d | Dark UI elements |
| `white` | #ffffff | Backgrounds, text on dark |

**Accent Colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| `teal` | #33e9bf | Success, positive feedback |
| `yellow-green` | #c6eb00 | Highlights, badges |
| `light-green` | #d1f801 | Premium indicators |
| `light-green-02` | #f6fecc | Soft highlights |

**Background Colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-dark-blue` | #041c40 | Hero sections, footer, dark mode |
| `bg-dark-green` | #102d23 | Alternative dark sections |
| `bg-light` | #f5f5f5 | Page backgrounds |

### Gradients

```css
/* Featured/Popular Elements */
--gradient-featured: linear-gradient(180deg, #0367fb 0%, #33e9bf 51%, #c6eb00 100%);

/* Title Highlights */
--gradient-title: linear-gradient(90deg, #8cb8ff 0%, #eef4ff 100%);

/* Dark Fade */
--gradient-dark-fade: linear-gradient(270deg, transparent 1%, #102d23 100%);

/* Hero Background Overlay */
--gradient-hero: linear-gradient(180deg, #041c40 0%, #0a2a5c 100%);
```

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-6xs` | 20px | Tight gaps |
| `space-5xs` | 24px | Component internal |
| `space-4xs` | 28px | Small gaps |
| `space-3xs` | 30px | Card padding |
| `space-2xs` | 32px | Grid gaps |
| `space-xs` | 36px | Section gaps |
| `space-s` | 40px | Medium sections |
| `space-m` | 48px | Large gaps |
| `space-l` | 60px | Section padding |
| `space-xl` | 80px | Major sections |
| `space-2xl` | 100px | Hero padding |
| `space-3xl` | 120px | Section bottom |
| `space-4xl` | 140px | Section top |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-2xs` | 6px | Small buttons, tags |
| `radius-xs` | 8px | Inputs, small cards |
| `radius-s` | 10px | Buttons |
| `radius-m` | 12px | Cards, modals |
| `radius-l` | 16px | Large cards |
| `radius-xl` | 20px | Hero cards |
| `radius-full` | 9999px | Pills, avatars |

### Shadows

```css
/* Card Shadow */
--shadow-card: 0 2px 20px rgba(0, 0, 0, 0.05);

/* Elevated Shadow */
--shadow-elevated: 0 4px 30px rgba(0, 0, 0, 0.1);

/* Hover Shadow */
--shadow-hover: 0 8px 40px rgba(3, 103, 251, 0.15);

/* Modal Shadow */
--shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.2);
```

### Glass Effect

```css
/* Glass Card */
.glass {
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Dark Glass */
.glass-dark {
  background: rgba(4, 28, 64, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## Component Library

### Buttons

#### Primary Button (Blue)

```
States: Default | Hover | Active | Disabled
Background: #0367fb
Text: white, 16px, weight 500
Padding: 16px 32px
Border Radius: 10px
Animation: Text slide on hover (translateY -100% to 0%)
```

**Variants:**
- With Arrow: Includes chevron icon that slides on hover
- Large: 18px text, 20px 40px padding
- Small: 14px text, 12px 24px padding

#### Secondary Button (Black/Outline)

```
Background: transparent
Border: 1px solid #161616
Text: #161616, 16px, weight 500
Padding: 16px 32px
Border Radius: 10px
Animation: Arrow slide + background fill on hover
```

#### Ghost Button

```
Background: transparent
Text: #0367fb, 16px, weight 500
Padding: 8px 16px
Animation: Underline reveal on hover
```

### Input Fields

#### Text Input

```
Background: #f5f5f5 (whitesmoke)
Border: none (default), 2px solid #0367fb (focus)
Text: #161616, 16px
Placeholder: #787878
Padding: 16px 20px
Border Radius: 8px
Transition: border-color 0.2s ease
```

#### Email Input with Button

```
Container: flex row
Input: flex-grow, 16px padding
Button: integrated, #0367fb background
Border Radius: 8px (container)
```

#### Password Input

```
Same as Text Input
Icon: Eye toggle for show/hide
Icon Position: right, 16px from edge
```

### Cards

#### Standard Card

```
Background: white
Border: 1px solid #f3f3f3
Border Radius: 16px
Padding: 30px
Shadow: 0 2px 20px rgba(0,0,0,0.05)
```

#### Feature Card

```
Background: white
Border: 1px solid #f3f3f3
Border Radius: 16px
Padding: 40px
Icon: 48px, top-left
Title: heading-2
Description: body, #787878
Hover: translateY(-4px), shadow increase
```

#### Pricing Card

```
Background: white
Border: 1px solid #f3f3f3
Border Radius: 20px
Padding: 40px

Popular Variant:
- Gradient border: linear-gradient(180deg, #0367fb, #33e9bf, #c6eb00)
- "Most Popular" badge: top-center
```

#### Chat Message Card

```
User Message:
- Background: #0367fb
- Text: white
- Border Radius: 16px 16px 4px 16px
- Max Width: 80%
- Align: right

AI Message:
- Background: #f3f3f3
- Text: #161616
- Border Radius: 16px 16px 16px 4px
- Max Width: 80%
- Align: left
```

### Navigation

#### Top Navigation Bar

```
Background: rgba(4, 28, 64, 0.95)
Backdrop Filter: blur(10px)
Height: 72px
Position: fixed, top
Border Bottom: 1px solid rgba(255,255,255,0.1)

Logo: left
Nav Links: center, 16px gap
CTA Button: right
```

#### Sidebar Navigation (Dashboard)

```
Width: 280px
Background: white
Border Right: 1px solid #f3f3f3
Padding: 24px

Nav Item:
- Padding: 12px 16px
- Border Radius: 8px
- Active: background #deebff, text #0367fb
- Hover: background #f3f3f3
```

### Tags & Badges

#### Section Tag

```
Background: rgba(3, 103, 251, 0.1)
Text: #0367fb, 14px, weight 500
Padding: 8px 16px
Border Radius: 6px
Letter Spacing: 0.5px
```

#### Status Badge

```
Active/Success:
- Background: rgba(51, 233, 191, 0.15)
- Text: #1a9e7a

Warning:
- Background: rgba(198, 235, 0, 0.15)
- Text: #8fa600

Error:
- Background: rgba(251, 3, 67, 0.15)
- Text: #d9001b
```

### Modals & Dialogs

```
Overlay: rgba(0, 0, 0, 0.5)
Background: white
Border Radius: 20px
Padding: 40px
Max Width: 500px
Shadow: 0 20px 60px rgba(0,0,0,0.2)
Animation: fadeIn + scaleUp (0.95 to 1)
```

### FAQ Accordion

```
Container:
- Background: white
- Border: 1px solid #f3f3f3
- Border Radius: 12px
- Margin Bottom: 12px

Header:
- Padding: 24px
- Title: heading-3
- Icon: Plus/Minus toggle

Content:
- Padding: 0 24px 24px
- Text: body, #787878
- Animation: slideDown 0.3s ease
```

---

## Motion & Interaction

### Transition Defaults

```css
/* Fast - Micro interactions */
--transition-fast: 0.15s ease-out;

/* Normal - UI feedback */
--transition-normal: 0.2s ease-out;

/* Slow - Entrance/Exit */
--transition-slow: 0.3s ease-out;

/* Emphasis - Attention-grabbing */
--transition-emphasis: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Button Animations

#### Text Slide Effect

```css
.button-text-wrap {
  overflow: hidden;
  position: relative;
}

.button-text {
  transition: transform 0.3s ease;
}

.button:hover .button-text {
  transform: translateY(-100%);
}

/* Second text slides up from below */
.button-text-2 {
  position: absolute;
  transform: translateY(100%);
}

.button:hover .button-text-2 {
  transform: translateY(0);
}
```

#### Arrow Slide Effect

```css
.arrow-wrap {
  overflow: hidden;
  width: 24px;
}

.arrow-1, .arrow-2 {
  transition: transform 0.3s ease;
}

.button:hover .arrow-1 {
  transform: translateX(100%);
}

.button:hover .arrow-2 {
  transform: translateX(0);
}
```

### Entrance Animations

#### Title Reveal

```css
.title-reveal {
  overflow: hidden;
}

.title-reveal h1 {
  transform: translateY(100%);
  animation: revealUp 0.8s ease forwards;
}

@keyframes revealUp {
  to { transform: translateY(0); }
}
```

#### Fade + Slide

```css
.fade-slide {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeSlide 0.6s ease forwards;
}

@keyframes fadeSlide {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Stagger Children

```css
.stagger-container > * {
  opacity: 0;
  transform: translateY(20px);
}

.stagger-container > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-container > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-container > *:nth-child(3) { animation-delay: 0.3s; }
/* etc. */
```

### Social Icon Hover

```css
.social-link {
  position: relative;
  transition: transform 0.2s ease;
}

.social-link:hover {
  transform: scale(1.1);
}

.social-icon-bg {
  position: absolute;
  inset: 0;
  background: #0367fb;
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.2s ease;
}

.social-link:hover .social-icon-bg {
  transform: scale(1);
}
```

### Loading States

#### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f3f3f3 25%,
    #e8e8e8 50%,
    #f3f3f3 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Typing Indicator (Chat)

```css
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 16px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #787878;
  border-radius: 50%;
  animation: typingBounce 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}
```

---

## Layout Patterns

### Container

```css
.container {
  max-width: 1310px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
}
```

### Hero Section Layout

```
Structure:
- Full viewport height (min-height: 100vh)
- Background: #041c40 (Dark Blue)
- Two columns: Content (left, max-width 632px) + Image/Animation (right)
- Padding: 140px top, 120px bottom

Content Stack:
1. Section Tag
2. H1 Title (with blue accent span)
3. Subtitle paragraph
4. Button group (horizontal)
5. Trust logos (optional)
```

### Section Title Pattern

```
Structure:
- Centered alignment
- Max width: 800px

Stack:
1. Section Tag (centered)
2. H2 Title (centered)
3. Subtitle (centered, max-width 600px)

Spacing:
- Tag to Title: 16px
- Title to Subtitle: 24px
- Section Padding: 140px top, 120px bottom
```

### Feature Grid Pattern

```
Two Column:
- Left: Content (title, description, button)
- Right: Image/Animation
- Gap: 60px
- Alternate: reverse order on even sections

Three Column:
- Equal width cards
- Gap: 24px
- Responsive: stack on mobile
```

### Chat Layout

```
Structure:
- Sidebar (280px, fixed left)
- Main Chat Area (flex-grow)
- Input Area (fixed bottom)

Sidebar:
- Logo/Header (72px)
- New Chat Button
- Conversation List (scrollable)
- User Profile (fixed bottom)

Chat Area:
- Messages Container (scrollable, padding 40px)
- Input Container (fixed, glass effect)
```

### Dashboard Layout

```
Structure:
- Top Nav (72px, fixed)
- Sidebar (280px, fixed left)
- Main Content (flex-grow, padding 40px)

Grid System:
- Stats Row: 4 equal cards
- Charts: 2 column (60/40 split)
- Tables: Full width
```

---

## Page Specifications

### Landing Page

**Hero Section:**
- Background: #041c40
- Corner decorations (SVG)
- H1: "Votre Expert IA" + "Personnel" (blue accent)
- Subtitle: Value proposition
- CTAs: "Commencer" (primary) + "En savoir plus" (secondary)
- Trust logos row

**Features Section:**
- Background: white
- Section Tag + Title
- Feature cards (3 column grid)
- Each card: icon, title, description

**How It Works Section:**
- Background: #f3f3f3
- Numbered steps (1, 2, 3)
- Visual timeline/connection

**Testimonials Section:**
- Background: white
- Slider with testimonial cards
- Quote icon, text, author info

**Pricing Section:**
- Background: #f3f3f3
- Single pricing card (or 2-3 tiers)
- Feature list with checkmarks
- CTA button

**FAQ Section:**
- Background: white
- Accordion items
- 5-7 common questions

**Footer:**
- Background: #041c40
- Logo, nav links, social icons
- Copyright, legal links

### Login Page

**Layout:**
- Full viewport, centered card
- Background: #041c40 with subtle pattern/gradient

**Card:**
- Background: white
- Border Radius: 20px
- Padding: 48px
- Max Width: 440px

**Content:**
- Logo (centered, top)
- Title: "Se connecter"
- Subtitle: "Bon retour sur Ultra IA"
- Google OAuth button (full width)
- Divider: "ou"
- Email input
- Password input (with toggle)
- "Mot de passe oublie?" link
- Submit button (full width)
- "Creer un compte" link

### Chat Interface

**Sidebar:**
- Logo/branding
- "Nouvelle conversation" button
- Conversation list (scrollable)
- Each item: specialist avatar, title, timestamp
- User profile section (bottom)

**Main Area:**
- Specialist header (avatar, name, status)
- Messages container (scrollable)
- Message bubbles (user right, AI left)
- Typing indicator
- Input area (glass effect, fixed bottom)

**Input Area:**
- Textarea (auto-resize)
- Send button (icon)
- Character/message limit indicator

### Dashboard (Admin)

**Stats Overview:**
- 4 metric cards (subscribers, messages, revenue, retention)
- Each with icon, value, trend indicator

**Charts:**
- Activity chart (90 days line graph)
- Sessions by country (map or bar)
- Usage by hour (bar chart)

**Tables:**
- Users list with search/filter
- Conversations list
- Sortable columns, pagination

---

## Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 480px) { /* Small Mobile+ */ }
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large Desktop */ }
@media (min-width: 1440px) { /* Extra Large */ }
```

### Responsive Adjustments

**Mobile (< 768px):**
- Navigation: hamburger menu
- Hero: single column, reduced text sizes
- Cards: full width stack
- Sidebar: drawer (slide from left)
- Chat: full screen, no sidebar visible

**Tablet (768px - 1024px):**
- Navigation: visible, condensed
- Hero: two columns, reduced spacing
- Cards: 2 column grid
- Sidebar: collapsible

**Desktop (> 1024px):**
- Full layout as designed
- All animations enabled
- Maximum content width: 1310px

---

## Accessibility Guidelines

### Color Contrast

- Normal text on white: minimum 4.5:1 ratio
- Large text on white: minimum 3:1 ratio
- Interactive elements: clearly distinguishable focus states

**Verified Contrasts:**
- #161616 on white: 14.5:1 (AAA)
- #0367fb on white: 4.6:1 (AA)
- #787878 on white: 4.5:1 (AA minimum)
- White on #041c40: 15.2:1 (AAA)

### Focus States

```css
:focus-visible {
  outline: 2px solid #0367fb;
  outline-offset: 2px;
}

/* Remove default outline, add custom */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(3, 103, 251, 0.3);
}
```

### Keyboard Navigation

- All interactive elements reachable via Tab
- Logical tab order (left to right, top to bottom)
- Skip link to main content
- Escape closes modals/dropdowns
- Arrow keys for dropdown navigation

### Screen Reader Support

- Semantic HTML elements (nav, main, article, aside)
- ARIA labels for icon-only buttons
- Live regions for dynamic content (chat messages)
- Alt text for all images
- Form labels associated with inputs

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Notes

### CSS Variables Setup

```css
:root {
  /* Colors */
  --color-primary-01: #0367fb;
  --color-primary-02: #5f9cff;
  --color-primary-03: #b5d1ff;
  --color-primary-04: #deebff;
  --color-black-01: #161616;
  --color-black-02: #444444;
  --color-black-03: #787878;
  --color-black-04: #d9d9d9;
  --color-black-05: #f3f3f3;
  --color-teal: #33e9bf;
  --color-yellow-green: #c6eb00;
  --color-bg-dark: #041c40;

  /* Typography */
  --font-display: 'Inter Tight', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;

  /* Spacing */
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 40px;
  --space-xl: 60px;
  --space-2xl: 80px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  /* Shadows */
  --shadow-sm: 0 2px 10px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 40px rgba(0,0,0,0.12);

  /* Transitions */
  --transition-fast: 0.15s ease-out;
  --transition-normal: 0.2s ease-out;
  --transition-slow: 0.3s ease-out;
}
```

### Tailwind Config Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0367fb',
          50: '#deebff',
          100: '#b5d1ff',
          200: '#90bafe',
          300: '#5f9cff',
          400: '#0367fb',
          500: '#0061ff',
        },
        neutral: {
          900: '#161616',
          800: '#2d2d2d',
          700: '#444444',
          500: '#787878',
          300: '#d9d9d9',
          100: '#f3f3f3',
        },
        accent: {
          teal: '#33e9bf',
          lime: '#c6eb00',
          green: '#d1f801',
        },
        dark: {
          blue: '#041c40',
          green: '#102d23',
        },
      },
      fontFamily: {
        display: ['Inter Tight', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
}
```

### ShadCN Theme Override

Components to customize:
- Button: Add text slide animation, update colors
- Input: Update border-radius, focus states
- Card: Update shadows, border-radius
- Dialog: Update backdrop, animation
- Dropdown: Update styling to match design system

---

## Next Steps

1. **Implementar Design Tokens** - Criar arquivo de CSS variables e Tailwind config
2. **Atualizar Componentes ShadCN** - Customizar tema base
3. **Criar Pagina de Login** - Primeiro componente visual com novo design
4. **Desenvolver Landing Page** - Hero section como showcase do design system
5. **Interface de Chat** - Aplicar novo visual ao core do produto

---

**Documento criado em:** 2026-03-23
**Baseado em:** NexAgent Design System (Webflow Template)
**Status:** Pronto para implementacao
