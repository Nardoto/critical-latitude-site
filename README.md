# Critical Latitude

Blog editorial em inglês apresentado por Gwen. Astro 7.3.2, Content Collections em Markdown e saída inteiramente estática. Mantém a identidade do mockup: azul-marinho, creme, laranja, Oswald e Inter. Sem CMS, banco de dados ou framework de UI.

## Estrutura

```text
critical-latitude-site/
  site/                    Projeto Astro publicável
    src/content/posts/     Artigos Markdown
    src/content.config.ts  Schema e categorias permitidas
    src/components/        Menu, cards, player, CTA e listagem
    src/layouts/           HTML compartilhado e SEO
    src/pages/             Rotas estáticas
    src/data/              Vídeos, playlists, categorias e links
    src/styles/            CSS do mockup e estilos do blog
    public/                Logo, favicon e imagem social temporária
    scripts/               Verificações e importação inicial
    dist/                  Resultado de npm run build
  mockup-v1/               HTML/CSS/JS, assets e README originais preservados
  docs/
    canal-youtube.md        Pesquisa original, preservada
    editorial-provenance.md Origem e limites dos artigos
    validation/            Relatórios, capturas e teste de navegador
```

O site atual começa em `site/`. Para consultar a landing page antiga, abra `mockup-v1/index.html`. Nenhum arquivo histórico foi descartado. Publique `site/dist/`, não a raiz deste projeto.

## Rodar no Windows

Requer Node.js 22.12.0 ou superior compatível com Astro. A validação local usou Node 22.13.0 e npm 11.16.0. Use uma versão LTS atual na hospedagem.

```powershell
cd "C:\Users\tharc\Documents\site critical\projetos\critical-latitude-site\site"
npm install
npm run dev
```

Abra o endereço exibido pelo Astro (normalmente `http://localhost:4321`). Para gerar e conferir a versão estática:

```powershell
npm run check
npm run build
npm run verify
npm run preview
```

`npm run build` gera `site/dist/`. `npm run check` verifica tipos e componentes. `npm run verify` confere rotas, artigos, tamanho dos textos, links internos, fontes, SEO, RSS, sitemap e vídeos. O navegador não precisa de Node depois da publicação.

As versões de Astro e integrações estão fixadas em `package.json` e `package-lock.json`. `npm ci` pode ser usado em CI para reproduzir a instalação. O npm 11 pode avisar sobre revisão do script de instalação de `esbuild`; não se aplica aprovação global automática.

## Criar um artigo

1. Copie um `.md` existente de `site/src/content/posts/` para outro arquivo na mesma pasta.
2. Use nome em inglês com letras minúsculas e hífens. `my-new-article.md` gera `/blog/my-new-article/`; mantenha o nome estável depois de publicado. Não use `index` ou `page` como nome.
3. Edite frontmatter e corpo. Use `##` nos títulos que devem entrar no sumário. O template fornece H1, autor, fontes e disclaimer.
4. Rode `npm run check`, `npm run build` e `npm run verify`. Revise em `npm run preview`, depois publique o novo `dist/`.

```yaml
---
title: "A clear, specific article title"
description: "A short description of no more than 160 characters."
pubDate: 2026-09-09
category: earthquakes
videoId: g2595F_iCFA
videoTitle: "California's Most Dangerous Fault Isn't Overdue — USGS Said Something Worse"
sources:
  - label: "Gwen's source document"
    url: https://tinyurl.com/critical26
tags: [Hayward Fault, USGS]
draft: false
---

Opening paragraph.

## A descriptive section heading

Article text.
```

- `title`, `description`, `pubDate`, `category`, `videoId`, `videoTitle`, `sources` e `tags` são obrigatórios. `draft` é booleano, padrão `false`.
- `videoId` é o trecho depois de `v=` em `https://www.youtube.com/watch?v=g2595F_iCFA`, ou depois de `youtu.be/` em um link curto. Tem 11 caracteres; não inclua parâmetros como `&t=30`.
- `sources` recebe objetos `{label, url}`. Use o TinyURL real da descrição quando existir. Não invente um link quando o relatório não o fornece.
- `pubDate` aceita data ISO ou data com horário e fuso. Datas editoriais dos artigos são diferentes das datas dos vídeos. Empates são ordenados pelo nome do arquivo.
- `draft: true` remove o artigo de páginas, categorias, relacionados, RSS e sitemap no próximo build.
- Categorias exatas: `earthquakes`, `volcanoes`, `tsunamis`, `landslides-and-lahars`, `glaciers-and-sea-level`, `extreme-weather`, `infrastructure`, `preparedness`.
- Mantenha o corpo entre 700 e 1.000 palavras, parágrafos curtos, números rastreáveis à fonte e incertezas explícitas. O tempo de leitura é estimado a 220 palavras por minuto, uma convenção de interface.

A home destaca o mais recente e mostra os seis últimos. `/blog/` apresenta dez por página; páginas adicionais surgem em `/blog/page/2/`, `/blog/page/3/` etc. quando houver conteúdo. Não se gera página vazia. Os relacionados priorizam até três artigos da mesma categoria; a primeira edição tem um por categoria e mostra sugestões separadas em “More to explore”.

