---
title: 'Tradução Completa FR/EN — Auditoria e Correção Total'
slug: 'full-i18n-translation-audit-fr-en'
created: '2026-03-18'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Next.js 15', 'TypeScript', 'Zustand', 'cookie (LANG)', 'Zod 4.3.6']
files_to_modify:
  - 'src/lib/i18n/fr.ts'
  - 'src/lib/i18n/en.ts'
  - 'src/components/shared/language-switcher.tsx'
  - 'src/components/admin/settings-form.tsx'
  - 'src/app/(admin)/admin/settings/page.tsx'
  - 'src/actions/admin-settings-actions.ts'
code_patterns:
  - 'fr.ts define o tipo Translation — toda chave adicionada DEVE estar em en.ts também'
  - 'getT() para server components — async, lê cookie LANG, retorna fr ou en'
  - 'useT() para client components — lê Zustand locale, retorna fr ou en'
  - 'Server actions NÃO têm acesso a t — retornar {} sem message, client usa t para erro'
  - 'IntegrationRow é server component inline — receber labels traduzidos como props da page'
test_patterns: []
---

# Tech-Spec: Tradução Completa FR/EN — Auditoria e Correção Total

**Created:** 2026-03-18

## Overview

### Problem Statement

O sistema possui infraestrutura i18n completa e funcional (fr.ts, en.ts, getT(), useT(), Zustand language-store). Os arquivos novos de settings admin introduziram **5 chaves ausentes** em ambos os arquivos de tradução e **6 strings hardcoded** distribuídas em 4 arquivos. Resultado: badges, select items e aria-labels aparecem fixos em francês mesmo quando o usuário seleciona inglês.

Arquivos com problema:
- `settings/page.tsx` — "Configuré" / "Non configuré" hardcoded (FR)
- `settings-form.tsx` — "Français" / "English" hardcoded em SelectItems
- `admin-settings-actions.ts` — "Erreur lors de la sauvegarde" hardcoded (FR)
- `language-switcher.tsx` — aria-label com strings EN/FR hardcoded

### Solution

1. Adicionar as 5 chaves novas em `fr.ts` e `en.ts` (com suas respectivas traduções)
2. Corrigir os 4 arquivos para usar as chaves de tradução
3. Remover a string hardcoded do server action

### Scope

**In Scope:**
- `src/lib/i18n/fr.ts` — adicionar: `nav.switchLanguageAriaLabel`, `adminSettings.configured`, `adminSettings.notConfigured`, `adminSettings.languageFr`, `adminSettings.languageEn`
- `src/lib/i18n/en.ts` — adicionar as mesmas 5 chaves em inglês
- `src/components/shared/language-switcher.tsx` — substituir aria-label hardcoded
- `src/components/admin/settings-form.tsx` — substituir SelectItems hardcoded + corrigir toast.error
- `src/app/(admin)/admin/settings/page.tsx` — passar labels traduzidos para `IntegrationRow`
- `src/actions/admin-settings-actions.ts` — remover string hardcoded do catch

**Out of Scope:**
- Mudar arquitetura do i18n (Zustand + cookie está correto e funcionando)
- Painel /chat (lead) — já está 100% traduzido
- Validações Zod em `src/lib/validations/admin.ts` — mensagens de validação internas
- Os 150+ arquivos e componentes que já usam getT()/useT() corretamente
- Criar switcher de idioma em painéis que já têm (admin e expert têm switcher no dropdown do usuário)

## Context for Development

### Codebase Patterns

**Pattern 1 — Server components usam `getT()`:**
```ts
import { getT } from '@/lib/i18n/get-t';

export default async function MyPage() {
  const t = await getT();  // lê cookie LANG, retorna fr ou en
  return <h1>{t.admin.title}</h1>;
}
```

**Pattern 2 — Client components usam `useT()`:**
```ts
'use client';
import { useT } from '@/lib/i18n/use-t';

export function MyComponent() {
  const t = useT();  // lê Zustand locale, retorna fr ou en
  return <button>{t.adminSettings.save}</button>;
}
```

