/* eslint-disable prettier/prettier -- preserve Lovable-generated route formatting; avoid a whole-file cosmetic diff */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, FileDown, Info, Loader2, Plus, RefreshCw, Search, School, Trash2 } from "lucide-react";

import pdfFontUrl from "@/assets/DejaVuSans.ttf?url";
import capitalLogo from "@/assets/capital-consultoria-logo.jpg.asset.json";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { consultarEscolaPorInep, type EscolaInep } from "@/lib/escola.functions";
import {
  ANO_REFERENCIA, anoBaseDoPrograma, brl, calcularFator, calcularRepassePrograma, COMBINACOES, type Etapa,
  fatorFmt, mesesDeFuncionamento, type Modalidade, numeroFmt, parametrosFundebPorAno, type Turno, VAAF_NACIONAL_2026,
} from "@/lib/fnde";
import { buscarMunicipios, buscarUfs, type Municipio, type Uf } from "@/lib/ibge";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Calculadora de Repasse FNDE — Turmas e Estabelecimentos" },
    { name: "description", content: "Simule repasses do Fundeb para novas turmas e novos estabelecimentos, com VAAF oficial e relatório PDF." },
    { property: "og:title", content: "Calculadora de Repasse FNDE — Turmas e Estabelecimentos" },
    { property: "og:description", content: "Calculadora do Fundeb com municípios do Brasil, valores oficiais e relatório detalhado." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

type Modo = "turmas" | "estabelecimentos";
interface Turma { id: number; etapa: Etapa; turno: Turno; dataInicio: string; regular: boolean; especial: boolean; alunosRegulares: number; alunosEspeciais: number }
type Quantidades = Record<string, number>;
type Resultado = { chave: string; etapa: Etapa; turno: Turno; modalidade: Modalidade; dataInicio: string; fator: number; alunos: number; meses: number; valorAnual: number; repasse: number };

const campo = "w-full rounded-md border border-ink/10 bg-background px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink/35";
const campoErro = "border-destructive/60 focus:border-destructive focus:ring-destructive/15";
const quantidadesIniciais = Object.fromEntries(COMBINACOES.map((c) => [c.chave, 0]));
const novaTurma = (id: number): Turma => ({ id, etapa: "Creche", turno: "Integral", dataInicio: "", regular: true, especial: false, alunosRegulares: 0, alunosEspeciais: 0 });
const paresEstabelecimento = COMBINACOES.filter((c) => c.modalidade === "Regular").map((regular) => ({ regular, especial: COMBINACOES.find((c) => c.modalidade === "Educação Especial" && c.etapa === regular.etapa && c.turno === regular.turno) }));

function Index() {
  const [modo, setModo] = useState<Modo>("turmas");
  const [ufs, setUfs] = useState<Uf[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [uf, setUf] = useState("");
  const [municipioId, setMunicipioId] = useState("");
  const [carregandoLocalidades, setCarregandoLocalidades] = useState(true);
  const [vaaf, setVaaf] = useState(VAAF_NACIONAL_2026);
  const [fonteVaaf, setFonteVaaf] = useState("FNDE · parâmetros oficiais do Fundeb");
  const [dataCadastro, setDataCadastro] = useState("");
  const [dataInicioEstabelecimento, setDataInicioEstabelecimento] = useState("");
  const [turmas, setTurmas] = useState<Turma[]>([novaTurma(1)]);
  const [nextId, setNextId] = useState(2);
  const [quantidades, setQuantidades] = useState<Quantidades>(quantidadesIniciais);
  const [inep, setInep] = useState("");
  const [escola, setEscola] = useState<EscolaInep | null>(null);
  const [erroInep, setErroInep] = useState("");
  const [buscandoEscola, setBuscandoEscola] = useState(false);
  const [exportando, setExportando] = useState(false);
  const consultarEscola = useServerFn(consultarEscolaPorInep);

  useEffect(() => { setDataCadastro(new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })); }, []);
  useEffect(() => { buscarUfs().then(setUfs).catch(() => setUfs([])).finally(() => setCarregandoLocalidades(false)); }, []);
  useEffect(() => {
    if (!uf) { setMunicipios([]); setMunicipioId(""); return; }
    let ativo = true;
    setCarregandoLocalidades(true);
    buscarMunicipios(uf)
      .then((lista) => { if (ativo) setMunicipios(lista); })
      .catch(() => { if (ativo) setMunicipios([]); })
      .finally(() => { if (ativo) setCarregandoLocalidades(false); });
    return () => { ativo = false; };
  }, [uf]);

  async function buscarEscola() {
    setEscola(null); setErroInep("");
    if (!/^\d{8}$/.test(inep)) { setErroInep("Informe os 8 números do código INEP."); return; }
    setBuscandoEscola(true);
    try {
      const resultado = await consultarEscola({ data: { inep } });
      if (!resultado) setErroInep("Código ainda não encontrado na base. O cálculo pode continuar normalmente.");
      else setEscola(resultado);
    } catch { setErroInep("Não foi possível consultar a escola agora. O cálculo pode continuar normalmente."); }
    finally { setBuscandoEscola(false); }
  }

  const municipio = municipios.find((m) => String(m.id) === municipioId)?.nome ?? "Não selecionado";
  const dataCadastroValida = /^\d{4}-\d{2}-\d{2}$/.test(dataCadastro);
  const anoBaseAtual = modo === "estabelecimentos" && dataInicioEstabelecimento && dataCadastroValida
    ? anoBaseDoPrograma("estabelecimentos", dataInicioEstabelecimento, dataCadastro) ?? ANO_REFERENCIA
    : Number(dataCadastro.slice(0, 4)) || ANO_REFERENCIA;
  const parametrosOficiais = parametrosFundebPorAno(anoBaseAtual);
  const vaafValido = Number.isFinite(vaaf) && vaaf > 0;
  const dataPosteriorAoCadastro = useCallback((inicio: string) => Boolean(inicio && dataCadastroValida && inicio > dataCadastro), [dataCadastro, dataCadastroValida]);

  function restaurarVaafOficial() {
    if (!parametrosOficiais) return;
    setVaaf(parametrosOficiais.vaafMin);
    setFonteVaaf(`${parametrosOficiais.fonte} · ${parametrosOficiais.ato}`);
  }

  useEffect(() => {
    if (!dataCadastro) return;
    if (!parametrosOficiais) {
      setVaaf(0);
      setFonteVaaf(`Não há parâmetros oficiais cadastrados para o Fundeb ${anoBaseAtual}.`);
      return;
    }
    setVaaf(parametrosOficiais.vaafMin);
    setFonteVaaf(`${parametrosOficiais.fonte} · ${parametrosOficiais.ato}`);
  }, [anoBaseAtual, dataCadastro, parametrosOficiais]);

  const errosGerais = [!uf ? "Selecione o estado." : "", !municipioId ? "Selecione o município." : "", !dataCadastroValida ? "Informe a data de registro/envio no Simec." : "", !parametrosOficiais ? `Não há parâmetros oficiais cadastrados para o Fundeb ${anoBaseAtual}.` : "", parametrosOficiais && !vaafValido ? "Informe um VAAF maior que zero." : ""].filter(Boolean);
  const errosTurmas = turmas.flatMap((t, i) => {
    const erros: string[] = [];
    if (!t.dataInicio) erros.push(`Turma ${i + 1}: informe a data de início.`);
    else if (dataPosteriorAoCadastro(t.dataInicio)) erros.push(`Turma ${i + 1}: a data de início não pode ser posterior ao registro/envio no Simec.`);
    else if (dataCadastroValida && mesesDeFuncionamento(t.dataInicio, dataCadastro) <= 0) erros.push(`Turma ${i + 1}: o prazo máximo de 18 meses já terminou.`);
    if (!t.regular) erros.push(`Turma ${i + 1}: marque Regular, pois os alunos especiais fazem parte do total regular.`);
    if (t.regular && t.alunosRegulares <= 0) erros.push(`Turma ${i + 1}: informe a quantidade de alunos regulares.`);
    if (t.especial && t.alunosEspeciais <= 0) erros.push(`Turma ${i + 1}: informe a quantidade de alunos especiais.`);
    if (t.especial && t.alunosEspeciais > t.alunosRegulares) erros.push(`Turma ${i + 1}: alunos especiais não podem superar o total de alunos regulares.`);
    return erros;
  });
  const errosQuantidadesEstabelecimento = paresEstabelecimento.flatMap(({ regular, especial }) => {
    const total = quantidades[regular.chave] ?? 0;
    const especiais = especial ? quantidades[especial.chave] ?? 0 : 0;
    return especiais > total ? [`${regular.etapa} ${regular.turno}: alunos especiais não podem superar o total regular.`] : [];
  });
  const errosEstabelecimento = [!dataInicioEstabelecimento ? "Informe a data de início do estabelecimento." : "", dataPosteriorAoCadastro(dataInicioEstabelecimento) ? "A data de início do estabelecimento não pode ser posterior ao registro/envio no Simec." : "", dataInicioEstabelecimento && dataCadastroValida && !dataPosteriorAoCadastro(dataInicioEstabelecimento) && mesesDeFuncionamento(dataInicioEstabelecimento, dataCadastro) <= 0 ? "O prazo máximo de 18 meses do estabelecimento já terminou." : "", paresEstabelecimento.every(({ regular }) => (quantidades[regular.chave] ?? 0) <= 0) ? "Informe ao menos uma matrícula regular." : "", ...errosQuantidadesEstabelecimento].filter(Boolean);
  const avisos = [...errosGerais, ...(modo === "turmas" ? errosTurmas : errosEstabelecimento)];
  const dadosValidos = avisos.length === 0;

  const resultadosTurmas = useMemo<Resultado[]>(() => turmas.flatMap((t) => {
    if (!t.dataInicio || !dataCadastroValida || dataPosteriorAoCadastro(t.dataInicio) || !parametrosOficiais) return [];
    if (!t.regular || t.alunosRegulares <= 0) return [];
    const modalidade: Modalidade = "Regular";
    const calculo = calcularRepassePrograma({ programa: "turmas", dataInicio: t.dataInicio, dataRegistroSimec: dataCadastro, etapa: t.etapa, turno: t.turno, alunos: t.alunosRegulares, vaafInformado: vaaf });
    if (!calculo) return [];
    return [{ chave: `${t.id}-regular`, etapa: t.etapa, turno: t.turno, modalidade, dataInicio: t.dataInicio, fator: calculo.fator, alunos: t.alunosRegulares, meses: calculo.meses, valorAnual: calculo.valorAnual, repasse: calculo.repasse }];
  }), [turmas, vaaf, dataCadastro, dataCadastroValida, dataPosteriorAoCadastro, parametrosOficiais]);
  const mesesEstabelecimento = dataInicioEstabelecimento && dataCadastroValida && !dataPosteriorAoCadastro(dataInicioEstabelecimento) ? mesesDeFuncionamento(dataInicioEstabelecimento, dataCadastro) : 0;
  const resultadosEstabelecimento = useMemo<Resultado[]>(() => paresEstabelecimento.flatMap(({ regular }) => {
    if (!parametrosOficiais) return [];
    const total = quantidades[regular.chave] ?? 0;
    if (total <= 0) return [];
    const calculo = calcularRepassePrograma({ programa: "estabelecimentos", dataInicio: dataInicioEstabelecimento, dataRegistroSimec: dataCadastro, etapa: regular.etapa, turno: regular.turno, alunos: total, vaafInformado: vaaf });
    if (!calculo) return [];
    return [{ chave: regular.chave, etapa: regular.etapa, turno: regular.turno, modalidade: regular.modalidade, dataInicio: dataInicioEstabelecimento, fator: calculo.fator, alunos: total, meses: calculo.meses, valorAnual: calculo.valorAnual, repasse: calculo.repasse }];
  }), [quantidades, vaaf, dataCadastro, dataInicioEstabelecimento, parametrosOficiais]);
  const resultados = dadosValidos ? (modo === "turmas" ? resultadosTurmas : resultadosEstabelecimento) : [];
  const totalAlunos = resultados.reduce((s, r) => s + r.alunos, 0);
  const totalAnual = resultados.reduce((s, r) => s + r.valorAnual, 0);
  const totalRepasse = resultados.reduce((s, r) => s + r.repasse, 0);

  function atualizarTurma<K extends keyof Turma>(id: number, chave: K, valor: Turma[K]) { setTurmas((lista) => lista.map((t) => t.id === id ? { ...t, [chave]: valor } : t)); }
  function alternarModalidade(id: number, chave: "regular" | "especial", ativo: boolean) {
    setTurmas((lista) => lista.map((t) => t.id === id ? { ...t, [chave]: ativo, ...(ativo ? {} : chave === "regular" ? { alunosRegulares: 0 } : { alunosEspeciais: 0 }) } : t));
  }

  async function exportarPdf() {
    if (!dadosValidos) return;
    setExportando(true);
    try {
      const [{ jsPDF }, autoTableModule, fonte, logo] = await Promise.all([import("jspdf"), import("jspdf-autotable"), fetch(pdfFontUrl).then((r) => r.arrayBuffer()), fetch(capitalLogo.url).then((r) => r.arrayBuffer())]);
      const doc = new jsPDF(); let binario = ""; const bytes = new Uint8Array(fonte);
      for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      doc.addFileToVFS("DejaVuSans.ttf", btoa(binario)); doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal"); doc.setFont("DejaVuSans");
      const tituloRelatorio = modo === "turmas" ? "Relatório Novas Turmas" : "Relatório Novos Estabelecimentos";
      doc.setFillColor(28, 75, 145); doc.rect(0, 0, 210, 34, "F"); doc.setFillColor(255, 255, 255); doc.roundedRect(10, 5, 56, 23, 1.5, 1.5, "F"); doc.addImage(new Uint8Array(logo), "JPEG", 12, 8, 52, 16.6);
      doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.text(tituloRelatorio, 72, 16);
      doc.setFontSize(9); doc.text("Programa de Repasse FNDE", 72, 24); doc.setTextColor(25, 34, 53); doc.setFontSize(10);
      doc.text(`Município: ${municipio} / ${uf}`, 14, 44); doc.text(`VAAF base: ${brl(vaaf)}`, 14, 51); doc.text(`Fonte: ${fonteVaaf}`, 14, 58, { maxWidth: 182 });
      let inicioTabela = 68;
       doc.text(`Registro/envio no Simec: ${formatarData(dataCadastro)}`, 14, 65);
       inicioTabela = 74;
        if (modo === "estabelecimentos") { doc.text(escola ? `Escola: ${escola.nome} · INEP ${inep}` : `INEP: ${inep || "não informado / aguardando cadastro"}`, 14, 72, { maxWidth: 182 }); doc.text(`Início: ${formatarData(dataInicioEstabelecimento)} · Meses considerados: ${mesesEstabelecimento}`, 14, 79); inicioTabela = 87; }
       const linhas = resultados.map((r) => [`${r.etapa} / ${r.turno}`, r.modalidade === "Educação Especial" ? "Especial" : "Regular", formatarData(r.dataInicio), String(r.meses), fatorFmt(r.fator), String(r.alunos), brl(r.valorAnual), brl(r.repasse)]);
       autoTableModule.default(doc, { startY: inicioTabela, head: [["Etapa / Turno", "Modalidade", "Início", "Meses", "Fator", "Alunos", "Valor anual", "Repasse"]], body: linhas, foot: [["TOTAL", "", "", "", "", String(totalAlunos), brl(totalAnual), brl(totalRepasse)]], styles: { font: "DejaVuSans", fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [28, 75, 145] }, footStyles: { fillColor: [230, 238, 249], textColor: [25, 34, 53], fontStyle: "bold" } });
      const finalY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100; doc.setFontSize(8); doc.setTextColor(90, 99, 116); doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} · Valores estimativos sujeitos à validação pelo FNDE.`, 14, finalY + 10);
      const tipoArquivo = modo === "turmas" ? "novas-turmas" : "novos-estabelecimentos";
      doc.save(`relatorio-${tipoArquivo}-${municipio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}.pdf`);
    } finally { setExportando(false); }
  }

  return <main className="bg-civic-mesh min-h-screen text-ink"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-7 sm:py-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-md bg-brand font-display font-bold text-primary-foreground shadow-sm">FDE</div><div><h1 className="font-display text-lg font-bold">Calculadora de Repasse FNDE</h1><p className="text-xs text-ink/55">Novas Turmas e Novos Estabelecimentos</p></div></div><div className="flex items-center gap-2"><span className="hidden rounded-full border border-special/25 bg-background/80 px-3 py-2 text-xs font-semibold text-special sm:inline">FUNDEB · {anoBaseAtual}</span><Button onClick={exportarPdf} disabled={exportando || !dadosValidos || resultados.length === 0} className="bg-brand text-primary-foreground hover:bg-brand-deep">{exportando ? <Loader2 className="animate-spin" /> : <FileDown />} Exportar PDF</Button></div></header>
    <nav className="mt-7 grid max-w-xl grid-cols-1 rounded-lg border border-ink/10 bg-background/75 p-1 shadow-sm sm:grid-cols-2" aria-label="Tipo de cálculo"><Button variant="ghost" onClick={() => setModo("turmas")} className={modo === "turmas" ? "bg-brand text-primary-foreground hover:bg-brand hover:text-primary-foreground" : "text-ink/60"}><School /> Novas Turmas</Button><Button variant="ghost" onClick={() => setModo("estabelecimentos")} className={modo === "estabelecimentos" ? "bg-brand text-primary-foreground hover:bg-brand hover:text-primary-foreground" : "text-ink/60"}><Building2 /> Novos Estabelecimentos</Button></nav>

    <section className="mt-5 border-y border-ink/8 bg-background/75 px-4 py-5 shadow-sm sm:px-6"><SectionTitle numero="1" titulo="Localidade, registro e valor de referência" /><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Estado (UF)" required><select aria-invalid={!uf} className={`${campo} ${!uf ? campoErro : ""}`} value={uf} onChange={(e) => setUf(e.target.value)}><option value="">Selecione</option>{ufs.map((u) => <option key={u.id} value={u.sigla}>{u.nome}</option>)}</select></Field>
      <Field label="Município" required><select aria-invalid={!municipioId} className={`${campo} ${!municipioId ? campoErro : ""}`} value={municipioId} onChange={(e) => setMunicipioId(e.target.value)} disabled={!uf || carregandoLocalidades}><option value="">{carregandoLocalidades && uf ? "Carregando..." : "Selecione"}</option>{municipios.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></Field>
      <Field label="Data de registro/envio no Simec" required><input aria-invalid={!dataCadastroValida} className={`${campo} ${!dataCadastroValida ? campoErro : ""}`} type="date" value={dataCadastro} onChange={(e) => setDataCadastro(e.target.value)} /></Field>
      <Field label="VAAF Base do FUNDEB (R$)" required><div className="flex gap-2"><input aria-invalid={!vaafValido} className={`${campo} ${!vaafValido ? campoErro : ""}`} type="number" min="0.01" step="0.01" value={vaaf || ""} onChange={(e) => { setVaaf(Number(e.target.value)); setFonteVaaf("Valor informado manualmente pelo usuário."); }} /><Button variant="outline" size="icon" onClick={restaurarVaafOficial} disabled={!parametrosOficiais} title="Restaurar valor oficial"><RefreshCw /></Button></div></Field>
    </div><p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-ink/50"><Info className="mt-0.5 size-3.5 shrink-0" />{fonteVaaf}</p></section>

    {modo === "turmas" ? <section className="mt-5 bg-background p-5 shadow-sm ring-1 ring-ink/5 sm:p-6"><SectionTitle numero="2" titulo="Matrículas aprovadas"><Button size="sm" onClick={() => { setTurmas((v) => [...v, novaTurma(nextId)]); setNextId((v) => v + 1); }} className="bg-brand text-primary-foreground hover:bg-brand-deep"><Plus /> Nova turma</Button></SectionTitle><div className="mt-5 space-y-4">{turmas.map((t, i) => <article key={t.id} className="border-b border-ink/10 pb-5 last:border-0 last:pb-0"><div className="mb-3 flex items-center justify-between"><h3 className="font-display text-sm font-bold">Turma {i + 1}</h3><Button variant="ghost" size="icon" onClick={() => setTurmas((v) => v.filter((x) => x.id !== t.id))} disabled={turmas.length === 1} className="text-destructive" title="Remover turma"><Trash2 /></Button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Etapa" required><select className={campo} value={t.etapa} onChange={(e) => atualizarTurma(t.id, "etapa", e.target.value as Etapa)}><option>Creche</option><option>Pré-escola</option></select></Field>
      <Field label="Turno" required><select className={campo} value={t.turno} onChange={(e) => atualizarTurma(t.id, "turno", e.target.value as Turno)}><option>Integral</option><option>Parcial</option></select></Field>
       <Field label="Data de início" required><input aria-invalid={!t.dataInicio || dataPosteriorAoCadastro(t.dataInicio)} className={`${campo} ${!t.dataInicio || dataPosteriorAoCadastro(t.dataInicio) ? campoErro : ""}`} type="date" value={t.dataInicio} onChange={(e) => atualizarTurma(t.id, "dataInicio", e.target.value)} /></Field>
    </div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ModalidadeTurma label="Regular" descricao="Total de alunos da turma, incluindo os especiais" checked={t.regular} alunos={t.alunosRegulares} erro={t.regular && t.alunosRegulares <= 0} onChecked={(v) => alternarModalidade(t.id, "regular", v)} onAlunos={(v) => atualizarTurma(t.id, "alunosRegulares", v)} /><ModalidadeTurma label="Especial" descricao="Alunos especiais que já estão incluídos no total regular" checked={t.especial} alunos={t.alunosEspeciais} erro={t.especial && (t.alunosEspeciais <= 0 || t.alunosEspeciais > t.alunosRegulares)} onChecked={(v) => alternarModalidade(t.id, "especial", v)} onAlunos={(v) => atualizarTurma(t.id, "alunosEspeciais", v)} /></div>{t.dataInicio && dataCadastroValida && !dataPosteriorAoCadastro(t.dataInicio) && <p className="mt-3 text-xs font-semibold text-brand-deep">Meses considerados: {mesesDeFuncionamento(t.dataInicio, dataCadastro)} meses</p>}</article>)}</div></section> :
    <section className="mt-5 bg-background p-5 shadow-sm ring-1 ring-ink/5 sm:p-6"><SectionTitle numero="2" titulo="Identificação e matrículas do estabelecimento" /><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Código INEP (opcional)"><div className="flex gap-2"><input aria-invalid={Boolean(erroInep)} className={`${campo} ${erroInep ? campoErro : ""}`} inputMode="numeric" maxLength={8} placeholder="Se já disponível" value={inep} onChange={(e) => { setInep(e.target.value.replace(/\D/g, "").slice(0, 8)); setEscola(null); setErroInep(""); }} onKeyDown={(e) => { if (e.key === "Enter" && inep.length === 8) void buscarEscola(); }} /><Button variant="outline" size="icon" onClick={buscarEscola} disabled={buscandoEscola || inep.length !== 8} title="Consultar escola">{buscandoEscola ? <Loader2 className="animate-spin" /> : <Search />}</Button></div>{erroInep && <p className="mt-1.5 text-xs text-ink/55">{erroInep}</p>}<p className="mt-1.5 text-xs text-ink/45">Novos estabelecimentos podem ainda não constar na base do INEP.</p></Field>
       <Field label="Data de início" required><input aria-invalid={!dataInicioEstabelecimento || dataPosteriorAoCadastro(dataInicioEstabelecimento)} className={`${campo} ${!dataInicioEstabelecimento || dataPosteriorAoCadastro(dataInicioEstabelecimento) ? campoErro : ""}`} type="date" value={dataInicioEstabelecimento} onChange={(e) => setDataInicioEstabelecimento(e.target.value)} /></Field>
        <Field label="Meses considerados"><div className="flex h-[42px] items-center rounded-md bg-brand/8 px-3 font-display font-bold text-brand-deep">{!dataInicioEstabelecimento || !dataCadastroValida || dataPosteriorAoCadastro(dataInicioEstabelecimento) ? "—" : `${mesesEstabelecimento} meses`}</div></Field>
    </div>{escola && <div className="mt-4 flex items-start gap-3 border-l-4 border-special bg-special/8 px-4 py-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-special" /><div><p className="font-semibold">{escola.nome}</p><p className="text-xs text-ink/55">{escola.municipio}/{escola.uf} · {escola.situacao} · {escola.fonte}</p>{(escola.uf !== uf || String(municipios.find((m) => m.nome === escola.municipio)?.id ?? "") !== municipioId) && <p className="mt-1 text-xs font-semibold text-destructive">A localização da escola não corresponde ao município selecionado.</p>}</div></div>}
    <p className="mt-6 text-sm text-ink/55">Em Regular, informe o total de alunos. Em Especial, informe somente quantos desse total são especiais; essa marcação não cria uma matrícula nem um valor adicional.</p><div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">{COMBINACOES.map((c) => <label key={c.chave} className="flex items-center justify-between gap-4 border-b border-ink/8 pb-3"><span className="text-sm font-medium">{c.rotulo}<small className="mt-0.5 block text-ink/45">{c.modalidade === "Regular" ? "Total, incluindo especiais" : "Parte do total regular"} · Fator {parametrosOficiais ? fatorFmt(calcularFator(c.etapa, c.turno, c.modalidade, anoBaseAtual)) : "—"}</small></span><input className={`${campo} w-24 text-right font-semibold tabular-nums`} type="number" min="0" value={quantidades[c.chave] || ""} placeholder="0" onChange={(e) => setQuantidades((q) => ({ ...q, [c.chave]: Math.max(0, Number(e.target.value) || 0) }))} /></label>)}</div></section>}

    {avisos.length > 0 && <Alert variant="destructive" className="mt-5 bg-background"><AlertCircle /><AlertTitle>Revise os dados antes do cálculo</AlertTitle><AlertDescription><ul className="mt-2 list-disc space-y-1 pl-4">{avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}</ul></AlertDescription></Alert>}
    <section className="mt-5 bg-gradient-to-r from-brand to-brand-deep p-5 text-primary-foreground shadow-sm sm:p-7"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase text-primary-foreground/70">Valor total do repasse previsto</p><p className="mt-2 font-display text-3xl font-bold tabular-nums sm:text-5xl">{dadosValidos ? brl(totalRepasse) : "Aguardando dados"}</p></div><div className="flex gap-6 text-right"><Stat label="Matrículas" valor={totalAlunos} /><Stat label={modo === "turmas" ? "Turmas" : "Categorias"} valor={modo === "turmas" ? turmas.length : resultados.length} /></div></div></section>
    <section className="mt-5 overflow-hidden bg-background shadow-sm ring-1 ring-ink/5"><div className="flex items-center gap-2 border-b border-ink/8 px-5 py-4"><span className="grid size-6 place-items-center rounded-md bg-brand/10 text-xs font-bold text-brand">3</span><h2 className="font-display text-sm font-bold uppercase">Resultado detalhado</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead><tr className="border-b border-ink/8 text-left text-[11px] uppercase text-ink/50"><th className="px-5 py-3">Etapa / turno</th><th className="px-4 py-3">Modalidade</th><th className="px-4 py-3">Meses</th><th className="px-4 py-3">Fator</th><th className="px-4 py-3 text-right">Alunos</th><th className="px-4 py-3 text-right">Valor anual</th><th className="px-5 py-3 text-right">Repasse proporcional</th></tr></thead><tbody className="divide-y divide-ink/5">{resultados.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-ink/45">Preencha e revise os campos obrigatórios para calcular.</td></tr> : resultados.map((r) => <tr key={r.chave}><td className="px-5 py-3.5 font-medium">{r.etapa} · {r.turno}</td><td className="px-4 py-3.5 text-ink/65">{r.modalidade}</td><td className="px-4 py-3.5">{r.meses}</td><td className="px-4 py-3.5"><span className={`rounded px-2 py-1 text-xs font-bold ${r.modalidade === "Educação Especial" ? "bg-special/12 text-special" : "bg-brand/10 text-brand"}`}>{fatorFmt(r.fator)}</span></td><td className="px-4 py-3.5 text-right font-semibold">{r.alunos}</td><td className="px-4 py-3.5 text-right tabular-nums">{brl(r.valorAnual)}</td><td className="px-5 py-3.5 text-right font-display font-bold tabular-nums">{brl(r.repasse)}</td></tr>)}</tbody>{resultados.length > 0 && <tfoot><tr className="border-t-2 border-ink/10 bg-canvas/50 font-bold"><td className="px-5 py-4" colSpan={4}>Total geral</td><td className="px-4 py-4 text-right">{totalAlunos}</td><td className="px-4 py-4 text-right tabular-nums">{brl(totalAnual)}</td><td className="px-5 py-4 text-right font-display text-brand-deep tabular-nums">{brl(totalRepasse)}</td></tr></tfoot>}</table></div></section>
    <footer className="py-6 text-center text-[11px] text-ink/40">Cálculo: valor anual por aluno publicado pelo Fundeb ÷ 12 × meses elegíveis, até o limite de 18 meses. Alunos especiais não são contados em duplicidade.</footer>
  </div></main>;
}

function ModalidadeTurma({ label, descricao, checked, alunos, erro, onChecked, onAlunos }: { label: string; descricao: string; checked: boolean; alunos: number; erro: boolean; onChecked: (v: boolean) => void; onAlunos: (v: number) => void }) { return <div className={`rounded-md border p-3 ${checked ? "border-brand/25 bg-brand/5" : "border-ink/10"}`}><label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><Checkbox checked={checked} onCheckedChange={(v) => onChecked(v === true)} />{label}</label><p className="mt-1 text-xs text-ink/50">{descricao}</p><label className="mt-3 block"><span className="mb-1.5 block text-xs text-ink/60">Quantidade de alunos {label.toLowerCase()}</span><input aria-invalid={erro} className={`${campo} ${erro ? campoErro : ""}`} type="number" min="0" disabled={!checked} value={alunos || ""} placeholder="0" onChange={(e) => onAlunos(Math.max(0, Number(e.target.value) || 0))} /></label></div>; }
function formatarData(data: string): string { const [ano, mes, dia] = data.split("-"); return ano && mes && dia ? `${dia}/${mes}/${ano}` : "Não informada"; }
function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink/65">{label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}</span>{children}</label>; }
function SectionTitle({ numero, titulo, children }: { numero: string; titulo: string; children?: React.ReactNode }) { return <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-brand/10 text-xs font-bold text-brand">{numero}</span><h2 className="font-display text-sm font-bold uppercase">{titulo}</h2></div>{children}</div>; }
function Stat({ label, valor }: { label: string; valor: number }) { return <div><p className="text-[11px] text-primary-foreground/60">{label}</p><p className="font-display text-lg font-bold">{numeroFmt(valor).replace(",00", "")}</p></div>; }