## Catálogo e produto

`site/src/data/videos.json` contém os 14 vídeos do relatório, com título, ID, duração e data original. Adicione novos registros manualmente e atualize `site/src/data/playlists.ts` se a associação estiver confirmada. As playlists refletem o relatório; outros vídeos aparecem em “More from the channel”, uma vez cada. A home seleciona o vídeo mais recente pela data. Ao ampliar o catálogo além da edição inicial, atualize a contagem descritiva de `/videos/` e a expectativa de 14 vídeos no verificador.

A compra aponta para `https://payhip.com/b/GWENV`. O preço é consultado na Payhip. `/guide/` preserva o tablet e os impressos em CSS; são amostras visuais, não PDFs de produto. Edite a copy em `site/src/pages/guide.astro`.

`site/scripts/import-reference.mjs` foi usado uma vez para migrar o mockup e extrair o inventário. Não faz parte do build. Não o execute depois de editar o catálogo ou o guia, pois regrava esses dois arquivos.

## Publicar

O resultado é HTML/CSS/JavaScript estático. Não instale adaptadores de servidor nem configure SSR.

| Configuração | Cloudflare Pages | Vercel | Netlify |
| --- | --- | --- | --- |
| Projeto | Pages conectado ao Git | Importar projeto Git | Importar projeto Git |
| Root/Base directory ao importar o workspace inteiro | `projetos/critical-latitude-site/site` | `projetos/critical-latitude-site/site` | `projetos/critical-latitude-site/site` |
| Build command | `npm run build` | `npm run build` | `npm run build` |
| Output/Publish directory, relativo à raiz acima | `dist` | `dist` | `dist` |
| Preset | Astro / Static | Astro | Astro |

Se o repositório começar nesta pasta de projeto, use `site` como diretório raiz/base. Se contiver somente o Astro, use `.`. Confirme Node compatível com `package.json` no painel.

Na Cloudflare, escolha **Pages** para este fluxo; não é necessário Worker. Na Vercel e Netlify, revise os valores detectados. Em publicação manual, envie o conteúdo de `site/dist/`, com `index.html` no topo. Não configure redirecionamento de SPA para a home: isso esconderia a 404 real.

Referências oficiais: [Astro na Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/), [Astro na Vercel](https://docs.astro.build/en/guides/deploy/vercel/), [Astro na Netlify](https://docs.astro.build/en/guides/deploy/netlify/).

## Domínio e compartilhamento

1. Troque `site: 'https://criticallatitude.com'` em `site/astro.config.mjs` pelo domínio HTTPS definitivo. É um placeholder, não uma confirmação de propriedade ou DNS.
2. No painel da hospedagem, adicione o domínio em **Custom domains / Domains**. Copie os registros DNS indicados pelo provedor para o registrador/zona DNS; não existe IP fixo universal para este projeto.
3. Escolha a forma canônica, com ou sem `www`, e configure o redirecionamento da alternativa no provedor. Espere a validação DNS e o certificado HTTPS.
4. Faça novo build e publique. Canonicals, JSON-LD, feed, robots e sitemap usam `Astro.site`; mudar apenas DNS não atualiza essas URLs.
5. Abra o domínio, `/rss.xml`, `/sitemap-index.xml`, um post e uma URL inexistente. Confirme que a hospedagem entrega `404.html` para páginas ausentes.

O `og:image` padrão é `/og-default.svg`, um placeholder local com a identidade da marca. Antes da publicação pública, substitua por JPG ou PNG local aprovado de 1200 × 630 e atualize `defaultSocialImage` em `site/src/data/site.ts`; redes sociais podem não renderizar SVG. Posts usam a thumbnail do vídeo como imagem social. Não há foto de Gwen inventada.

As únicas imagens remotas são thumbnails de `img.youtube.com`. As fontes são Google Fonts, Oswald e Inter. O player só cria um iframe `youtube-nocookie.com` após clique ou teclado; sem JavaScript, oferece link para assistir no YouTube. O menu mantém os links acessíveis sem JavaScript. FAQ e sumário usam HTML nativo.

## Evidências e limites

Os oito artigos têm origem e limites em `docs/editorial-provenance.md`. O relatório contém descrições e capítulos completos apenas para cinco vídeos. Thwaites e El Niño são artigos de leitura crítica, sem acrescentar os dados ausentes. Os links de fontes reproduzem o relatório; não são uma auditoria científica independente ou serviço de alertas.

`docs/validation/build-report.json` registra rotas, palavras e números por artigo. `docs/validation/browser-report.json` e as capturas registram a validação local. O teste usa Playwright/Chromium já instalados, sem adicionar dependências ao site:

```powershell
node docs/validation/browser-check.cjs
```

Execute na raiz do projeto. Em outra máquina, ajuste `CL_PLAYWRIGHT_PATH` e `CL_CHROMIUM_PATH` para instalações existentes. O teste usa servidor temporário local e fecha o navegador ao terminar. A abertura do iframe é testada com resposta simulada; verifica o componente, não a disponibilidade de reprodução do YouTube.

Nenhum deploy, alteração DNS, compra ou configuração de conta é realizado pelo build.
