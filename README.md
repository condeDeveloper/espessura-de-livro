# Espessura de livro

A espessura de livro de um grafo, varrida por **todas** as ordens do lombo, em JavaScript puro, sem dependência nenhuma.

Fure os vértices do grafo numa espiral, todos numa linha: é o **lombo** do livro. Cada aresta vai numa **página**, que é uma meia-folha saindo do lombo. Duas arestas na mesma página não podem se cruzar — e cruzar, com os vértices na ordem `v0 v1 … v(n−1)`, quer dizer que as pontas se intercalam: `a < c < b < d`.

A espessura é o **mínimo sobre todas as ordens possíveis**. Essa é a parte cara: não basta colorir bem um desenho, é preciso escolher a ordem certa também.

**Página:** <https://condedeveloper.github.io/espessura-de-livro/>

---

## Os quatro achados

**1. O lombo às vezes decide tudo e às vezes não decide nada.** No `K_8` as **2.520** ordens dão todas o mesmo resultado: melhor lombo e pior lombo são os mesmos 4. No ciclo de 7, **uma** ordem em 360 serve — **0,28%** — e errar custa até 4 páginas onde 1 bastava. Os dois extremos foram medidos varrendo tudo.

**2. A fórmula ⌈n/2⌉ do grafo completo falha no caso primitivo.** Ela acerta de `K_4` a `K_8`, medida uma a uma. No `K_3` ela pede 2 páginas e o triângulo cabe em **1**: as três arestas compartilham pontas duas a duas e nenhuma cruza nenhuma.

**3. A cota de Euler é exata em 6 dos 13 grafos, e nos completos ela *é* o teorema.** `k ≥ (m−n)/(n−3)` com `m = n(n−1)/2` dá `n/2` direto — a cota e a fórmula famosa são a mesma conta. Nos outros 7 grafos ela fica curta, errando por **2 páginas inteiras** no `K(3,3)` e no Petersen.

**4. A ordem óbvia custa o dobro.** Numerar 0, 1, 2, … e usar essa ordem dá **4 páginas no cubo Q3** (o mínimo é 2) e **5 no Petersen** (o mínimo é 3). No ciclo ela já é ótima, porque ali ela *é* o ciclo.

---

## As tabelas

Todos os números saem de `node ferramentas/medidor.js` e estão presos em `testes/`.

### A espessura de cada grafo

| grafo | n | arestas | páginas | ordens varridas |
| --- | --- | --- | --- | --- |
| `K_4` | 4 | 6 | 2 | 3 |
| `K_5` | 5 | 10 | 3 | 12 |
| `K_6` | 6 | 15 | 3 | 60 |
| `K_7` | 7 | 21 | 4 | 360 |
| `K_8` | 8 | 28 | 4 | 2.520 |
| ciclo 6 | 6 | 6 | 1 | 60 |
| ciclo 7 | 7 | 7 | 1 | 360 |
| caminho 6 | 6 | 5 | 1 | 60 |
| `K(3,3)` | 6 | 9 | 3 | 60 |
| roda 6 | 7 | 12 | 2 | 360 |
| cubo Q3 | 8 | 12 | 2 | 2.520 |
| grade 3×3 | 9 | 12 | 2 | 20.160 |
| Petersen | 10 | 15 | 3 | 181.440 |

Todas completas, nenhuma parou num teto. O número de ordens é `(n−1)!/2`: o vértice 0 fica preso na primeira casa (mata as *n* rotações) e o segundo tem de ser menor que o último (mata a inversão). As duas reduções valem porque **cruzamento de cordas é propriedade circular**, e isso está preso em teste.

### Quão raro é acertar o lombo

| grafo | páginas | ordens ótimas | de | % |
| --- | --- | --- | --- | --- |
| `K_4` … `K_8` | 2 a 4 | todas | todas | **100,00** |
| `K(3,3)` | 3 | 60 | 60 | **100,00** |
| caminho 6 | 1 | 8 | 60 | 13,33 |
| roda 6 | 2 | 48 | 360 | 13,33 |
| cubo Q3 | 2 | 252 | 2.520 | 10,00 |
| grade 3×3 | 2 | 1.220 | 20.160 | 6,05 |
| ciclo 6 | 1 | 1 | 60 | 1,67 |
| ciclo 7 | 1 | 1 | 360 | **0,28** |
| Petersen | 3 | 94.308 | 181.440 | 51,98 |

