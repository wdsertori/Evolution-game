import { useState, useEffect, useCallback, useRef } from "react";

// Fixed color tokens used regardless of biome (icons, UI chrome, text).
const WATER = "#2f9bc0";
const WATER_LIGHT = "#a8dced";
const WATER_DARK = "#1c6e8c";
const SAND_DARK = "#c9a86a";
const ROCK_FILL = "#93897b";
const ROCK_DARK = "#5f584f";
const PROTEIN_RED = "#c0392b";
const STEEL = "#8a97a1";
const STAMINA_YELLOW = "#f2b705";
const FISH_BODY = "#f2994a";
const FISH_BODY_DARK = "#c9701f";
const BIG_FISH_BODY = "#d9822b";
const FISH_BELLY = "#fff3e0";
const TEXT_DARK = "#3a2c1d";
const TEXT_MUTED = "#7a6b52";
const UI_PANEL = "#f6f1e4";
const FROG_GREEN = "#5a9450";
const FROG_GREEN_DARK = "#3c6b35";
const FROG_BELLY = "#e8e0b0";
const SNAKE_GREEN = "#6b8a3a";
const SNAKE_DARK = "#3f5522";
const EVOLUTION_COLOR = "#8a5fb0";
const EVOLUTION_LIGHT = "#d9c9ec";
const LIZARD_GREEN = "#7a9c3f";
const LIZARD_GREEN_DARK = "#4f6b28";
const CROC_GREEN = "#57713a";
const CROC_DARK = "#33471f";
const SCORPION_BODY = "#4a2e22";
const CORAL_PINK = "#e8735a";
const CORAL_ORANGE = "#f2a65a";
const ALGAE_GREEN = "#2f8f6a";
const ALGAE_DARK = "#1c5f47";

const key = (x, y) => `${x},${y}`;
const BUILD_TAG = "2026-07-25.7";
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// Vertical wall of rocks along column x, with exactly one passable gap row.
function wall(x, gapY, h) {
  const arr = [];
  for (let y = 0; y < h; y++) {
    if (y === gapY) continue;
    arr.push(`${x},${y}`);
  }
  return arr;
}
// Horizontal wall of rocks along row y, with exactly one passable gap column.
function wallH(y, gapX, w) {
  const arr = [];
  for (let x = 0; x < w; x++) {
    if (x === gapX) continue;
    arr.push(`${x},${y}`);
  }
  return arr;
}

