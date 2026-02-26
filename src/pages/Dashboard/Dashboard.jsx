import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Tag, ClipboardList, BarChart2, Calendar } from 'lucide-react'
import { getDashboard } from '../../services/dashboard'
import KpiCard        from '../../components/KpiCard'
import PaymentMethods from '../../components/PaymentMethods'
import SalesChannels  from '../../components/SalesChannels'
import HoursChart     from '../../components/HoursChart'
import DaysChart      from '../../components/DaysChart'
import TopProducts    from '../../components/TopProducts'
import TopClients     from '../../components/TopClients'
import styles         from './Dashboard.module.css'

const KPI_CONFIG = [
  { key: 'faturamento',     label: 'Faturamento',         accent: 'var(--gold)',      isCurrency: true,  deltaLabel: 'vs. período anterior', icon: DollarSign   },
  { key: 'vendas',          label: 'Vendas',              accent: 'var(--pink)',      isCurrency: true,  deltaLabel: 'período atual',        icon: TrendingUp   },
  { key: 'ticketMedio',     label: 'Ticket Médio',        accent: 'var(--pink-dark)', isCurrency: true,  deltaLabel: 'por atendimento',      icon: Tag          },
  { key: 'atendimentos',    label: 'Atendimentos',        accent: 'var(--danger)',    isCurrency: false, deltaLabel: 'vs. período anterior', icon: ClipboardList },
  { key: 'taxaAtendimento', label: 'Média Diária',        accent: 'var(--muted)',     isCurrency: true,  deltaLabel: 'por dia no período',   icon: BarChart2    },
]

// Formata { day, month, year } para input date "YYYY-MM-DD"
const toInputDate = (d) =>
  `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`

// Converte string "YYYY-MM-DD" para { day, month, year }
const fromInputDate = (str) => {
  const [year, month, day] = str.split('-').map(Number)
  return { day, month, year }
}

// Formata { day, month, year } para exibição "DD/MM/YYYY"
const formatDisplay = (d) =>
  `${String(d.day).padStart(2,'0')}/${String(d.month).padStart(2,'0')}/${d.year}`

export default function Dashboard() {
  const hoje  = new Date()
  const [inicio, setInicio] = useState({ day: 1,              month: hoje.getMonth() + 1, year: hoje.getFullYear() })
  const [fim,    setFim]    = useState({ day: hoje.getDate(), month: hoje.getMonth() + 1, year: hoje.getFullYear() })
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDashboard(inicio, fim)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [inicio, fim])

  return (
    <div className={styles.page}>

      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Bem-vinda de volta</p>
          <h2 className={styles.greeting}>Olá, Vitória Moss</h2>
        </div>

        {/* Filtro de período */}
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

      {error && (
        <div className={styles.error}>
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            {KPI_CONFIG.map((cfg) => {
              const kpi = data.kpis[cfg.key]
              return (
                <KpiCard
                  key={cfg.key}
                  label={cfg.label}
                  value={kpi.value}
                  delta={kpi.delta}
                  deltaAbs={kpi.deltaAbs}
                  deltaLabel={cfg.deltaLabel}
                  isCurrency={cfg.isCurrency}
                  accent={cfg.accent}
                  icon={cfg.icon}
                />
              )
            })}
          </div>

          {/* Pagamentos · Canais */}
          <div className={styles.row3}>
            <PaymentMethods data={data.payments} />
            <SalesChannels  data={data.channels} />
          </div>

          {/* Gráficos */}
          <div className={styles.row2wide}>
            <HoursChart data={data.salesByHour} />
            <DaysChart  data={data.salesByDay}  />
          </div>

          {/* Produtos · Clientes */}
          <div className={styles.row2}>
            <TopProducts data={data.topProducts} />
            <TopClients  data={data.topClients}  />
          </div>
        </>
      )}

    </div>
  )
}