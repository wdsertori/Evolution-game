# Rumo à Lagoa

Mini RPG evolutivo para mobile. O jogador controla uma criatura que atravessa
biomas hostis e evolui através de eras — peixe, anfíbio, réptil, e (em
desenvolvimento) ave e mamífero.

Jogo em português, feito em React, exportado como um único arquivo `.html`
autocontido (React + Babel standalone + Tailwind via CDN) — não precisa de
build step, servidor ou instalação. Roda offline em qualquer navegador,
incluindo Safari do iPhone abrindo o arquivo local direto pelo app Arquivos.

## Jogar

Abra [`index.html`](./index.html) em qualquer navegador. Pra jogar no
celular: baixe o arquivo e abra pelo app Arquivos (iOS) ou similar.

## Estrutura

- **`rumo-a-lagoa.jsx`** — código-fonte do jogo (componente React único).
  É aqui que as mudanças acontecem.
- **`build.py`** — gera `index.html` a partir do `.jsx`. Rode
  `python3 build.py` sempre que editar o `.jsx`.
- **`index.html`** — o jogo pronto pra jogar/publicar. Gerado pelo
  `build.py`, não deve ser editado à mão.

## Estado atual (18 fases)

- **Era Peixe** (6 fases) — cenário subaquático, objetivo é alcançar corais,
  obstáculos são algas. Evolução: peixe → peixe grande → tubarão.
- **Era Anfíbio** (6 fases) — pântanos e charcos. Evolução: girino com
  pernas → sapo → sapo-boi.
- **Era Réptil** (6 fases) — terrenos rochosos e áridos. Evolução:
  lagartixa → lagarto → jacaré.

Mecânicas: energia (dreno constante, restaurada por água), força e estamina
(cada uma limitada a 10, coletadas via proteína/estamina), força quebra
obstáculos via botão dedicado, estamina aumenta velocidade de movimento e
aciona evolução, vidas extras, pontuação com histórico local, tela inicial
com curiosidades sobre evolução biológica (Darwin e outros), animação de
metamorfose ao final de cada era.

## Roadmap

- Eras Ave e Mamífero (ainda não construídas)
- Futuro mais distante: biomas Futurista (robôs), Pós-apocalíptico
  (cyberpunk) e Alienígena
- Cenários maiores com ícones de 2 blocos de tamanho, começando na era
  Mamífero
- Polimento geral de desenhos e gráficos

## Deploy

`index.html` é o arquivo final — sobe direto pra qualquer hospedagem
estática (basta colocar numa pasta e abrir). Sem dependências de servidor.