function seededRandom(x, y, seed) {
  const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

// Roadmap de eras futuras (ainda não implementadas): Ave, Mamífero,
// e depois disso três biomas extras já cogitados: Futurista (robôs),
// Pós-apocalíptico (cyberpunk), Alienígena.
const LEVELS = [
  {
    name: "Recife Raso",
    w: 7, h: 5,
    start: { x: 0, y: 2 }, goal: { x: 6, y: 2 },
    rocks: ["2,0", "2,1", "2,3", "2,4", "4,0", "4,2", "4,4"],
    items: { "1,0": "water", "5,4": "water", "3,2": "protein", "0,4": "stamina", "1,4": "stamina" },
    hazards: [],
    era: "peixe", creatureEra: "peixe", goalType: "coral", obstacleType: "algae",
  },
  {
    name: "Canal Raso",
    w: 8, h: 5,
    start: { x: 0, y: 2 }, goal: { x: 7, y: 2 },
    rocks: ["2,0", "2,1", "2,2", "2,4", "5,0", "5,1", "5,3", "5,4"],
    items: { "0,0": "water", "1,1": "stamina", "3,0": "stamina", "4,2": "water", "6,0": "protein", "6,4": "protein" },
    hazards: [],
    era: "peixe", creatureEra: "peixe", goalType: "coral", obstacleType: "algae",
  },
  {
    name: "Corredor de Corais",
    w: 8, h: 6,
    start: { x: 0, y: 3 }, goal: { x: 7, y: 3 },
    rocks: ["2,0", "2,1", "2,3", "2,4", "2,5", "4,0", "4,1", "4,2", "4,4", "4,5", "6,0", "6,2", "6,3", "6,4", "6,5"],
    items: { "1,4": "water", "3,1": "protein", "5,0": "stamina", "6,5": "water", "7,0": "protein", "3,5": "stamina" },
    hazards: [{ axis: "x", fixed: 2, min: 0, max: 7, pos: 1, dir: 1, kind: "hook" }],
    era: "peixe", creatureEra: "peixe", goalType: "coral", obstacleType: "algae",
  },
  {
    name: "Raízes do Mangue",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 14, y: 5 },
    rocks: [...wall(9, 3, 11), ...wall(12, 8, 11)],
    items: { "2,2": "water", "12,1": "water", "5,9": "protein", "1,8": "stamina", "13,9": "stamina", "2,6": "water", "7,6": "water", "7,9": "protein" },

    hazards: [
      { axis: "x", fixed: 5, min: 1, max: 13, pos: 3, dir: 1, kind: "hook" },
      { axis: "y", fixed: 9, min: 0, max: 10, pos: 2, dir: 1, kind: "hook" },
    ],
    era: "peixe", creatureEra: "peixe", goalType: "coral", obstacleType: "algae",
  },
  {
    name: "Fundo do Pântano",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 0, y: 5 },
    rocks: [...wall(5, 2, 11), ...wall(2, 7, 11)],
    items: { "10,9": "water", "9,1": "stamina", "3,4": "protein", "1,9": "water", "12,3": "stamina", "8,6": "water", "11,4": "water", "14,5": "stamina" },

    hazards: [
      { axis: "x", fixed: 5, min: 0, max: 13, pos: 6, dir: 1, kind: "hook" },
      { axis: "y", fixed: 4, min: 0, max: 10, pos: 3, dir: -1, kind: "hook" },
    ],
    era: "peixe", creatureEra: "peixe", goalType: "coral", obstacleType: "algae",
  },
  {
    name: "Vulcão Adormecido",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 7, y: 10 },
    rocks: [...wallH(7, 10, 15), ...wallH(9, 4, 15)],
    items: { "2,3": "water", "12,8": "water", "7,2": "protein", "4,9": "stamina", "11,3": "stamina", "2,8": "water", "10,0": "water", "14,0": "protein" },

    hazards: [
      { axis: "y", fixed: 7, min: 0, max: 10, pos: 1, dir: 1, kind: "hook" },
      { axis: "x", fixed: 5, min: 1, max: 13, pos: 5, dir: 1, kind: "hook" },
      { axis: "x", fixed: 8, min: 1, max: 13, pos: 9, dir: -1, kind: "hook" },
    ],
    // última fase do peixe: uma fresta vulcânica no fundo do mar vira cromossomo — o portal da metamorfose
    era: "peixe", creatureEra: "peixe", goalType: "chromosome", obstacleType: "algae",
  },
  {
    name: "Margem do Riacho",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 14, y: 5 },
    rocks: [...wall(9, 3, 11), ...wall(12, 8, 11)],
    items: { "2,2": "water", "12,1": "water", "5,9": "protein", "1,8": "stamina", "13,9": "stamina", "4,6": "water", "0,3": "water", "4,1": "stamina" },

    hazards: [
      { axis: "x", fixed: 5, min: 1, max: 13, pos: 3, dir: 1, kind: "hook" },
      { axis: "y", fixed: 9, min: 0, max: 10, pos: 2, dir: 1, kind: "hook" },
    ],
    // fase de metamorfose: ainda toda dentro d'água, mas o objetivo é alcançar a margem
    era: "anfibio", creatureEra: "peixe", goalType: "shore",
  },
  {
    name: "Brejo Raso",
    w: 15, h: 11,
    start: { x: 0, y: 5 }, goal: { x: 14, y: 5 },
    rocks: [...wall(4, 2, 11), ...wall(8, 7, 11), ...wall(11, 4, 11)],
    items: { "2,8": "water", "9,1": "water", "6,9": "protein", "1,1": "stamina", "13,7": "stamina", "9,0": "water", "13,0": "water", "1,4": "protein" },

    hazards: [
      { axis: "x", fixed: 5, min: 1, max: 13, pos: 2, dir: 1, kind: "snake" },
      { axis: "y", fixed: 8, min: 0, max: 10, pos: 3, dir: 1, kind: "snake" },
    ],
    era: "anfibio", creatureEra: "anfibio", goalType: "pond",
  },
  {
    name: "Vala de Lama",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 0, y: 5 },
    rocks: [...wall(5, 2, 11), ...wall(2, 7, 11)],
    items: { "10,9": "water", "9,1": "stamina", "3,4": "protein", "1,9": "water", "12,3": "stamina", "4,7": "water", "8,3": "water", "12,4": "stamina" },

    hazards: [
      { axis: "x", fixed: 5, min: 0, max: 13, pos: 6, dir: 1, kind: "snake" },
      { axis: "y", fixed: 4, min: 0, max: 10, pos: 3, dir: -1, kind: "snake" },
      { axis: "x", fixed: 8, min: 1, max: 13, pos: 4, dir: 1, kind: "snake" },
    ],
    era: "anfibio", creatureEra: "anfibio", goalType: "pond",
  },
  {
    name: "Charco Denso",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 7, y: 10 },
    rocks: [...wallH(7, 10, 15), ...wallH(9, 4, 15)],
    items: { "2,3": "water", "12,8": "water", "7,2": "protein", "4,9": "stamina", "11,3": "stamina", "6,0": "water", "8,2": "water", "1,6": "protein" },

    hazards: [
      { axis: "y", fixed: 7, min: 0, max: 10, pos: 1, dir: 1, kind: "snake" },
      { axis: "x", fixed: 5, min: 1, max: 13, pos: 5, dir: 1, kind: "snake" },
      { axis: "x", fixed: 8, min: 1, max: 13, pos: 9, dir: -1, kind: "snake" },
    ],
    era: "anfibio", creatureEra: "anfibio", goalType: "pond",
  },
  {
    name: "Pântano Profundo",
    w: 15, h: 11,
    start: { x: 0, y: 5 }, goal: { x: 14, y: 5 },
    rocks: [...wall(3, 1, 11), ...wall(6, 6, 11), ...wall(9, 3, 11), ...wall(12, 8, 11)],
    items: { "1,9": "water", "13,1": "water", "7,9": "protein", "4,0": "stamina", "10,10": "stamina", "5,2": "water", "2,8": "water", "7,3": "stamina" },

    hazards: [
      { axis: "x", fixed: 4, min: 1, max: 13, pos: 3, dir: 1, kind: "snake" },
      { axis: "y", fixed: 7, min: 0, max: 10, pos: 6, dir: -1, kind: "snake" },
      { axis: "x", fixed: 8, min: 1, max: 13, pos: 9, dir: -1, kind: "snake" },
      { axis: "y", fixed: 10, min: 0, max: 10, pos: 2, dir: 1, kind: "snake" },
    ],
    era: "anfibio", creatureEra: "anfibio", goalType: "pond",
  },
  {
    name: "Poça Ancestral",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 7, y: 0 },
    rocks: [...wallH(3, 10, 15), ...wallH(1, 4, 15)],
    items: { "2,8": "water", "12,2": "water", "7,8": "protein", "1,3": "stamina", "13,6": "stamina", "13,8": "water", "12,5": "water", "5,10": "protein" },

    hazards: [
      { axis: "x", fixed: 4, min: 1, max: 13, pos: 2, dir: 1, kind: "snake" },
      { axis: "y", fixed: 10, min: 0, max: 8, pos: 3, dir: 1, kind: "snake" },
      { axis: "x", fixed: 7, min: 1, max: 13, pos: 8, dir: -1, kind: "snake" },
      { axis: "y", fixed: 2, min: 0, max: 8, pos: 5, dir: -1, kind: "snake" },
    ],
    // última fase do anfíbio: outra vez o cromossomo — prenúncio do réptil
    era: "anfibio", creatureEra: "anfibio", goalType: "chromosome",
  },
  {
    name: "Lodo Rachado",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 7, y: 10 },
    rocks: [...wallH(7, 10, 15), ...wallH(9, 4, 15)],
    items: { "2,3": "water", "12,8": "water", "7,2": "protein", "4,9": "stamina", "11,3": "stamina", "14,2": "water", "14,4": "water", "6,6": "stamina" },

    hazards: [
      { axis: "y", fixed: 7, min: 0, max: 10, pos: 1, dir: 1, kind: "snake" },
      { axis: "x", fixed: 5, min: 1, max: 13, pos: 5, dir: 1, kind: "snake" },
      { axis: "x", fixed: 8, min: 1, max: 13, pos: 9, dir: -1, kind: "snake" },
    ],
    // fase de metamorfose: mesmo charco de antes, mas secando — o objetivo agora é a toca na pedra
    era: "reptil", creatureEra: "anfibio", goalType: "toca",
  },
  {
    name: "Pedregal Ardente",
    w: 15, h: 11,
    start: { x: 0, y: 5 }, goal: { x: 14, y: 5 },
    rocks: [...wall(4, 3, 11), ...wall(9, 7, 11)],
    items: { "2,8": "water", "2,1": "stamina", "6,9": "protein", "11,1": "water", "12,3": "stamina", "11,5": "water", "14,10": "water", "0,0": "protein" },

    hazards: [
      { axis: "x", fixed: 5, min: 1, max: 13, pos: 3, dir: 1, kind: "scorpion" },
      { axis: "y", fixed: 7, min: 0, max: 10, pos: 2, dir: 1, kind: "scorpion" },
    ],
    era: "reptil", creatureEra: "reptil", goalType: "toca",
  },
  {
    name: "Fenda Seca",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 0, y: 5 },
    rocks: [...wall(5, 4, 11), ...wall(2, 3, 11)],
    items: { "10,9": "water", "9,1": "stamina", "3,7": "protein", "1,9": "water", "12,2": "stamina", "3,2": "water", "4,4": "water", "12,9": "stamina" },

    hazards: [
      { axis: "x", fixed: 5, min: 0, max: 13, pos: 6, dir: 1, kind: "scorpion" },
      { axis: "y", fixed: 5, min: 0, max: 10, pos: 3, dir: -1, kind: "scorpion" },
      { axis: "x", fixed: 8, min: 1, max: 13, pos: 4, dir: 1, kind: "scorpion" },
    ],
    era: "reptil", creatureEra: "reptil", goalType: "toca",
  },
  {
    name: "Duna de Ossos",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 7, y: 0 },
    rocks: [...wallH(2, 6, 15), ...wallH(5, 11, 15), ...wallH(8, 3, 15)],
    items: { "2,3": "water", "12,8": "water", "7,9": "protein", "4,1": "stamina", "11,7": "stamina", "10,1": "water", "5,4": "water", "3,7": "protein" },

    hazards: [
      { axis: "y", fixed: 7, min: 0, max: 10, pos: 1, dir: 1, kind: "scorpion" },
      { axis: "x", fixed: 4, min: 1, max: 13, pos: 5, dir: 1, kind: "scorpion" },
      { axis: "x", fixed: 9, min: 1, max: 13, pos: 9, dir: -1, kind: "scorpion" },
    ],
    era: "reptil", creatureEra: "reptil", goalType: "toca",
  },
  {
    name: "Muralha Rochosa",
    w: 15, h: 11,
    start: { x: 0, y: 5 }, goal: { x: 14, y: 5 },
    rocks: [...wall(3, 4, 11), ...wall(6, 2, 11), ...wall(9, 8, 11), ...wall(12, 5, 11)],
    items: { "1,9": "water", "13,1": "water", "7,3": "protein", "4,9": "stamina", "10,1": "stamina", "14,1": "water", "0,7": "water", "14,0": "stamina" },

    hazards: [
      { axis: "x", fixed: 4, min: 1, max: 13, pos: 3, dir: 1, kind: "scorpion" },
      { axis: "y", fixed: 6, min: 0, max: 10, pos: 2, dir: -1, kind: "scorpion" },
      { axis: "x", fixed: 8, min: 1, max: 13, pos: 9, dir: -1, kind: "scorpion" },
      { axis: "y", fixed: 12, min: 0, max: 10, pos: 5, dir: 1, kind: "scorpion" },
    ],
    era: "reptil", creatureEra: "reptil", goalType: "toca",
  },
  {
    name: "Cume Escaldante",
    w: 15, h: 11,
    start: { x: 7, y: 5 }, goal: { x: 14, y: 5 },
    rocks: [...wall(5, 7, 11), ...wall(10, 3, 11)],
    items: { "2,2": "water", "12,8": "water", "7,1": "protein", "3,9": "stamina", "13,4": "stamina", "12,0": "water", "4,6": "water", "6,3": "protein" },

    hazards: [
      { axis: "x", fixed: 5, min: 1, max: 13, pos: 2, dir: 1, kind: "scorpion" },
      { axis: "y", fixed: 10, min: 0, max: 10, pos: 8, dir: -1, kind: "scorpion" },
      { axis: "x", fixed: 8, min: 1, max: 13, pos: 10, dir: -1, kind: "scorpion" },
      { axis: "y", fixed: 5, min: 0, max: 10, pos: 3, dir: 1, kind: "scorpion" },
    ],
    // última fase do réptil: cromossomo de novo — prenúncio da ave
    era: "reptil", creatureEra: "reptil", goalType: "chromosome",
  },
];

const THEMES = [
  { name: "Recife Raso", pageBg: "#7fc4d4", cellBg: "#a9dbe6", decorColor: "#2f8fa8", decorVariant: "algae" },
  { name: "Canal Raso", pageBg: "#6bb0c9", cellBg: "#97cfe0", decorColor: "#276f88", decorVariant: "algae" },
  { name: "Corredor de Corais", pageBg: "#4f96b5", cellBg: "#7ec0d6", decorColor: "#1f6f85", decorVariant: "algae" },
  { name: "Raízes do Mangue", pageBg: "#5a9a82", cellBg: "#86bfa8", decorColor: "#2f5f4a", decorVariant: "algae" },
  { name: "Fundo do Pântano", pageBg: "#46786a", cellBg: "#6fa08f", decorColor: "#1f4438", decorVariant: "algae" },
  { name: "Vulcão Adormecido", pageBg: "#2f4a5e", cellBg: "#4f7086", decorColor: "#d97a3a", decorVariant: "algae" },
  { name: "Margem do Riacho", pageBg: "#a9c9c2", cellBg: "#c3ded8", decorColor: "#4f8f7d", decorVariant: "grass" },
  { name: "Brejo Raso", pageBg: "#b7c48f", cellBg: "#cdd8a8", decorColor: "#5f7a3a", decorVariant: "grass" },
  { name: "Vala de Lama", pageBg: "#a8a077", cellBg: "#c2ba95", decorColor: "#6b5a35", decorVariant: "grass" },
  { name: "Charco Denso", pageBg: "#8fa877", cellBg: "#a9c090", decorColor: "#3f5a2a", decorVariant: "grass" },
  { name: "Pântano Profundo", pageBg: "#7c9270", cellBg: "#96a988", decorColor: "#33472a", decorVariant: "grass" },
  { name: "Poça Ancestral", pageBg: "#9a8fae", cellBg: "#b6adc4", decorColor: "#5f4f7a", decorVariant: "grass" },
  { name: "Lodo Rachado", pageBg: "#b3a06e", cellBg: "#c9b98c", decorColor: "#8a6b3f", decorVariant: "crack" },
  { name: "Pedregal Ardente", pageBg: "#d98c5a", cellBg: "#e8ab7d", decorColor: "#a85a2e", decorVariant: "boulder" },
  { name: "Fenda Seca", pageBg: "#c97b5a", cellBg: "#dc9c7c", decorColor: "#8a4a2e", decorVariant: "crack" },
  { name: "Duna de Ossos", pageBg: "#ddc9a0", cellBg: "#ede0c0", decorColor: "#b3986a", decorVariant: "dune" },
  { name: "Muralha Rochosa", pageBg: "#a89184", cellBg: "#c2ada0", decorColor: "#6b5347", decorVariant: "boulder" },
  { name: "Cume Escaldante", pageBg: "#c26b4a", cellBg: "#dd8f6a", decorColor: "#8a3a22", decorVariant: "boulder" },
];

