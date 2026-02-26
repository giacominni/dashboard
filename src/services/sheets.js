const SHEET_ID = import.meta.env.VITE_SHEET_ID

// Parser CSV que respeita campos entre aspas
// "R$ 1.300,00" não é dividido pela vírgula interna
function parseCSVLine(line) {
  const result = []
  let current  = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

// Busca uma aba pelo GID e retorna array de linhas (cada linha = array de colunas)
export async function fetchSheet(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`
  const res  = await fetch(url)
  if (!res.ok) throw new Error(`Erro ao buscar aba gid=${gid}: ${res.status}`)
  const csv  = await res.text()

  return csv
    .trim()
    .split('\n')
    .map(line => parseCSVLine(line))
}

// "R$ 1.234,56"  →  1234.56
export function parseBRL(str) {
  if (!str) return 0
  return parseFloat(
    String(str)
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  ) || 0
}

// "31/05/2023"  →  { day:31, month:5, year:2023 }
export function parseDate(str) {
  if (!str) return null
  const [day, month, year] = str.trim().split('/').map(Number)
  if (!day || !month || !year) return null
  return { day, month, year }
}

// "31/05/2023" ou "03/2023"  →  true
export function isDateRow(str) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(str?.trim()) ||
         /^\d{2}\/\d{4}$/.test(str?.trim())
}

// Linha só com dígitos (código de produto)
export function isNumericCode(str) {
  return /^\d+$/.test(str?.trim())
}