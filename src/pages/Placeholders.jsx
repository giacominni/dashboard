const placeholder = (label) => () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '60vh', flexDirection: 'column', gap: 12,
  }}>
    <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--pink-dark)' }}>
      {label}
    </p>
    <p style={{ fontSize: 13, color: 'var(--muted)' }}>Em breve</p>
  </div>
)

export const Vendas       = placeholder('Vendas')
export const Clientes     = placeholder('Clientes')
export const Produtos     = placeholder('Produtos')
export const Relatorios   = placeholder('Relatórios')
export const Configuracoes = placeholder('Configurações')
