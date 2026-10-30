#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ingestao dos dashes do Funil de Aquisicao (GaaS).

Le um export cru (colado do Excel/Sheets -> TAB-separado, ou ja em CSV) de um
dos dois funis estaticos e emite o arquivo no formato EXATO que o app espera em
public/data/. Faz validacao de sanidade e usa checksum quando possivel.

Uso:
    python build_funnel_files.py serasa   <input_raw>  <output_csv>
    python build_funnel_files.py appafinz <input_raw>  <output_tsv>

Contratos (fonte da verdade = parsers do app):
  SERASA  -> FunilAquisicaoView.tsx  (delimitador ';', 8 colunas, DD/MM/YYYY,
             numeros pt-BR, linha 'Total' recalculada)
  APPAFINZ-> AppAfinzFunnelView.tsx  (delimitador TAB, 5 colunas raw longo,
             precisa das linhas de referencia [status vazio, MARC_PLURIX=0]
             para CPF/onboarding e das linhas APROVADO SIM/NAO para etapas 2-8)
"""
import sys, re

DATE_RE = re.compile(r"^\d{2}/\d{2}/\d{4}$")

SERASA_HEADER = ["Data", "Consultas Neurotech", "Aprovados Neurotech",
                 "Pedidos Confirmados", "Env. da Foto Biometria",
                 "Env. Documento", "Assinatura do Cartão", "Total Emitidos"]
APPAFINZ_HEADER = ["created_data", "Etapa", "status", "MARC_PLURIX", "Contagem de CPF"]


def read_rows(path):
    with open(path, "r", encoding="utf-8-sig") as fh:
        text = fh.read()
    rows = []
    for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        if line.strip() == "":
            continue
        # Excel paste -> TAB. Alguns exports vem com ';'. Detecta por linha.
        if "\t" in line:
            cells = line.split("\t")
        elif ";" in line:
            cells = line.split(";")
        else:
            cells = [line]
        # remove rotulo de lista tipo "1 - " / "2 - " so na 1a celula do header
        cells[0] = re.sub(r"^\s*\d+\s*-\s*", "", cells[0])
        rows.append([c.strip() for c in cells])
    return rows


def ptbr_to_int(s):
    s = (s or "").strip()
    if s == "":
        return None
    return int(s.replace(".", "").replace(",", ""))


def build_serasa(inp, out):
    rows = read_rows(inp)
    data = [r for r in rows if r and DATE_RE.match(r[0])]
    if not data:
        raise SystemExit("SERASA: nenhuma linha de data encontrada")
    # normaliza para 8 colunas (celulas vazias viram '')
    norm = []
    for r in data:
        r = (r + [""] * 8)[:8]
        norm.append(r)
    # ordena por data
    norm.sort(key=lambda r: tuple(int(x) for x in reversed(r[0].split("/"))))
    # checksum: soma por coluna
    totals = [0] * 7
    for r in norm:
        for i in range(1, 8):
            v = ptbr_to_int(r[i])
            if v is not None:
                totals[i - 1] += v
    # linha Total fornecida no export cru (se houver)
    provided = None
    for r in rows:
        if r and r[0].strip().lower() == "total":
            provided = [ptbr_to_int(x) for x in (r + [""] * 8)[1:8]]
    # emite ';' com numeros pt-BR (mantem . de milhar, celula vazia = vazio)
    def ptbr(n):
        return f"{n:,}".replace(",", ".")
    lines = [";".join(SERASA_HEADER)]
    for r in norm:
        lines.append(";".join(r))
    lines.append(";".join(["Total"] + [ptbr(t) for t in totals]))
    with open(out, "w", encoding="utf-8", newline="") as fh:
        fh.write("\n".join(lines) + "\n")

    # relatorio
    print(f"SERASA -> {out}")
    print(f"  dias: {len(norm)}  ({norm[0][0]} .. {norm[-1][0]})")
    print(f"  total recalculado: {[ptbr(t) for t in totals]}")
    if provided is not None:
        ok = all((p or 0) == t for p, t in zip(provided, totals))
        print(f"  total no export cru: {[ptbr(p or 0) for p in provided]}")
        print(f"  CHECKSUM: {'OK' if ok else 'DIVERGIU'}")
        if not ok:
            for name, p, t in zip(SERASA_HEADER[1:], provided, totals):
                if (p or 0) != t:
                    print(f"    - {name}: cru={p} recalc={t}")
    _check_date_gaps([r[0] for r in norm], "SERASA")


def _load_appafinz_rows(path):
    rows = read_rows(path)
    data = [r for r in rows if r and DATE_RE.match(r[0])]
    return [(r + [""] * 5)[:5] for r in data]


def _has_funnel(rows_for_date):
    # etapa >= 1 (qualquer coisa alem da digitacao de CPF "0.")
    return any(not r[1].startswith("0.") for r in rows_for_date)


def build_appafinz(inp, out, merge_with=None):
    norm = _load_appafinz_rows(inp)
    if not norm:
        raise SystemExit("APPAFINZ: nenhuma linha de data encontrada")

    preserved = []
    if merge_with:
        # MERGE: nunca regride historico de funil. Para cada data em que o
        # export NOVO nao tem funil (so etapa 0) mas o arquivo ANTIGO tem,
        # mantem as linhas do antigo daquela data.
        from collections import defaultdict
        old = _load_appafinz_rows(merge_with)
        old_by_date, new_by_date = defaultdict(list), defaultdict(list)
        for r in old:
            old_by_date[r[0]].append(r)
        for r in norm:
            new_by_date[r[0]].append(r)
        keep_from_old = []
        for d, orows in old_by_date.items():
            if _has_funnel(orows) and not _has_funnel(new_by_date.get(d, [])):
                # descarta as linhas 'so etapa 0' do novo p/ essa data e usa o antigo
                norm = [r for r in norm if r[0] != d]
                keep_from_old.append(d)
                preserved.append(d)
                norm.extend(orows)
        if preserved:
            preserved.sort(key=lambda s: tuple(int(x) for x in reversed(s.split("/"))))
    norm.sort(key=lambda r: (tuple(int(x) for x in reversed(r[0].split("/"))), r[1]))
    lines = ["\t".join(APPAFINZ_HEADER)]
    for r in norm:
        lines.append("\t".join(r))
    with open(out, "w", encoding="utf-8", newline="") as fh:
        fh.write("\n".join(lines) + "\n")

    dates = sorted({r[0] for r in norm},
                   key=lambda d: tuple(int(x) for x in reversed(d.split("/"))))
    print(f"APPAFINZ -> {out}")
    print(f"  linhas: {len(norm)}  dias distintos: {len(dates)}  ({dates[0]} .. {dates[-1]})")
    if merge_with:
        if preserved:
            print(f"  MERGE: funil preservado do arquivo antigo em {len(preserved)} dia(s): {preserved}")
        else:
            print("  MERGE: nenhum dia precisou de preservacao (novo cobre tudo)")
    # valida: cada dia com etapa >=2 precisa de linha APROVADO (SIM/NAO)
    faltando_ref = []
    for d in dates:
        src = [r for r in norm if r[0] == d]
        tem_completed = any(r[1].startswith("8.") and r[2] == "APROVADO" for r in src)
        tem_cpf_ref = any(r[1].startswith("0.") and r[2] == "" and r[3] == "0" for r in src)
        if tem_completed and not tem_cpf_ref:
            faltando_ref.append(d)
    if faltando_ref:
        print(f"  {len(faltando_ref)} dia(s) com etapa 8 mas SEM linha de referencia CPF: {faltando_ref[:8]}")
    else:
        print("  referencias CPF/onboarding presentes onde ha funil")
    _check_date_gaps(dates, "APPAFINZ")


def _check_date_gaps(date_strs, tag):
    from datetime import date, timedelta
    ds = sorted({tuple(int(x) for x in reversed(s.split("/"))) for s in date_strs})
    days = [date(y, m, d) for (y, m, d) in ds]
    gaps = []
    for a, b in zip(days, days[1:]):
        if (b - a).days > 1:
            gaps.append(f"{a.strftime('%d/%m')}->{b.strftime('%d/%m')} ({(b-a).days-1}d)")
    if gaps:
        print(f"  {tag}: buracos no calendario: {gaps}")
    else:
        print(f"  calendario continuo")


if __name__ == "__main__":
    if len(sys.argv) < 4 or sys.argv[1] not in ("serasa", "appafinz"):
        print(__doc__)
        raise SystemExit(2)
    kind, inp, out = sys.argv[1], sys.argv[2], sys.argv[3]
    # arg opcional 4: arquivo antigo p/ merge (so appafinz)
    merge_with = sys.argv[4] if len(sys.argv) > 4 else None
    if kind == "serasa":
        build_serasa(inp, out)
    else:
        build_appafinz(inp, out, merge_with=merge_with)
