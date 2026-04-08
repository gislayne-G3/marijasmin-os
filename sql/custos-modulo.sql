-- =====================================================
-- MARIJASMIN OS — Módulo de Custos
-- Cria tabelas, seeds e views para o painel de custos
-- Rodar no Supabase SQL Editor (uma vez)
-- =====================================================

-- ══ 1. agent_usage_log: log granular de cada chamada ══
CREATE TABLE IF NOT EXISTS agent_usage_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  agent_name text NOT NULL,
  model text NOT NULL,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  custo_usd numeric(12,6) DEFAULT 0,
  custo_brl numeric(12,4) DEFAULT 0,
  meta jsonb,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_usage_log_agent_ts ON agent_usage_log (agent_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_usage_log_ts ON agent_usage_log (timestamp DESC);

-- ══ 2. agent_monthly_summary: agregado mensal ══
CREATE TABLE IF NOT EXISTS agent_monthly_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  agent_name text NOT NULL,
  mes text NOT NULL, -- formato 'YYYY-MM'
  total_chamadas integer DEFAULT 0,
  total_tokens_input integer DEFAULT 0,
  total_tokens_output integer DEFAULT 0,
  custo_total_usd numeric(12,4) DEFAULT 0,
  custo_total_brl numeric(12,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, agent_name, mes)
);

CREATE INDEX IF NOT EXISTS idx_agent_monthly_summary_mes ON agent_monthly_summary (mes);

