import test, { after } from "node:test";
import assert from "node:assert/strict";

import { buscarMunicipios, buscarUfs } from "../src/lib/ibge.ts";

const fetchOriginal = globalThis.fetch;
let chamadas: string[] = [];

globalThis.fetch = (async (input: string | URL | Request) => {
  const url = String(input);
  chamadas.push(url);

  if (url.includes("/estados?orderBy=nome")) {
    return new Response(JSON.stringify([{ id: 33, sigla: "RJ", nome: "Rio de Janeiro" }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (url.includes("/estados/SP/municipios")) {
    return new Response(
      JSON.stringify([
        { id: 3550308, nome: "São Paulo", microrregiao: { id: 1 } },
        { id: 3509502, nome: "Campinas", microrregiao: { id: 2 } },
      ]),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }

  if (url.includes("/estados/ZZ/municipios")) {
    return new Response("indisponível", { status: 503 });
  }

  return new Response("não encontrado", { status: 404 });
}) as typeof fetch;

after(() => {
  globalThis.fetch = fetchOriginal;
});

test("UFs são carregadas uma única vez e reutilizadas em memória", async () => {
  chamadas = [];
  const primeira = await buscarUfs();
  const segunda = await buscarUfs();

  assert.deepEqual(primeira, [{ id: 33, sigla: "RJ", nome: "Rio de Janeiro" }]);
  assert.equal(segunda, primeira);
  assert.equal(chamadas.filter((url) => url.includes("/estados?orderBy=nome")).length, 1);
});

test("municípios são normalizados por UF e reutilizados em cache", async () => {
  chamadas = [];
  const primeira = await buscarMunicipios("sp");
  const segunda = await buscarMunicipios(" SP ");

  assert.deepEqual(primeira, [
    { id: 3550308, nome: "São Paulo" },
    { id: 3509502, nome: "Campinas" },
  ]);
  assert.equal(segunda, primeira);
  assert.equal(chamadas.filter((url) => url.includes("/estados/SP/municipios")).length, 1);
});

test("falha HTTP do IBGE é explícita e não vira lista oficial vazia", async () => {
  await assert.rejects(() => buscarMunicipios("ZZ"), /Não foi possível carregar os municípios/);
});
