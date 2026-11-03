---
tags: [estrategia,restricao,governanca]
tipo: estrategia
camada: estrategia
atualizado: 2026-06-08
status: a-validar
fonte: gaas-supabase
---

# Anti-Overlap / Pressão de Contato

**Definição:** a restrição que evita **bombardear o mesmo indivíduo** com disparos sobrepostos — controlar a frequência de contato por pessoa para não queimar a base.

## Contexto
É a **restrição #2 da [[Função-Objetivo]]** (respeitar pressão de contato) e relaciona-se ao playbook anti-bounce de SMS/WhatsApp (item 5 do [[Framework-v1-Diretor|diretor]]). O destino é um `frequency_ledger` no [[Orquestrador]] — um livro-razão de quantas vezes cada CPF foi tocado.

## ⚠️ Bloqueio
Hoje o GaaS só tem dado **agregado** (volume por campanha), não individual (CPF). Anti-overlap real depende de acesso ao dado individual no [[SFMC-Salesforce-Marketing-Cloud|SFMC]] — é a [[Decisões-Abertas|decisão aberta #2]] e teto da [[Roadmap-Framework|Fase 3]].

## Relacionado
- [[Função-Objetivo]] · [[Orquestrador]] · [[SFMC-Salesforce-Marketing-Cloud]] · [[Decisões-Abertas]] · [[Roadmap-Framework]]
