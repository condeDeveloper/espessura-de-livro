// Os casos caros: o Petersen com 181.440 ordens e a grade com 20.160.
//
// Ficam em arquivo separado porque sao as duas varreduras que respondem a
// pergunta mais forte do projeto — a de QUANTAS ordens atingem o minimo — e
// essa resposta so vale porque nenhuma ordem foi pulada.

import test from 'node:test'
import assert from 'node:assert/strict'

import { espessura, raridadeDoOtimo, piorOrdem, quantasOrdens } from '../js/busca.js'
import { petersen, grade, cubo } from '../js/nucleo.js'

test('o Petersen: 181.440 ordens varridas, 3 paginas', () => {
  const g = petersen()
  assert.equal(g.n, 10)
  assert.equal(g.m, 15)
  const r = espessura(g)
  assert.equal(r.paginas, 3)
  assert.equal(r.completa, true)
  assert.equal(r.abertas, 181440)
  assert.equal(r.abertas, quantasOrdens(10))
})

test('no Petersen, 94.308 das 181.440 ordens atingem o minimo', () => {
  const r = raridadeDoOtimo(petersen())
  assert.equal(r.otimas, 94308)
  assert.equal(r.total, 181440)
  assert.equal((r.fracao * 100).toFixed(2), '51.98')
  assert.equal(r.completa, true)
})

test('o pior lombo do Petersen custa 5 paginas contra as 3 do melhor', () => {
  const g = petersen()
  const p = piorOrdem(g)
  assert.equal(p.paginas, 5)
  assert.equal(p.completa, true)
  assert.equal(espessura(g).paginas, 3)
})

test('a grade 3x3: 20.160 ordens, e so 1.220 delas servem', () => {
  const g = grade(3, 3)
  assert.equal(g.n, 9)
  assert.equal(g.m, 12)
  const r = raridadeDoOtimo(g)
  assert.equal(r.paginas, 2)
  assert.equal(r.otimas, 1220)
  assert.equal(r.total, 20160)
  assert.equal((r.fracao * 100).toFixed(2), '6.05')
})

test('o cubo Q3: 252 das 2.520 ordens, exatamente 10%', () => {
  const r = raridadeDoOtimo(cubo(3))
  assert.equal(r.paginas, 2)
  assert.equal(r.otimas, 252)
  assert.equal(r.total, 2520)
  assert.equal(r.fracao * 100, 10)
})
