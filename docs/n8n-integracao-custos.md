# Integração n8n → Painel de Custos

Este documento explica como cada workflow do n8n deve registrar o uso real dos
agentes IA na tabela `agent_usage_log` do Supabase, para que o painel
`/custos/agentes` mostre números reais em vez de estimativas.

## Pré-requisitos

1. SQL `sql/custos-modulo.sql` rodado no Supabase SQL Editor (cria tabelas + views).
2. Cada workflow Mari + agentes IA precisa de **1 node "HTTP Request"** logo após
   o node que chama a Anthropic / OpenAI.

## Endpoint

```
POST https://oovdayewoaeyaolzoesq.supabase.co/rest/v1/agent_usage_log
```

## Headers

```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json
Prefer: return=minimal
```

(usar o mesmo `apikey` já configurado em outros nodes Supabase do projeto)

## Body

```json
{
  "agent_name": "mari_sdr_whatsapp",
  "model": "claude-haiku-4-5-20251001",
  "input_tokens": {{ $json.usage.input_tokens }},
  "output_tokens": {{ $json.usage.output_tokens }},
  "custo_usd": {{ ($json.usage.input_tokens / 1000000 * 1.00) + ($json.usage.output_tokens / 1000000 * 5.00) }},
  "custo_brl": {{ (($json.usage.input_tokens / 1000000 * 1.00) + ($json.usage.output_tokens / 1000000 * 5.00)) * 5.20 }},
  "meta": {
    "workflow": "WF12",
    "session_id": "{{ $json.session_id }}"
  }
}
```

## Tabela de `agent_name` (canonical)

| agent_name              | Workflow | Modelo                       | Preço in/out (USD/Mtok) |
|-------------------------|----------|------------------------------|--------------------------|
| `mari_sdr_whatsapp`     | WF12     | claude-haiku-4-5-20251001    | 1.00 / 5.00              |
| `mari_chatwoot`         | WF14     | claude-haiku-4-5-20251001    | 1.00 / 5.00              |
| `mari_instagram`        | WF16     | claude-haiku-4-5-20251001    | 1.00 / 5.00              |
| `mari_aprendizado`      | WF13     | claude-haiku-4-5-20251001    | 1.00 / 5.00              |
| `pix_ocr`               | WF-PIX   | claude-haiku-4-5-20251001    | 1.00 / 5.00              |
| `links_pagarme`         | WF-PAY   | claude-haiku-4-5-20251001    | 1.00 / 5.00              |

> Os IDs precisam bater **exatamente** com os IDs definidos em
> `src/lib/pricing.ts → AGENTES_PRODUCAO`. Qualquer divergência fará o painel
> mostrar estimativa em vez do valor real.

## Cálculo de custo (referência)

```
custo_usd  = (input_tokens  / 1_000_000) * preco_input_usd
           + (output_tokens / 1_000_000) * preco_output_usd

custo_brl  = custo_usd * cambio_brl   (use 5.20 como fallback estável)
```

Para Haiku 4.5:
- input  = $1.00 / Mtok
- output = $5.00 / Mtok

## Onde adicionar o node no workflow

1. Abrir o workflow (ex: WF12 — Mari SDR WhatsApp)
2. Localizar o node que chama a Anthropic (`anthropic-claude-call` ou similar)
3. Conectar a saída do node Anthropic em um novo **HTTP Request**
4. Configurar method=POST, URL e Headers conforme acima
5. No body, mapear os tokens vindos da resposta da Anthropic
6. Conectar a saída do HTTP Request no próximo passo do fluxo (com `errorOutput=continueRegularOutput` para nunca derrubar a Mari por erro de log)

## Verificação

Depois de ativar em pelo menos 1 workflow, abrir `/custos/agentes` no OS. O alerta
amarelo "Sem dados reais ainda" deve sumir e a coluna **Custo real (mês)** vai
mostrar valores em verde, com chamadas e tokens registrados.

A view `vw_agentes_custo_mes_atual` agrega automaticamente o `agent_usage_log` do
mês corrente — não precisa de cron, é cálculo on-the-fly.

## Próximos passos opcionais

- **Cron de fechamento mensal**: dia 1 às 00:05 do mês seguinte, copiar
  `vw_agentes_custo_mes_atual` para `agent_monthly_summary` (snapshot histórico).
- **Cron de câmbio**: a cada 1h, atualizar uma tabela `cambio_brl` lendo
  `api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json`.
  Hoje o frontend faz isso direto com cache de sessionStorage (1h).
