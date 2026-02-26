import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import styles from './HoursChart.module.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>
        {payload[0].value.toLocaleString('pt-BR')}
      </p>
    </div>
  )
}

export default function HoursChart({ data }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Horários de Venda</h3>
        <span className={styles.sub}>Mês atual</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#E8A0B4" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#E8A0B4" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,160,180,0.15)" />
          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9A8080' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9A8080' }} axisLine={false} tickLine={false}
                 tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#C9A84C"
            strokeWidth={2}
            fill="url(#pinkGrad)"
            dot={{ r: 3, fill: '#C9A84C', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#E8A0B4' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
