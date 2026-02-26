import styles from './SalesChannels.module.css'

export default function SalesChannels({ data }) {
  const max = Math.max(...data.map((c) => c.value))

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Canais de Venda</h3>

      <div className={styles.list}>
        {data.map((c) => (
          <div key={c.label} className={styles.item}>
            <div className={styles.top}>
              <span className={styles.label}>{c.label}</span>
              <span className={styles.count}>{c.value}</span>
            </div>
            <div className={styles.barBg}>
              <div
                className={styles.bar}
                style={{ width: `${(c.value / max) * 100}%` }}
              />
            </div>
            {c.delta !== null && (
              <span className={styles.badge}>▲ +{c.delta.toFixed(2).replace('.', ',')}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
