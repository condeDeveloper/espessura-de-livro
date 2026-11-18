// Os numeros do README, presos.
//
// Todos sairam de `node ferramentas/medidor.js`. Os derivados — porcentagens,
// razoes entre o pior e o melhor lombo, contagens de "exatas" e "curtas" —
// passaram pelo programa antes de entrar aqui.

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  espessuras, cotaContraMedida, formulaDoKn, raridades,
  melhorContraPior, motorContraBraco, umaPaginaSo, ocupacao
} from '../js/medidas.js'

test('a espessura de cada grafo do catalogo', () => {
  const m = new Map(espessuras().map((l) => [l.nome, l.paginas]))
  assert.equal(m.get('K_4'), 2)
  assert.equal(m.get('K_5'), 3)
  assert.equal(m.get('K_6'), 3)
  assert.equal(m.get('K_7'), 4)
  assert.equal(m.get('K_8'), 4)
  assert.equal(m.get('ciclo 6'), 1)
  assert.equal(m.get('ciclo 7'), 1)
  assert.equal(m.get('caminho 6'), 1)
  assert.equal(m.get('K33'), 3)
  assert.equal(m.get('roda 6'), 2)
  assert.equal(m.get('cubo Q3'), 2)
  assert.equal(m.get('grade 3x3'), 2)
  assert.equal(m.get('petersen'), 3)
})

test('todas as varreduras foram completas, nenhuma parou no teto', () => {
  for (const l of espessuras()) assert.equal(l.completa, true, l.nome)
})

test('as ordens varridas sao (n-1)!/2 em cada linha', () => {
  const esperado = { 4: 3, 5: 12, 6: 60, 7: 360, 8: 2520, 9: 20160, 10: 181440 }
  for (const l of espessuras()) assert.equal(l.ordens, esperado[l.n], l.nome)
})

test('a cota de Euler e exata em 6 e curta em 7', () => {
  const r = cotaContraMedida()
  assert.equal(r.exatas, 6)
  assert.equal(r.curtas, 7)
  assert.equal(r.exatas + r.curtas, 13)
  assert.equal(r.maiorFolga, 2)
})

