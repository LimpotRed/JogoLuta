# Rua 99

Jogo de luta 2D para navegador, inspirado nos arcades de rua e desenvolvido somente com HTML, CSS e JavaScript.

Em uma arena do Distrito Central, Kai enfrenta Rex em uma partida melhor de tres. O jogo combina arte original em Canvas, fisica local, inteligencia artificial, controles para teclado e suporte a toque em celulares.

## Jogar agora

Abra [`index.html`](./index.html) no Chrome, Edge ou Firefox e clique em **Lutar**.

O jogo funciona diretamente no navegador e nao exige instalacao de Java, Node.js ou dependencias externas durante a execucao. Os arquivos necessarios estao incluidos no projeto, portanto ele tambem funciona sem internet.

Tambem e possivel iniciar um servidor local com Node.js:

```bash
npx serve .
```

Depois, abra o endereco exibido no terminal.

## Controles

| Acao | Teclado | Celular |
| --- | --- | --- |
| Mover em quatro direcoes | `W` / `A` / `S` / `D` ou setas | Botoes direcionais |
| Pular | `Espaco` | — |
| Defender | Segurar `Shift` | — |
| Soco | `J` | Botao de soco |
| Chute | `K` | Botao de chute |
| Especial | `L`, com 60% de energia | Botao de especial |
| Pausar/continuar | `P` ou `Esc` | Botao de pausa |
| Reiniciar partida | `R` | Botao de reinicio |
| Som | `M` | Botao de volume |
| Tela cheia | `F` | Botao de tela cheia |

Os controles de ataque aceitam um novo toque ou pressionamento a cada golpe. Movimento e ataque podem ser usados ao mesmo tempo em telas de toque. No teclado, `W`/`S` movem o lutador para cima/baixo na arena, `A`/`D` para os lados; `Espaco` pula e `Shift` defende.

## Regras da partida

- A partida e vencida pelo primeiro lutador a ganhar dois rounds.
- Cada round dura 60 segundos.
- Quando o tempo termina, vence quem tiver mais vida.
- Em caso de empate, o round e repetido.
- A defesa reduz o dano, mas nao bloqueia todo o impacto.
- A energia recarrega com o tempo e ao acertar ou receber golpes.
- O especial causa mais dano, empurra o adversario e consome 60% de energia.
- Vitorias, derrotas e o melhor combo ficam salvos no navegador.
- A dificuldade pode ser alterada entre Tranquilo, Normal e Intenso.

## Funcionalidades

- Arena original em pixel art desenhada com Canvas.
- Dois lutadores com animacoes de movimento, salto, ataque, defesa e nocaute.
- Adversario controlado por inteligencia artificial.
- Fisica de colisao e gravidade com Matter.js.
- Soco, chute, defesa, especial, combos, dano e knockback.
- Efeitos de particulas, tremor de tela e efeitos sonoros sintetizados.
- Interface responsiva para desktop, tablet e celular.
- Modo tela cheia e controles por toque.
- Placar persistente usando `localStorage`.
- Execucao offline com todos os recursos locais.

## Estrutura do projeto

```text
.
|-- index.html                 Interface, layout e estilos
|-- game.js                    Loop da partida, controles e regras
|-- art.js                     Cenario, personagens e efeitos visuais
|-- assets/
|   |-- matter.min.js          Matter.js 0.20.0 em arquivo local
|   |-- icons/                 Icones dos controles
|   |-- MATTER-LICENSE.txt     Licenca do Matter.js
|   `-- LUCIDE-LICENSE.txt     Licenca dos icones Lucide
|-- .gitignore
`-- README.md
```

## Tecnologias

- HTML5
- CSS3
- JavaScript moderno
- Canvas 2D
- Web Audio API
- Matter.js 0.20.0
- Lucide Icons

## Desenvolvimento

Nao ha etapa de build. Para alterar o jogo, edite `index.html`, `game.js` ou `art.js` e recarregue a pagina no navegador.

Para testar a sintaxe dos arquivos JavaScript, use:

```bash
node --check game.js
node --check art.js
```

## Creditos e licencas

O cenario, os personagens e a logica do jogo foram desenvolvidos para este projeto. O motor de fisica utilizado e o [Matter.js](https://brm.io/matter-js/), licenciado sob MIT. Os icones sao fornecidos pelo [Lucide](https://lucide.dev/), licenciado sob ISC.

As licencas completas das dependencias estao disponiveis em [`assets/`](./assets/).
