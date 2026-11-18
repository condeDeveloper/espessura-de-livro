// Espessura de livro: o grafo encadernado.
//
// Imagine os vertices do grafo furados numa espiral, todos numa linha reta — o
// LOMBO do livro. Cada aresta e desenhada numa PAGINA, que e uma meia-folha
// saindo do lombo. Duas arestas na mesma pagina nao podem se cruzar.
//
// Com os vertices na ordem v0 v1 ... v(n-1) ao longo do lombo, duas arestas
// (a,b) e (c,d) se CRUZAM quando as pontas se intercalam:
//
//     a < c < b < d      (ou o mesmo com os papeis trocados)
//
// Arestas que compartilham ponta nunca se cruzam, e arestas aninhadas
// (a < c < d < b) tambem nao: a de dentro desenha um arco menor por baixo.
//
// A ESPESSURA DE LIVRO do grafo e o menor numero de paginas, considerando
// TODAS as ordens possiveis do lombo. Isso e o que torna o problema caro: nao
// basta colorir bem um desenho, e preciso escolher a ordem certa tambem.
//
// Uma vez fixada a ordem, o problema vira coloracao: monto o grafo de conflito
// (um vertice por aresta, ligado quando as duas se cruzam) e o numero de
// paginas daquela ordem e o numero cromatico dele.

/** Um grafo: numero de vertices e lista de arestas [a,b] com a < b. */
export function grafo (n, arestas) {
  const vistas = new Set()
  const limpas = []
  for (const [x, y] of arestas) {
    if (x === y) throw new Error(`laco no vertice ${x}: o livro nao desenha laco`)
    if (x < 0 || y < 0 || x >= n || y >= n) throw new Error(`aresta ${x}-${y} fora de 0..${n - 1}`)
    const a = Math.min(x, y)
    const b = Math.max(x, y)
    const k = `${a}-${b}`
    // Aresta repetida inflaria a contagem sem mudar o desenho. Montar o grafo
    // por notacao compacta escreve cada ligacao duas vezes, e ja houve tabela
    // mentindo por isso no acervo: a adjacencia estava certa e a CONTAGEM nao.
    if (vistas.has(k)) continue
    vistas.add(k)
    limpas.push([a, b])
  }
  return { n, arestas: limpas, m: limpas.length }
}

/** As duas arestas se cruzam, dada a POSICAO de cada vertice no lombo? */
export function cruzam (e1, e2, posicao) {
  let [a, b] = [posicao[e1[0]], posicao[e1[1]]]
  let [c, d] = [posicao[e2[0]], posicao[e2[1]]]
  if (a > b) { const t = a; a = b; b = t }
  if (c > d) { const t = c; c = d; d = t }
  // Ponta compartilhada: nunca cruzam.
  if (a === c || a === d || b === c || b === d) return false
  return (a < c && c < b && b < d) || (c < a && a < d && d < b)
}

/**
 * O grafo de conflito de uma ordem: quem cruza com quem.
 *
 * Devolvo uma mascara de bits por aresta. Com ate 30 arestas isso cabe num
 * inteiro do JavaScript, e a coloracao fica uma conta de bits em vez de uma
 * varredura de lista.
 */
export function conflitos (g, ordem) {
  const posicao = new Array(g.n)
  for (let i = 0; i < ordem.length; i++) posicao[ordem[i]] = i
  const mascaras = new Array(g.m).fill(0)
  for (let i = 0; i < g.m; i++) {
    for (let j = i + 1; j < g.m; j++) {
      if (cruzam(g.arestas[i], g.arestas[j], posicao)) {
        mascaras[i] |= 1 << j
        mascaras[j] |= 1 << i
      }
    }
  }
  return mascaras
}

export function conta (m) {
  m = m - ((m >>> 1) & 0x55555555)
  m = (m & 0x33333333) + ((m >>> 2) & 0x33333333)
  m = (m + (m >>> 4)) & 0x0f0f0f0f
  return (m * 0x01010101) >>> 24
}

/** Quantos pares de arestas se cruzam nesta ordem. */
export function quantosCruzamentos (g, ordem) {
  const c = conflitos(g, ordem)
  let total = 0
  for (const m of c) total += conta(m)
  return total / 2
}

/**
 * Da para pintar o grafo de conflito com k cores?
 *
 * Volta atras na primeira aresta que nao cabe. A ordem de visita e a das
 * arestas mais conflituosas primeiro, que e o que faz a poda morder cedo.
 *
 * O `estado` e criado DENTRO da chamada, nunca compartilhado entre niveis: o
 * vetor de estado reaproveitado entre niveis de busca e o erro que mais
 * aparece neste acervo, e ele nao da sintoma, da resposta errada em silencio.
 */
