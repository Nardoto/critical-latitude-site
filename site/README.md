# Critical Latitude — Astro

Projeto 100% estático, sem adaptador de servidor, banco, CMS ou framework de UI.

```powershell
npm install
npm run dev
npm run check
npm run build
npm run verify
npm run preview
```

Requer Node.js >=22.12.0. O build é `npm run build`; a saída é `dist`.

Documentação completa: [README do projeto](../README.md), incluindo criação de posts, categorias, vídeos, domínio e publicação em Cloudflare Pages, Vercel e Netlify. Ao importar o workspace inteiro, use `projetos/critical-latitude-site/site` como Root/Base Directory.

Artigos: `src/content/posts/*.md`. Domínio: `astro.config.mjs`. Imagem social temporária: `public/og-default.svg`, configurada em `src/data/site.ts`. O domínio `https://criticallatitude.com` é placeholder.
