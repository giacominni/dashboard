import { useState, useEffect } from 'react'
import { Calendar, ShoppingBag, TrendingUp, DollarSign, Search } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts'
import { getProdutos } from '../../services/produtos'
import { currency } from '../../utils/format'
import styles from './Produtos.module.css'

const toInputDate = (d) =>
  `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`
const fromInputDate = (str) => {
  const [year, month, day] = str.split('-').map(Number)
  return { day, month, year }
}

const COLORS = ['#C9A84C','#E8A0B4','#C97090','#A0822A','#9A8080','#3D7A52','#B84040','#6B8FAB']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.name} className={styles.tooltipValue}>
          {p.name === 'total' ? currency(p.value) : `${p.value} un`}
        </p>
      ))}
    </div>
  )
}

export default function Produtos() {
  const hoje = new Date()
  const [inicio, setInicio] = useState({ day: 1, month: 1, year: 2023 })
  const [fim,    setFim]    = useState({ day: hoje.getDate(), month: hoje.getMonth() + 1, year: hoje.getFullYear() })
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [sortBy,  setSortBy]  = useState('vendidos')
  const [page,    setPage]    = useState(1)
  const PER_PAGE = 20

  useEffect(() => {
    setLoading(true)
    setError(null)
    getProdutos(inicio, fim)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [inicio, fim])

  const rankingFiltrado = (data?.ranking ?? [])
    .filter(p => search === '' || p.nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'vendidos' ? b.vendidos - a.vendidos : b.total - a.total)

  const totalPages = Math.ceil(rankingFiltrado.length / PER_PAGE)
  const paginado   = rankingFiltrado.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const maxQty     = Math.max(...(data?.ranking ?? []).map(p => p.vendidos), 1)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Catálogo</p>
          <h2 className={styles.title}>Produtos</h2>
        </div>
        <div className={styles.periodFilter}>
          <Calendar size={14} />
          <input type="date" className={styles.dateInput}
            value={toInputDate(inicio)} onChange={e => { setInicio(fromInputDate(e.target.value)); setPage(1) }} />
          <span className={styles.dateSep}>até</span>
          <input type="date" className={styles.dateInput}
            value={toInputDate(fim)} onChange={e => { setFim(fromInputDate(e.target.value)); setPage(1) }} />
        </div>
      </div>

      {loading && <div className={styles.loading}><div className={styles.spinner} /></div>}
      {error   && <div className={styles.error}>Erro: {error}</div>}

      {!loading && !error && data && (
        <>
          <div className={styles.kpiGrid}>
            {[
              { icon: ShoppingBag, color: 'var(--gold)',      label: 'Produtos Únicos',   value: data.totalItens },
              { icon: TrendingUp,  color: 'var(--pink)',      label: 'Unidades Vendidas',  value: data.totalVendidos.toLocaleString('pt-BR') },
              { icon: DollarSign,  color: 'var(--pink-dark)', label: 'Receita Total',      value: currency(data.totalReceita) },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className={styles.kpi} style={{'--c': color}}>
                <div className={styles.kpiIcon}><Icon size={15} /></div>
                <div>
                  <p className={styles.kpiLabel}>{label}</p>
                  <p className={styles.kpiValue}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.chartsRow}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Evolução de Vendas (unidades)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.evolucao} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--gold)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="vendidos" name="vendidos"
                    stroke="var(--gold)" strokeWidth={2} fill="url(#prodGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Top Categorias por Receita</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.categorias} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: 'var(--muted)' }}
                    axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="total" radius={[0, 4, 4, 0]}>
                    {data.categorias.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.tableHeader}>
              <h3 className={styles.cardTitle}>Ranking de Produtos</h3>
              <div className={styles.tableControls}>
                <div className={styles.searchWrap}>
                  <Search size={13} className={styles.searchIcon} />
                  <input placeholder="Buscar produto..." className={styles.search}
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <div className={styles.sortBtns}>
                  <button className={`${styles.sortBtn} ${sortBy === 'vendidos' ? styles.sortActive : ''}`}
                    onClick={() => setSortBy('vendidos')}>Quantidade</button>
                  <button className={`${styles.sortBtn} ${sortBy === 'total' ? styles.sortActive : ''}`}
                    onClick={() => setSortBy('total')}>Receita</button>
                </div>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr>
                  <th>#</th><th>Produto</th><th>Código</th>
                  <th className={styles.right}>Vendidos</th>
                  <th className={styles.right}>Receita</th>
                  <th className={styles.right}>Ticket Médio</th>
                  <th className={styles.barCol}></th>
                </tr></thead>
                <tbody>
                  {paginado.length === 0 && (
                    <tr><td colSpan={7} className={styles.empty}>Nenhum produto encontrado</td></tr>
                  )}
                  {paginado.map((p, i) => {
                    const rank = (page - 1) * PER_PAGE + i + 1
                    return (
                      <tr key={p.nome}>
                        <td className={styles.rankCell}>
                          <span className={styles.rankNum}>{rank}</span>
                        </td>
                        <td className={styles.prodName}>{p.nome}</td>
                        <td className={styles.mono}>{p.cod}</td>
                        <td className={`${styles.right} ${styles.bold}`}>{p.vendidos.toLocaleString('pt-BR')}</td>
                        <td className={`${styles.right} ${styles.goldText}`}>{currency(p.total)}</td>
                        <td className={styles.right}>{p.vendidos > 0 ? currency(p.total / p.vendidos) : '—'}</td>
                        <td className={styles.barCol}>
                          <div className={styles.inlineBar}>
                            <div className={styles.inlineBarFill} style={{ width: `${(p.vendidos / maxQty) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                <span className={styles.pageInfo}>{page} / {totalPages}</span>
                <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}