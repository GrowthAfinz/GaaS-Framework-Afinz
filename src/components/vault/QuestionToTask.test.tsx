import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QuestionRow, QuestionTableContext, isQuestionTable } from './QuestionToTask';

const render = (md: string) => renderToStaticMarkup(
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    table: ({ node, children }) => {
      const box = <table>{children}</table>;
      return isQuestionTable(node as never) ? <QuestionTableContext.Provider value={{ notePath: '10-Resultados/Publicos/Publico-X.md', domain: 'crm-aquisicao' }}>{box}</QuestionTableContext.Provider> : box;
    },
    tr: ({ node, children }) => <QuestionRow node={node as never}>{children}</QuestionRow>,
  }}>{md}</ReactMarkdown>,
);

describe('Virar Tarefa nas Perguntas em aberto', () => {
  it('acrescenta a coluna e o botão só em tabelas cuja primeira coluna é Questão', () => {
    const html = render('| Questão | Impacto | Evidência necessária | Dono |\n|---|---|---|---|\n| A régua se paga? | volume | CAC por canal | Pablo |\n| Outra pergunta | x | y | a confirmar |');
    expect(html.match(/Virar Tarefa/g)).toHaveLength(2);
    expect(html).toContain('<th');
    expect(html).toContain('Tarefa</th>');
  });
  it('deixa as outras tabelas como estão', () => {
    const html = render('| Mês | Cartões |\n|---|---|\n| jul | 10 |');
    expect(html).not.toContain('Virar Tarefa');
  });
});
