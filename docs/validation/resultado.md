# Resultado da validação

- Ambiente: Windows, Node 22.13.0, npm 11.16.0.
- Astro: 7.3.2, versão estável consultada no registro npm durante a execução.
- `npm install`: código 0, 277 pacotes adicionados, zero vulnerabilidades. O npm emitiu aviso de revisão de allow-scripts para o postinstall de esbuild; isso não impediu instalação ou build.
- `npm run check`: 27 arquivos, zero erros, zero warnings e zero hints após os ajustes de compatibilidade com Astro/Zod.
- Build final: código 0, `output: static`, 22 páginas HTML em 3,19 segundos, sem erros nem warnings de conteúdo. Saída completa em `build.log`.
- `npm run verify`: oito posts publicados no HTML, cada um com 700–1.000 palavras, oito categorias, 14 vídeos únicos, 476 links internos válidos, SEO, fontes, TOC, RSS, sitemap e robots verificados. Contagem exata e números de cada artigo em `build-report.json`.
- Navegador: 64 verificações passaram. Todas as páginas de conteúdo foram abertas em 390 px e 1440 px sem overflow horizontal. Menu, Escape, resize, FAQ por teclado, ausência de iframe inicial, ativação do iframe por teclado, fallback sem JS, âncoras do sumário, tipografia e contrastes principais verificados.
- Nenhuma falha de JavaScript, requisição local ou resposta externa de erro foi registrada. A resposta do iframe do player foi simulada intencionalmente: o teste garante a criação correta sob interação, não a reprodução externa do vídeo.
- Capturas da home, guia e artigo em celular e desktop foram geradas e inspecionadas. As capturas precedem somente ajustes finais de espaçamento em “More to explore” e de palavras no artigo de preparação; o build final inclui esses ajustes.
- Paginação configurada para dez artigos; com oito na primeira edição existe apenas `/blog/`. O cenário com uma segunda página ainda não foi exercitado no navegador.
- Nenhum deploy, alteração DNS ou compra foi feito.

Rotas presentes: `/`, `/blog/`, os oito `/blog/[slug]/`, os oito `/category/[slug]/`, `/videos/`, `/guide/`, `/about/`, `/404.html`, `/rss.xml`, `/robots.txt`, `/sitemap-index.xml` e `/sitemap-0.xml`.

Pendências de publicação: confirmar domínio definitivo em `astro.config.mjs`, substituir o SVG social temporário por JPG/PNG aprovado e configurar hospedagem/DNS. Limites editoriais e comportamento de relacionados estão registrados em `../editorial-provenance.md`.
