#!/usr/bin/env node
// O medidor. Roda as tabelas e cospe os numeros que vao para o README.
//
//   node ferramentas/medidor.js             todas
//   node ferramentas/medidor.js espessuras  a espessura de cada grafo
//   node ferramentas/medidor.js cota        a cota de Euler contra a medida
//   node ferramentas/medidor.js completo    a formula ceil(n/2) e onde ela falha
//   node ferramentas/medidor.js raridade    quao raro e acertar o lombo
//   node ferramentas/medidor.js lombo       o melhor lombo contra o pior
//   node ferramentas/medidor.js duelo       o motor contra a forca bruta
//   node ferramentas/medidor.js uma         quem cabe em uma pagina so
//   node ferramentas/medidor.js ocupacao    quanto do teto de arestas cada um usa

import {
  espessuras, cotaContraMedida, formulaDoKn, raridades,
  melhorContraPior, motorContraBraco, umaPaginaSo, ocupacao
} from '../js/medidas.js'

const n = (x) => x === null || x === undefined ? '-' : x.toLocaleString('pt-BR')
const pad = (s, w) => String(s).padStart(w)
const padr = (s, w) => String(s).padEnd(w)

function tEspessuras () {
  console.log('\n== a espessura de livro de cada grafo ==')
  for (const l of espessuras()) {
    console.log(`   ${padr(l.nome, 10)} n=${pad(l.n, 2)}  m=${pad(l.m, 2)}  ->  ${l.paginas} pagina${l.paginas === 1 ? '' : 's'}   (${n(l.ordens)} ordens varridas)`)
  }
  console.log('   Toda linha e minimo sobre TODAS as ordens do lombo, nao sobre uma ordem escolhida.')
}

function tCota () {
  console.log('\n== a cota de Euler contra a medida ==')
  console.log('   k >= (m - n) / (n - 3), que vem de k paginas comportarem no maximo k(n-3) + n arestas')
  const r = cotaContraMedida()
  for (const l of r.linhas) {
    console.log(`   ${padr(l.nome, 10)} n=${pad(l.n, 2)}  m=${pad(l.m, 2)}  cota ${l.cota}  medido ${l.paginas}   ${l.exata ? 'EXATA' : 'curta por ' + l.folga}`)
  }
  console.log(`\n   exatas: ${r.exatas}   curtas: ${r.curtas}   maior folga: ${r.maiorFolga}`)
  console.log('   Nos completos a cota nao e so exata: ela E a formula ceil(n/2).')
}

function tCompleto () {
  console.log('\n== a formula ceil(n/2) do grafo completo ==')
  for (const l of formulaDoKn(8)) {
    const marca = l.bate ? 'bate' : 'NAO BATE'
    const nota = l.valeAqui ? '' : '   <- a formula so vale de n=4 em diante'
    console.log(`   K_${l.n}  m=${pad(l.m, 2)}   medido ${l.medido}   formula ${l.formula}   ${marca}${nota}`)
  }
  console.log('   O triangulo cabe em uma pagina: as tres arestas compartilham pontas duas a duas.')
}

function tRaridade () {
  console.log('\n== quao raro e acertar o lombo otimo ==')
  for (const l of raridades()) {
    console.log(`   ${padr(l.nome, 10)} ${l.paginas} pagina${l.paginas === 1 ? ' ' : 's'}   ${pad(n(l.otimas), 6)} de ${pad(n(l.total), 6)} ordens   ${l.porcento.toFixed(2)}%`)
  }
  console.log('   Nos completos o lombo nao importa: toda ordem e otima.')
  console.log('   No ciclo de 7 so uma ordem em 360 serve, e e a ordem do proprio ciclo.')
}

function tLombo () {
  console.log('\n== o melhor lombo contra o pior, e o que a ordem obvia custa ==')
  for (const l of melhorContraPior()) {
    console.log(`   ${padr(l.nome, 10)} melhor ${l.melhor}   pior ${l.pior}   (${l.razao.toFixed(2)}x)   ordem 0..n-1: ${l.natural}${l.perdaDaNatural > 0 ? '   <- perde ' + l.perdaDaNatural : ''}`)
  }
}

function tDuelo () {
  console.log('\n== o motor com poda contra a forca bruta ==')
  for (const l of motorContraBraco()) {
    console.log(`   ${padr(l.nome, 10)} motor ${l.paginasBom} (${pad(n(l.nosBom), 7)} nos)   braco ${l.paginasBurro} (${pad(n(l.nosBurro), 9)} nos)   ${l.razao.toFixed(2)}x   concordam: ${l.concordam}`)
  }
}

function tUma () {
  console.log('\n== quem cabe em uma pagina so ==')
  for (const l of umaPaginaSo()) {
    console.log(`   ${padr(l.nome, 10)} externoplanar: ${String(l.externoplanar).padEnd(5)}   paginas: ${l.paginas}   bate: ${l.bate}`)
  }
  console.log('   "externoplanar" aqui e decidido pelo DESENHO (existe ordem sem cruzamento nenhum),')
  console.log('   e nao perguntando ao motor de paginas. Sao dois caminhos para a mesma resposta.')
}

function tOcupacao () {
  console.log('\n== quanto do teto de arestas cada grafo usa ==')
  for (const l of ocupacao()) {
    console.log(`   ${padr(l.nome, 10)} ${l.paginas} paginas comportam ${pad(l.teto, 3)} arestas, o grafo tem ${pad(l.m, 2)}   sobra ${pad(l.sobra, 3)}${l.cheio ? '   <- no limite' : ''}`)
  }
}

const partes = {
  espessuras: tEspessuras,
  cota: tCota,
  completo: tCompleto,
  raridade: tRaridade,
  lombo: tLombo,
  duelo: tDuelo,
  uma: tUma,
  ocupacao: tOcupacao
}

const pedido = process.argv[2]
if (!pedido) {
  for (const f of Object.values(partes)) f()
} else if (partes[pedido]) {
  partes[pedido]()
} else {
  console.error(`nao conheco "${pedido}". conheco: ${Object.keys(partes).join(', ')}`)
  process.exit(1)
}
