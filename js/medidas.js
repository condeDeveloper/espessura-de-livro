// As tabelas do README. Calculadas aqui, e em lugar nenhum mais.
//
// Toda tabela passa por `umaVez`. Pedir a mesma varredura de ordens duas vezes
// na suite e pagar duas vezes: com 20.160 ordens na grade 3x3 isso ja se nota,
// e o acervo ja perdeu oito minutos por job de CI exatamente assim.

import {
  completo, ciclo, caminho, bipartidoCompleto, roda, grade, cubo, petersen, heawood
} from './nucleo.js'
import { espessura, raridadeDoOtimo, ordemNatural, piorOrdem, quantasOrdens } from './busca.js'
import { cotaDeEuler, espessuraNoBraco, formulaDoCompleto, ehExternoplanar, arestasQueCabem } from './juiz.js'

const guardadas = new Map()
function umaVez (chave, fn) {
  if (!guardadas.has(chave)) guardadas.set(chave, fn())
  return guardadas.get(chave)
}

/** O catalogo de grafos que as tabelas usam. Montados por regra, nunca de cabeca. */
export const CATALOGO = [
  ['K_4', () => completo(4)],
  ['K_5', () => completo(5)],
  ['K_6', () => completo(6)],
  ['K_7', () => completo(7)],
  ['K_8', () => completo(8)],
  ['ciclo 6', () => ciclo(6)],
  ['ciclo 7', () => ciclo(7)],
  ['caminho 6', () => caminho(6)],
  ['K33', () => bipartidoCompleto(3, 3)],
  ['roda 6', () => roda(6)],
  ['cubo Q3', () => cubo(3)],
  ['grade 3x3', () => grade(3, 3)],
  ['petersen', () => petersen()]
]

export function pega (nome) {
  const achado = CATALOGO.find(([n]) => n === nome)
  if (!achado) throw new Error(`nao tenho o grafo "${nome}"`)
  return umaVez(`grafo:${nome}`, achado[1])
}

/** A espessura medida de cada grafo do catalogo. */
export function espessuras () {
  return umaVez('espessuras', () =>
    CATALOGO.map(([nome]) => {
      const g = pega(nome)
      const r = espessura(g)
      return { nome, n: g.n, m: g.m, paginas: r.paginas, ordens: r.abertas, otimas: r.otimas, completa: r.completa }
    })
  )
}

/**
 * A cota de Euler contra a medida.
 *
 * A pergunta nao e "a cota vale?" (vale, e cota inferior). A pergunta e ONDE
 * ela e exata e quanto ela erra quando nao e.
 */
export function cotaContraMedida () {
  return umaVez('cota', () => {
    const linhas = espessuras().map((l) => {
      const g = pega(l.nome)
      const cota = cotaDeEuler(g)
      return { ...l, cota, exata: cota === l.paginas, folga: l.paginas - cota }
    })
    return {
      linhas,
      exatas: linhas.filter((l) => l.exata).length,
      curtas: linhas.filter((l) => !l.exata).length,
      maiorFolga: Math.max(...linhas.map((l) => l.folga))
    }
  })
}

/**
 * A formula do grafo completo, e onde ela deixa de valer.
 *
 * ceil(n/2) acerta de n = 4 em diante. No n = 3 ela pede 2 paginas e o
 * triangulo cabe em 1. A tabela mostra o n = 3 em vez de comecar em 4 e
 * esconder o caso que desmente.
 */
export function formulaDoKn (ate = 8) {
  return umaVez(`kn:${ate}`, () => {
    const linhas = []
    for (let n = 3; n <= ate; n++) {
      const g = completo(n)
      const medido = espessura(g).paginas
      const f = formulaDoCompleto(n)
      linhas.push({ n, m: g.m, medido, formula: f.valor, bate: medido === f.valor, valeAqui: f.valeAqui })
    }
    return linhas
  })
}

/** Quao raro e acertar o lombo otimo. */
export function raridades () {
  return umaVez('raridades', () =>
    CATALOGO.map(([nome]) => {
      const g = pega(nome)
      const r = raridadeDoOtimo(g)
      return { nome, n: g.n, paginas: r.paginas, otimas: r.otimas, total: r.total, porcento: r.fracao * 100 }
    })
  )
}

/** O melhor lombo contra o pior, e o que a ordem obvia custa. */
export function melhorContraPior () {
  return umaVez('melhorpior', () => {
    const nomes = ['ciclo 6', 'ciclo 7', 'caminho 6', 'K_6', 'K33', 'cubo Q3', 'grade 3x3', 'roda 6', 'petersen']
    return nomes.map((nome) => {
      const g = pega(nome)
      const melhor = espessura(g).paginas
      const pior = piorOrdem(g).paginas
      const natural = ordemNatural(g)
      return { nome, melhor, pior, natural, razao: pior / melhor, perdaDaNatural: natural - melhor }
    })
  })
}

/** O motor com poda contra a forca bruta. */
export function motorContraBraco () {
  return umaVez('duelo', () => {
    const nomes = ['ciclo 6', 'K_5', 'roda 6', 'caminho 6']
    return nomes.map((nome) => {
      const g = pega(nome)
      const bom = espessura(g)
      const burro = espessuraNoBraco(g)
      return {
        nome,
        paginasBom: bom.paginas,
        paginasBurro: burro.paginas,
        concordam: bom.paginas === burro.paginas,
        nosBom: bom.nos,
        nosBurro: burro.nos,
        razao: burro.nos / bom.nos
      }
    })
  })
}

/** Quem cabe em uma pagina e quem nao cabe, decidido pelo desenho. */
export function umaPaginaSo () {
  return umaVez('externoplanar', () =>
    CATALOGO.map(([nome]) => {
      const g = pega(nome)
      const e = ehExternoplanar(g)
      const paginas = espessuras().find((l) => l.nome === nome).paginas
      return { nome, externoplanar: e.sim, paginas, bate: e.sim === (paginas <= 1) }
    })
  )
}

/** Quantas arestas k paginas comportam, e quanto cada grafo usa do teto. */
export function ocupacao () {
  return umaVez('ocupacao', () =>
    espessuras().map((l) => {
      const teto = arestasQueCabem(l.n, l.paginas)
      return { nome: l.nome, n: l.n, m: l.m, paginas: l.paginas, teto, sobra: teto - l.m, cheio: l.m === teto }
    })
  )
}

export { quantasOrdens, heawood }
