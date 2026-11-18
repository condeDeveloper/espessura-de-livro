// O juiz. Tres caminhos que nao passam pela varredura de ordens.
//
// 1. `cotaDeEuler` — uma conta fechada, sem busca nenhuma. Um livro de k
//    paginas com n vertices desenha no maximo k(n-3) + n arestas, porque cada
//    pagina e um grafo externoplanar sobre o mesmo lombo. Virando a conta do
//    avesso, k >= (m - n) / (n - 3): uma COTA INFERIOR que a varredura tem de
//    respeitar. Onde ela e exata, ela confirma; onde ela fica curta, o quanto
//    ela erra e o achado.
//
// 2. `forcaBruta` — a mesma resposta distribuindo as arestas pelas paginas uma
//    a uma, sem grafo de conflito, sem poda por simetria de cor e sem ordenar
//    por conflito. E k^m tentativas no pior caso, entao so alcanca o pequeno —
//    e a tabela diz ate onde ele foi.
//
// 3. `ehExternoplanar` — a caracterizacao conhecida: um grafo cabe em UMA
//    pagina exatamente quando e externoplanar. Decidido por outro caminho (um
//    desenho concreto no circulo), e nao perguntando ao proprio motor.

import { conflitos, cruzam, conta } from './nucleo.js'
import { ordensDoLombo, quantasOrdens } from './busca.js'

/**
 * A cota inferior pela conta de Euler: k >= (m - n) / (n - 3).
 *
 * Para n <= 3 a conta nao vale (o denominador zera ou vira negativo), e aí
 * devolvo null em vez de um numero bonito. Filtrar o caso degenerado para fora
 * e diferente de inventar resposta para ele.
 */
export function cotaDeEuler (g) {
  if (g.n <= 3) return null
  const bruta = (g.m - g.n) / (g.n - 3)
  return Math.max(0, Math.ceil(bruta))
}

/** O maximo de arestas que k paginas comportam com n vertices. */
export function arestasQueCabem (n, k) {
  if (n <= 2) return n * (n - 1) / 2
  return k * (n - 3) + n
}

/**
 * A forca bruta: cada aresta numa pagina, testando todas as distribuicoes.
 *
 * Nao usa grafo de conflito pronto nem poda de simetria: compara aresta com
 * aresta na hora. E o juiz burro, e e ele que diz se a poda do motor bom esta
 * jogando fora solucao valida.
 */
export function forcaBruta (g, ordem, k) {
  const posicao = new Array(g.n)
  for (let i = 0; i < ordem.length; i++) posicao[ordem[i]] = i
  const pagina = new Array(g.m).fill(-1)
  let nos = 0

  function tenta (i) {
    if (i === g.m) return true
    nos++
    for (let p = 0; p < k; p++) {
      let bate = false
      for (let j = 0; j < i; j++) {
        if (pagina[j] === p && cruzam(g.arestas[i], g.arestas[j], posicao)) { bate = true; break }
      }
      if (bate) continue
      pagina[i] = p
      if (tenta(i + 1)) return true
      pagina[i] = -1
    }
    return false
  }

  return { cabe: tenta(0), nos }
}

/** A espessura pela forca bruta, varrendo as ordens no braco. */
export function espessuraNoBraco (g, teto = Infinity) {
  let melhor = Infinity
  let abertas = 0
  let nos = 0
  for (const ordem of ordensDoLombo(g.n)) {
    if (abertas >= teto) return { paginas: melhor, abertas, nos, completa: false }
    abertas++
    for (let k = 0; k <= g.m; k++) {
      const r = forcaBruta(g, ordem, k)
      nos += r.nos
      if (r.cabe) { if (k < melhor) melhor = k; break }
    }
  }
  return { paginas: melhor, abertas, nos, completa: true }
}

/**
 * O grafo e externoplanar?
 *
 * Decido pelo desenho: existe uma ordem circular em que NENHUM par de arestas
 * se cruza. Isso e exatamente "cabe em uma pagina", e a caracterizacao
 * conhecida diz que isso e ser externoplanar. Aqui eu procuro o desenho, em vez
 * de perguntar ao motor de paginas.
 */
export function ehExternoplanar (g) {
  for (const ordem of ordensDoLombo(g.n)) {
    const c = conflitos(g, ordem)
    let algum = false
    for (const m of c) if (m !== 0) { algum = true; break }
    if (!algum) return { sim: true, ordem }
  }
  return { sim: false, ordem: null }
}

/**
 * A formula conhecida para o grafo completo: ceil(n/2).
 *
 * Ela vale A PARTIR DE n = 4. No n = 3 ela pede 2 e o triangulo cabe em 1
 * pagina, porque as tres arestas compartilham pontas duas a duas e nenhuma
 * cruza nenhuma. Guardo a faixa de validade junto com a formula: condicao que
 * so falha no caso primitivo e exatamente o tipo de coisa que passa batida.
 */
export function formulaDoCompleto (n) {
  return { valor: Math.ceil(n / 2), valeApartirDe: 4, valeAqui: n >= 4 }
}

/** Quantos pares de arestas cruzam, somados sobre todas as ordens. */
export function cruzamentosTotais (g, teto = Infinity) {
  let abertas = 0
  let soma = 0
  for (const ordem of ordensDoLombo(g.n)) {
    if (abertas >= teto) break
    abertas++
    const c = conflitos(g, ordem)
    let t = 0
    for (const m of c) t += conta(m)
    soma += t / 2
  }
  return { soma, abertas, media: soma / abertas }
}

export { quantasOrdens }
