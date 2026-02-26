import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Tag, RotateCcw, Calendar, BarChart2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getFaturamento } from '../../services/dashboard'
import { currency } from '../../utils/format'
import styles from './Faturamento.module.css'

const KPI_CONFIG = [
  { key: 'faturamento', label: 'Faturamento Total', icon: DollarSign, accent: 'var(--gold)',      isCurrency: true  },
  { key: 'vendas',      label: 'Total de Vendas',   icon: TrendingUp, accent: 'var(--pink)',      isCurrency: false },
  { key: 'ticketMedio', label: 'Ticket Médio',      icon: Tag,        accent: 'var(--pink-dark)', isCurrency: true  },
  { key: 'devolucao',   label: 'Devoluções',        icon: RotateCcw,  accent: 'var(--danger)',    isCurrency: true  },
  { key: 'mediaDiaria', label: 'Média Diária',      icon: BarChart2,  accent: 'var(--muted)',     isCurrency: true  },
]

const toInputDate = (d) =>
  `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`

const fromInputDate = (str) => {
  const [year, month, day] = str.split('-').map(Number)
  return { day, month, year }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{currency(payload[0].value)}</p>
    </div>
  )
}

export default function Faturamento() {
  const hoje  = new Date()
  const [inicio, setInicio] = useState({ day: 1, month: hoje.getMonth() + 1, year: hoje.getFullYear() })
  const [fim,    setFim]    = useState({ day: hoje.getDate(), month: hoje.getMonth() + 1, year: hoje.getFullYear() })
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getFaturamento(inicio, fim)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [inicio, fim])

  const diasFiltrados = data?.dias.filter(d =>
    search === '' || d.data.includes(search)
  ) ?? []

  return (
    <div className={styles.page}>

      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Relatório financeiro</p>
          <h2 className={styles.title}>Faturamento</h2>
        </div>
        <div className={styles.periodFilter}>
          <Calendar size={14} />
          <input
            type="date"
            className={styles.dateInput}
            value={toInputDate(inicio)}
            onChange={e => setInicio(fromInputDate(e.target.value))}
          />
          <span className={styles.dateSep}>até</span>
          <input
            type="date"
            className={styles.dateInput}
            value={toInputDate(fim)}
            onChange={e => setFim(fromInputDate(e.target.value))}
          />
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Carregando dados...</p>
        </div>
      )}

      {error && <div className={styles.error}>Erro: {error}</div>}

      {!loading && !error && data && (
        <>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            {KPI_CONFIG.map(cfg => {
              const kpi = data.resumo[cfg.key]
              const Icon = cfg.icon
              const delta = kpi.delta
              return (
                <div key={cfg.key} className={styles.kpiCard} style={{ '--accent': cfg.accent }}>
                  <div className={styles.kpiTop}>
                    <span className={styles.kpiLabel}>{cfg.label}</span>
                    <div className={styles.kpiIcon}><Icon size={14} /></div>
                  </div>
                  <p className={styles.kpiValue}>
                    {cfg.isCurrency ? currency(kpi.value) : kpi.value.toLocaleString('pt-BR')}
                  </p>
                  {delta !== null && (
                    <p className={`${styles.kpiDelta} ${delta >= 0 ? styles.pos : styles.neg}`}>
                      {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs. período anterior
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Gráfico de evolução */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Evolução do Faturamento</h3>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.chart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--gold)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="value"
                    stroke="var(--gold)" strokeWidth={2}
                    fill="url(#fatGrad)" dot={false} activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela diária */}
          <div className={styles.card}>
            <div className={styles.tableHeader}>
              <h3 className={styles.cardTitle}>Detalhamento por Dia</h3>
              <input
                type="text"
                placeholder="Buscar data..."
                className={styles.search}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th className={styles.right}>Vendas</th>
                    <th className={styles.right}>Ticket Médio</th>
                    <th className={styles.right}>Devolução</th>
                    <th className={styles.right}>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {diasFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.empty}>Nenhum registro encontrado</td>
                    </tr>
                  )}
                  {diasFiltrados.map((d, i) => (
                    <tr key={i} className={d.devolucao > 0 ? styles.rowDev : ''}>
                      <td className={styles.dateCell}>{d.data}</td>
                      <td className={styles.right}>{d.vendas}</td>
                      <td className={styles.right}>{currency(d.ticketMedio)}</td>
                      <td className={`${styles.right} ${d.devolucao > 0 ? styles.danger : ''}`}>
                        {currency(d.devolucao)}
                      </td>
                      <td className={`${styles.right} ${styles.totalCell}`}>{currency(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
                {diasFiltrados.length > 0 && (
                  <tfoot>
                    <tr className={styles.footerRow}>
                      <td><strong>Total</strong></td>
                      <td className={styles.right}>
                        <strong>{diasFiltrados.reduce((s, d) => s + d.vendas, 0)}</strong>
                      </td>
                      <td className={styles.right}>—</td>
                      <td className={`${styles.right} ${styles.danger}`}>
                        <strong>{currency(diasFiltrados.reduce((s, d) => s + d.devolucao, 0))}</strong>
                      </td>
                      <td className={`${styles.right} ${styles.totalCell}`}>
                        <strong>{currency(diasFiltrados.reduce((s, d) => s + d.total, 0))}</strong>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}