// Curiosidades e citações sobre evolução, exibidas aleatoriamente na tela
// inicial e entre fases — um jeito de sugerir a ideia do jogo sem entregá-la.
const CURIOSITIES = [
  "Há cerca de 375 milhões de anos, um peixe chamado Tiktaalik já tinha algo parecido com um pescoço — e isso mudou tudo.",
  "Os primeiros vertebrados a pisar em terra firme ainda respiravam boa parte do tempo dentro d'água.",
  "Nadadeiras carnudas, como as do celacanto, guardam os primeiros esboços do que um dia seriam patas.",
  "O ar tem cerca de 20 vezes mais oxigênio disponível que a água — uma vantagem e tanto pra quem ousasse sair dela.",
  "Peixes pulmonados conseguem sobreviver fora d'água por meses, enterrados na lama, esperando a próxima chuva.",
  "A palavra 'evolução' nem aparece na primeira edição de 'A Origem das Espécies', de 1859.",
  "Charles Darwin passou quase 20 anos revisando sua teoria antes de publicá-la.",
  "\"Não é a espécie mais forte que sobrevive, nem a mais inteligente, mas a que melhor se adapta\" — frase famosa, embora nunca escrita por Darwin.",
  "A expressão 'sobrevivência do mais apto' foi cunhada por Herbert Spencer, não por Darwin.",
  "Alfred Russel Wallace chegou às mesmas conclusões que Darwin, quase ao mesmo tempo, do outro lado do mundo.",
  "Toda vida na Terra compartilha o mesmo código genético básico — sinal de uma origem em comum.",
  "\"Nada em Biologia faz sentido, exceto à luz da evolução.\" — Theodosius Dobzhansky.",
  "Baleias têm ossos residuais de patas traseiras, herança de ancestrais que andavam em terra.",
  "O olho humano e o do polvo evoluíram de formas completamente independentes — e ainda assim se parecem.",
  "Mutação, seleção, deriva genética: às vezes uma espécie muda sem nenhum motivo além do acaso.",
  "Cerca de 99% de todas as espécies que já existiram estão extintas hoje.",
  "A evolução não tem direção nem objetivo final — só respostas ao ambiente de cada época.",
  "Thomas Huxley defendia Darwin com tanta força que ganhou o apelido de 'o buldogue de Darwin'.",
  "Jean-Baptiste Lamarck propôs uma teoria da evolução décadas antes de Darwin — errada em boa parte, mas pioneira.",
  "Ernst Haeckel resumiu uma ideia, hoje considerada simplificada demais, em uma frase: 'a ontogenia recapitula a filogenia'.",
  "Anfíbios foram os primeiros vertebrados a desenvolver pulmões funcionais pra respirar fora d'água.",
  "A pele de um sapo é tão permeável que ele também 'bebe' água através dela.",
  "O nome 'anfíbio' vem do grego e significa, literalmente, 'as duas vidas' — a aquática e a terrestre.",
  "Girinos têm guelras; ao virarem adultos, muitos as perdem para sempre.",
  "Existem sapos capazes de congelar quase por completo no inverno e voltar à vida na primavera.",
  "O ovo com casca resistente à seca foi uma das invenções mais importantes da história da vida terrestre.",
  "Alguns vertebrados foram os primeiros a se libertar completamente da necessidade de viver perto da água.",
  "Escamas de queratina ajudam certos animais a reter água no corpo — mais um passo rumo à vida na terra seca.",
  "Há espécies que regulam a própria temperatura com o ambiente, por isso costumam tomar sol pela manhã.",
  "Algumas lagartixas conseguem soltar a própria cauda pra escapar de um predador.",
  "A vida na Terra tem cerca de 3,7 bilhões de anos; os primeiros vertebrados só surgiram bem depois, há 500 milhões.",
  "Toda espécie viva hoje é, tecnicamente, tão evoluída quanto qualquer outra — só que de formas diferentes.",
  "Evolução convergente é quando espécies sem parentesco chegam a soluções parecidas, como golfinhos e tubarões.",
  "Órgãos vestigiais, como o apêndice humano, são pistas físicas de um passado evolutivo diferente.",
  "Uma espécie pode levar milhares de gerações pra mudar de forma perceptível — ou só algumas, sob pressão forte.",
  "\"A evolução é um fato, não uma opinião\" — resumo comum entre biólogos, mesmo quando os detalhes ainda são debatidos.",
  "Richard Dawkins popularizou a ideia do 'gene egoísta': o que se propaga não é o indivíduo, é a informação genética.",
  "Stephen Jay Gould defendia que a evolução avança aos saltos, com longos períodos de calmaria entre eles.",
  "Lynn Margulis propôs que células complexas surgiram da fusão entre organismos simples — hoje uma teoria aceita.",
  "Carl Sagan gostava de lembrar que somos, literalmente, feitos de poeira de estrelas antigas.",
  "As tentilhões das Ilhas Galápagos tinham bicos tão diferentes entre si que ajudaram Darwin a formular sua teoria.",
  "Darwin viajou cinco anos a bordo do navio HMS Beagle antes de começar a rascunhar sua teoria.",
  "Mariposas de Manchester escureceram de cor durante a Revolução Industrial — evolução acontecendo à vista, em décadas.",
  "Bactérias resistentes a antibióticos são um exemplo de seleção natural agindo em tempo real, hoje mesmo.",
  "Cães são todos, geneticamente, a mesma espécie que o lobo — só moldados por milênios de seleção humana.",
  "O DNA de humanos e chimpanzés é cerca de 98% idêntico.",
  "Fósseis de transição, como o de Tiktaalik, são raros — mas cada um preenche um capítulo perdido da história da vida.",
  "Especiação é o processo pelo qual uma população se divide até virar duas espécies distintas.",
  "Ilhas isoladas costumam gerar espécies únicas — foi assim com os tentilhões, as tartarugas e as iguanas de Galápagos.",
  "A seleção natural não escolhe o 'melhor' organismo — só o que deixa mais descendentes naquele ambiente específico.",
  "Alfred Russel Wallace escreveu sobre seleção natural enquanto se recuperava de malária na Indonésia.",
  "Gregor Mendel descobriu as leis da hereditariedade estudando ervilhas — sem nunca saber da existência do DNA.",
  "A teoria da evolução e a genética só se uniram décadas depois de Darwin, na chamada 'síntese moderna'.",
  "Extremófilos são organismos capazes de viver em fontes vulcânicas, gelo polar ou até dentro de rochas.",
  "Existem mais bactérias em um grama de solo do que estrelas visíveis a olho nu no céu noturno.",
  "A evolução não 'planeja' nada — ela reage ao que já existe, improvisando com o material disponível.",
  "Um mesmo osso do braço humano corresponde ao osso da nadadeira de uma baleia e à asa de um morcego.",
  "Órgãos homólogos, como esses, são uma das provas mais fortes de ancestralidade comum entre espécies.",
  "Estruturas análogas, como as asas de um inseto e as de um pássaro, evoluíram de formas independentes.",
  "Darwin hesitou tanto em publicar sua teoria que quase foi superado por Wallace, que chegou à mesma ideia sozinho.",
  "A expressão 'elo perdido' é enganosa: não existe um único elo — existem milhares de espécies de transição.",
  "O peixe-pulmonado australiano é considerado um dos parentes vivos mais próximos dos primeiros tetrápodes.",
  "Uma população pequena e isolada tende a evoluir mais rápido que uma população grande e espalhada.",
  "A deriva genética pode mudar uma espécie inteira só por acaso, sem nenhuma vantagem envolvida.",
  "O naturalista Georges Cuvier defendia o catastrofismo — a ideia de que extinções em massa moldaram a vida na Terra.",
  "Charles Lyell, geólogo, convenceu Darwin de que a Terra era velha o bastante pra evolução lenta acontecer.",
  "Darwin chamou sua própria teoria de 'descendência com modificação' — o termo 'evolução' só pegou depois.",
  "Uma crista dorsal pode servir tanto pra regular temperatura quanto pra impressionar um parceiro.",
  "Metamorfose completa, como a de um girino virando sapo, reorganiza quase todo o corpo do animal.",
  "Nem toda mudança evolutiva é lenta: algumas espécies mudam de geração em geração, sob pressão intensa.",
  "O conceito de 'espécie' é mais confuso do que parece — biólogos discutem suas definições até hoje.",
  "A vida pode ter começado em poças de maré, respingadas por ondas e secadas pelo sol, repetidas vezes.",
  "Sapos-boi engolem presas quase do próprio tamanho, graças a uma mordida surpreendentemente forte.",
  "Escorpiões existem, quase sem mudar de forma, há mais de 400 milhões de anos.",
  "Cobras perderam as patas ao longo da evolução — mas algumas espécies ainda carregam ossos residuais de quadril.",
  "Certos répteis de hoje se parecem muito com fósseis de 200 milhões de anos atrás — evolução nem sempre significa mudança rápida.",
  "A força de mordida de um jacaré está entre as mais fortes do reino animal.",
  "Proteína é o material de construção do corpo — mais dela, mais força e crescimento físico.",
  "Estamina não é só resistência: é também o motor por trás de mudanças no próprio corpo.",
  "'Evolução' e 'progresso' não são sinônimos — adaptar-se ao ambiente não significa ficar 'melhor', só mais apto ali.",
  "Um mesmo ambiente pode empurrar espécies diferentes rumo a soluções parecidas, repetidas vezes na história da vida.",
  "A cada extinção em massa, a vida se reorganizou e ocupou espaços deixados vazios por quem não sobreviveu.",
  "Joseph Hooker foi um dos primeiros amigos de Darwin a conhecer sua teoria, ainda em segredo.",
  "Darwin adiou tanto a publicação de sua teoria que chegou a se referir a ela como 'confessar um assassinato'.",
  "A seleção sexual, outra ideia de Darwin, explica enfeites exagerados, como a cauda de um pavão.",
  "Répteis, aves e mamíferos compartilham um ancestral comum entre os primeiros tetrápodes terrestres.",
  "Cada fase de uma jornada evolutiva carrega, sem saber, as sementes da próxima.",
  "Água doce, água salgada, lama, areia: o ambiente sempre escreveu boa parte da história de cada espécie.",
  "Nem toda transformação é visível de imediato — genes podem mudar gerações antes que o corpo acompanhe.",
  "A vida encontrou pelo menos duas formas independentes de sair da água e conquistar a terra firme.",
  "Alguns cientistas do século 19 resistiram à teoria de Darwin décadas depois de ela ser amplamente aceita.",
  "O termo 'darwinismo' já era usado ainda em vida do próprio Darwin, a partir de 1860.",
  "A seleção natural age sobre o que já existe — nunca cria uma característica totalmente do zero.",
  "A resistência de um organismo a um ambiente hostil pode ser a diferença entre extinção e sobrevivência da espécie.",
  "Épocas de fartura e épocas de escassez moldam a evolução de formas opostas — mas igualmente decisivas.",
  "Toda espécie viva é, de certa forma, uma resposta bem-sucedida — até agora — às pressões do seu tempo.",
  "Uma jornada evolutiva raramente segue um caminho reto — costuma ser cheia de becos sem saída e recomeços.",
  "O mesmo impulso que tira um peixe da água pode, com tempo suficiente, reescrever toda a sua anatomia.",
  "Nem todo mundo que atravessa um ambiente hostil sai do outro lado exatamente como entrou.",
];

