import { useState, useEffect } from 'react'
import { Calendar, Users, TrendingUp, Clock, Gift } from 'lucide-react'
import { getClientes } from '../../services/clientes'
import { currency } from '../../utils/format'
import styles from './Clientes.module.css'

const toInputDate = (d) =>
  `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`
const fromInputDate = (str) => {
  const [year, month, day] = str.split('-').map(Number)
  return { day, month, year }
}

export default function Clientes() {
  const hoje  = new Date()
  const [inicio, setInicio] = useState({ day: 1, month: 1, year: 2023 })
  const [fim,    setFim]    = useState({ day: hoje.getDate(), month: hoje.getMonth() + 1, year: hoje.getFullYear() })
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [aba,     setAba]     = useState('ranking')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getClientes(inicio, fim)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [inicio, fim])

  const rankingFiltrado  = (data?.ranking  ?? []).filter(c =>
    search === '' || c.nome.toLowerCase().includes(search.toLowerCase()))
  const inativosFiltrado = (data?.inativos ?? []).filter(c =>
    search === '' || c.nome.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.page}>

      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Relacionamento</p>
          <h2 className={styles.title}>Clientes</h2>
        </div>
        <div className={styles.periodFilter}>
          <Calendar size={14} />
          <input type="date" className={styles.dateInput}
            value={toInputDate(inicio)} onChange={e => setInicio(fromInputDate(e.target.value))} />
          <span className={styles.dateSep}>até</span>
          <input type="date" className={styles.dateInput}
            value={toInputDate(fim)} onChange={e => setFim(fromInputDate(e.target.value))} />
        </div>
      </div>

      {loading && <div className={styles.loading}><div className={styles.spinner} /></div>}
      {error   && <div className={styles.error}>Erro: {error}</div>}

      {!loading && !error && data && (
        <>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            {[
              { icon: Users,     color: 'var(--gold)',      label: 'Clientes Únicos',         value: data.totalUnicos },
              { icon: TrendingUp,color: 'var(--pink)',      label: 'Total em Compras',         value: currency(data.totalCompras), raw: true },
              { icon: TrendingUp,color: 'var(--pink-dark)', label: 'Ticket Médio por Cliente', value: currency(data.ticketMedioCliente), raw: true },
              { icon: Clock,     color: 'var(--danger)',    label: 'Inativos +60 dias',        value: data.inativos.length },
            ].map(({ icon: Icon, color, label, value, raw }) => (
              <div key={label} className={styles.kpi} style={{'--c': color}}>
                <div className={styles.kpiIcon}><Icon size={15} /></div>
                <div>
                  <p className={styles.kpiLabel}>{label}</p>
                  <p className={styles.kpiValue}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Abas */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${aba === 'ranking'         ? styles.tabActive : ''}`}
              onClick={() => { setAba('ranking');         setSearch('') }}>
              <TrendingUp size={13} /> Quem mais compra
            </button>
            <button className={`${styles.tab} ${aba === 'inativos'        ? styles.tabActive : ''}`}
              onClick={() => { setAba('inativos');        setSearch('') }}>
              <Clock size={13} /> Sem compras recentes
            </button>
            <button className={`${styles.tab} ${aba === 'aniversariantes' ? styles.tabActive : ''}`}
              onClick={() => { setAba('aniversariantes'); setSearch('') }}>
              <Gift size={13} /> Aniversariantes
            </button>
          </div>

          {/* ── Ranking ──────────────────────────────────────────────────── */}
          {aba === 'ranking' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Clientes que mais compraram</h3>
                <input placeholder="Buscar cliente..." className={styles.search}
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr>
                    <th>#</th><th>Cliente</th>
                    <th className={styles.right}>Compras</th>
                    <th className={styles.right}>Total Gasto</th>
                    <th className={styles.right}>Ticket Médio</th>
                    <th className={styles.right}>Última Compra</th>
                  </tr></thead>
                  <tbody>
                    {rankingFiltrado.length === 0 && (
                      <tr><td colSpan={6} className={styles.empty}>Nenhum cliente encontrado</td></tr>
                    )}
                    {rankingFiltrado.map((c, i) => (
                      <tr key={c.nome}>
                        <td className={styles.rankCell}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' :
                            <span className={styles.rankNum}>{i + 1}</span>}
                        </td>
                        <td>
                          <div className={styles.clientInfo}>
                            <div className={styles.avatar}>{c.nome.substring(0,2).toUpperCase()}</div>
                            <span className={styles.clientName}>{c.nome}</span>
                          </div>
                        </td>
                        <td className={styles.right}>{c.compras}</td>
                        <td className={`${styles.right} ${styles.bold}`}>{currency(c.total)}</td>
                        <td className={styles.right}>{currency(c.ticket)}</td>
                        <td className={`${styles.right} ${styles.mono}`}>{c.ultimaCompra}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Inativos ─────────────────────────────────────────────────── */}
          {aba === 'inativos' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Clientes sem compra recente</h3>
                <input placeholder="Buscar cliente..." className={styles.search}
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr>
                    <th>Cliente</th>
                    <th className={styles.right}>Última Compra</th>
                    <th className={styles.right}>Dias sem comprar</th>
                    <th className={styles.right}>Total Histórico</th>
                    <th className={styles.right}>Nº Compras</th>
                  </tr></thead>
                  <tbody>
                    {inativosFiltrado.length === 0 && (
                      <tr><td colSpan={5} className={styles.empty}>Nenhum cliente inativo</td></tr>
                    )}
                    {inativosFiltrado.map(c => (
                      <tr key={c.nome}>
                        <td>
                          <div className={styles.clientInfo}>
                            <div className={styles.avatar}>{c.nome.substring(0,2).toUpperCase()}</div>
                            <span className={styles.clientName}>{c.nome}</span>
                          </div>
                        </td>
                        <td className={`${styles.right} ${styles.mono}`}>{c.ultimaCompra}</td>
                        <td className={styles.right}>
                          <span className={c.diasSemComprar > 90 ? styles.badgeRed : styles.badgeOrange}>
                            {c.diasSemComprar} dias
                          </span>
                        </td>
                        <td className={`${styles.right} ${styles.bold}`}>{currency(c.total)}</td>
                        <td className={styles.right}>{c.compras}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Aniversariantes ──────────────────────────────────────────── */}
          {aba === 'aniversariantes' && (
            <div className={styles.card}>
              <div className={styles.anivEmpty}>
                <Gift size={44} strokeWidth={1.2} />
                <h3>Aniversariantes do mês</h3>
                <p>Esta aba está pronta e aguardando os dados de aniversário.</p>
                <p className={styles.anivDica}>
                  Quando adicionar uma coluna de data de nascimento na planilha de clientes,
                  é só avisar que conecto aqui automaticamente.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
