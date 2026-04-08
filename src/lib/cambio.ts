// Câmbio USD/BRL via Banco Central com cache em sessionStorage
// Fallback fixo R$ 5,20 conforme regra do projeto

const FALLBACK_BRL = 5.20
const CACHE_KEY = 'os_cambio_brl'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1h

interface BcbResp {
  data: string
  valor: string
}

export async function getCambioBrl(): Promise<number> {
  // sessionStorage cache
  if (typeof sessionStorage !== 'undefined') {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) {
      try {
        const cached = JSON.parse(raw) as { valor: number; ts: number }
        if (Date.now() - cached.ts < CACHE_TTL_MS && cached.valor > 0) {
          return cached.valor
        }
      } catch {
        // ignore
      }
    }
  }

  try {
    // série 1 = USD/BRL venda do Banco Central
    const resp = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json',
      { signal: AbortSignal.timeout(4000) }
    )
    if (resp.ok) {
      const data = (await resp.json()) as BcbResp[]
      const valor = parseFloat(data[0]?.valor || '0')
      if (valor > 0) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ valor, ts: Date.now() }))
        }
        return valor
      }
    }
  } catch {
    // network/timeout — usa fallback
  }
  return FALLBACK_BRL
}

export const CAMBIO_FALLBACK = FALLBACK_BRL
