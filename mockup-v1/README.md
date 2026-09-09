# Critical Latitude — landing page mockup

Landing page estática em inglês. HTML, um CSS e JavaScript mínimo; sem framework, build, imagens remotas ou dependências. Os únicos recursos externos carregados pela página são Oswald e Inter pelo Google Fonts. Sem conexão, fontes locais substitutas mantêm a página utilizável.

## Abrir

Dê duplo clique em `index.html`. Não é necessário instalar nada nem iniciar servidor. A página funciona por `file://`; navegação, FAQ e links internos também.

## Ajustar antes de vender

- **Preço:** procure `class="product-price` em `index.html` e substitua `$XX` nas duas ocorrências (hero e oferta). O marcador é intencional; não há cobrança neste mockup.
- **Checkout:** procure o comentário `CHECKOUT_URL` e troque `href="#CHECKOUT_URL"` pelo link completo do Gumroad, Lemon Squeezy ou Stripe Payment Link. Remova o parágrafo `id="CHECKOUT_URL"` quando ativar o checkout. Os demais CTAs levam à oferta.
- **Vídeos:** os três thumbnails são composições CSS ilustrativas e apontam para o canal. Troque cada URL de `.video-link` pelo vídeo escolhido e ajuste título/descrição. Não são títulos de vídeos confirmados.
- **Políticas e suporte:** substitua os avisos de Privacy, Terms e Contact no rodapé pelas informações reais. Defina reembolso e atualizações e ajuste as respostas correspondentes do FAQ antes de aceitar compras.
- **Compartilhamento:** adicione `og:url` e `og:image` com URLs absolutas do domínio publicado. Title, description, Open Graph básico e favicon já estão no HTML.
- **Identidade:** a paleta está em `:root` de `css/style.css`; o logo local está em `assets/logo.svg`. As miniaturas do produto são HTML/CSS. Os checklists da seção Preview foram transcritos da referência fornecida; os produtos desenhados são mockups, não arquivos PDF entregáveis.

## Publicar como site estático

Publique a pasta que contém `index.html`, `css/`, `js/` e `assets/logo.svg`. Não é necessário comando de build. A pasta `assets/validation/`, quando presente, contém apenas evidências locais e não precisa ser publicada.

- **Netlify Drop:** entre no painel do Netlify e arraste a pasta do site para a área de publicação manual. O `index.html` deve ficar na raiz do upload.
- **Vercel:** envie esses arquivos a um repositório Git e importe-o. Selecione o preset **Other**, deixe o comando de build vazio e use a raiz do site como diretório de saída. Se importar o workspace inteiro, configure `projetos/critical-latitude-site` como Root Directory.
- **Cloudflare Pages:** crie um projeto Pages com upload direto e envie a pasta ou ZIP do site, com `index.html` na raiz.
- **GitHub Pages:** coloque o conteúdo desta pasta na raiz de um repositório. Em **Settings → Pages**, publique a branch escolhida e a pasta **/(root)**. Os caminhos relativos também funcionam sob o subdiretório do repositório.

Nenhuma publicação ou integração de pagamento é realizada automaticamente.

## Validação local

A pasta `assets/validation/` reúne capturas em 390 px e 1440 px, a prévia dos impressos, `report.json` e o script de verificação. Os testes abrem o `index.html` por `file://`, verificam console, largura, fontes, âncoras, contraste das cores principais, menu, FAQ por teclado e funcionamento sem JavaScript/fontes remotas. `verify.cjs` usa uma instalação existente de Playwright e Chromium desta máquina; ajuste os dois caminhos do início caso queira executá-lo em outro computador. Esse script não é carregado pelo site.
