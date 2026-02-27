import { fetchSheet, parseBRL, parseDate, isDateRow } from './sheets.js'

const GID_PRODUTOS = import.meta.env.VITE_GID_PRODUTOS

function parseProdutosRows(rows) {
  const result = []
  for (const row of rows) {
    const col0 = row[0], col1 = row[1], col2 = row[2]
    if (!col0) continue
    if (col0.startsWith('Código') || col0.startsWith('Cod')) continue
    if (col0.startsWith('Total') || col0.startsWith('---')) continue
    if (!col1 || !col2 || !isDateRow(col2)) continue
    const data = parseDate(col2)
    if (!data) continue
    result.push({ cod: col0, nome: col1.trim(), data, vendidos: parseBRL(row[3]), total: parseBRL(row[4]) })
  }
  return result
}

function porPeriodo(arr, inicio, fim) {
  const toMs = (d) => new Date(d.year, d.month - 1, d.day).getTime()
  const ini = toMs(inicio), end = toMs(fim)
  return arr.filter(r => { const t = toMs(r.data); return t >= ini && t <= end })
}

export async function getProdutos(inicio, fim) {
  const rows    = await fetchSheet(GID_PRODUTOS)
  const todos   = parseProdutosRows(rows)
  const periodo = porPeriodo(todos, inicio, fim)

  // Agrupa por produto
  const prodMap = {}
  periodo.forEach(r => {
    if (!prodMap[r.nome]) prodMap[r.nome] = { cod: r.cod, nome: r.nome, vendidos: 0, total: 0 }
    prodMap[r.nome].vendidos += r.vendidos
    prodMap[r.nome].total    += r.total
  })

  const ranking = Object.values(prodMap)
    .sort((a, b) => b.vendidos - a.vendidos)

  // Evolução por mês
  const evolucaoMap = {}
  periodo.forEach(r => {
    const key = `${String(r.data.month).padStart(2,'0')}/${r.data.year}`
    if (!evolucaoMap[key]) evolucaoMap[key] = { mes: key, vendidos: 0, total: 0 }
    evolucaoMap[key].vendidos += r.vendidos
    evolucaoMap[key].total    += r.total
  })
  const evolucao = Object.values(evolucaoMap).sort((a, b) => a.mes.localeCompare(b.mes))

  // Top categorias (primeiras palavras do nome)
  const catMap = {}
  periodo.forEach(r => {
    const cat = r.nome.split(' ')[0]
    if (!catMap[cat]) catMap[cat] = { nome: cat, vendidos: 0, total: 0 }
    catMap[cat].vendidos += r.vendidos
    catMap[cat].total    += r.total
  })
  const categorias = Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 8)

  const totalVendidos = periodo.reduce((s, r) => s + r.vendidos, 0)
  const totalReceita  = periodo.reduce((s, r) => s + r.total,    0)
  const totalItens    = ranking.length

  return { ranking, evolucao, categorias, totalVendidos, totalReceita, totalItens }
}