**Pattern 3 — Tipo `Translation` é implícito de `fr.ts`:**
`en.ts` começa com `export const en: Translation = { ... }`. Qualquer chave em `fr.ts` que faltar em `en.ts` causa erro TypeScript em build. Portanto: SEMPRE adicionar em `fr.ts` PRIMEIRO, depois em `en.ts`.

**Pattern 4 — Server actions não têm acesso a `t`:**
Solução padrão: retornar `error: {}` (sem message hardcoded). O client component usa o fallback `t.adminSettings.saveError`.

**Pattern 5 — IntegrationRow como server component inline:**
É uma função TypeScript pura dentro do arquivo da page. Recebe props como qualquer componente React. O body async da page tem acesso a `t` — basta passar os labels como props.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/lib/i18n/fr.ts` | Define Translation type + FR — MODIFICAR PRIMEIRO |
| `src/lib/i18n/en.ts` | EN translations — MODIFICAR SEGUNDO |
| `src/lib/i18n/get-t.ts` | Helper server — NÃO modificar |
| `src/lib/i18n/use-t.ts` | Hook client — NÃO modificar |
| `src/stores/language-store.ts` | Zustand store — NÃO modificar |
| `src/components/shared/language-switcher.tsx` | Botão FR\|EN — client component |
| `src/components/admin/settings-form.tsx` | Form de configurações — client component |
| `src/app/(admin)/admin/settings/page.tsx` | Página de configurações — server component |
| `src/actions/admin-settings-actions.ts` | Server action — sem acesso a `t` |

### Technical Decisions

**TD1 — Posição de `switchLanguageAriaLabel`:** Na seção `nav` (não `adminSettings`), pois o `LanguageSwitcher` é um componente global usado no header público e em todos os painéis.

**TD2 — Semântica do aria-label:** O aria-label descreve a AÇÃO que vai acontecer (trocar para o outro idioma), descrita no idioma ATUAL da UI:
- fr.ts: `'Passer en anglais'` — quando em FR, o botão vai para EN
- en.ts: `'Switch to French'` — quando em EN, o botão vai para FR

**TD3 — Nomes de idioma no dropdown:** Traduzidos conforme solicitado (não fixos em native-name):
- FR: `languageFr: 'Français'`, `languageEn: 'Anglais'`
- EN: `languageFr: 'French'`, `languageEn: 'English'`

**TD4 — Server action error:** Remover a `message` do retorno de erro do catch. O client faz `result.error?.message ?? t.adminSettings.saveError` — com `error: {}`, `result.error.message` será `undefined`, e o fallback `t.adminSettings.saveError` entra automaticamente.

## Implementation Plan

### Tasks

- [x] **Task 1: Adicionar chaves em `src/lib/i18n/fr.ts`**
  - File: `src/lib/i18n/fr.ts`
  - Action: Na seção `nav`, após `mobileTitle: 'Menu de navigation',`, adicionar:
    ```ts
    switchLanguageAriaLabel: 'Passer en anglais',
    ```
  - Action: Na seção `adminSettings`, após `integrationsDescription: 'Statut des services externes...',`, adicionar:
    ```ts
    configured: 'Configuré',
    notConfigured: 'Non configuré',
    languageFr: 'Français',
    languageEn: 'Anglais',
    ```
  - Notes: `fr.ts` define o tipo `Translation`. Adicionar aqui ANTES de `en.ts`.

- [x] **Task 2: Adicionar chaves em `src/lib/i18n/en.ts`**
  - File: `src/lib/i18n/en.ts`
  - Action: Na seção `nav`, após `mobileTitle: 'Navigation menu',`, adicionar:
    ```ts
    switchLanguageAriaLabel: 'Switch to French',
    ```
  - Action: Na seção `adminSettings`, após `integrationsDescription: 'Status of external services...',`, adicionar:
    ```ts
    configured: 'Configured',
    notConfigured: 'Not configured',
    languageFr: 'French',
    languageEn: 'English',
    ```
  - Notes: Deve satisfazer o tipo `Translation` atualizado por Task 1. Executar após Task 1.

- [x] **Task 3: Corrigir aria-label em `src/components/shared/language-switcher.tsx`**
  - File: `src/components/shared/language-switcher.tsx`
  - Action: Adicionar import `useT` após linha 3 (imports existentes):
    ```ts
    import { useT } from '@/lib/i18n/use-t';
    ```
  - Action: No corpo do componente `LanguageSwitcher`, após `const setLocale = ...`, adicionar:
    ```ts
    const t = useT();
    ```
  - Action: Substituir linha 19 (aria-label hardcoded):
    ```tsx
    // REMOVER:
    aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
    // ADICIONAR:
    aria-label={t.nav.switchLanguageAriaLabel}
    ```
  - Notes: Executar após Tasks 1 e 2 para que a chave `nav.switchLanguageAriaLabel` exista.

- [x] **Task 4: Corrigir SelectItems em `src/components/admin/settings-form.tsx`**
  - File: `src/components/admin/settings-form.tsx`
  - Action: Substituir linha 76:
    ```tsx
    // REMOVER:
    <SelectItem value="fr">Français</SelectItem>
    // ADICIONAR:
    <SelectItem value="fr">{t.adminSettings.languageFr}</SelectItem>
    ```
  - Action: Substituir linha 77:
    ```tsx
    // REMOVER:
    <SelectItem value="en">English</SelectItem>
    // ADICIONAR:
    <SelectItem value="en">{t.adminSettings.languageEn}</SelectItem>
    ```
  - Action: Substituir linha 50 (simplificar toast.error):
    ```tsx
    // REMOVER:
    toast.error(result.error?.message ?? t.adminSettings.saveError);
    // ADICIONAR:
    toast.error(t.adminSettings.saveError);
    ```
  - Notes: `t` já está disponível (linha 28: `const t = useT()`). Executar após Tasks 1 e 2.

- [x] **Task 5: Corrigir `IntegrationRow` em `src/app/(admin)/admin/settings/page.tsx`**
  - File: `src/app/(admin)/admin/settings/page.tsx`
  - Action: Substituir a função `IntegrationRow` inteira (linhas 15-32):
    ```tsx
    // ANTES:
    function IntegrationRow({ label, configured }: { label: string; configured: boolean }) {
      return (
        <div className="flex items-center justify-between py-2">
          <span className="text-sm">{label}</span>
          {configured ? (
            <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Configuré
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-red-500/30 text-red-500">
              <XCircle className="h-3 w-3" />
              Non configuré
            </Badge>
          )}
        </div>
      );
    }

    // DEPOIS:
    function IntegrationRow({
      label,
      configured,
      configuredLabel,
      notConfiguredLabel,
    }: {
      label: string;
      configured: boolean;
      configuredLabel: string;
      notConfiguredLabel: string;
    }) {
      return (
        <div className="flex items-center justify-between py-2">
          <span className="text-sm">{label}</span>
          {configured ? (
            <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              {configuredLabel}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-red-500/30 text-red-500">
              <XCircle className="h-3 w-3" />
              {notConfiguredLabel}
            </Badge>
          )}
        </div>
      );
    }
    ```
  - Action: Substituir linha 67 (render das integrações):
    ```tsx
    // ANTES:
    <IntegrationRow key={integration.label} {...integration} />

    // DEPOIS:
    <IntegrationRow
      key={integration.label}
      {...integration}
      configuredLabel={t.adminSettings.configured}
      notConfiguredLabel={t.adminSettings.notConfigured}
    />
    ```
  - Notes: `t` já está disponível na page (linha 35: `const t = await getT()`). Executar após Tasks 1 e 2.

- [x] **Task 6: Corrigir string hardcoded em `src/actions/admin-settings-actions.ts`**
  - File: `src/actions/admin-settings-actions.ts`
  - Action: Substituir linha 48:
    ```ts
    // ANTES:
    return { success: false, error: { message: 'Erreur lors de la sauvegarde' } };

    // DEPOIS:
    return { success: false, error: {} };
    ```
  - Notes: O `settings-form.tsx` (após Task 4) usa `t.adminSettings.saveError` diretamente — não depende mais do `error.message`. Executar após Task 4.

### Acceptance Criteria

- [x] **AC1:** Given que as Tasks 1 e 2 foram concluídas, when `tsc --noEmit` é executado na raiz do projeto, then não há erros de tipo relacionados a `Translation` ou propriedades faltando em `en.ts`.

- [x] **AC2:** Given que o usuário selecionou idioma **EN** (via switcher FR|EN), when acessa `/admin/settings`, then os badges na seção "Integrations" exibem **"Configured"** e **"Not configured"** (não "Configuré"/"Non configuré").

- [x] **AC3:** Given que o usuário selecionou idioma **FR**, when acessa `/admin/settings`, then os badges exibem **"Configuré"** e **"Non configuré"** corretamente.

- [x] **AC4:** Given que o usuário selecionou idioma **EN**, when abre o dropdown "Default language" no settings form, then as opções aparecem como **"French"** e **"English"** (não "Français"/"English" misto).

- [x] **AC5:** Given que o usuário selecionou idioma **FR**, when abre o dropdown "Default language", then as opções aparecem como **"Français"** e **"Anglais"**.

- [x] **AC6:** Given que o idioma atual é **FR**, when inspeciona o botão FR|EN no header com DevTools, then `aria-label="Passer en anglais"` (não "Switch to English" hardcoded).

- [x] **AC7:** Given que o idioma atual é **EN**, when inspeciona o botão FR|EN no header, then `aria-label="Switch to French"` (não "Passer en français" hardcoded).

- [x] **AC8:** Given que o server action `updatePlatformSettings` lança erro no catch, when o toast de erro aparece no client, then a mensagem está no idioma atual do usuário (usa `t.adminSettings.saveError`, não a string francesa hardcoded).

## Additional Context

### Dependencies

- Tasks 1 e 2 (`fr.ts` e `en.ts`) devem ser concluídas ANTES de Tasks 3, 4, 5 (dependem das chaves novas)
- Task 6 (`admin-settings-actions.ts`) deve ser concluída em conjunto ou após Task 4 (`settings-form.tsx`) pois ambos tratam do fluxo de erro
- Sem dependências de bibliotecas externas — usa apenas a infraestrutura i18n já existente

### Testing Strategy

**Manual (após implementação):**
1. No browser, selecionar idioma EN via botão FR|EN no header público
2. Navegar para `/admin/settings`
3. Verificar: título, subtítulo, seções General/Access/Integrations, botão Save — tudo em inglês
4. Verificar: dropdown "Default language" mostra "French" e "English"
5. Verificar: badges mostram "Configured" / "Not configured"
6. Trocar para FR — repetir verificações em francês
7. Inspecionar aria-label do botão FR|EN via DevTools em ambos os idiomas

**TypeScript check (automatizado):**
```bash
npx tsc --noEmit
```
Deve passar sem erros após Tasks 1 e 2.

### Notes

- **NÃO** modificar `get-t.ts`, `use-t.ts`, `index.ts`, ou `language-store.ts` — infraestrutura funciona corretamente
- **NÃO** modificar nenhum dos 150+ outros arquivos que já usam getT()/useT() — auditoria confirmou que estão corretos
- O painel /chat ("lead") está 100% traduzido — nenhuma ação necessária
- Os painéis /admin e /expert já têm switcher de idioma no dropdown do usuário (ícone Globe) — funciona via Zustand
- Futura melhoria (fora do escopo): traduzir mensagens de validação Zod em `src/lib/validations/admin.ts`
