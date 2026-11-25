export const COPY_VARIABLES = {
  FirstName: 'Primeiro nome',
  NomeInvestida: 'Nome da rede',
  CartaoNmComercial: 'Nome do cartão',
  LimiteNovo: 'Limite formatado',
} as const;

export type CopyVariable = keyof typeof COPY_VARIABLES;
export const copyToken = (name: CopyVariable) => `%%=v(@${name})=%%`;
const tokens = new Map(Object.keys(COPY_VARIABLES).map((name) => [name.toLowerCase(), name as CopyVariable]));
export const COPY_TOKEN_PATTERN = /%%=v\(@(\w+)\)=%%/gi;

export const copyVariable = (name: string) => tokens.get(name.toLowerCase());

export function withoutCopyTokens(value: string): string {
  return value.replace(COPY_TOKEN_PATTERN, (token, name: string) => copyVariable(name) ? '' : token);
}
