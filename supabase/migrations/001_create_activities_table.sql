-- =============================================
-- SQL Migration: Unified Activities Table (GaaS + Historical)
-- Replaces previous 'dispatches' concept
-- =============================================

-- Drop old table if exists (renaming strategy)
DROP TABLE IF EXISTS dispatches;

CREATE TABLE IF NOT EXISTS activities (
  -- Identificadores
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Controle Interno GaaS
  prog_gaas BOOLEAN DEFAULT FALSE, -- Identifica se foi criado pelo sistema (true) ou importado (false)
  status VARCHAR(20) DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Scheduled', 'Enviado', 'Realizado')),
  
  -- Campos Core (Dimensões Principais)
  "BU" VARCHAR(20),
  jornada VARCHAR(255),
  "Activity name / Taxonomia" VARCHAR(255), -- Manter nome compatível ou mapear no front
  "Canal" VARCHAR(50), 
  "Data de Disparo" DATE,
  "Data Fim" DATE,
  "Safra" VARCHAR(20),
  
  -- Segmentação & Parceiros
  "Parceiro" VARCHAR(100),
  "SIGLA_Parceiro" VARCHAR(50), -- Resolvendo duplicidade de SIGLA
  "Segmento" VARCHAR(100),
  "SIGLA_Segmento" VARCHAR(50), -- Resolvendo duplicidade de SIGLA
  "Subgrupos" VARCHAR(100),
  "Etapa de aquisição" VARCHAR(100),
  "Perfil de Crédito" VARCHAR(100),
  
  -- Ofertas
  "Produto" VARCHAR(100),
  "Oferta" VARCHAR(100),
  "Promocional" VARCHAR(100),
  "SIGLA_Oferta" VARCHAR(50), -- Resolvendo duplicidade de SIGLA
  "Oferta 2" VARCHAR(100),
  "Promocional 2" VARCHAR(100),
  "Ordem de disparo" INTEGER,

  -- Métricas de Base
  "Base Total" INTEGER,
  "Base Acionável" INTEGER,
  "% Otimização de base" DECIMAL(5,2),
  
  -- Métricas Financeiras (Custos)
  "Custo Unitário Oferta" DECIMAL(10,2),
  "Custo Total da Oferta" DECIMAL(12,2),
  "Custo unitário do canal" DECIMAL(10,2),
  "Custo total canal" DECIMAL(12,2),
  "Custo Total Campanha" DECIMAL(12,2),
  "CAC" DECIMAL(10,2),
  
  -- Métricas de Funil (Taxas)
  "Taxa de Entrega" DECIMAL(5,2),
  "Taxa de Abertura" DECIMAL(5,2),
  "Taxa de Clique" DECIMAL(5,2),
  "Taxa de Proposta" DECIMAL(5,2),
  "Taxa de Aprovação" DECIMAL(5,2),
  "Taxa de Finalização" DECIMAL(5,2),
  "Taxa de Conversão" DECIMAL(5,2),
  
  -- Volumes (Resultados)
  "Cartões Gerados" INTEGER,
  "Aprovados" INTEGER,
  "Propostas" INTEGER,
  "Emissões Independentes" INTEGER,
  "Emissões Assistidas" INTEGER,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activities_data ON activities("Data de Disparo");
CREATE INDEX IF NOT EXISTS idx_activities_bu ON activities("BU");
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_prog_gaas ON activities(prog_gaas);

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON activities
  FOR ALL USING (true) WITH CHECK (true);
