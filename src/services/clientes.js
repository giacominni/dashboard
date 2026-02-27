<<<<<<< HEAD
import { fetchSheet, parseBRL, parseDate, isDateRow } from './sheets.js'

const GID_CLIENTES = import.meta.env.VITE_GID_CLIENTES

function parseClientesRows(rows) {
  const result = []
  for (const row of rows) {
    const col0 = row[0]
    if (!col0 || col0.startsWith('Cliente') || col0.startsWith('Total')) continue
    if (col0.toLowerCase().includes('consumidor final')) continue

    // Tenta data na col2 (formato novo: Cliente|Venda|Data|Total)
    // Tenta data na col3 (formato antigo: Cliente|Venda|NF|Data|...)
    let data = null
    let totalCol = 3

    if (row[2] && isDateRow(row[2])) {
      data = parseDate(row[2])
      totalCol = 3
    } else if (row[3] && isDateRow(row[3])) {
      data = parseDate(row[3])
      totalCol = 10
    }

    if (!data) continue

    result.push({
      nome:  col0,
      venda: row[1],
      data,
      total: parseBRL(row[totalCol]),
    })
  }
  return result
}

function porPeriodo(arr, inicio, fim) {
  const toMs = (d) => new Date(d.year, d.month - 1, d.day).getTime()
  const ini = toMs(inicio), end = toMs(fim)
  return arr.filter(r => { const t = toMs(r.data); return t >= ini && t <= end })
}

function formatData(d) {
  return `${String(d.day).padStart(2,'0')}/${String(d.month).padStart(2,'0')}/${d.year}`
}

export async function getClientes(inicio, fim) {
  const rows  = await fetchSheet(GID_CLIENTES)
  const todos = parseClientesRows(rows)

  if (todos.length === 0) {
    return { ranking: [], inativos: [], totalUnicos: 0, totalCompras: 0, ticketMedioCliente: 0 }
  }

  const periodo = porPeriodo(todos, inicio, fim)

  // Mapa histórico completo (todos os registros)
  const historicoMap = {}
  todos.forEach(r => {
    if (!historicoMap[r.nome]) {
      historicoMap[r.nome] = { compras: 0, total: 0, ultimaData: null }
    }
    historicoMap[r.nome].compras++
    historicoMap[r.nome].total += r.total
    const t = new Date(r.data.year, r.data.month - 1, r.data.day)
    if (!historicoMap[r.nome].ultimaData || t > historicoMap[r.nome].ultimaData) {
      historicoMap[r.nome].ultimaData = t
    }
  })

  // Ranking — agrupado pelo período selecionado
  const periodoMap = {}
  periodo.forEach(r => {
    if (!periodoMap[r.nome]) periodoMap[r.nome] = { compras: 0, total: 0 }
    periodoMap[r.nome].compras++
    periodoMap[r.nome].total += r.total
  })

  const hoje = new Date()

  const ranking = Object.entries(periodoMap)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([nome, v]) => {
      const ult = historicoMap[nome]?.ultimaData
      return {
        nome,
        compras:     v.compras,
        total:       v.total,
        ticket:      v.compras > 0 ? v.total / v.compras : 0,
        ultimaCompra: ult ? formatData({ day: ult.getDate(), month: ult.getMonth() + 1, year: ult.getFullYear() }) : '-',
      }
    })

  // Inativos — última compra há mais de 60 dias (baseado no histórico completo)
  const inativos = Object.entries(historicoMap)
    .filter(([, c]) => c.ultimaData && (hoje - c.ultimaData) / 86400000 > 60)
    .sort(([, a], [, b]) => a.ultimaData - b.ultimaData)
    .map(([nome, c]) => ({
      nome,
      compras:        c.compras,
      total:          c.total,
      ticket:         c.compras > 0 ? c.total / c.compras : 0,
      diasSemComprar: Math.floor((hoje - c.ultimaData) / 86400000),
      ultimaCompra:   formatData({ day: c.ultimaData.getDate(), month: c.ultimaData.getMonth() + 1, year: c.ultimaData.getFullYear() }),
    }))

  const totalCompras       = Object.values(periodoMap).reduce((s, c) => s + c.total, 0)
  const totalUnicos        = Object.keys(periodoMap).length
  const ticketMedioCliente = totalUnicos > 0 ? totalCompras / totalUnicos : 0

  return { ranking, inativos, totalUnicos, totalCompras, ticketMedioCliente }
=======
import { fetchSheet, parseBRL, parseDate, isDateRow } from './sheets.js'

const GID_CLIENTES = import.meta.env.VITE_GID_CLIENTES

function parseClientesRows(rows) {
  const result = []
  for (const row of rows) {
    const col0 = row[0]
    if (!col0 || col0.startsWith('Cliente') || col0.startsWith('Total')) continue
    if (col0.toLowerCase().includes('consumidor final')) continue

    let data = null, totalCol = 3
    if (row[2] && isDateRow(row[2]))      { data = parseDate(row[2]); totalCol = 3  }
    else if (row[3] && isDateRow(row[3])) { data = parseDate(row[3]); totalCol = 10 }
    if (!data) continue

    result.push({ nome: col0, venda: row[1], data, total: parseBRL(row[totalCol]) })
  }
  return result
}

