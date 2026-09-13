export interface ImmutableFilePorts {
  // Return null only for an explicit not-found response. Other failures reject.
  read(): Promise<Uint8Array | null>;
  create(): Promise<Uint8Array>;
  write(bytes: Uint8Array): Promise<void>;
}

/** A lost upload acknowledgement must not export another mutable live deck. */
export async function getOrCreateImmutableFile(ports: ImmutableFilePorts): Promise<Uint8Array> {
  const existing = await ports.read();
  if (existing) return existing;
  const generated = await ports.create();
  let writeError: unknown;
  try { await ports.write(generated); } catch (error) { writeError = error; }
  const persisted = await ports.read();
  if (!persisted) throw writeError ?? new Error('Arquivo não confirmado no Storage.');
  if (persisted.length !== generated.length || persisted.some((byte, index) => byte !== generated[index])) {
    throw new Error('Arquivo imutável diverge dos bytes enviados.');
  }
  return persisted;
}
