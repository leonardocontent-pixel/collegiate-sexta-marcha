# Collegiate Vendas — Operação Sexta Marcha

Dashboard comercial em Next.js + Supabase, preparado para Vercel, com estética tática/forças especiais inspirada em interfaces de jogos militares modernos.

## O que está pronto

- Login por senha e link mágico
- Primeira ativação em `/bootstrap` para criar o primeiro administrador
- Dashboard principal até a seção **Esquadrão**
- 4 loadouts do executivo
- Upload e corte da foto do rosto para avatar tático estilo “mini crack”
- Esquadrão com ranking, VGV e vendas
- Relatórios com filtros e exportação CSV
- Gestão de usuários, perfil, time, operador vinculado e bloqueio de acesso
- Banco Supabase com RLS, Storage de avatares, views agregadas e dados iniciais
- Layout responsivo para desktop/tablet/mobile

## Supabase já preparado

Este pacote foi conectado ao projeto Supabase:

- Project ref: `uotxeqxwqqpblqgmgbjd`
- Região: São Paulo (`sa-east-1`)
- Schema e seeds já aplicados
- Storage `avatars` já criado
- Security Advisor verificado sem alertas após o hardening

As credenciais públicas estão em `.env.local` para desenvolvimento. Em produção, configure as mesmas variáveis na Vercel.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra:

```text
http://localhost:3000/bootstrap
```

Crie o primeiro administrador. Depois disso, use `/gestao` para convidar e administrar os demais usuários.

## Variáveis da Vercel

Configure em **Project Settings → Environment Variables**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://uotxeqxwqqpblqgmgbjd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_C1DWMw9qnE2F7_BLx0wbdQ_iUf5ViJm
NEXT_PUBLIC_SITE_URL=https://SEU-DOMINIO.vercel.app
```

`NEXT_PUBLIC_SITE_URL` é recomendada para que os links de autenticação retornem ao domínio correto.

## Ajuste obrigatório no Supabase Auth

No Supabase, em **Authentication → URL Configuration**:

1. Defina o **Site URL** com o domínio da Vercel.
2. Adicione às **Redirect URLs**:
   - `https://SEU-DOMINIO.vercel.app/auth/callback`
   - `https://SEU-DOMINIO.vercel.app/bootstrap/promote`
   - para desenvolvimento: `http://localhost:3000/**`

Se usar template de e-mail com `token_hash`, o projeto também contém `/auth/confirm`.

## Deploy na Vercel

Suba a pasta para um repositório Git e importe na Vercel, ou rode:

```bash
npx vercel
npx vercel --prod
```

Depois configure as três variáveis acima e faça novo deploy.

## Estrutura

```text
app/
  (protected)/dashboard
  (protected)/loadout
  (protected)/esquadrao
  (protected)/relatorios
  (protected)/gestao
  login/
  bootstrap/
  auth/
components/
lib/
supabase/migrations/
public/assets/
```

## Segurança

- RLS habilitado em todas as tabelas operacionais.
- Usuário comum só pode editar seu próprio perfil visual/loadout.
- Campos sensíveis de acesso são protegidos por trigger.
- Somente administrador altera perfil, time, vínculo e status de outros usuários.
- O primeiro auto-promotion para admin só funciona enquanto ainda não existir nenhum administrador ativo.
