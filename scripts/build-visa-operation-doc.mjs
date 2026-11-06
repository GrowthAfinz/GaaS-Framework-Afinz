// Projeção documental. SQLs permanecem referências, nunca são executados.
import fs from "node:fs";
import path from "node:path";
const vault = process.argv[2];
if (!vault) throw new Error("Informe o diretório do vault.");
const read = (p) => fs.readFileSync(path.join(vault, p), "utf8");
const source = "04-Operacao/Automacao-VDV-Pool-de-Ofertas.md";
const runbook = read(source);
const sqls = (t) =>
  [...t.matchAll(/```sql\s*\n([\s\S]*?)```/g)].map((m) => m[1].trim());
const proposalSql = sqls(runbook);
const de = "02-Entidades-Dados/SFMC/";
const stepData = [
  [
    "01",
    "IMP_VDV_01_MAPA_ENTRADA",
    "Importar arquivo da IN",
    "MAPA_MCC_ENTRADA",
    "Overwrite",
    "a incluir",
    "Importa texto do SFTP. O import automático ainda está fora da automação; mudança no SFTP não garante atualização.",
    null,
    [],
  ],
  [
    "02",
    "Q_VDV_02_MAPA",
    "Converter a MAPA",
    "MAPA_MCC",
    "Overwrite",
    "rodando",
    "Converte decimais, quantidades e datas brasileiras. TRY_CONVERT evita interromper a query por campo sujo; conferir nulos e valores após a carga.",
    "DE-MAPA_MCC.md",
    [],
  ],
  [
    "03",
    "Q_VDV_03_CRUZAMENTO",
    "Aplicar elegibilidade",
    "VDV_CRUZAMENTO",
    "Overwrite",
    "rodando",
    "Reduz a base a um CPF e aplica status, compra em 30 dias, limite de R$ 200 e bloqueios. Parceiro e nome do cartão são acréscimos propostos.",
    "DE-VDV_CRUZAMENTO.md",
    [0, 1],
  ],
  [
    "04",
    "Q_VDV_04_APTOS",
    "Classificar grupo e célula",
    "VDV_APTOS",
    "Overwrite",
    "rodando",
    "Versão de 03/11 em operação. Safra vinda do tema, parceiro e nome do cartão são mudanças propostas. O SQL novo também dá prioridade a FAMILIA_PRESENTES; conferir antes de substituir.",
    "DE-VDV_APTOS.md",
    [2],
  ],
  [
    "05",
    "Q_VDV_05_ENVIO",
    "Congelar a safra",
    "VDV_ENVIO",
    "Atualizar",
    "proposta",
    "Inclui CPFs novos e preserva grupo e célula de quem entrou. Versão e safra vêm do tema vigente. Entrada de novos aptos a cada disparo ainda é decisão aberta.",
    null,
    [3],
  ],
  [
    "08",
    "Q_VDV_08_VITRINE",
    "Gerar vitrine por grupo",
    "MOVIMENTO_OFERTAS_VISA",
    "Overwrite",
    "proposta",
    "Seleciona 2 do grupo e 1 descoberta, com reservas, usando tempo sem aparecer, vigência e desconto. Divisão de posições ainda aberta. Exige FOTO, LINK e VALOR; uma oferta por marca.",
    null,
    [4],
  ],
  [
    "09",
    "Q_VDV_09_HISTORICO",
    "Registrar memória da vitrine",
    "VDV_VITRINE_HISTORICO",
    "Atualizar",
    "proposta",
    "Acumula a vitrine por dia, versão, grupo, célula e posição. MOTIVO explica a escolha; FL_EXIBIDA usa hoje as posições 1 a 3.",
    null,
    [5],
  ],
  [
    "10",
    "Q_VDV_10_DISPARO",
    "Preparar público do dia",
    "VDV_DISPARO",
    "Overwrite",
    "proposta",
    "Cruza safra congelada com aptidão atual. Grupo e célula ficam congelados; contato e limite vêm da base do dia. Exclui controles SEG-C e GEN-C.",
    null,
    [6],
  ],
  [
    "06",
    "Q_VDV_06_FUNIL",
    "Conferir etapas e distribuição",
    "VDV_FUNIL",
    "Atualizar",
    "rodando",
    "Funil atual em operação. Etapas VITRINE e DISPARO e safra dinâmica são propostas ainda não testadas. Acumula histórico.",
    "DE-VDV_FUNIL.md",
    [7],
  ],
];
const steps = stepData.map(
  ([number, id, title, target, action, status, description, file, indexes]) => {
    const currentSql = file ? sqls(read(de + file)) : [];
    if (number === "02")
      currentSql.unshift(
        fs.readFileSync(
          "src/modules/dynamic-email/fixtures/visaMapaQuery.sql",
          "utf8",
        ),
      );
    return {
      number,
      id,
      title,
      target,
      action,
      status,
      description,
      source: file ? de + file : source,
      currentSql,
      proposalSql: indexes.map((i) => proposalSql[i]),
      proposalSource: source,
    };
  },
);
if (proposalSql.length !== 8)
  throw new Error("A estrutura de SQLs do runbook mudou. Revisar o gerador.");
const openSource = "07-Evolucao/Decisões-Abertas.md";
const decisions = read(openSource)
  .split("\n")
  .filter((l) => /^(2[1-9])\. /.test(l))
  .map((l) => ({
    number: Number(l.split(".")[0]),
    text: l.replace(/^\d+\. /, "").replace(/\*\*|`/g, ""),
    source: openSource,
  }));
const rotationSource = "05-Estrategia/Rotacao-de-Ofertas-Vai-de-Visa.md";
const rotation = read(rotationSource);
const section = (text, title) =>
  text.split(title)[1]?.split("\n## ")[0]?.trim() ?? "";
const result = {
  sourceDate: "2026-11-05",
  source,
  steps,
  decisions,
  rotationSource,
  rotationDecisions: section(rotation, "## Decisões tomadas (05/11/2026)"),
  rotationRule: section(
    rotation,
    "## Regra de priorização (por grupo, a cada disparo)",
  ),
  rotationLimits: section(rotation, "## Lacunas"),
  requirements: section(runbook, "## Campos e DEs que precisam existir antes"),
  execution: section(runbook, "## Ordem de execução"),
  buEvidence: section(runbook, "## Onde roda no SFMC (BU)"),
};
fs.writeFileSync(
  "src/modules/dynamic-email/fixtures/visaOperation.json",
  JSON.stringify(result, null, 2) + "\n",
);
