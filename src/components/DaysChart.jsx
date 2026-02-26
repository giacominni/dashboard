import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, Cell,
} from 'recharts'
import styles from './DaysChart.module.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{payload[0].value.toLocaleString('pt-BR')}</p>
    </div>
  )
}

export default function DaysChart({ data }) {
  const max = Math.max(...data.map((d) => d.value))

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Dias Movimentados</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9A8080' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9A8080' }} axisLine={false} tickLine={false}
                 tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232,160,180,0.07)' }} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.day}
                fill={entry.value === max ? '#C9A84C' : entry.value > max * 0.7 ? '#E8A0B4' : 'rgba(232,160,180,0.35)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
