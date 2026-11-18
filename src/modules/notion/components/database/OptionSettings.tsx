import React, { useState } from 'react';
import type { DatabaseProperty, NotionColor } from '../../types/notion';
import { useNotionEdit } from './editContext';

const colors: Record<NotionColor, string> = {
  default: 'Padrão', gray: 'Cinza', brown: 'Marrom', orange: 'Laranja', yellow: 'Amarelo',
  green: 'Verde', blue: 'Azul', purple: 'Roxo', pink: 'Rosa', red: 'Vermelho',
};
const control = 'rounded border border-[var(--notion-border)] bg-[var(--notion-card)] px-2 py-1';

export function OptionSettings({ databaseId, property }: { databaseId: string; property: DatabaseProperty }) {
  const edit = useNotionEdit();
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const options = property.options ?? [];
  const index = options.findIndex(option => option.id === selected);
  const option = options[index];

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = name.trim();
    if (!next || options.some(item => item.id !== selected && item.name.toLowerCase() === next.toLowerCase())) {
      setError('Informe um nome único.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (option) edit.editOption?.(databaseId, property.id, option.id, { name: next });
      else {
        await edit.createOption(databaseId, property.id, next);
        setName('');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (!edit.editOption) return null;

  return (
    <div className="mt-2 space-y-2 border-t border-[var(--notion-border)] pt-2">
      <label className="grid gap-1">
        {property.type === 'status' ? 'Etapas' : 'Opções'}
        <select className={control} value={selected} onChange={event => {
          const id = event.target.value;
          setSelected(id);
          setName(options.find(item => item.id === id)?.name ?? '');
          setError('');
        }}>
          <option value="">Adicionar opção</option>
          {options.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select>
      </label>
      <form onSubmit={save} className="flex gap-1">
        <input className={`${control} min-w-0 flex-1`} aria-label="Nome da opção" placeholder="Nome da opção"
          value={name} onChange={event => setName(event.target.value)} />
        <button className={control} type="submit" disabled={saving}>{option ? 'Salvar' : 'Adicionar'}</button>
      </form>
      {option && (
        <div className="flex flex-wrap gap-1">
          <select className={control} aria-label="Cor da opção" value={option.color}
            onChange={event => edit.editOption?.(databaseId, property.id, option.id, { color: event.target.value as NotionColor })}>
            {Object.entries(colors).map(([color, label]) => <option key={color} value={color}>{label}</option>)}
          </select>
          <button className={control} disabled={index === 0} onClick={() => edit.editOption?.(databaseId, property.id, option.id, { offset: -1 })} aria-label="Mover opção para antes">↑</button>
          <button className={control} disabled={index === options.length - 1} onClick={() => edit.editOption?.(databaseId, property.id, option.id, { offset: 1 })} aria-label="Mover opção para depois">↓</button>
          <button className={control} onClick={() => {
            if (!window.confirm(`Remover “${option.name}”? Os pedidos com essa opção ficarão com o campo vazio.`)) return;
            edit.removeOption(databaseId, property.id, option.id);
            setSelected('');
            setName('');
          }}>Remover</button>
        </div>
      )}
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </div>
  );
}
