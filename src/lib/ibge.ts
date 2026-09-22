export interface Uf {
  id: number;
  sigla: string;
  nome: string;
}

export interface Municipio {
  id: number;
  nome: string;
}

const BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
let cacheUfs: Uf[] | null = null;
const cacheMunicipios = new Map<string, Municipio[]>();

export async function buscarUfs(): Promise<Uf[]> {
  if (cacheUfs) return cacheUfs;

  const r = await fetch(`${BASE}/estados?orderBy=nome`);
  if (!r.ok) throw new Error("Não foi possível carregar os estados");

  cacheUfs = (await r.json()) as Uf[];
  return cacheUfs;
}

export async function buscarMunicipios(uf: string): Promise<Municipio[]> {
  const chave = uf.trim().toUpperCase();
  const emCache = cacheMunicipios.get(chave);
  if (emCache) return emCache;

  const r = await fetch(`${BASE}/estados/${encodeURIComponent(chave)}/municipios?orderBy=nome`);
  if (!r.ok) throw new Error("Não foi possível carregar os municípios");

  const dados = (await r.json()) as Municipio[];
  const municipios = dados.map((m) => ({ id: m.id, nome: m.nome }));
  cacheMunicipios.set(chave, municipios);
  return municipios;
}
