import test from 'node:test'
import assert from 'node:assert/strict'

import {
  grafo, cruzam, conflitos, cabeEmPaginas, paginasDaOrdem, conta, quantosCruzamentos,
  completo, ciclo, caminho, bipartidoCompleto, roda, grade, cubo, petersen, porLCF, heawood
} from '../js/nucleo.js'
import { ordensDoLombo, quantasOrdens, espessura, ordemNatural, piorOrdem, permutacoes } from '../js/busca.js'
import { cotaDeEuler, arestasQueCabem, forcaBruta, espessuraNoBraco, ehExternoplanar, formulaDoCompleto } from '../js/juiz.js'

test('o grafo recusa laco e aresta fora da faixa', () => {
  assert.throws(() => grafo(3, [[0, 0]]), /laco/)
  assert.throws(() => grafo(3, [[0, 5]]), /fora/)
})

test('aresta repetida nao infla a contagem', () => {
  // A notacao LCF escreve cada corda duas vezes. Se o montador nao tirasse as
  // repetidas, a adjacencia sairia certa e o NUMERO de arestas sairia errado —
  // que e exatamente o modo como uma tabela mente sem dar erro.
  const g = grafo(4, [[0, 1], [1, 0], [0, 1], [2, 3]])
  assert.equal(g.m, 2)
  const h = heawood()
  assert.equal(h.n, 14)
  assert.equal(h.m, 21)   // 14 do aro + 7 cordas, e nao 14 + 14
  // Grafo cubico: soma dos graus = 2 x arestas.
  const grau = new Array(14).fill(0)
  for (const [a, b] of h.arestas) { grau[a]++; grau[b]++ }
  assert.ok(grau.every((d) => d === 3), 'Heawood e cubico')
  assert.equal(grau.reduce((x, y) => x + y, 0), 2 * h.m)
})

test('arestas que compartilham ponta nunca se cruzam', () => {
  const pos = [0, 1, 2, 3]
  assert.equal(cruzam([0, 2], [2, 3], pos), false)
  assert.equal(cruzam([0, 1], [0, 3], pos), false)
})

test('arestas aninhadas nao se cruzam, intercaladas sim', () => {
  const pos = [0, 1, 2, 3]
  // 0 < 1 < 2 < 3: a aresta 0-3 contem a 1-2.
  assert.equal(cruzam([0, 3], [1, 2], pos), false)
  // 0 < 1 < 2 < 3: 0-2 e 1-3 se intercalam.
  assert.equal(cruzam([0, 2], [1, 3], pos), true)
})

test('o cruzamento nao muda quando o lombo gira', () => {
  // E por isso que prender o vertice 0 na primeira casa e reducao legitima.
  const g = ciclo(5)
  const base = quantosCruzamentos(g, [0, 1, 2, 3, 4])
  for (const giro of [[1, 2, 3, 4, 0], [2, 3, 4, 0, 1], [3, 4, 0, 1, 2]]) {
    assert.equal(quantosCruzamentos(g, giro), base)
  }
  // Nem quando ele e lido ao contrario.
  assert.equal(quantosCruzamentos(g, [0, 4, 3, 2, 1]), base)
})

test('o ciclo desenhado na propria ordem nao tem cruzamento nenhum', () => {
  const g = ciclo(7)
  assert.equal(quantosCruzamentos(g, [0, 1, 2, 3, 4, 5, 6]), 0)
  assert.equal(paginasDaOrdem(g, [0, 1, 2, 3, 4, 5, 6]).paginas, 1)
})

test('o numero de ordens varridas e (n-1)!/2', () => {
  for (const [n, esperado] of [[3, 1], [4, 3], [5, 12], [6, 60], [7, 360], [8, 2520]]) {
    assert.equal(quantasOrdens(n), esperado)
    assert.equal([...ordensDoLombo(n)].length, esperado)
  }
})

test('as ordens geradas comecam todas no vertice 0 e sao distintas', () => {
  const todas = [...ordensDoLombo(6)]
  assert.equal(todas.length, 60)
  for (const o of todas) {
    assert.equal(o[0], 0)
    assert.equal(new Set(o).size, 6)
  }
  assert.equal(new Set(todas.map((o) => o.join(','))).size, 60)
})

test('o gerador de permutacoes devolve copias', () => {
  const lista = [...permutacoes([1, 2, 3])]
  assert.equal(lista.length, 6)
  assert.notDeepEqual(lista[0], lista[1])
})

test('grafo sem aresta cabe em zero paginas', () => {
  const g = grafo(4, [])
  assert.equal(espessura(g).paginas, 0)
  assert.deepEqual(cabeEmPaginas([], 0), { cabe: true, nos: 0, cores: [] })
})

test('a coloracao do conflito nao inventa cor que nao cabe', () => {
  // Tres arestas que se cruzam duas a duas precisam de tres paginas.
  const g = grafo(6, [[0, 3], [1, 4], [2, 5]])
  const m = conflitos(g, [0, 1, 2, 3, 4, 5])
  assert.equal(cabeEmPaginas(m, 2).cabe, false)
  assert.equal(cabeEmPaginas(m, 3).cabe, true)
})

