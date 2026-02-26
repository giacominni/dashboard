import { fetchSheet, parseBRL, parseDate, isDateRow, isNumericCode } from './sheets.js'

const GID = {
  faturamento: import.meta.env.VITE_GID_FATURAMENTO,
  pagamentos:  import.meta.env.VITE_GID_PAGAMENTOS,
  produtos:    import.meta.env.VITE_GID_PRODUTOS,
  clientes:    import.meta.env.VITE_GID_CLIENTES,
}

// ─────────────────────────────────────────────────────────────────────────────
// Filtra por período
// ─────────────────────────────────────────────────────────────────────────────
function porPeriodo(arr, inicio, fim) {
  const toMs = (d) => new Date(d.year, d.month - 1, d.day).getTime()
  const ini  = toMs(inicio)
  const end  = toMs(fim)
  return arr.filter(r => { const t = toMs(r.data); return t >= ini && t <= end })
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER — Faturamento (fonte principal dos KPIs)
// Data       | Vendas | Ticket Médio | Devolução | Valor Total
// 01/03/2023 | 6      | R$ 216,67   | R$ 0,00   | R$ 1.300,00
// ─────────────────────────────────────────────────────────────────────────────
function parseFaturamento(rows) {
  const result = []
  for (const row of rows) {
    const col0 = row[0]
    if (!col0 || col0.startsWith('Data') || col0.startsWith('Total')) continue
    if (!isDateRow(col0)) continue
    const data = parseDate(col0)
    if (!data) continue
    result.push({
      data,
      vendas:      parseInt(row[1]) || 0,
      ticketMedio: parseBRL(row[2]),
      devolucao:   parseBRL(row[3]),
      total:       parseBRL(row[4]),
    })
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER — Pagamentos
// 01/03/2023 | R$ 1.300,00  ← data do grupo
// Dinheiro   | R$ 327,00    ← dado real
// ─────────────────────────────────────────────────────────────────────────────
function parsePagamentos(rows) {
  const result  = []
  let dataAtual = null
  for (const row of rows) {
    const col0 = row[0]
    if (!col0 || col0.startsWith('Método')) continue
    if (isDateRow(col0)) { dataAtual = parseDate(col0); continue }
    if (dataAtual && col0 && row[1]) {
      result.push({ data: dataAtual, forma: col0, valor: parseBRL(row[1]) })
    }
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER — Produtos
// Código | Produto    | Data       | Quantidade | Valor
// 12     | AMÊNDOA... | 01/03/2023 | 1,00 Un    | R$ 45,00
// ─────────────────────────────────────────────────────────────────────────────
function parseProdutos(rows) {
  const result = []
  for (const row of rows) {
    const col0 = row[0], col1 = row[1], col2 = row[2]
    if (!col0) continue
    if (col0.startsWith('Código') || col0.startsWith('Cod')) continue
    if (col0.startsWith('Total') || col0.startsWith('---')) continue
    if (!col1 || !col2 || !isDateRow(col2)) continue
    const data = parseDate(col2)
    if (!data) continue
    result.push({ data, nome: col1.trim(), vendidos: parseBRL(row[3]), total: parseBRL(row[4]) })
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER — Clientes
// Cliente | Venda | Data       | Valor Total
// ABEL... | 1228  | 31/05/2023 | R$ 73,00
// ─────────────────────────────────────────────────────────────────────────────
function parseClientes(rows) {
  const result = []
  for (const row of rows) {
    const col0 = row[0]
    if (!col0 || col0.startsWith('Cliente') || col0.startsWith('Total')) continue
    if (!row[2] || !isDateRow(row[2])) continue
    const data = parseDate(row[2])
    if (!data) continue
    result.push({ data, nome: col0, venda: row[1], total: parseBRL(row[3]) })
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL — Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export async function getDashboard(inicio, fim) {
  const [rowsFat, rowsPag, rowsProd, rowsCli] = await Promise.all([
    fetchSheet(GID.faturamento),
    fetchSheet(GID.pagamentos),
    fetchSheet(GID.produtos),
    fetchSheet(GID.clientes),
  ])

  const faturamentos = parseFaturamento(rowsFat)
  const pagamentos   = parsePagamentos(rowsPag)
  const produtos     = parseProdutos(rowsProd)
  const clientes     = parseClientes(rowsCli)

  const fatPeriodo  = porPeriodo(faturamentos, inicio, fim)
  const pagPeriodo  = porPeriodo(pagamentos,   inicio, fim)
  const prodPeriodo = porPeriodo(produtos,      inicio, fim)
  const cliPeriodo  = porPeriodo(clientes,      inicio, fim)

  // Período anterior
  const msInicio      = new Date(inicio.year, inicio.month - 1, inicio.day).getTime()
  const msFim         = new Date(fim.year,    fim.month - 1,    fim.day).getTime()
  const duracao       = msFim - msInicio
  const inicioPrev    = new Date(msInicio - duracao - 86400000)
  const fimPrev       = new Date(msInicio - 86400000)
  const fatPrev       = porPeriodo(faturamentos, {
    day: inicioPrev.getDate(), month: inicioPrev.getMonth() + 1, year: inicioPrev.getFullYear()
  }, {
    day: fimPrev.getDate(), month: fimPrev.getMonth() + 1, year: fimPrev.getFullYear()
  })

  // ── KPIs — todos vindos da aba faturamento ─────────────────────────────────
  const faturamento     = fatPeriodo.reduce((s, r) => s + r.total,  0)
  const faturamentoPrev = fatPrev.reduce((s, r)    => s + r.total,  0)
  const totalVendas     = fatPeriodo.reduce((s, r) => s + r.vendas, 0)
  const diasPeriodo     = Math.max(1, Math.round(duracao / 86400000) + 1)
  const ticketMedio     = totalVendas > 0 ? faturamento / totalVendas : 0
  const deltaFaturamento = faturamentoPrev > 0
    ? +((faturamento - faturamentoPrev) / faturamentoPrev * 100).toFixed(2)
    : null

  // ── Formas de pagamento ────────────────────────────────────────────────────
  const paymentMap = {}
  pagPeriodo.forEach(p => { paymentMap[p.forma] = (paymentMap[p.forma] ?? 0) + p.valor })
  const FORMAS_NEG = ["vale presente"]
  const payments = Object.entries(paymentMap)
    .map(([label, value]) => ({
      label,
      value: FORMAS_NEG.some(f => label.toLowerCase().includes(f)) ? -Math.abs(value) : value
    }))
    .sort((a, b) => b.value - a.value)

  const channels = payments
    .filter(p => p.value > 0)
    .map(p => ({ label: p.label, value: Math.round(p.value), delta: null }))

  // ── Movimento por dia ──────────────────────────────────────────────────────
  const dailyMap = {}
  fatPeriodo.forEach(r => {
    const label = `${String(r.data.day).padStart(2,'0')}/${String(r.data.month).padStart(2,'0')}`
    dailyMap[label] = (dailyMap[label] ?? 0) + r.total
  })
  const salesByHour = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, value]) => ({ hour, value }))

  // ── Vendas por dia da semana ───────────────────────────────────────────────
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const dayMap = {}
  fatPeriodo.forEach(r => {
    const d = DIAS[new Date(r.data.year, r.data.month - 1, r.data.day).getDay()]
    dayMap[d] = (dayMap[d] ?? 0) + r.total
  })
  const salesByDay = DIAS.filter(d => dayMap[d]).map(d => ({ day: d, value: dayMap[d] }))

  // ── Top produtos ───────────────────────────────────────────────────────────
  const prodMap = {}
  prodPeriodo.forEach(p => { prodMap[p.nome] = (prodMap[p.nome] ?? 0) + p.vendidos })
  const topProducts = Object.entries(prodMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, qty], i) => ({ rank: i + 1, name, qty }))

  // ── Top clientes ───────────────────────────────────────────────────────────
  const clientMap = {}
  cliPeriodo.forEach(c => { clientMap[c.nome] = (clientMap[c.nome] ?? 0) + c.total })
  const topClients = Object.entries(clientMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nome, total], i) => ({
      rank: i + 1, initials: nome.substring(0, 2).toUpperCase(),
      name: nome, sub: 'Cliente', value: total,
    }))

  return {
    kpis: {
      faturamento:     { value: faturamento,  delta: deltaFaturamento, deltaAbs: faturamento - faturamentoPrev },
      vendas:          { value: faturamento,  delta: null,             deltaAbs: null },
      ticketMedio:     { value: ticketMedio,  delta: null,             deltaAbs: null },
      atendimentos:    { value: totalVendas,  delta: null,             deltaAbs: null },
      taxaAtendimento: { value: +(faturamento / diasPeriodo).toFixed(2), delta: null, deltaAbs: null },
    },
    payments, channels, salesByHour, salesByDay, topProducts, topClients,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÃO FATURAMENTO — página Faturamento
// ─────────────────────────────────────────────────────────────────────────────
export async function getFaturamento(inicio, fim) {
  const rows  = await fetchSheet(GID.faturamento)
  const todos = parseFaturamento(rows)
  const periodo = porPeriodo(todos, inicio, fim)

  const msInicio      = new Date(inicio.year, inicio.month - 1, inicio.day).getTime()
  const msFim         = new Date(fim.year,    fim.month - 1,    fim.day).getTime()
  const duracao       = msFim - msInicio
  const inicioPrev    = new Date(msInicio - duracao - 86400000)
  const fimPrev       = new Date(msInicio - 86400000)
  const prev          = porPeriodo(todos, {
    day: inicioPrev.getDate(), month: inicioPrev.getMonth() + 1, year: inicioPrev.getFullYear()
  }, {
    day: fimPrev.getDate(), month: fimPrev.getMonth() + 1, year: fimPrev.getFullYear()
  })

  const totalFaturamento = periodo.reduce((s, r) => s + r.total,     0)
  const totalVendas      = periodo.reduce((s, r) => s + r.vendas,    0)
  const totalDevolucao   = periodo.reduce((s, r) => s + r.devolucao, 0)
  const ticketMedio      = totalVendas > 0 ? totalFaturamento / totalVendas : 0
  const diasPeriodo      = Math.max(1, Math.round(duracao / 86400000) + 1)
  const mediaDiaria      = totalFaturamento / diasPeriodo
  const prevTotal        = prev.reduce((s, r) => s + r.total, 0)
  const deltaFaturamento = prevTotal > 0
    ? +((totalFaturamento - prevTotal) / prevTotal * 100).toFixed(2)
    : null

  return {
    resumo: {
      faturamento: { value: totalFaturamento, delta: deltaFaturamento, deltaAbs: totalFaturamento - prevTotal },
      vendas:      { value: totalVendas,      delta: null, deltaAbs: null },
      ticketMedio: { value: ticketMedio,      delta: null, deltaAbs: null },
      devolucao:   { value: totalDevolucao,   delta: null, deltaAbs: null },
      mediaDiaria: { value: mediaDiaria,      delta: null, deltaAbs: null },
    },
    dias: periodo.map(r => ({
      data:        `${String(r.data.day).padStart(2,'0')}/${String(r.data.month).padStart(2,'0')}/${r.data.year}`,
      vendas:      r.vendas,
      ticketMedio: r.ticketMedio,
      devolucao:   r.devolucao,
      total:       r.total,
    })),
    chart: periodo.map(r => ({
      day:   `${String(r.data.day).padStart(2,'0')}/${String(r.data.month).padStart(2,'0')}`,
      value: r.total,
    })),
  }
}