test('a cota e exata exatamente nos completos e na roda', () => {
  const exatas = cotaContraMedida().linhas.filter((l) => l.exata).map((l) => l.nome)
  assert.deepEqual(exatas.sort(), ['K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'roda 6'])
})

test('a cota fica curta por 2 no K33 e no Petersen', () => {
  const porNome = new Map(cotaContraMedida().linhas.map((l) => [l.nome, l]))
  assert.equal(porNome.get('K33').cota, 1)
  assert.equal(porNome.get('K33').paginas, 3)
  assert.equal(porNome.get('K33').folga, 2)
  assert.equal(porNome.get('petersen').cota, 1)
  assert.equal(porNome.get('petersen').paginas, 3)
  assert.equal(porNome.get('petersen').folga, 2)
})

test('a formula ceil(n/2) falha no K_3 e acerta de K_4 a K_8', () => {
  const linhas = formulaDoKn(8)
  const k3 = linhas.find((l) => l.n === 3)
  assert.equal(k3.medido, 1)
  assert.equal(k3.formula, 2)
  assert.equal(k3.bate, false)
  assert.equal(k3.valeAqui, false)
  for (const l of linhas.filter((x) => x.n >= 4)) {
    assert.equal(l.bate, true, `K_${l.n}`)
  }
})

test('nos completos e no K33 toda ordem do lombo e otima', () => {
  const porNome = new Map(raridades().map((l) => [l.nome, l]))
  for (const nome of ['K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'K33']) {
    const l = porNome.get(nome)
    assert.equal(l.otimas, l.total, nome)
    assert.equal(l.porcento, 100, nome)
  }
})

test('no ciclo de 7 so uma ordem em 360 e otima', () => {
  const porNome = new Map(raridades().map((l) => [l.nome, l]))
  const c7 = porNome.get('ciclo 7')
  assert.equal(c7.otimas, 1)
  assert.equal(c7.total, 360)
  assert.equal(c7.porcento.toFixed(2), '0.28')
  const c6 = porNome.get('ciclo 6')
  assert.equal(c6.otimas, 1)
  assert.equal(c6.total, 60)
  assert.equal(c6.porcento.toFixed(2), '1.67')
})

test('as outras raridades medidas', () => {
  const porNome = new Map(raridades().map((l) => [l.nome, l]))
  assert.equal(porNome.get('caminho 6').otimas, 8)
  assert.equal(porNome.get('roda 6').otimas, 48)
  assert.equal(porNome.get('cubo Q3').otimas, 252)
  assert.equal(porNome.get('grade 3x3').otimas, 1220)
  assert.equal(porNome.get('petersen').otimas, 94308)
  assert.equal(porNome.get('petersen').porcento.toFixed(2), '51.98')
  assert.equal(porNome.get('grade 3x3').porcento.toFixed(2), '6.05')
})

test('o pior lombo custa ate 4x o melhor, e nos completos custa 1x', () => {
  const porNome = new Map(melhorContraPior().map((l) => [l.nome, l]))
  assert.equal(porNome.get('ciclo 7').melhor, 1)
  assert.equal(porNome.get('ciclo 7').pior, 4)
  assert.equal(porNome.get('ciclo 7').razao, 4)
  assert.equal(porNome.get('ciclo 6').pior, 3)
  assert.equal(porNome.get('petersen').pior, 5)
  assert.equal(porNome.get('petersen').razao.toFixed(2), '1.67')
  // Nos completos melhor e pior sao o MESMO numero: o lombo nao muda nada.
  assert.equal(porNome.get('K_6').melhor, porNome.get('K_6').pior)
  assert.equal(porNome.get('K33').melhor, porNome.get('K33').pior)
})

test('a ordem obvia 0..n-1 perde 2 paginas no cubo e no Petersen', () => {
  const porNome = new Map(melhorContraPior().map((l) => [l.nome, l]))
  assert.equal(porNome.get('cubo Q3').natural, 4)
  assert.equal(porNome.get('cubo Q3').perdaDaNatural, 2)
  assert.equal(porNome.get('petersen').natural, 5)
  assert.equal(porNome.get('petersen').perdaDaNatural, 2)
  assert.equal(porNome.get('grade 3x3').perdaDaNatural, 1)
  // E nao perde nada onde ela ja e a ordem certa.
  assert.equal(porNome.get('ciclo 7').perdaDaNatural, 0)
  assert.equal(porNome.get('K_6').perdaDaNatural, 0)
})

test('o motor e a forca bruta concordam, e a poda cobra menos', () => {
  for (const l of motorContraBraco()) {
    assert.equal(l.concordam, true, l.nome)
    assert.ok(l.razao > 1, `${l.nome}: razao ${l.razao}`)
  }
  const porNome = new Map(motorContraBraco().map((l) => [l.nome, l]))
  assert.equal(porNome.get('K_5').nosBom, 205)
  assert.equal(porNome.get('K_5').nosBurro, 2588)
  assert.equal(porNome.get('K_5').razao.toFixed(2), '12.62')
  assert.equal(porNome.get('roda 6').razao.toFixed(2), '23.99')
})

test('externoplanar e "cabe em uma pagina" sao a mesma coisa nas 13 linhas', () => {
  const linhas = umaPaginaSo()
  assert.equal(linhas.length, 13)
  for (const l of linhas) assert.equal(l.bate, true, l.nome)
  assert.equal(linhas.filter((l) => l.externoplanar).length, 3)
})

test('K_4, K_6 e K_8 ficam exatamente no teto de arestas', () => {
  const porNome = new Map(ocupacao().map((l) => [l.nome, l]))
  for (const nome of ['K_4', 'K_6', 'K_8']) {
    assert.equal(porNome.get(nome).sobra, 0, nome)
    assert.equal(porNome.get(nome).cheio, true, nome)
  }
  // Os de tamanho impar sobram.
  assert.equal(porNome.get('K_5').sobra, 1)
  assert.equal(porNome.get('K_7').sobra, 2)
  // E o Petersen usa menos da metade do que 3 paginas comportariam.
  assert.equal(porNome.get('petersen').teto, 31)
  assert.equal(porNome.get('petersen').m, 15)
  assert.equal(porNome.get('petersen').sobra, 16)
})
