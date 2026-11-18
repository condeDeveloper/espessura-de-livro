// A varredura das ordens do lombo.
//
// A espessura e o minimo sobre TODAS as ordens, entao a busca tem dois andares:
// por fora as ordens, por dentro a coloracao do grafo de conflito daquela ordem.
//
// Duas simetrias cortam o andar de fora, e as duas valem porque o cruzamento de
// duas cordas e uma propriedade CIRCULAR: girar o lombo nao muda quem cruza com
// quem, e inverter o sentido tambem nao. Entao prendo o vertice 0 na primeira
// posicao (mata as n rotacoes) e exijo que o segundo seja menor que o ultimo
// (mata a inversao). Sobram (n-1)!/2 ordens, e nao n!.
//
// Isso e reducao de verdade, nao enfeite: com 10 vertices sao 181.440 ordens em
// vez de 3.628.800.

import { conflitos, cabeEmPaginas, paginasDaOrdem, conta } from './nucleo.js'

/** Gera as ordens com o vertice 0 preso e o sentido fixado. */
export function * ordensDoLombo (n) {
  if (n <= 1) { yield [0]; return }
  if (n === 2) { yield [0, 1]; return }
  const resto = []
  for (let i = 1; i < n; i++) resto.push(i)
  for (const p of permutacoes(resto)) {
    // Inversao: a ordem [0, a, ..., z] e a mesma de [0, z, ..., a].
    if (p[0] > p[p.length - 1]) continue
    yield [0, ...p]
  }
}

export function * permutacoes (lista) {
  if (lista.length <= 1) { yield [...lista]; return }
  for (let i = 0; i < lista.length; i++) {
    const resto = [...lista.slice(0, i), ...lista.slice(i + 1)]
    for (const p of permutacoes(resto)) yield [lista[i], ...p]
  }
}

/** Quantas ordens a varredura vai abrir: (n-1)!/2 para n >= 3. */
export function quantasOrdens (n) {
  if (n <= 2) return 1
  let f = 1
  for (let i = 2; i <= n - 1; i++) f *= i
  return f / 2
}

/**
 * A espessura de livro do grafo, varrendo todas as ordens.
 *
 * `teto` limita quantas ordens abrir. Quando a varredura para no teto, o
 * resultado vem com `completa: false` e o numero e um LIMITE SUPERIOR, nao a
 * espessura. A tabela do README diz qual e qual: afirmar "a espessura e 3"
 * quando so se varreu metade das ordens e dizer o que nao foi medido.
 */
export function espessura (g, opcoes = {}) {
  const teto = opcoes.teto || Infinity
  let melhor = Infinity
  let otimas = 0
  let abertas = 0
  let nos = 0
  let melhorOrdem = null

  for (const ordem of ordensDoLombo(g.n)) {
    if (abertas >= teto) {
      return { paginas: melhor, otimas, abertas, nos, melhorOrdem, completa: false, total: quantasOrdens(g.n) }
    }
    abertas++
    const mascaras = conflitos(g, ordem)
    if (melhor === Infinity) {
      const r = paginasDaOrdem(g, ordem)
      nos += r.nos
      melhor = r.paginas
      otimas = 1
      melhorOrdem = ordem
      continue
    }
    // Ja sei de uma ordem com `melhor` paginas. Para esta ordem so me interessa
    // saber se ela faz MELHOR, ou se empata. Perguntar "cabe em melhor-1?" e
    // muito mais barato que calcular o cromatico inteiro.
    const tenta = cabeEmPaginas(mascaras, melhor - 1)
    nos += tenta.nos
    if (tenta.cabe) {
      const r = paginasDaOrdem(g, ordem)
      nos += r.nos
      melhor = r.paginas
      otimas = 1
      melhorOrdem = ordem
    } else {
      const empata = cabeEmPaginas(mascaras, melhor)
      nos += empata.nos
      if (empata.cabe) otimas++
    }
  }
  return { paginas: melhor, otimas, abertas, nos, melhorOrdem, completa: true, total: quantasOrdens(g.n) }
}

/**
 * Quantas ordens atingem o minimo, e qual fracao do total elas sao.
 *
 * E a pergunta que o livro nao responde: saber a espessura nao diz se achar uma
 * ordem boa e facil ou e agulha no palheiro.
 */
export function raridadeDoOtimo (g, opcoes = {}) {
  const r = espessura(g, opcoes)
  return {
    paginas: r.paginas,
    otimas: r.otimas,
    total: r.completa ? r.total : r.abertas,
    fracao: r.otimas / (r.completa ? r.total : r.abertas),
    completa: r.completa
  }
}

/**
 * O numero de paginas da ordem "natural" 0,1,2,...,n-1.
 *
 * Serve para medir quanto se perde usando a ordem obvia em vez de procurar.
 */
export function ordemNatural (g) {
  const ordem = []
  for (let i = 0; i < g.n; i++) ordem.push(i)
  return paginasDaOrdem(g, ordem).paginas
}

/** O maior numero de paginas que alguma ordem exige: o pior lombo possivel. */
export function piorOrdem (g, opcoes = {}) {
  const teto = opcoes.teto || Infinity
  let pior = 0
  let abertas = 0
  let ordemRuim = null
  for (const ordem of ordensDoLombo(g.n)) {
    if (abertas >= teto) return { paginas: pior, abertas, ordemRuim, completa: false }
    abertas++
    const r = paginasDaOrdem(g, ordem)
    if (r.paginas > pior) { pior = r.paginas; ordemRuim = ordem }
  }
  return { paginas: pior, abertas, ordemRuim, completa: true }
}

/** Quantos pares de arestas se cruzam, no melhor e no pior lombo. */
export function cruzamentosPorOrdem (g, opcoes = {}) {
  const teto = opcoes.teto || Infinity
  let menos = Infinity
  let mais = 0
  let abertas = 0
  for (const ordem of ordensDoLombo(g.n)) {
    if (abertas >= teto) break
    abertas++
    const c = conflitos(g, ordem)
    let total = 0
    for (const m of c) total += conta(m)
    total /= 2
    if (total < menos) menos = total
    if (total > mais) mais = total
  }
  return { menos, mais, abertas }
}

export { paginasDaOrdem, conflitos }
