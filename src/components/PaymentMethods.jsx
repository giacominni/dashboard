import { CreditCard, Banknote, Zap, Gift } from 'lucide-react'
import { currency } from '../utils/format'
import styles from './PaymentMethods.module.css'

const PAYMENT_ICONS = {
  'Cartão de Crédito': CreditCard,
  'Cartão de Débito':  CreditCard,
  'Dinheiro':          Banknote,
  'PIX':               Zap,
  'Vale Presente':     Gift,
}

export default function PaymentMethods({ data }) {
  const total = data.reduce((sum, p) => sum + p.value, 0)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Formas de Pagamento</h3>
        <span className={styles.link}>Detalhes →</span>
      </div>

      <ul className={styles.list}>
        {data.map((p) => {
          const Icon = PAYMENT_ICONS[p.label] || CreditCard
          return (
            <li key={p.label} className={styles.row}>
              <div className={styles.left}>
                <span className={styles.icon}>
                  <Icon size={14} />
                </span>
                <span className={styles.name}>{p.label}</span>
              </div>
              <span className={`${styles.value} ${p.value < 0 ? styles.neg : ''}`}>
                {currency(p.value)}
              </span>
            </li>
          )
        })}
      </ul>

      <div className={styles.total}>
        <span className={styles.totalLabel}>Total Recebido</span>
        <span className={styles.totalValue}>{currency(total)}</span>
      </div>
      <p className={styles.note}>* Vale Presente é subtraído do total</p>
    </div>
  )
}