// The camera window never shows more than CAP_W x CAP_H cells at once.
const CELL = 44;
const CAP_W = 8;
const CAP_H = 6;
const CELL_ICON_SIZE = 34; // ícones de objetivo/obstáculo/item, preenchendo melhor a célula maior
const PLAYER_ICON_SIZE = 38; // a criatura fica um pouco maior que os demais ícones, pra dar destaque

// The base creature artwork points LEFT (west). Rotation alone handles every
// angle except due-east, which mirrors instead of rotating 180° (avoids an
// upside-down "belly up" look).
const FACING_TRANSFORM = {
  w: "scaleX(1)",
  nw: "rotate(45deg)",
  n: "rotate(90deg)",
  ne: "scaleX(-1) rotate(-45deg)",
  e: "scaleX(-1)",
  se: "scaleX(-1) rotate(45deg)",
  s: "rotate(-90deg)",
  sw: "rotate(-45deg)",
};
const DIR_TO_FACING = {
  "-1,0": "w", "-1,-1": "nw", "0,-1": "n", "1,-1": "ne",
  "1,0": "e", "1,1": "se", "0,1": "s", "-1,1": "sw",
};
const FACING_TO_DIR = {
  w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1],
  e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1],
};

// ---------- Icons ----------
function FishIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M4 16 C9 8, 20 8, 26 12 L30 8 L28 16 L30 24 L26 20 C20 24, 9 24, 4 16 Z" fill={FISH_BODY} stroke="black" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 18 C10 21, 16 21, 20 19" stroke={FISH_BELLY} strokeWidth="1.6" fill="none" />
      <path d="M8 15 C12 12, 18 12, 22 13" stroke={WATER} strokeWidth="1.2" fill="none" opacity="0.8" />
      <circle cx="10" cy="14" r="1.4" fill="black" />
      <path d="M14 16 L20 14 M14 16 L20 18" stroke={FISH_BODY_DARK} strokeWidth="1" fill="none" />
    </svg>
  );
}
function BigFishIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M2 18 C5 7, 23 7, 29 13 L31 9 L30 18 L31 27 L29 23 C23 29, 5 29, 2 18 Z" fill={BIG_FISH_BODY} stroke="black" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 7 L16 1 L19 8 Z" fill={BIG_FISH_BODY} stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 12 L27 14 M7 16 L26 17 M8 20 L25 20" stroke={FISH_BODY_DARK} strokeWidth="1" opacity="0.6" fill="none" />
      <path d="M5 21 C10 24, 17 24, 22 22" stroke={FISH_BELLY} strokeWidth="1.8" fill="none" />
      <circle cx="9" cy="15" r="2" fill="black" />
      <circle cx="9.6" cy="14.4" r="0.6" fill="white" />
    </svg>
  );
}
function SharkIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M1 18 C4 9, 15 6, 25 9 C29 10, 31 14, 31 17 C31 18, 27 17, 24 18 C15 23, 4 24, 1 18 Z" fill={STEEL} stroke="black" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 9 L16 1 L19 9 Z" fill={STEEL} stroke="black" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M27 12 L31 6 L29 16 Z" fill={STEEL} stroke="black" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="6" cy="15" r="1.3" fill="black" />
      <path d="M4 19 L10 17" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}
function TadpoleLegsIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M6 16 C6 9, 12 6, 17 7 C23 8, 27 12, 27 16 C27 20, 23 20, 19 18 C13 22, 6 22, 6 16 Z" fill={FROG_GREEN} stroke="black" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.6" fill="black" />
      <path d="M20 20 C20 22, 18 23, 17 25 M23 19 C24 21, 24 23, 23 25" stroke={FROG_GREEN_DARK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function FrogIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <ellipse cx="15" cy="18" rx="12" ry="8" fill={FROG_GREEN} stroke="black" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="4" fill={FROG_GREEN} stroke="black" strokeWidth="1.4" />
      <circle cx="18" cy="9" r="3.4" fill={FROG_GREEN} stroke="black" strokeWidth="1.4" />
      <circle cx="9" cy="10" r="1.3" fill="black" />
      <circle cx="18" cy="9" r="1.1" fill="black" />
      <path d="M6 22 C6 22, 3 25, 1 24 M24 22 C24 22, 28 24, 30 22" stroke={FROG_GREEN_DARK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M8 20 C12 22, 18 22, 21 20" stroke={FROG_BELLY} strokeWidth="1.6" fill="none" />
    </svg>
  );
}
function GiantToadIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <ellipse cx="15" cy="19" rx="14" ry="9" fill={FROG_GREEN_DARK} stroke="black" strokeWidth="1.8" />
      <circle cx="8" cy="9" r="4.6" fill={FROG_GREEN_DARK} stroke="black" strokeWidth="1.6" />
      <circle cx="19" cy="8" r="4" fill={FROG_GREEN_DARK} stroke="black" strokeWidth="1.6" />
      <circle cx="8" cy="9" r="1.5" fill="black" />
      <circle cx="19" cy="8" r="1.3" fill="black" />
      <circle cx="5" cy="18" r="1" fill={FROG_GREEN} /><circle cx="12" cy="23" r="1" fill={FROG_GREEN} />
      <circle cx="20" cy="22" r="1" fill={FROG_GREEN} /><circle cx="25" cy="16" r="1" fill={FROG_GREEN} />
      <path d="M4 23 C3 26, 1 28, -1 28 M26 23 C28 25, 30 27, 31 27" stroke="black" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M9 21 C13 23, 19 23, 22 21" stroke={FROG_BELLY} strokeWidth="1.8" fill="none" />
    </svg>
  );
}
function GeckoIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M18 18 C23 19, 27 22, 30 26" stroke={LIZARD_GREEN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="12" cy="17" rx="8" ry="5.5" fill={LIZARD_GREEN} stroke="black" strokeWidth="1.6" />
      <circle cx="5" cy="14" r="3" fill={LIZARD_GREEN} stroke="black" strokeWidth="1.4" />
      <circle cx="4" cy="13" r="1.3" fill="black" />
      <path d="M9 22 L7 26 M14 23 L13 27 M8 12 L5 9 M13 12 L12 8" stroke={LIZARD_GREEN_DARK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function LizardIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M17 17 C23 18, 28 21, 31 26" stroke={LIZARD_GREEN} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="11" cy="16" rx="10" ry="6.5" fill={LIZARD_GREEN} stroke="black" strokeWidth="1.7" />
      <circle cx="3" cy="13" r="3.6" fill={LIZARD_GREEN} stroke="black" strokeWidth="1.5" />
      <circle cx="2" cy="12" r="1.4" fill="black" />
      <path d="M6 9 L7 5 M9 9 L11 5 M12 10 L15 6" stroke={LIZARD_GREEN_DARK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M7 21 L5 26 M13 22 L12 27 M18 20 L18 25" stroke={LIZARD_GREEN_DARK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function JacareIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M1 18 C1 14, 4 12, 9 12 L26 10 C29 10, 31 12, 31 14 C31 16, 29 17, 26 17 L9 18 C6 22, 3 23, 1 21 Z" fill={CROC_GREEN} stroke="black" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M22 10 L26 6 M25 11 L28 8" stroke="black" strokeWidth="1" />
      <circle cx="9" cy="13" r="1.4" fill="black" />
      <path d="M11 19 L9 24 M17 19 L16 24" stroke={CROC_DARK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function DeadCreatureIcon({ Icon, size = 60 }) {
  return (
    <div style={{ width: size, height: size, display: "inline-block", transform: "scaleY(-1)", filter: "grayscale(1) brightness(0.7)" }}>
      <Icon size={size} />
    </div>
  );
}
function RockIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M6 22 L8 14 L14 8 L22 9 L27 15 L26 23 L18 26 L9 25 Z" fill={ROCK_FILL} stroke="black" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11 14 L16 16 M18 12 L22 17" stroke={ROCK_DARK} strokeWidth="1" />
    </svg>
  );
}
function AlgaeIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M8 29 C5 21, 10 16, 7 8 C6 5, 8 2, 9 1" stroke={ALGAE_DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M16 29 C19 20, 13 15, 17 6 C18 3, 16 1, 15 0" stroke={ALGAE_GREEN} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M24 29 C21 22, 26 17, 23 9 C22 6, 24 3, 25 1" stroke={ALGAE_DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function WaterIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M12 4 H20 V9 L24 14 C26 17, 26 24, 20 27 C14 30, 6 26, 7 19 C7.5 15, 10 11, 12 9 Z" fill={WATER_LIGHT} stroke={WATER_DARK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 4 H20 V7 H12 Z" fill={SAND_DARK} stroke="black" strokeWidth="1.2" />
      <path d="M12 18 C14 20, 18 20, 19 17" stroke={WATER_DARK} strokeWidth="1" fill="none" />
    </svg>
  );
}
function ProteinIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="2" y="12" width="5" height="8" rx="1.5" fill={PROTEIN_RED} stroke="black" strokeWidth="1" />
      <rect x="25" y="12" width="5" height="8" rx="1.5" fill={PROTEIN_RED} stroke="black" strokeWidth="1" />
      <rect x="7" y="14" width="4" height="4" fill={STEEL} stroke="black" strokeWidth="1" />
      <rect x="21" y="14" width="4" height="4" fill={STEEL} stroke="black" strokeWidth="1" />
      <rect x="10.5" y="15" width="11" height="2" fill="black" />
    </svg>
  );
}
function StaminaIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M18 2 L8 18 H15 L13 30 L26 12 H18 Z" fill={STAMINA_YELLOW} stroke="black" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function BreakIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M9 30 L9 17 C9 13, 12 11, 15 12 L15 8 C15 5, 19 5, 19 8 L19 12 C22 11, 25 13, 25 17 L25 30 Z" fill={FISH_BELLY} stroke="black" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 17 L25 17" stroke="black" strokeWidth="1" opacity="0.4" />
      <path d="M4 4 L11 11 M28 4 L21 11 M16 1 L16 8" stroke={PROTEIN_RED} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function GoalIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <ellipse cx="16" cy="17" rx="14" ry="10" fill={WATER_LIGHT} stroke="black" strokeWidth="1.6" />
      <path d="M5 14 Q10 11, 16 14 T27 14" stroke={WATER_DARK} strokeWidth="1" fill="none" />
      <path d="M4 19 Q10 16, 16 19 T28 19" stroke={WATER_DARK} strokeWidth="1" fill="none" />
    </svg>
  );
}
function CoralIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M16 30 L16 20 M16 22 L9 14 M16 22 L23 14 M12 24 L6 18 M20 24 L26 18" stroke={CORAL_PINK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="14" r="2.6" fill={CORAL_ORANGE} stroke="black" strokeWidth="1.2" />
      <circle cx="23" cy="14" r="2.6" fill={CORAL_ORANGE} stroke="black" strokeWidth="1.2" />
      <circle cx="16" cy="19" r="2.8" fill={CORAL_ORANGE} stroke="black" strokeWidth="1.2" />
      <circle cx="6" cy="18" r="2" fill={CORAL_ORANGE} stroke="black" strokeWidth="1.2" />
      <circle cx="26" cy="18" r="2" fill={CORAL_ORANGE} stroke="black" strokeWidth="1.2" />
    </svg>
  );
}
function ShoreIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M1 22 Q10 26, 16 22 T31 22 V30 H1 Z" fill={WATER_LIGHT} stroke="black" strokeWidth="1.4" />
      <path d="M6 22 C6 14, 12 9, 20 9 C26 9, 30 13, 30 18 L30 22 Z" fill={FROG_GREEN} stroke="black" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 21 Q9 24, 15 21" stroke={WATER_DARK} strokeWidth="1" fill="none" />
    </svg>
  );
}
function TocaIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M2 27 C2 15, 9 6, 16 6 C23 6, 30 15, 30 27 Z" fill={ROCK_FILL} stroke="black" strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="16" cy="24" rx="8" ry="7" fill="#241a14" stroke="black" strokeWidth="1.4" />
      <path d="M8 20 L11 14 M22 19 L20 13" stroke={ROCK_DARK} strokeWidth="1.2" />
    </svg>
  );
}
function SilhouetteCellIcon({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <circle cx="30" cy="34" r="16" fill={EVOLUTION_COLOR} />
      <circle cx="24" cy="30" r="3" fill={EVOLUTION_LIGHT} opacity="0.7" />
    </svg>
  );
}
function SilhouetteDropIcon({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <path d="M30 14 C40 22, 46 32, 40 42 C34 50, 20 48, 16 38 C13 30, 20 20, 30 14 Z" fill={EVOLUTION_COLOR} />
    </svg>
  );
}
function SilhouetteFinnedIcon({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <ellipse cx="26" cy="34" rx="18" ry="12" fill={EVOLUTION_COLOR} />
      <path d="M40 30 L52 22 L48 36 Z" fill={EVOLUTION_COLOR} />
      <path d="M20 44 L14 52 M32 45 L30 53" stroke={EVOLUTION_COLOR} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function SilhouetteLeggedIcon({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <ellipse cx="28" cy="30" rx="17" ry="10" fill={EVOLUTION_COLOR} />
      <circle cx="46" cy="26" r="7" fill={EVOLUTION_COLOR} />
      <path d="M18 38 L14 48 M24 39 L21 49 M34 39 L36 49 M40 38 L44 48" stroke={EVOLUTION_COLOR} strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
function SilhouetteUprightIcon({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <ellipse cx="28" cy="26" rx="14" ry="9" fill={EVOLUTION_COLOR} />
      <circle cx="44" cy="20" r="7" fill={EVOLUTION_COLOR} />
      <path d="M20 33 L16 50 M32 33 L34 50" stroke={EVOLUTION_COLOR} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M18 22 L8 16 M40 30 L46 42" stroke={EVOLUTION_COLOR} strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
const EVOLUTION_STAGES = [SilhouetteCellIcon, SilhouetteDropIcon, SilhouetteFinnedIcon, SilhouetteLeggedIcon, SilhouetteUprightIcon];
function EvolutionMontage({ size = 92 }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % EVOLUTION_STAGES.length), 600);
    return () => clearInterval(id);
  }, []);
  const Stage = EVOLUTION_STAGES[stage];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: EVOLUTION_LIGHT, border: "2px solid black", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div key={stage} style={{ animation: "evoPop 600ms ease" }}>
        <Stage size={size * 0.72} />
      </div>
    </div>
  );
}
function ChromosomeIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill={EVOLUTION_LIGHT} stroke="black" strokeWidth="1.4" />
      <path d="M10 6 C10 14, 22 18, 22 26 M22 6 C22 14, 10 18, 10 26" stroke={EVOLUTION_COLOR} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="10" cy="6" r="1.6" fill={EVOLUTION_COLOR} /><circle cx="22" cy="6" r="1.6" fill={EVOLUTION_COLOR} />
      <circle cx="10" cy="26" r="1.6" fill={EVOLUTION_COLOR} /><circle cx="22" cy="26" r="1.6" fill={EVOLUTION_COLOR} />
      <circle cx="16" cy="16" r="1.6" fill={EVOLUTION_COLOR} />
    </svg>
  );
}
function HookIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 1 V13 C12 13, 12 20, 17 20 C21 20, 21 15, 17 14" stroke="#7d8a94" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="1.5" r="1.3" fill="#7d8a94" stroke="black" strokeWidth="0.6" />
      <circle cx="17.5" cy="14.5" r="1.1" fill={PROTEIN_RED} />
    </svg>
  );
}
function ScorpionIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <ellipse cx="9" cy="14" rx="6" ry="4" fill={SCORPION_BODY} stroke="black" strokeWidth="1.4" />
      <path d="M15 12 C18 10, 19 6, 22 4 M22 4 L20 4 M22 4 L22 6" stroke={SCORPION_BODY} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M4 12 L1 9 M4 16 L1 18" stroke={SCORPION_BODY} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="13" r="1" fill="black" />
    </svg>
  );
}
function SnakeIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M2 20 C6 20, 4 14, 8 14 C12 14, 10 8, 14 8 C17 8, 17 4, 21 4" stroke={SNAKE_GREEN} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M2 20 C6 20, 4 14, 8 14 C12 14, 10 8, 14 8 C17 8, 17 4, 21 4" stroke={SNAKE_DARK} strokeWidth="1" fill="none" strokeDasharray="1 3" />
      <circle cx="21" cy="4" r="1.3" fill="black" />
      <path d="M23 3 L25 2" stroke="black" strokeWidth="0.8" />
    </svg>
  );
}
function Decor({ variant, color, size = 16, style }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", style };
  if (variant === "grass") return (<svg {...common}><path d="M6 20 C6 12, 8 8, 9 4 M12 20 C12 10, 13 6, 12 2 M16 20 C17 13, 19 9, 20 5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>);
  if (variant === "cactus") return (<svg {...common}><path d="M12 21 V8 M12 8 C12 8, 7 9, 7 13 M7 13 V16 M12 12 C12 12, 17 13, 17 16 M17 16 V19" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></svg>);
  if (variant === "bush") return (<svg {...common}><circle cx="8" cy="16" r="4" fill={color} /><circle cx="14" cy="14" r="5" fill={color} /><circle cx="18" cy="17" r="3.5" fill={color} /></svg>);
  if (variant === "tree") return (<svg {...common}><rect x="10.5" y="15" width="3" height="7" fill={color} /><circle cx="12" cy="10" r="8" fill={color} /></svg>);
  if (variant === "dune") return (<svg {...common}><path d="M2 16 Q7 10, 12 16 T22 16" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>);
  if (variant === "tile") return (<svg {...common}><rect x="3" y="3" width="18" height="18" fill="none" stroke={color} strokeWidth="1.4" /></svg>);
  if (variant === "crack") return (<svg {...common}><path d="M4 20 L9 14 L7 8 M9 14 L15 16 L13 22 M15 16 L20 12 L22 18" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>);
  if (variant === "boulder") return (<svg {...common}><ellipse cx="12" cy="16" rx="9" ry="6" fill={color} /><ellipse cx="17" cy="12" rx="5" ry="4" fill={color} /></svg>);
  if (variant === "algae") return (<svg {...common}><path d="M6 22 C4 16, 8 12, 5 6 M12 22 C14 15, 9 11, 12 4 M18 22 C16 14, 20 10, 17 5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>);
  return null;
}

const ITEM_ICON = { water: WaterIcon, protein: ProteinIcon, stamina: StaminaIcon };

const MAX_RESOURCE = 10; // teto de força e estamina
const calcDuration = (speed) => {
  const s = Math.min(speed, MAX_RESOURCE) / MAX_RESOURCE;
  return Math.round(420 - 290 * Math.pow(s, 1.6));
};
const CREATURES_BY_ERA = {
  peixe: [FishIcon, BigFishIcon, SharkIcon],
  anfibio: [TadpoleLegsIcon, FrogIcon, GiantToadIcon],
  reptil: [GeckoIcon, LizardIcon, JacareIcon],
};
function creatureStage(s, creatureEra) {
  const stages = CREATURES_BY_ERA[creatureEra] || CREATURES_BY_ERA.peixe;
  if (s >= 6) return stages[2];
  if (s >= 3) return stages[1];
  return stages[0];
}

function ScorePanel({ finalScore, history }) {
  if (!finalScore) return null;
  return (
    <div className="w-full text-left" style={{ color: TEXT_DARK }}>
      <div className="text-xs space-y-0.5 mb-2">
        <div className="flex justify-between"><span>Tempo</span><span>{finalScore.time} pts</span></div>
        <div className="flex justify-between"><span>Fases</span><span>{finalScore.phase} pts</span></div>
        <div className="flex justify-between"><span>Proteína</span><span>{finalScore.protein} pts</span></div>
        <div className="flex justify-between"><span>Estamina</span><span>{finalScore.stamina} pts</span></div>
        <div className="flex justify-between font-bold pt-1" style={{ borderTop: `1px solid ${TEXT_DARK}` }}>
          <span>Total</span><span>{finalScore.total} pts</span>
        </div>
      </div>
      {finalScore.isNewBest && (
        <p className="text-xs font-bold text-center mb-2" style={{ color: WATER }}>Novo recorde! 🏆</p>
      )}
      {history.length > 0 && (
        <div className="text-xs">
          <p className="font-bold mb-1">Últimas pontuações</p>
          <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between" style={{ color: TEXT_MUTED }}>
                <span>{i + 1}. Fase {h.phaseReached}/{LEVELS.length}</span>
                <span>{h.total} pts · {h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function randomCuriosity() {
  return CURIOSITIES[Math.floor(Math.random() * CURIOSITIES.length)];
}

export default function FishGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];
  const theme = THEMES[levelIndex];

  const [player, setPlayer] = useState(level.start);
  const [facing, setFacing] = useState("e");
  const [rocks, setRocks] = useState(() => new Set(level.rocks));
  const [items, setItems] = useState(level.items);
  const [hazards, setHazards] = useState(() => LEVELS[0].hazards.map((h) => ({ ...h })));
  const [energy, setEnergy] = useState(100);
  const [strength, setStrength] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [evoPeak, setEvoPeak] = useState(0); // maior estamina já atingida — a evolução nunca regride
  const [livesRemaining, setLivesRemaining] = useState(2);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalStamina, setTotalStamina] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [scoreHistory, setScoreHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("fishGameScoreHistory");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [status, setStatus] = useState("intro"); // intro | playing | levelComplete | won | lost | gameOver
  const [curiosity, setCuriosity] = useState(randomCuriosity);
  const [isMoving, setIsMoving] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [moveDuration, setMoveDuration] = useState(calcDuration(0));
  const [toast, setToast] = useState("");

  const speedRef = useRef(0);
  speedRef.current = speed;
  const energyRef = useRef(100);
  energyRef.current = energy;
  const livesRef = useRef(2);
  livesRef.current = livesRemaining;
  const isMovingRef = useRef(false);
  const heldDirRef = useRef(null);
  const toastTimer = useRef(null);
  const moveRef = useRef(() => {});
  const lastHitRef = useRef(0);
  const spawnGraceRef = useRef(Date.now());
  const gameStartRef = useRef(Date.now());

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1000);
  };

  const loadLevel = useCallback((idx) => {
    const lvl = LEVELS[idx];
    setPlayer(lvl.start);
    setRocks(new Set(lvl.rocks));
    setItems(lvl.items);
    setHazards(lvl.hazards.map((h) => ({ ...h })));
    setIsMoving(false);
    setCelebrating(false);
    isMovingRef.current = false;
    heldDirRef.current = null;
    lastHitRef.current = 0;
    spawnGraceRef.current = Date.now();
    setStatus("playing");
  }, []);

  const restartGame = useCallback(() => {
    setLevelIndex(0);
    setEnergy(100);
    setStrength(0);
    setSpeed(0);
    setEvoPeak(0);
    setFacing("e");
    setLivesRemaining(2);
    setTotalProtein(0);
    setTotalStamina(0);
    setFinalScore(null);
    loadLevel(0);
    setCuriosity(randomCuriosity());
    setStatus("intro");
  }, [loadLevel]);

  const startGame = useCallback(() => {
    gameStartRef.current = Date.now();
    spawnGraceRef.current = Date.now();
    setStatus("playing");
  }, []);

  const respawnAfterDeath = useCallback(() => {
    loadLevel(levelIndex);
    setEnergy(100);
  }, [levelIndex, loadLevel]);

  const advanceLevel = useCallback(() => {
    const next = levelIndex + 1;
    if (LEVELS[next] && LEVELS[next].creatureEra !== LEVELS[levelIndex].creatureEra) {
      setSpeed(0);
      setEvoPeak(0);
    }
    setLevelIndex(next);
    loadLevel(next);
  }, [levelIndex, loadLevel]);

  // Score: tempo restante + fases + proteína total + estamina total. Salva as últimas 10 no aparelho.
  const finalizeGame = useCallback(
    (outcome) => {
      const elapsedSec = (Date.now() - gameStartRef.current) / 1000;
      const timeScore = Math.max(0, Math.round((600 - elapsedSec) * 2));
      const phaseScore = (outcome === "won" ? LEVELS.length : levelIndex) * 500;
      const proteinScore = totalProtein * 100;
      const staminaScore = totalStamina * 80;
      const total = timeScore + phaseScore + proteinScore + staminaScore;
      const best = scoreHistory.length ? Math.max(...scoreHistory.map((s) => s.total)) : 0;
      const entry = {
        total,
        time: timeScore,
        phase: phaseScore,
        protein: proteinScore,
        stamina: staminaScore,
        phaseReached: outcome === "won" ? LEVELS.length : levelIndex + 1,
        outcome,
        date: new Date().toLocaleDateString("pt-BR"),
      };
      const newHistory = [entry, ...scoreHistory].slice(0, 10);
      setScoreHistory(newHistory);
      try {
        localStorage.setItem("fishGameScoreHistory", JSON.stringify(newHistory));
      } catch (e) {}
      setFinalScore({ ...entry, isNewBest: total > best });
      setStatus(outcome);
    },
    [levelIndex, totalProtein, totalStamina, scoreHistory]
  );

  const handleDeath = useCallback(() => {
    if (livesRef.current > 0) {
      setLivesRemaining((l) => l - 1);
      setStatus("lost");
    } else {
      finalizeGame("gameOver");
    }
  }, [finalizeGame]);

  // energy drains over real time — the fish is out of water
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      const next = Math.max(0, energyRef.current - 1.1);
      setEnergy(next);
      if (next <= 0) handleDeath();
    }, 500);
    return () => clearInterval(id);
  }, [status, handleDeath]);

  // hazards patrol back and forth
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      setHazards((hs) =>
        hs.map((h) => {
          let pos = h.pos + h.dir;
          let dir = h.dir;
          if (pos >= h.max) { pos = h.max; dir = -1; }
          else if (pos <= h.min) { pos = h.min; dir = 1; }
          return { ...h, pos, dir };
        })
      );
    }, 350);
    return () => clearInterval(id);
  }, [status]);

  // hazard collision: -2 estamina on touch, dies if it hits zero
  useEffect(() => {
    if (status !== "playing") return;
    const now = Date.now();
    if (now - spawnGraceRef.current < 1200) return;
    if (now - lastHitRef.current < 900) return;
    const hitHazard = hazards.find((h) => {
      const hx = h.axis === "x" ? h.pos : h.fixed;
      const hy = h.axis === "x" ? h.fixed : h.pos;
      return hx === player.x && hy === player.y;
    });
    if (hitHazard) {
      lastHitRef.current = now;
      showToast(hitHazard.kind === "snake" ? "Cobra! -2 estamina" : hitHazard.kind === "scorpion" ? "Escorpião! -2 estamina" : "Anzol! -2 estamina");
      const next = Math.max(0, speedRef.current - 2);
      setSpeed(next);
      if (next <= 0) handleDeath();
    }
  }, [hazards, player, status, handleDeath]);

  const resolveArrival = useCallback((target, k) => {
    setItems((it) => {
      if (!it[k]) return it;
      const type = it[k];
      const copy = { ...it };
      delete copy[k];
      if (type === "water") {
        setEnergy((e) => Math.min(100, e + 22));
        showToast("Água! +tempo");
      } else if (type === "protein") {
        setStrength((s) => Math.min(MAX_RESOURCE, s + 1));
        setTotalProtein((t) => t + 1);
        showToast("Proteína! ficou mais forte");
      } else if (type === "stamina") {
        setSpeed((s) => Math.min(MAX_RESOURCE, s + 1));
        setEvoPeak((p) => Math.max(p, Math.min(MAX_RESOURCE, speedRef.current + 1)));
        setTotalStamina((t) => t + 1);
        showToast("Estamina! nada mais rápido agora");
      }
      return copy;
    });
  }, []);

  const breakRock = useCallback(() => {
    if (status !== "playing" || isMovingRef.current || celebrating) return;
    const [dx, dy] = FACING_TO_DIR[facing];
    const tx = player.x + dx;
    const ty = player.y + dy;
    if (tx < 0 || tx >= level.w || ty < 0 || ty >= level.h) return;
    const k = key(tx, ty);
    const isAlgae = level.obstacleType === "algae";
    if (!rocks.has(k)) {
      showToast("Nada pra quebrar ali na frente");
      return;
    }
    if (strength <= 0) {
      showToast("Sem força — colete proteína primeiro");
      return;
    }
    setRocks((r) => { const copy = new Set(r); copy.delete(k); return copy; });
    setStrength((s) => s - 1);
    showToast(isAlgae ? "Alga cortada com força!" : "Rocha quebrada com força!");
  }, [status, celebrating, player, facing, level.w, level.h, level.obstacleType, rocks, strength]);

  const move = useCallback(
    (dx, dy) => {
      if (status !== "playing" || isMovingRef.current || celebrating) return;
      const dirKey = `${dx},${dy}`;
      if (DIR_TO_FACING[dirKey]) setFacing(DIR_TO_FACING[dirKey]);

      const tx = player.x + dx;
      const ty = player.y + dy;
      if (tx < 0 || tx >= level.w || ty < 0 || ty >= level.h) return;
      const k = key(tx, ty);

      if (rocks.has(k)) {
        showToast(level.obstacleType === "algae" ? "Alga no caminho — use o botão pra cortar" : "Rocha no caminho — use o botão pra quebrar");
        return;
      }

      const duration = calcDuration(speedRef.current);
      const target = { x: tx, y: ty };
      const reachedGoal = target.x === level.goal.x && target.y === level.goal.y;

      setMoveDuration(duration);
      isMovingRef.current = true;
      setIsMoving(true);
      setPlayer(target);

      setTimeout(() => {
        isMovingRef.current = false;
        setIsMoving(false);
        resolveArrival(target, k);

        if (reachedGoal) {
          setCelebrating(true);
          setTimeout(() => {
            setCelebrating(false);
            if (levelIndex === LEVELS.length - 1) {
              finalizeGame("won");
            } else {
              setCuriosity(randomCuriosity());
              setStatus("levelComplete");
            }
          }, 700);
        } else if (heldDirRef.current) {
          // keep chaining with whatever direction is CURRENTLY held, so turning
          // mid-stride (joystick or diagonal keys) feels smooth, not stop-and-go
          moveRef.current(heldDirRef.current.dx, heldDirRef.current.dy);
        }
      }, duration);
    },
    [status, celebrating, player, level.w, level.h, level.goal.x, level.goal.y, level.obstacleType, rocks, levelIndex, resolveArrival, finalizeGame]
  );

  useEffect(() => { moveRef.current = move; }, [move]);

  // Sets/clears the currently-held direction and kicks off movement immediately
  // if nothing is in flight. Shared by keyboard and the joystick.
  const setHeldDirection = useCallback((dir) => {
    const prev = heldDirRef.current;
    const changed = (!prev && dir) || (prev && !dir) || (prev && dir && (prev.dx !== dir.dx || prev.dy !== dir.dy));
    heldDirRef.current = dir;
    if (dir && changed && !isMovingRef.current) {
      moveRef.current(dir.dx, dir.dy);
    }
  }, []);

  const heldKeysRef = useRef({ up: false, down: false, left: false, right: false });
  useEffect(() => {
    const applyKey = (e, isDown) => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w") heldKeysRef.current.up = isDown;
      else if (k === "ArrowDown" || k === "s") heldKeysRef.current.down = isDown;
      else if (k === "ArrowLeft" || k === "a") heldKeysRef.current.left = isDown;
      else if (k === "ArrowRight" || k === "d") heldKeysRef.current.right = isDown;
      else return false;
      return true;
    };
    const onKeyDown = (e) => {
      if (!applyKey(e, true)) return;
      const { up, down, left, right } = heldKeysRef.current;
      let dx = (right ? 1 : 0) - (left ? 1 : 0);
      let dy = (down ? 1 : 0) - (up ? 1 : 0);
      setHeldDirection(dx || dy ? { dx, dy } : null);
    };
    const onKeyUp = (e) => {
      if (!applyKey(e, false)) return;
      const { up, down, left, right } = heldKeysRef.current;
      let dx = (right ? 1 : 0) - (left ? 1 : 0);
      let dy = (down ? 1 : 0) - (up ? 1 : 0);
      setHeldDirection(dx || dy ? { dx, dy } : null);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setHeldDirection]);

  // --- Joystick: drag a knob, snapped to 8 directions, free diagonal movement ---
  const JOY_MAX_DRAG = 42;
  const JOY_DEAD_ZONE = 12;
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyBaseRef = useRef(null);
  const joyActiveRef = useRef(false);
  const joyCenterRef = useRef({ x: 0, y: 0 });

  const updateJoystick = useCallback(
    (clientX, clientY) => {
      const dx0 = clientX - joyCenterRef.current.x;
      const dy0 = clientY - joyCenterRef.current.y;
      const dist = Math.sqrt(dx0 * dx0 + dy0 * dy0);
      const clamped = Math.min(dist, JOY_MAX_DRAG);
      const angle = Math.atan2(dy0, dx0);
      setJoyKnob({ x: Math.cos(angle) * clamped, y: Math.sin(angle) * clamped });

      if (dist < JOY_DEAD_ZONE) {
        setHeldDirection(null);
        return;
      }
      let deg = (angle * 180) / Math.PI;
      if (deg < 0) deg += 360;
      const DIRS = [
        { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 1 },
        { dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      ];
      setHeldDirection(DIRS[Math.round(deg / 45) % 8]);
    },
    [setHeldDirection]
  );

  const onJoyPointerDown = (e) => {
    e.preventDefault();
    const rect = joyBaseRef.current.getBoundingClientRect();
    joyCenterRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    joyActiveRef.current = true;
    updateJoystick(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!joyActiveRef.current) return;
      updateJoystick(e.clientX, e.clientY);
    };
    const onUp = () => {
      if (!joyActiveRef.current) return;
      joyActiveRef.current = false;
      setJoyKnob({ x: 0, y: 0 });
      setHeldDirection(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [updateJoystick, setHeldDirection]);

  if (status === "intro") {
    return (
      <div
        className="w-full min-h-screen flex flex-col items-center justify-center py-6 px-6 font-sans text-center"
        style={{ backgroundColor: theme.pageBg }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <style>{`
          html, body {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>
        <FishIcon size={56} />
        <h1 className="text-2xl font-bold mt-3 mb-3 tracking-tight" style={{ color: TEXT_DARK }}>Evo Path</h1>
        <p className="text-sm max-w-xs mb-6" style={{ color: TEXT_DARK }}>
          Uma jornada pelas eras da vida. Atravesse ambientes cada vez mais hostis, sobreviva, e descubra no que você vai se transformar.
        </p>
        <p className="text-xs italic max-w-xs mb-8" style={{ color: TEXT_MUTED }}>"{curiosity}"</p>
        <button onClick={startGame} className="px-6 py-3 text-white text-base rounded-md active:opacity-70" style={{ backgroundColor: WATER }}>
          Iniciar
        </button>
        <p className="text-[10px] mt-8 opacity-50" style={{ color: TEXT_MUTED }}>build {BUILD_TAG}</p>
      </div>
    );
  }

  const viewW = Math.min(level.w, CAP_W);
  const viewH = Math.min(level.h, CAP_H);
  const camX = clamp(player.x - Math.floor(viewW / 2), 0, Math.max(0, level.w - viewW));
  const camY = clamp(player.y - Math.floor(viewH / 2), 0, Math.max(0, level.h - viewH));

  const growScale = 1 + Math.min(strength, MAX_RESOURCE) * 0.075;
  const CreatureIcon = creatureStage(evoPeak, level.creatureEra);

  const bgCells = [];
  for (let y = 0; y < level.h; y++) {
    for (let x = 0; x < level.w; x++) {
      const k = key(x, y);
      const isGoal = level.goal.x === x && level.goal.y === y;
      const isRock = rocks.has(k);
      const itemType = items[k];
      const ItemIcon = itemType ? ITEM_ICON[itemType] : null;
      const showDecor = !isGoal && !isRock && !itemType && seededRandom(x, y, levelIndex * 97 + 13) < 0.22;
      bgCells.push(
        <div key={k} className="flex items-center justify-center" style={{ width: CELL, height: CELL, backgroundColor: theme.cellBg }}>
          {isGoal && (level.goalType === "chromosome" ? <ChromosomeIcon size={CELL_ICON_SIZE} /> : level.goalType === "shore" ? <ShoreIcon size={CELL_ICON_SIZE} /> : level.goalType === "toca" ? <TocaIcon size={CELL_ICON_SIZE} /> : level.goalType === "coral" ? <CoralIcon size={CELL_ICON_SIZE} /> : <GoalIcon size={CELL_ICON_SIZE} />)}
          {isRock && (level.obstacleType === "algae" ? <AlgaeIcon size={CELL_ICON_SIZE} /> : <RockIcon size={CELL_ICON_SIZE} />)}
          {ItemIcon && !isRock && <ItemIcon size={CELL_ICON_SIZE} />}
          {showDecor && (
            <Decor
              variant={theme.decorVariant}
              color={theme.decorColor}
              size={14 + seededRandom(x, y, levelIndex * 53 + 7) * 12}
              style={{ opacity: 0.55, transform: `rotate(${(seededRandom(x, y, levelIndex * 31 + 3) - 0.5) * 40}deg)` }}
            />
          )}
        </div>
      );
    }
  }

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center py-6 px-2 font-sans"
      style={{ backgroundColor: theme.pageBg }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes celebrateSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(200deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes evoPop {
          0% { transform: scale(0.6) translateY(6px); opacity: 0; }
          60% { transform: scale(1.08) translateY(0); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        html, body {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .ctrl-btn, .ctrl-pad {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: none;
        }
      `}</style>

      <h1 className="text-xl font-bold mb-1 tracking-tight" style={{ color: TEXT_DARK }}>Evo Path</h1>
      <p className="text-xs mb-3 text-center max-w-xs" style={{ color: TEXT_MUTED }}>
        Fase {levelIndex + 1}/{LEVELS.length} · {level.name} ({theme.name})
      </p>

      <div className="w-full max-w-sm mb-2">
        <div className="flex justify-between text-xs mb-1" style={{ color: TEXT_MUTED }}>
          <span>Energia</span><span>{Math.max(0, Math.round(energy))}%</span>
        </div>
        <div className="w-full h-3 rounded-sm overflow-hidden" style={{ backgroundColor: UI_PANEL, border: `1px solid ${TEXT_DARK}` }}>
          <div className="h-full transition-all duration-300" style={{ width: `${Math.max(0, energy)}%`, backgroundColor: WATER }} />
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-xs items-center" style={{ color: TEXT_DARK }}>
        <div className="flex items-center gap-1"><ProteinIcon size={16} /> <span>{strength}/{MAX_RESOURCE}</span></div>
        <div className="flex items-center gap-1"><StaminaIcon size={16} /> <span>{speed}/{MAX_RESOURCE}</span></div>
        <div className="flex items-center gap-1">
          <span>Vidas:</span>
          {[0, 1].map((i) => (
            <span key={i} style={{ color: i < livesRemaining ? PROTEIN_RED : "#cfc6b8", fontSize: 14 }}>●</span>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="relative overflow-hidden" style={{ width: viewW * CELL, height: viewH * CELL, border: "2px solid black" }}>
          <div
            className="absolute top-0 left-0 grid"
            style={{
              width: level.w * CELL, height: level.h * CELL,
              gridTemplateColumns: `repeat(${level.w}, ${CELL}px)`,
              transform: `translate(${-camX * CELL}px, ${-camY * CELL}px)`,
              transition: `transform ${moveDuration}ms linear`,
            }}
          >
            {bgCells}

            {hazards.map((h, i) => {
              const hx = h.axis === "x" ? h.pos : h.fixed;
              const hy = h.axis === "x" ? h.fixed : h.pos;
              return (
                <div
                  key={i}
                  className="absolute top-0 left-0 flex items-center justify-center pointer-events-none"
                  style={{ width: CELL, height: CELL, transform: `translate(${hx * CELL}px, ${hy * CELL}px)`, transition: "transform 350ms linear" }}
                >
                  {h.kind === "snake" ? <SnakeIcon /> : h.kind === "scorpion" ? <ScorpionIcon /> : <HookIcon />}
                </div>
              );
            })}

            {celebrating && (
              <>
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: CELL * 1.6, height: CELL * 1.6, left: level.goal.x * CELL - CELL * 0.3, top: level.goal.y * CELL - CELL * 0.3, backgroundColor: WATER_LIGHT, border: `2px solid ${WATER_DARK}`, opacity: 0.9 }}
                />
                <div
                  className="absolute rounded-full animate-ping pointer-events-none"
                  style={{ width: CELL, height: CELL, left: level.goal.x * CELL, top: level.goal.y * CELL, backgroundColor: WATER, opacity: 0.5 }}
                />
              </>
            )}

            <div
              className="absolute top-0 left-0 flex items-center justify-center pointer-events-none"
              style={{ width: CELL, height: CELL, transform: `translate(${player.x * CELL}px, ${player.y * CELL}px)`, transition: `transform ${moveDuration}ms linear` }}
            >
              <div style={{ transform: `scale(${growScale})`, transition: "transform 250ms ease" }}>
                <div style={celebrating ? { animation: "celebrateSpin 0.7s ease-in-out" } : { transform: FACING_TRANSFORM[facing], transition: "transform 150ms ease" }}>
                  <CreatureIcon size={PLAYER_ICON_SIZE} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {toast && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap z-10" style={{ backgroundColor: TEXT_DARK }}>
            {toast}
          </div>
        )}

        {status === "levelComplete" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4 z-10" style={{ backgroundColor: "rgba(246,241,228,0.97)", border: "2px solid black" }}>
            <p className="text-lg font-bold" style={{ color: TEXT_DARK }}>
              {level.goalType === "chromosome" ? "Uma transformação se aproxima..." : level.goalType === "shore" ? "Você alcançou a margem!" : level.goalType === "toca" ? "Você encontrou a toca!" : "Fase concluída!"}
            </p>
            {level.goalType === "chromosome" && <EvolutionMontage />}
            <p className="text-xs italic max-w-xs" style={{ color: TEXT_MUTED }}>
              {level.goalType === "chromosome" && "Sua espécie está prestes a evoluir para a próxima era. "}
              {curiosity}
            </p>
            <button onClick={advanceLevel} className="px-4 py-2 text-white text-sm rounded-md active:opacity-70" style={{ backgroundColor: WATER }}>
              Seguir para a próxima fase
            </button>
          </div>
        )}

        {status === "won" && (
          <div className="absolute inset-0 flex flex-col items-center gap-2 text-center px-4 py-3 z-10 overflow-y-auto" style={{ backgroundColor: "rgba(246,241,228,0.97)", border: "2px solid black" }}>
            <p className="text-base font-bold" style={{ color: TEXT_DARK }}>
              {level.goalType === "chromosome" ? "Evolução completa... por enquanto! 🧬" : "Chegou na lagoa final! 🎉"}
            </p>
            {level.goalType === "chromosome" && (
              <>
                <EvolutionMontage />
                <p className="text-xs" style={{ color: TEXT_MUTED }}>Ave e mamífero ainda vêm por aí.</p>
              </>
            )}
            <ScorePanel finalScore={finalScore} history={scoreHistory} />
            <button onClick={restartGame} className="px-4 py-2 text-white text-sm rounded-md active:opacity-70" style={{ backgroundColor: TEXT_DARK }}>
              Jogar novamente
            </button>
          </div>
        )}

        {status === "gameOver" && (
          <div className="absolute inset-0 flex flex-col items-center gap-2 text-center px-4 py-3 z-10 overflow-y-auto" style={{ backgroundColor: "rgba(246,241,228,0.97)", border: "2px solid black" }}>
            <DeadCreatureIcon Icon={CreatureIcon} size={40} />
            <p className="text-base font-bold" style={{ color: TEXT_DARK }}>As vidas acabaram...</p>
            <ScorePanel finalScore={finalScore} history={scoreHistory} />
            <button onClick={restartGame} className="px-4 py-2 text-white text-sm rounded-md active:opacity-70" style={{ backgroundColor: TEXT_DARK }}>
              Jogar novamente
            </button>
          </div>
        )}

        {status === "lost" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4 z-10" style={{ backgroundColor: "rgba(246,241,228,0.97)", border: "2px solid black" }}>
            <DeadCreatureIcon Icon={CreatureIcon} />
            <p className="text-lg font-bold" style={{ color: TEXT_DARK }}>Você perdeu uma vida!</p>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>Vidas restantes: {livesRemaining}</p>
            <button onClick={respawnAfterDeath} className="px-4 py-2 text-white text-sm rounded-md active:opacity-70" style={{ backgroundColor: WATER }}>
              Tentar novamente nesta fase
            </button>
          </div>
        )}
      </div>

      <div className="flex items-end gap-5 mt-6">
        <div
          ref={joyBaseRef}
          className="ctrl-pad relative rounded-full"
          style={{ width: 132, height: 132, backgroundColor: UI_PANEL, border: "3px solid black", touchAction: "none", opacity: isMoving ? 0.85 : 1 }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={onJoyPointerDown}
        >
          <div
            className="ctrl-btn absolute rounded-full"
            style={{
              width: 56, height: 56, left: "50%", top: "50%",
              backgroundColor: WATER, border: "2px solid black",
              transform: `translate(-50%, -50%) translate(${joyKnob.x}px, ${joyKnob.y}px)`,
              transition: joyActiveRef.current ? "none" : "transform 150ms ease",
              pointerEvents: "none",
            }}
          />
        </div>
        <button
          className="ctrl-btn rounded-full flex items-center justify-center active:opacity-70"
          style={{ width: 72, height: 72, backgroundColor: UI_PANEL, border: "3px solid black" }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => { e.preventDefault(); breakRock(); }}
        >
          <BreakIcon size={34} />
        </button>
      </div>
      <p className="text-[11px] mt-2 text-center" style={{ color: TEXT_MUTED }}>
        Arraste o manípulo — inclusive na diagonal<br />Encare o obstáculo e toque no punho pra quebrar
      </p>
    </div>
  );
}
