import styles from './TopProducts.module.css'

export default function TopProducts({ data }) {
  const max = Math.max(...data.map((p) => p.qty))

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Produtos Mais Vendidos</h3>
        <span className={styles.link}>Ver todos →</span>
      </div>
      <ul className={styles.list}>
        {data.map((p) => (
          <li key={p.rank} className={styles.row}>
            <span className={`${styles.rank} ${p.rank === 1 ? styles.gold : ''}`}>
              {p.rank}
            </span>
            <span className={styles.name}>{p.name}</span>
            <div className={styles.barWrap}>
              <div className={styles.bar} style={{ width: `${(p.qty / max) * 100}%` }} />
            </div>
            <span className={styles.qty}>{p.qty}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
