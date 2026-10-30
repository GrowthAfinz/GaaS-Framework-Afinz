#!/usr/bin/env python3
"""
Gerador de Diarizado de Pacing — formato herdado da planilha Jacto.
Layout fiel:
  [TOPO] Gráficos de linha lado a lado (Realizado acum vs Meta acum), 1 por objetivo.
  [COCKPIT] Mini-painel de pacing por objetivo: métricas em linha
            (Investimento, Volume KPI, Eficiência) × colunas Acum | Meta | Gap | Gap% | Projeção.
  [TABELA] Diária: Data | Dia da semana | por objetivo [Investimento | acum | Volume | acum].
Cockpit e Tabela compartilham a MESMA grade de blocos (4 colunas por objetivo) p/ alinhar.
Métricas em PT-BR. Parametrizável via JSON.
Uso: python gerar_diarizado.py config.json saida.xlsx
"""
import json, sys, datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import LineChart, Reference
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.line import LineProperties

DIAS_PT=["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"]

def gerar(cfg, saida):
    P=cfg.get("paleta",{})
    TINTA=P.get("tinta","1E293B"); CINZA=P.get("cinza","64748B"); HEADER=P.get("header","334155")
    PAPEL=P.get("papel","F1F5F9"); LINHA=P.get("linha","E2E8F0"); BRANCO="FFFFFF"
    FONT=cfg.get("fonte","Arial"); objetivos=cfg["objetivos"]
    dias_no_mes=cfg.get("dias_no_mes",30)
    def Fn(sz=10,b=False,c=TINTA,i=False): return Font(name=FONT,size=sz,bold=b,color=c,italic=i)
    def fill(h): return PatternFill("solid",start_color=h)
    thin=Side(style="thin",color=LINHA); med=Side(style="thin",color=CINZA)
    BORD=Border(left=thin,right=thin,top=thin,bottom=thin)
    def ctr(): return Alignment("center",vertical="center")
    def lft(): return Alignment("left",vertical="center",wrap_text=True)

    wb=Workbook(); ws=wb.active; ws.title="Diarizado"; ws.sheet_view.showGridLines=False
    BLOCO=4  # colunas por objetivo (grade única): Invest | Invest acum | Volume | Volume acum
    def col_obj(i): return 3 + i*BLOCO   # A,B reservados; obj0 começa em C(3)
    NOBJ=len(objetivos); NCOLT=col_obj(NOBJ)-1

    # ---------- TOPO: reservar p/ gráficos ----------
    GRAF_ROWS=20
    # ---------- COCKPIT ----------
    rT=GRAF_ROWS+1
    ws.cell(rT,1,cfg.get("titulo","DIARIZADO — Pacing")+("  ·  "+cfg.get("mes","") if cfg.get("mes") else "")).font=Fn(15,True,TINTA)
    ws.cell(rT+1,1,"Gráficos no topo · cockpit de pacing por objetivo · tabela diária (diário + acumulado). Métricas em PT-BR. Pacing por investimento (confiável).").font=Fn(8,c=CINZA,i=True)
    cockH=rT+3
    # faixa de título por objetivo (mesma grade da tabela: BLOCO cols)
    ws.cell(cockH,1,"COCKPIT").font=Fn(9,True,TINTA)
    for i,ob in enumerate(objetivos):
        c0=col_obj(i)
        first_c=ws.cell(cockH,c0,ob["nome"]); first_c.font=Fn(9,True,BRANCO); first_c.alignment=Alignment("left",vertical="center")
        for k in range(c0,c0+BLOCO): ws.cell(cockH,k).fill=fill(ob["cor"])
        ws.merge_cells(start_row=cockH,start_column=c0,end_row=cockH,end_column=c0+BLOCO-1)
    # sub-cabeçalho do cockpit: col label fica em A; nas colunas do objetivo mostramos: Acum | Meta | Gap% | Proj
    sub=cockH+1
    ws.cell(sub,1,"Indicador").font=Fn(8,True,BRANCO); ws.cell(sub,1).fill=fill(HEADER); ws.cell(sub,1).alignment=ctr(); ws.cell(sub,1).border=BORD
    ws.cell(sub,2,"").fill=fill(HEADER); ws.cell(sub,2).border=BORD
    for i,ob in enumerate(objetivos):
        c0=col_obj(i)
        for j,h in enumerate(["Acum.","Meta","Gap %","Projeção"]):
            x=ws.cell(sub,c0+j,h); x.font=Fn(7,True,BRANCO); x.fill=fill(HEADER); x.alignment=ctr(); x.border=BORD

    # ---------- TABELA DIÁRIA ----------
    TAB=cockH+8  # cockpit ocupa ~6 linhas
    # título de bloco (linha TAB-1) + sub-cabeçalho (TAB)
    ws.merge_cells(start_row=TAB-1,start_column=1,end_row=TAB-1,end_column=2)
    tc=ws.cell(TAB-1,1,"TABELA DIÁRIA"); tc.font=Fn(9,True,TINTA)
    ws.cell(TAB,1,"Data").font=Fn(8,True,BRANCO); ws.cell(TAB,2,"Dia").font=Fn(8,True,BRANCO)
    for c in (1,2): ws.cell(TAB,c).fill=fill(HEADER); ws.cell(TAB,c).alignment=ctr(); ws.cell(TAB,c).border=BORD
    for i,ob in enumerate(objetivos):
        c0=col_obj(i)
        tcell=ws.cell(TAB-1,c0,ob["nome"]); tcell.font=Fn(9,True,BRANCO); tcell.alignment=Alignment("left",vertical="center")
        for k in range(c0,c0+BLOCO): ws.cell(TAB-1,k).fill=fill(ob["cor"])
        ws.merge_cells(start_row=TAB-1,start_column=c0,end_row=TAB-1,end_column=c0+BLOCO-1)
        for j,s in enumerate(["Investimento","Acum.",ob["kpi_volume_label"],"Acum."]):
            x=ws.cell(TAB,c0+j,s); x.font=Fn(7,True,BRANCO); x.fill=fill(HEADER); x.alignment=ctr(); x.border=BORD

    n=len(objetivos[0]["dados"]); first=TAB+1
    for di in range(n):
        r=first+di; data=objetivos[0]["dados"][di][0]; dt=datetime.date.fromisoformat(data)
        ws.cell(r,1,dt.strftime("%d/%m")).font=Fn(8,c=TINTA); ws.cell(r,1).alignment=ctr(); ws.cell(r,1).border=BORD
        ws.cell(r,2,DIAS_PT[dt.weekday()][:3]).font=Fn(8,c=CINZA); ws.cell(r,2).alignment=ctr(); ws.cell(r,2).border=BORD
        for i,ob in enumerate(objetivos):
            c0=col_obj(i); row=ob["dados"][di]; inv=row[1]; vol=row[2]
            ws.cell(r,c0,inv).number_format='#,##0.00'
            ws.cell(r,c0+1,f"=SUM({get_column_letter(c0)}${first}:{get_column_letter(c0)}{r})").number_format='#,##0'
            ws.cell(r,c0+2,vol).number_format='#,##0'
            ws.cell(r,c0+3,f"=SUM({get_column_letter(c0+2)}${first}:{get_column_letter(c0+2)}{r})").number_format='#,##0'
            for k in range(c0,c0+BLOCO):
                ws.cell(r,k).border=BORD; ws.cell(r,k).alignment=ctr(); ws.cell(r,k).font=Fn(8,c=TINTA)
    last=first+n-1

    # ---------- coluna auxiliar Meta acum (p/ gráfico), à direita, oculta ----------
    metacol={}; cax=NCOLT+2
    for i,ob in enumerate(objetivos):
        md=ob["budget"]/dias_no_mes
        ws.cell(TAB,cax,"Meta "+ob["nome"]).font=Fn(7,c=CINZA)
        for di in range(n): ws.cell(first+di,cax,round(md*(di+1),2)).number_format='#,##0'
        metacol[ob["nome"]]=cax; cax+=1

    # ---------- preencher COCKPIT (refs à tabela) ----------
    cr_inv=cockH+2; 
    ws.cell(cr_inv,1,"Investimento (R$)").font=Fn(8,c=TINTA); ws.cell(cr_inv,1).border=BORD
    cr_vol=cockH+3; ws.cell(cr_vol,1,"Volume (KPI)").font=Fn(8,c=TINTA); ws.cell(cr_vol,1).border=BORD
    cr_efi=cockH+4; ws.cell(cr_efi,1,"Eficiência").font=Fn(8,c=TINTA); ws.cell(cr_efi,1).border=BORD
    cr_sta=cockH+5; ws.cell(cr_sta,1,"Status").font=Fn(8,True,TINTA); ws.cell(cr_sta,1).border=BORD
    for rr in (cr_inv,cr_vol,cr_efi,cr_sta): ws.cell(rr,2).border=BORD
    for i,ob in enumerate(objetivos):
        c0=col_obj(i); invacum=f"{get_column_letter(c0+1)}{last}"; volacum=f"{get_column_letter(c0+3)}{last}"
        md=ob["budget"]/dias_no_mes; metanow=f"{md:.2f}*{n}"
        # INVESTIMENTO: Acum | Meta | Gap% | Projeção
        ws.cell(cr_inv,c0,f"={invacum}").number_format='#,##0'
        ws.cell(cr_inv,c0+1,f"={metanow}").number_format='#,##0'
        ws.cell(cr_inv,c0+2,f"=({invacum}-({metanow}))/({metanow})").number_format='0.0%;[Red]-0.0%'
        ws.cell(cr_inv,c0+3,f"={invacum}/{n}*{dias_no_mes}").number_format='#,##0'
        # VOLUME: Acum | — | — | Projeção
        ws.cell(cr_vol,c0,f"={volacum}").number_format='#,##0'
        ws.cell(cr_vol,c0+1,"—").alignment=ctr(); ws.cell(cr_vol,c0+2,"—").alignment=ctr()
        ws.cell(cr_vol,c0+3,f"={volacum}/{n}*{dias_no_mes}").number_format='#,##0'
        # EFICIÊNCIA (CPC/CPM/CPL)
        if ob["kpi_tipo"]=="CPM":
            ef=f"=IF({volacum}=0,0,{invacum}/{volacum}*1000)"
        else: ef=f"=IF({volacum}=0,0,{invacum}/{volacum})"
        ec=ws.cell(cr_efi,c0,ef); ec.number_format='R$ #,##0.00'; ec.font=Fn(8,True,ob["cor"])
        ws.cell(cr_efi,c0+1,ob["kpi_nome"]).font=Fn(7,c=CINZA); ws.cell(cr_efi,c0+1).alignment=ctr()
        ws.cell(cr_efi,c0+2,"—").alignment=ctr(); ws.cell(cr_efi,c0+3,"—").alignment=ctr()
        # STATUS (semáforo PT) — usa gap% do investimento
        gapcell=f"{get_column_letter(c0+2)}{cr_inv}"
        st=ws.cell(cr_sta,c0,f'=IF({gapcell}>0.1,"🔴 Acima",IF({gapcell}<-0.1,"🟡 Abaixo","🟢 Ritmo"))')
        st.alignment=ctr(); st.font=Fn(8,True,TINTA)
        for j in (1,2,3): ws.cell(cr_sta,c0+j,"").border=BORD
        for rr in (cr_inv,cr_vol,cr_efi,cr_sta):
            for k in range(c0,c0+BLOCO):
                ws.cell(rr,k).border=BORD
                if k>c0 and ws.cell(rr,k).alignment.horizontal!="center": ws.cell(rr,k).alignment=ctr()
                if ws.cell(rr,k).font.color is None: ws.cell(rr,k).font=Fn(8,c=TINTA)

    # ---------- GRÁFICOS no topo ----------
    per=cfg.get("graf_por_linha",2)
    for idx,ob in enumerate(objetivos):
        c0=col_obj(idx)
        ch=LineChart(); ch.title=f"{ob['nome']} — Investimento acum (R$)"; ch.style=2
        ch.height=cfg.get("graf_altura",7.2); ch.width=cfg.get("graf_largura",9.8)
        cats=Reference(ws,min_col=1,min_row=first,max_row=last)
        real=Reference(ws,min_col=c0+1,min_row=TAB,max_row=last)
        meta=Reference(ws,min_col=metacol[ob["nome"]],min_row=TAB,max_row=last)
        ch.add_data(real,titles_from_data=True); ch.add_data(meta,titles_from_data=True)
        ch.set_categories(cats); ch.y_axis.delete=False; ch.x_axis.delete=False
        ch.series[0].graphicalProperties=GraphicalProperties(); ch.series[0].graphicalProperties.line=LineProperties(solidFill=ob["cor"],w=24000)
        ch.series[1].graphicalProperties=GraphicalProperties(); ch.series[1].graphicalProperties.line=LineProperties(solidFill="94A3B8",w=13000,prstDash="dash")
        ch.series[0].smooth=False; ch.series[1].smooth=False
        anchor_col=1+(idx%per)*9; anchor_row=1+(idx//per)*10
        ws.add_chart(ch, f"{get_column_letter(anchor_col)}{anchor_row}")

    ws.column_dimensions["A"].width=7; ws.column_dimensions["B"].width=6
    for c in range(3,NCOLT+1): ws.column_dimensions[get_column_letter(c)].width=12
    for nome,mc in metacol.items(): ws.column_dimensions[get_column_letter(mc)].hidden=True
    for r in range(1,last+3):
        for c in range(1,NCOLT+1):
            x=ws.cell(r,c)
            if x.fill.start_color.rgb in (None,"00000000"): x.fill=fill(BRANCO)
    ws.sheet_view.zoomScale=80
    ws.freeze_panes=f"A{TAB+1}"
    wb.save(saida); return saida

if __name__=="__main__":
    cfg=json.load(open(sys.argv[1])); out=sys.argv[2] if len(sys.argv)>2 else "diarizado.xlsx"
    print("SAVED",gerar(cfg,out))