function porPeriodo(arr, inicio, fim) {
  const toMs = (d) => new Date(d.year, d.month - 1, d.day).getTime()
  const ini = toMs(inicio), end = toMs(fim)
  return arr.filter(r => { const t = toMs(r.data); return t >= ini && t <= end })
}

function formatData(d) {
  return `${String(d.day).padStart(2,'0')}/${String(d.month).padStart(2,'0')}/${d.year}`
}

export async function getClientes(inicio, fim) {
  const rows  = await fetchSheet(GID_CLIENTES)
  const todos = parseClientesRows(rows)

  if (todos.length === 0) {
    return { ranking: [], inativos: [], evolucaoMes: [], faixas: [], recorrencia: [],
             totalUnicos: 0, totalCompras: 0, ticketMedioCliente: 0 }
  }

  const periodo = porPeriodo(todos, inicio, fim)

  // Histórico completo por cliente
  const historicoMap = {}
  todos.forEach(r => {
    if (!historicoMap[r.nome]) historicoMap[r.nome] = { compras: 0, total: 0, ultimaData: null }
    historicoMap[r.nome].compras++
    historicoMap[r.nome].total += r.total
    const t = new Date(r.data.year, r.data.month - 1, r.data.day)
    if (!historicoMap[r.nome].ultimaData || t > historicoMap[r.nome].ultimaData)
      historicoMap[r.nome].ultimaData = t
  })

  // Ranking por período
  const periodoMap = {}
  periodo.forEach(r => {
    if (!periodoMap[r.nome]) periodoMap[r.nome] = { compras: 0, total: 0 }
    periodoMap[r.nome].compras++
    periodoMap[r.nome].total += r.total
  })

  const hoje = new Date()

  const ranking = Object.entries(periodoMap)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([nome, v]) => {
      const ult = historicoMap[nome]?.ultimaData
      return {
        nome, compras: v.compras, total: v.total,
        ticket: v.compras > 0 ? v.total / v.compras : 0,
        ultimaCompra: ult ? formatData({ day: ult.getDate(), month: ult.getMonth() + 1, year: ult.getFullYear() }) : '-',
      }
    })

  // Inativos +60 dias
  const inativos = Object.entries(historicoMap)
    .filter(([, c]) => c.ultimaData && (hoje - c.ultimaData) / 86400000 > 60)
    .sort(([, a], [, b]) => a.ultimaData - b.ultimaData)
    .map(([nome, c]) => ({
      nome, compras: c.compras, total: c.total,
      ticket: c.compras > 0 ? c.total / c.compras : 0,
      diasSemComprar: Math.floor((hoje - c.ultimaData) / 86400000),
      ultimaCompra: formatData({ day: c.ultimaData.getDate(), month: c.ultimaData.getMonth() + 1, year: c.ultimaData.getFullYear() }),
    }))

  // Evolução por mês (período selecionado)
  const evolMap = {}
  periodo.forEach(r => {
    const key = `${String(r.data.month).padStart(2,'0')}/${r.data.year}`
    if (!evolMap[key]) evolMap[key] = { mes: key, total: 0, clientes: new Set() }
    evolMap[key].total += r.total
    evolMap[key].clientes.add(r.nome)
  })
  const evolucaoMes = Object.values(evolMap)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map(r => ({ mes: r.mes, total: r.total, clientes: r.clientes.size }))

  // Faixas de gasto (histórico completo)
  const faixasDef = [
    { faixa: 'Até R$200',         min: 0,    max: 200   },
    { faixa: 'R$201–R$500',       min: 201,  max: 500   },
    { faixa: 'R$501–R$1.000',     min: 501,  max: 1000  },
    { faixa: 'R$1.001–R$5.000',   min: 1001, max: 5000  },
    { faixa: 'Acima de R$5.000',  min: 5001, max: Infinity },
  ]
  const faixas = faixasDef.map(f => ({
    faixa: f.faixa,
    count: Object.values(periodoMap).filter(c => c.total >= f.min && c.total <= f.max).length,
  })).filter(f => f.count > 0)

  // Recorrência: quantos clientes compraram 1x, 2x, 3x...
  const recorrMap = {}
  Object.values(periodoMap).forEach(c => {
    const n = Math.min(c.compras, 10)
    const key = n === 10 ? '10+' : String(n)
    recorrMap[key] = (recorrMap[key] ?? 0) + 1
  })
  const recorrencia = Object.entries(recorrMap)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([compras, clientes]) => ({ compras: `${compras}x`, clientes }))

  const totalCompras       = Object.values(periodoMap).reduce((s, c) => s + c.total, 0)
  const totalUnicos        = Object.keys(periodoMap).length
  const ticketMedioCliente = totalUnicos > 0 ? totalCompras / totalUnicos : 0

  return { ranking, inativos, evolucaoMes, faixas, recorrencia, totalUnicos, totalCompras, ticketMedioCliente }
>>>>>>> 5d57ea7 (pagina de produtos e clientes)
}