test('o triangulo cabe em uma pagina, e a formula ceil(n/2) pede duas', () => {
  const g = completo(3)
  assert.equal(g.m, 3)
  assert.equal(espessura(g).paginas, 1)
  const f = formulaDoCompleto(3)
  assert.equal(f.valor, 2)
  assert.equal(f.valeAqui, false)
  assert.equal(f.valeApartirDe, 4)
})

test('de K_4 a K_8 a formula ceil(n/2) acerta', () => {
  for (let n = 4; n <= 8; n++) {
    const medido = espessura(completo(n)).paginas
    assert.equal(medido, Math.ceil(n / 2), `K_${n}`)
    assert.equal(formulaDoCompleto(n).valeAqui, true)
  }
})

test('a cota de Euler se cala quando a conta nao vale', () => {
  // Com n <= 3 o denominador n-3 zera ou fica negativo. Devolver um numero
  // bonito ali seria inventar resposta para o caso degenerado.
  assert.equal(cotaDeEuler(completo(3)), null)
  assert.equal(cotaDeEuler(completo(2)), null)
  assert.equal(cotaDeEuler(completo(4)), 2)
})

test('a cota de Euler nunca passa da medida', () => {
  for (const g of [completo(5), completo(7), ciclo(6), cubo(3), roda(6), bipartidoCompleto(3, 3)]) {
    const cota = cotaDeEuler(g)
    if (cota === null) continue
    assert.ok(cota <= espessura(g).paginas, `cota ${cota} passou da medida`)
  }
})

test('nos completos a cota de Euler E a formula ceil(n/2)', () => {
  for (let n = 4; n <= 8; n++) {
    assert.equal(cotaDeEuler(completo(n)), Math.ceil(n / 2), `K_${n}`)
  }
})

test('o teto de arestas e k(n-3) + n', () => {
  assert.equal(arestasQueCabem(4, 2), 6)
  assert.equal(arestasQueCabem(6, 3), 15)
  assert.equal(arestasQueCabem(8, 4), 28)
  // K_4, K_6 e K_8 ficam exatamente no limite.
  for (const n of [4, 6, 8]) {
    const g = completo(n)
    assert.equal(g.m, arestasQueCabem(n, Math.ceil(n / 2)), `K_${n}`)
  }
  // K_5 e K_7 sobram.
  for (const n of [5, 7]) {
    const g = completo(n)
    assert.ok(g.m < arestasQueCabem(n, Math.ceil(n / 2)), `K_${n}`)
  }
})

test('cabe em uma pagina exatamente quando ha ordem sem cruzamento', () => {
  for (const g of [ciclo(6), ciclo(7), caminho(6)]) {
    assert.equal(ehExternoplanar(g).sim, true)
    assert.equal(espessura(g).paginas, 1)
  }
  for (const g of [completo(4), bipartidoCompleto(3, 3), cubo(3), petersen()]) {
    assert.equal(ehExternoplanar(g).sim, false)
    assert.ok(espessura(g).paginas > 1)
  }
})

test('o motor com poda e a forca bruta dao a mesma espessura', () => {
  for (const [nome, g] of [['ciclo 6', ciclo(6)], ['K_5', completo(5)], ['caminho 6', caminho(6)]]) {
    const bom = espessura(g)
    const burro = espessuraNoBraco(g)
    assert.equal(bom.paginas, burro.paginas, nome)
    // A poda tem de custar MENOS, senao ela nao e poda.
    assert.ok(burro.nos > bom.nos, `${nome}: ${burro.nos} contra ${bom.nos}`)
  }
})

test('a forca bruta tambem recusa o que nao cabe', () => {
  const g = grafo(6, [[0, 3], [1, 4], [2, 5]])
  assert.equal(forcaBruta(g, [0, 1, 2, 3, 4, 5], 2).cabe, false)
  assert.equal(forcaBruta(g, [0, 1, 2, 3, 4, 5], 3).cabe, true)
})

test('o pior lombo nunca e melhor que o melhor', () => {
  for (const g of [ciclo(6), cubo(3), roda(6), completo(6)]) {
    assert.ok(piorOrdem(g).paginas >= espessura(g).paginas)
  }
})

test('a ordem obvia 0..n-1 nem sempre e boa', () => {
  // No cubo ela custa o dobro do minimo.
  const q3 = cubo(3)
  assert.equal(ordemNatural(q3), 4)
  assert.equal(espessura(q3).paginas, 2)
  // No ciclo ela ja e otima, porque ela E o ciclo.
  assert.equal(ordemNatural(ciclo(7)), 1)
  assert.equal(espessura(ciclo(7)).paginas, 1)
})

test('as familias tem o numero de arestas que a regra manda', () => {
  assert.equal(completo(7).m, 21)
  assert.equal(ciclo(9).m, 9)
  assert.equal(caminho(9).m, 8)
  assert.equal(bipartidoCompleto(3, 4).m, 12)
  assert.equal(roda(6).m, 12)
  assert.equal(grade(3, 3).m, 12)
  assert.equal(cubo(3).m, 12)
  assert.equal(petersen().m, 15)
  assert.equal(porLCF(14, [5, -5]).m, 21)
})

test('contar bits bate com a contagem no braco', () => {
  for (const x of [0, 1, 7, 255, 1023, 0b101010]) {
    let c = 0
    for (let i = 0; i < 31; i++) if (x & (1 << i)) c++
    assert.equal(conta(x), c)
  }
})
