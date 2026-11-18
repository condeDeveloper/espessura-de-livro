// A pagina: o grafo desenhado no circulo, com as paginas coloridas.
//
// O desenho usa o MESMO motor do resto: a ordem do lombo vem da busca, as
// paginas vem da coloracao do grafo de conflito. A pagina nao reimplementa a
// regra de cruzamento, so desenha o que o nucleo decidiu.

import {
  completo, ciclo, caminho, bipartidoCompleto, roda, grade, cubo, petersen,
  conflitos, cabeEmPaginas, paginasDaOrdem, quantosCruzamentos
} from './nucleo.js'
import { espessura, ordemNatural, piorOrdem, quantasOrdens } from './busca.js'
import { cotaDeEuler } from './juiz.js'

const FAMILIAS = {
  'K_4': () => completo(4), 'K_5': () => completo(5), 'K_6': () => completo(6),
  'K_7': () => completo(7), 'K_8': () => completo(8),
  'ciclo 6': () => ciclo(6), 'ciclo 7': () => ciclo(7), 'caminho 6': () => caminho(6),
  'K 3,3': () => bipartidoCompleto(3, 3), 'roda 6': () => roda(6),
  'cubo Q3': () => cubo(3), 'grade 3x3': () => grade(3, 3), 'Petersen': () => petersen()
}

const CORES = ['#a52a45', '#4ec9a8', '#e0b64a', '#6f8ddb', '#c77dd6', '#d4536f']

const elGrafo = document.getElementById('grafo')
const elDesenho = document.getElementById('desenho')
const elTexto = document.getElementById('texto')
const elLombo = document.getElementById('lombo')

let atual = null
let ordemAtual = null

function monta () {
  const g = FAMILIAS[elGrafo.value]()
  atual = g
  ordemAtual = null
  for (let i = 0; i < g.n; i++) { /* ordem natural ate alguem pedir outra */ }
  ordemAtual = Array.from({ length: g.n }, (_, i) => i)
  desenha()
}

function cores (g, ordem) {
  const mascaras = conflitos(g, ordem)
  const r = paginasDaOrdem(g, ordem)
  const pintado = cabeEmPaginas(mascaras, r.paginas)
  return { paginas: r.paginas, cor: pintado.cores }
}

function desenha () {
  const g = atual
  const ordem = ordemAtual
  const { paginas, cor } = cores(g, ordem)
  const R = 150
  const cx = 200
  const cy = 190
  const pontos = new Array(g.n)
  for (let i = 0; i < g.n; i++) {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / g.n
    pontos[ordem[i]] = [cx + R * Math.cos(ang), cy + R * Math.sin(ang)]
  }

  const partes = []
  g.arestas.forEach(([a, b], i) => {
    const [x1, y1] = pontos[a]
    const [x2, y2] = pontos[b]
    const c = CORES[(cor[i] ?? 0) % CORES.length]
    partes.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="2" opacity="0.9"/>`)
  })
  for (let v = 0; v < g.n; v++) {
    const [x, y] = pontos[v]
    partes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="#1d1729" stroke="#ece7f5" stroke-width="1.5"/>`)
    partes.push(`<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" fill="#ece7f5" font-size="11">${v}</text>`)
  }
  elDesenho.innerHTML = `<svg viewBox="0 0 400 380" role="img" aria-label="grafo desenhado no circulo">${partes.join('')}</svg>`

  const cruz = quantosCruzamentos(g, ordem)
  elLombo.textContent = ordem.join(' · ')
  elTexto.innerHTML = `Esta ordem usa <strong>${paginas}</strong> página${paginas === 1 ? '' : 's'} e tem ${cruz} par${cruz === 1 ? '' : 'es'} de arestas se cruzando. Cada cor é uma página.`
}

document.getElementById('melhor').addEventListener('click', () => {
  const g = atual
  elTexto.textContent = 'varrendo todas as ordens...'
  setTimeout(() => {
    const antes = performance.now()
    const r = espessura(g)
    const ms = Math.round(performance.now() - antes)
    ordemAtual = r.melhorOrdem
    desenha()
    const cota = cotaDeEuler(g)
    elTexto.innerHTML += ` <br>Mínimo sobre as <strong>${r.abertas.toLocaleString('pt-BR')}</strong> ordens do lombo, varridas em ${ms} ms: <strong>${r.paginas}</strong>. ` +
      `${r.otimas.toLocaleString('pt-BR')} ordens (${(r.otimas / r.abertas * 100).toFixed(2)}%) empatam nesse mínimo. ` +
      (cota === null ? '' : `A cota de Euler pedia ${cota}${cota === r.paginas ? ', e foi exata' : `, e ficou curta por ${r.paginas - cota}`}.`)
  }, 10)
})

document.getElementById('pior').addEventListener('click', () => {
  const g = atual
  elTexto.textContent = 'varrendo todas as ordens...'
  setTimeout(() => {
    const r = piorOrdem(g)
    ordemAtual = r.ordemRuim || ordemAtual
    desenha()
    elTexto.innerHTML += ` <br>Este é o <strong>pior</strong> lombo: ${r.paginas} páginas, contra ${espessura(g).paginas} do melhor.`
  }, 10)
})

document.getElementById('obvia').addEventListener('click', () => {
  const g = atual
  ordemAtual = Array.from({ length: g.n }, (_, i) => i)
  desenha()
  const melhor = espessura(g).paginas
  const nat = ordemNatural(g)
  elTexto.innerHTML += ` <br>A ordem 0, 1, 2, … usa ${nat} e o mínimo é ${melhor}` +
    (nat > melhor ? `: ela <strong>perde ${nat - melhor}</strong>.` : ': ela já é ótima.')
})

document.getElementById('sortear').addEventListener('click', () => {
  const g = atual
  const o = Array.from({ length: g.n }, (_, i) => i)
  for (let i = o.length - 1; i > 1; i--) {
    const j = 1 + Math.floor(Math.random() * i)
    const t = o[i]; o[i] = o[j]; o[j] = t
  }
  ordemAtual = o
  desenha()
})

elGrafo.addEventListener('change', monta)

for (const nome of Object.keys(FAMILIAS)) {
  const op = document.createElement('option')
  op.value = nome
  op.textContent = nome
  if (nome === 'Petersen') op.selected = true
  elGrafo.appendChild(op)
}
monta()