-- ══ 3. model_pricing: tabela de preços por modelo (USD por milhão de tokens) ══
CREATE TABLE IF NOT EXISTS model_pricing (
  model text PRIMARY KEY,
  preco_input_usd_por_mtok numeric(8,4) NOT NULL,
  preco_output_usd_por_mtok numeric(8,4) NOT NULL,
  fornecedor text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO model_pricing (model, preco_input_usd_por_mtok, preco_output_usd_por_mtok, fornecedor) VALUES
  ('claude-haiku-4-5-20251001', 1.00, 5.00, 'anthropic'),
  ('claude-sonnet-4-6', 3.00, 15.00, 'anthropic'),
  ('claude-sonnet-4-20250514', 3.00, 15.00, 'anthropic'),
  ('claude-opus-4-6', 15.00, 75.00, 'anthropic'),
  ('gpt-4o-mini', 0.15, 0.60, 'openai'),
  ('gpt-4o', 2.50, 10.00, 'openai'),
  ('whisper-1', 0.006, 0.006, 'openai')
ON CONFLICT (model) DO UPDATE SET
  preco_input_usd_por_mtok = EXCLUDED.preco_input_usd_por_mtok,
  preco_output_usd_por_mtok = EXCLUDED.preco_output_usd_por_mtok,
  updated_at = now();

-- ══ 4. tool_costs: custos fixos e variáveis de ferramentas ══
CREATE TABLE IF NOT EXISTS tool_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ferramenta text NOT NULL,
  categoria text NOT NULL, -- infra | ia | pessoas | marketing | plataforma
  tipo text NOT NULL,      -- fixo | variavel
  custo_brl numeric(10,2) NOT NULL,
  mes text,                -- 'YYYY-MM' (null = recorrente atual)
  observacao text,
  ativo boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_costs_ativo ON tool_costs (ativo);
CREATE INDEX IF NOT EXISTS idx_tool_costs_mes ON tool_costs (mes);

-- Seed inicial (tabela do prompt da Gislayne — pode editar via UI no futuro)
INSERT INTO tool_costs (ferramenta, categoria, tipo, custo_brl, observacao) VALUES
  ('Vercel Pro (4 apps)',     'infra',      'fixo',     110.00, '4 deploys: site, crm, atacado, OS'),
  ('Railway (n8n+Evo+CW)',    'infra',      'fixo',      80.00, 'n8n, Evolution API, Chatwoot'),
  ('Tiny ERP',                'plataforma', 'fixo',     250.00, 'ERP principal'),
  ('WBuy (atacado)',          'plataforma', 'fixo',     699.00, 'site marijasminatacado'),
  ('Nuvemshop Essencial',     'plataforma', 'fixo',      69.00, 'site marijasmin.com.br'),
  ('Claude AI (assinatura)',  'ia',         'fixo',     550.00, 'plano Pro'),
  ('OpenAI API',              'ia',         'variavel',  40.00, 'estimativa volume atual'),
  ('WhatsApp API Meta',       'plataforma', 'fixo',     150.00, 'BSP/Cloud API'),
  ('Canva Pro',               'marketing',  'fixo',     100.00, 'design'),
  ('Meta Ads',                'marketing',  'variavel',5000.00, 'budget mensal anúncios'),
  ('Samily (auxiliar)',       'pessoas',    'fixo',    1700.00, 'auxiliar'),
  ('Analista e-commerce',     'pessoas',    'fixo',    1800.00, 'analista'),
  ('Fal AI (Studio)',         'ia',         'variavel', 100.00, 'geração de imagens, estimativa')
ON CONFLICT DO NOTHING;

-- ══ 5. equipe_humana_referencia: salários de mercado para comparativo ══
CREATE TABLE IF NOT EXISTS equipe_humana_referencia (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  cargo text NOT NULL,
  salario_brl numeric(10,2) NOT NULL,
  observacao text,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO equipe_humana_referencia (cargo, salario_brl, ordem, observacao) VALUES
  ('Atendente WhatsApp (24h)',     3500.00, 1, 'cobertura full-time'),
  ('Community Manager',            3000.00, 2, 'gestão IG/FB/TikTok'),
  ('Designer gráfico',             4000.00, 3, 'arte visual'),
  ('Analista financeiro',          6000.00, 4, 'DRE, fluxo de caixa'),
  ('Analista de tráfego',          4500.00, 5, 'Meta Ads'),
  ('Copywriter',                   3500.00, 6, 'copy de campanhas'),
  ('Fotógrafo (sessão/mês)',       3500.00, 7, 'sessão mensal'),
  ('Analista de CRM',              3000.00, 8, 'gestão de leads'),
  ('Gerente de e-commerce',        5000.00, 9, 'gestão das lojas')
ON CONFLICT DO NOTHING;

-- ══ 6. View: resumo do mês corrente por agente ══
CREATE OR REPLACE VIEW vw_agentes_custo_mes_atual AS
SELECT
  agent_name,
  model,
  COUNT(*) as total_chamadas,
  SUM(input_tokens) as total_tokens_input,
  SUM(output_tokens) as total_tokens_output,
  SUM(input_tokens + output_tokens) as total_tokens,
  ROUND(SUM(custo_usd)::numeric, 4) as custo_total_usd,
  ROUND(SUM(custo_brl)::numeric, 2) as custo_total_brl,
  MIN(timestamp) as primeira_chamada,
  MAX(timestamp) as ultima_chamada
FROM agent_usage_log
WHERE timestamp >= date_trunc('month', now())
GROUP BY agent_name, model
ORDER BY custo_total_brl DESC;

-- ══ 7. View: custo diário consolidado (últimos 30 dias) ══
CREATE OR REPLACE VIEW vw_custo_diario_30d AS
SELECT
  date_trunc('day', timestamp)::date as dia,
  COUNT(*) as chamadas,
  SUM(input_tokens + output_tokens) as tokens,
  ROUND(SUM(custo_usd)::numeric, 4) as custo_usd,
  ROUND(SUM(custo_brl)::numeric, 2) as custo_brl
FROM agent_usage_log
WHERE timestamp >= now() - interval '30 days'
GROUP BY 1
ORDER BY 1 DESC;

-- ══ 8. View: custo total mensal das ferramentas ativas ══
CREATE OR REPLACE VIEW vw_ferramentas_total_mes AS
SELECT
  categoria,
  tipo,
  COUNT(*) as itens,
  ROUND(SUM(custo_brl)::numeric, 2) as total_brl
FROM tool_costs
WHERE ativo = true AND (mes IS NULL OR mes = to_char(now(), 'YYYY-MM'))
GROUP BY categoria, tipo
ORDER BY total_brl DESC;

-- ══ 9. RLS: tudo aberto pra anon (OS é interno, sem público) ══
ALTER TABLE agent_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_humana_referencia ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anon_all_agent_usage_log" ON agent_usage_log FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_all_agent_monthly_summary" ON agent_monthly_summary FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_read_model_pricing" ON model_pricing FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_all_tool_costs" ON tool_costs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_all_equipe_humana_referencia" ON equipe_humana_referencia FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FIM
