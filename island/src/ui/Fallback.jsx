export function Fallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(var(--sky), var(--sky-low))',
        fontFamily: '"Noto Sans TC", sans-serif',
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'var(--cream)',
          border: '3px dashed var(--wood)',
          borderRadius: 24,
          maxWidth: 'min(420px, 90vw)',
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(61,50,41,.25)',
          color: 'var(--ink)',
        }}
      >
        <p style={{ lineHeight: 1.8, margin: 0 }}>
          小島暫時載入不了，先到一般版逛逛吧 →{' '}
          <a href="/" style={{ color: 'var(--pink)', fontWeight: 700 }}>
            vivichen.ai
          </a>
        </p>
      </div>
    </div>
  )
}
