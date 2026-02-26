export const currency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export const percent = (v) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v)) + '%'

export const monthName = (m, y) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(y, m - 1))
    .replace(' de ', ' ')
    .replace(/^\w/, c => c.toUpperCase())