export function cabeEmPaginas (mascaras, k) {
  const m = mascaras.length
  if (m === 0) return { cabe: true, nos: 0, cores: [] }
  const ordemDeVisita = mascaras
    .map((mask, i) => [conta(mask), i])
    .sort((a, b) => b[0] - a[0])
    .map(([, i]) => i)

  const cor = new Array(m).fill(-1)
  let nos = 0

  function tenta (indice, maiorUsada) {
    if (indice === m) return true
    nos++
    const atual = ordemDeVisita[indice]
    const vizinhos = mascaras[atual]
    // Simetria das cores: nao adianta tentar a cor 5 antes de a 4 ter sido
    // usada. Sem este corte a busca repete o mesmo desenho com os nomes das
    // cores trocados, e paga k! vezes a mais.
    const teto = Math.min(k - 1, maiorUsada + 1)
    for (let c = 0; c <= teto; c++) {
      let bate = false
      let resto = vizinhos
      while (resto) {
        const b = resto & -resto
        const j = Math.log2(b >>> 0) | 0
        if (cor[j] === c) { bate = true; break }
        resto ^= b
      }
      if (bate) continue
      cor[atual] = c
      if (tenta(indice + 1, Math.max(maiorUsada, c))) return true
      cor[atual] = -1
    }
    return false
  }

  const cabe = tenta(0, -1)
  return { cabe, nos, cores: cabe ? [...cor] : [] }
}

/** O numero de paginas que ESTA ordem exige: o cromatico do conflito. */
export function paginasDaOrdem (g, ordem) {
  const mascaras = conflitos(g, ordem)
  let nos = 0
  for (let k = 0; k <= g.m; k++) {
    const r = cabeEmPaginas(mascaras, k)
    nos += r.nos
    if (r.cabe) return { paginas: k, nos }
  }
  return { paginas: g.m, nos }
}

// ---------------------------------------------------------------------------
// Familias de grafos. Cada uma e montada por regra, nunca desenhada de cabeca.
// ---------------------------------------------------------------------------

export function completo (n) {
  const a = []
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) a.push([i, j])
  return grafo(n, a)
}

export function ciclo (n) {
  const a = []
  for (let i = 0; i < n; i++) a.push([i, (i + 1) % n])
  return grafo(n, a)
}

export function caminho (n) {
  const a = []
  for (let i = 0; i + 1 < n; i++) a.push([i, i + 1])
  return grafo(n, a)
}

export function bipartidoCompleto (p, q) {
  const a = []
  for (let i = 0; i < p; i++) for (let j = 0; j < q; j++) a.push([i, p + j])
  return grafo(p + q, a)
}

export function roda (n) {
  // n vertices no aro mais um centro.
  const a = []
  for (let i = 0; i < n; i++) { a.push([i, (i + 1) % n]); a.push([i, n]) }
  return grafo(n + 1, a)
}

export function grade (largura, altura) {
  const a = []
  const id = (r, c) => r * largura + c
  for (let r = 0; r < altura; r++) {
    for (let c = 0; c < largura; c++) {
      if (c + 1 < largura) a.push([id(r, c), id(r, c + 1)])
      if (r + 1 < altura) a.push([id(r, c), id(r + 1, c)])
    }
  }
  return grafo(largura * altura, a)
}

export function cubo (d) {
  const n = 1 << d
  const a = []
  for (let x = 0; x < n; x++) {
    for (let b = 0; b < d; b++) {
      const y = x ^ (1 << b)
      if (y > x) a.push([x, y])
    }
  }
  return grafo(n, a)
}

export function petersen () {
  const a = []
  for (let i = 0; i < 5; i++) {
    a.push([i, (i + 1) % 5])          // o pentagono de fora
    a.push([i, 5 + i])                // os raios
    a.push([5 + i, 5 + ((i + 2) % 5)]) // a estrela de dentro
  }
  return grafo(10, a)
}

/** Grafo cubico por notacao LCF. A notacao escreve cada corda DUAS VEZES. */
export function porLCF (n, saltos) {
  const a = []
  for (let i = 0; i < n; i++) a.push([i, (i + 1) % n])
  for (let i = 0; i < n; i++) {
    const s = saltos[i % saltos.length]
    const j = ((i + s) % n + n) % n
    a.push([Math.min(i, j), Math.max(i, j)])
  }
  // `grafo` tira as repetidas: sem isso a contagem de arestas sairia inflada,
  // com a adjacencia certa e o numero errado.
  return grafo(n, a)
}

export function heawood () { return porLCF(14, [5, -5]) }
export function mobiusKantor () { return porLCF(16, [5, -5]) }