### O melhor lombo contra o pior

| grafo | melhor | pior | razão | ordem 0..n−1 |
| --- | --- | --- | --- | --- |
| ciclo 6 | 1 | 3 | 3,00× | 1 |
| ciclo 7 | 1 | 4 | 4,00× | 1 |
| caminho 6 | 1 | 3 | 3,00× | 1 |
| `K_6` | 3 | 3 | 1,00× | 3 |
| `K(3,3)` | 3 | 3 | 1,00× | 3 |
| cubo Q3 | 2 | 4 | 2,00× | **4** |
| grade 3×3 | 2 | 4 | 2,00× | **3** |
| roda 6 | 2 | 4 | 2,00× | 2 |
| Petersen | 3 | 5 | 1,67× | **5** |

### A cota de Euler contra a medida

Exata em 6, curta em 7, maior erro 2.

| grafo | cota | medido | |
| --- | --- | --- | --- |
| `K_4` a `K_8` | 2, 3, 3, 4, 4 | 2, 3, 3, 4, 4 | **exata nas cinco** |
| roda 6 | 2 | 2 | exata |
| ciclo 6, ciclo 7, caminho 6 | 0 | 1 | curta por 1 |
| cubo Q3, grade 3×3 | 1 | 2 | curta por 1 |
| `K(3,3)` | 1 | 3 | **curta por 2** |
| Petersen | 1 | 3 | **curta por 2** |

### O motor com poda contra a força bruta

| grafo | motor | força bruta | razão |
| --- | --- | --- | --- |
| caminho 6 | 208 nós | 642 nós | 3,09× |
| ciclo 6 | 192 nós | 974 nós | 5,07× |
| `K_5` | 205 nós | 2.588 nós | 12,62× |
| roda 6 | 3.312 nós | 79.463 nós | 23,99× |

Zero divergências em todas as linhas.

### Quanto do teto de arestas cada grafo usa

`K_4`, `K_6` e `K_8` ficam **exatamente** no limite `k(n−3)+n`: 6 de 6, 15 de 15, 28 de 28. Os de tamanho ímpar sobram 1 e 2. O Petersen usa 15 de 31 — menos da metade do que 3 páginas comportariam.

---

## O que as medidas me corrigiram

**Achei que ⌈n/2⌉ valesse para todo n.** Comparei a fórmula com a medida de `K_3` a `K_7` esperando cinco "bate", e o `K_3` voltou com **1** contra 2. A tabela do README começa no `K_3` justamente para não esconder a linha que desmente.

**Contei exatas e curtas com doze grafos, e o catálogo tinha treze.** Na primeira rodada da cota de Euler eu disse 6 exatas e 6 curtas. Com o ciclo de 7 incluído o certo é **6 e 7**. O número do README vem do medidor, que recalcula com o catálogo inteiro — e não da conta que eu fiz olhando a primeira saída.

O resto saiu certo de primeira. A coluna de 100% nos grafos completos não foi erro meu, mas foi a maior surpresa: perguntei "quantas ordens atingem o mínimo?" esperando número pequeno em todo lugar.

---

## Como rodar

Node 20 ou mais novo. Sem dependência.

```bash
npm test                               # a suite inteira
npm run medir                          # todas as tabelas
node ferramentas/medidor.js raridade   # quao raro e acertar o lombo
node ferramentas/medidor.js cota       # a cota de Euler contra a medida
```

## Os arquivos

- `js/nucleo.js` — cruzamento, grafo de conflito, coloração e as famílias de grafos.
- `js/busca.js` — a varredura das `(n−1)!/2` ordens do lombo.
- `js/juiz.js` — a cota de Euler, a força bruta e o teste de externoplanar pelo desenho.
- `js/medidas.js` — as tabelas do README, cada uma calculada uma vez só.
- `js/app.js` — a página, com o grafo desenhado no círculo.
- `ferramentas/medidor.js` — imprime as tabelas.
- `testes/` — 44 testes, com os números do README presos.

## Licença

MIT.
