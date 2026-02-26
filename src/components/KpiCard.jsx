import styles from './KpiCard.module.css'

export default function KpiCard({ label, value, delta, deltaAbs, deltaLabel, isCurrency = true, accent, icon: Icon }) {
  const isDown = delta < 0 || deltaAbs < 0

  return (
    <div className={styles.card}>
      <div className={styles.accentBar} style={{ background: accent }} />
      {Icon && (
        <div className={styles.iconWrap} style={{ background: accent + '18' }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      )}
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>
        {isCurrency
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
          : value.toLocaleString('pt-BR')}
      </p>
      {(delta !== null || deltaAbs !== null) && (
        <p className={`${styles.delta} ${isDown ? styles.down : styles.up}`}>
          {isDown ? '▼' : '▲'}
          {delta    !== null && <span> {Math.abs(delta).toFixed(2).replace('.', ',')}%</span>}
          {deltaAbs !== null && <span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deltaAbs)}</span>}
        </p>
      )}
      {deltaLabel && <p className={styles.sub}>{deltaLabel}</p>}
    </div>
  )
}
