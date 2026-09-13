// Kretsbildning enligt AB § 35: driftsenhet × befattningsgrupp med
// "i huvudsak jämförbara arbetsuppgifter". Kollektivavtalsområde används inte.
//
// Skönsmässigt och därför manuellt: själva gruppindelningen (motivering
// obligatorisk), driftsenhets- och ortsindelningen (inmatning, inte härledning).
// Regelstyrt: kretsar endast där arbetsbrist finns (AD 1993 nr 220),
// sammanläggningens formkrav (≤3 enheter, samma förvaltning, samma ort,
// facklig begäran), enmanskretsflaggan.

export function bildaKretsar({ driftsenheter, grupper, anstallda, arbetsbrist, sammanlaggning = null }) {
  const flaggor = [];
  const kravdaBeslut = [];

  for (const g of grupper) {
    if (!g.motivering || g.motivering.trim() === '') {
      throw new Error(`Befattningsgruppen "${g.id}" saknar motivering. Gruppindelning är ett skönsmässigt beslut som kräver strukturerad motivering.`);
    }
  }

  const enhetPerId = new Map(driftsenheter.map((e) => [e.id, e]));
  const gruppIds = new Set(grupper.map((g) => g.id));

  // Sammanläggningens formkrav (AB: snävare än 22 § 3 st LAS).
  let sammanlagdaEnheter = null;
  if (sammanlaggning) {
    if (!sammanlaggning.begardAvArbetstagarorganisation) {
      throw new Error('Sammanläggning av driftsenheter förutsätter begäran av arbetstagarorganisation.');
    }
    const ids = sammanlaggning.driftsenhetIds;
    if (ids.length > 3) {
      throw new Error('Sammanläggning får omfatta högst tre driftsenheter (AB § 35).');
    }
    const enheter = ids.map((id) => {
      const e = enhetPerId.get(id);
      if (!e) throw new Error(`Okänd driftsenhet i sammanläggning: ${id}`);
      return e;
    });
    const orter = new Set(enheter.map((e) => e.ort));
    if (orter.size > 1) {
      throw new Error(`Sammanläggning kräver att driftsenheterna ligger på samma ort (fann: ${[...orter].join(', ')}).`);
    }
    const forvaltningar = new Set(enheter.map((e) => e.forvaltningId));
    if (forvaltningar.size > 1) {
      throw new Error('Sammanläggning kräver att driftsenheterna tillhör samma förvaltnings verksamhetsområde.');
    }
    sammanlagdaEnheter = new Set(ids);
  }

  // Anställda utan gruppbeslut i berörda enheter → manuellt beslut krävs.
  const berordaEnheter = new Set(arbetsbrist.map((a) => a.driftsenhetId));
  if (sammanlagdaEnheter) for (const id of sammanlagdaEnheter) berordaEnheter.add(id);
  for (const a of anstallda) {
    if (berordaEnheter.has(a.driftsenhetId) && (a.gruppId === null || a.gruppId === undefined)) {
      kravdaBeslut.push({
        typ: 'GRUPPINDELNING_SAKNAS',
        beror: [a.id],
        detalj: `${a.namn} saknar beslut om befattningsgrupp. Motorn placerar aldrig någon i en grupp automatiskt.`,
      });
    } else if (a.gruppId !== null && a.gruppId !== undefined && !gruppIds.has(a.gruppId)) {
      throw new Error(`Anställd ${a.id} hänvisar till okänd grupp ${a.gruppId}.`);
    }
  }

  if (kravdaBeslut.length > 0) {
    return { status: 'KRAVER_MANUELLA_BESLUT', kravdaBeslut, kretsar: [], flaggor };
  }

  // Kretsar endast där arbetsbrist finns.
  const kretsar = [];
  const redanBildade = new Set();
  for (const brist of arbetsbrist) {
    const enhetsIds = sammanlagdaEnheter && sammanlagdaEnheter.has(brist.driftsenhetId)
      ? [...sammanlagdaEnheter]
      : [brist.driftsenhetId];
    const nyckel = `${[...enhetsIds].sort().join('+')}::${brist.gruppId}`;
    if (redanBildade.has(nyckel)) continue;
    redanBildade.add(nyckel);

    const medlemsIds = anstallda
      .filter((a) => enhetsIds.includes(a.driftsenhetId) && a.gruppId === brist.gruppId)
      .map((a) => a.id);

    const krets = {
      id: nyckel,
      driftsenhetIds: enhetsIds,
      gruppId: brist.gruppId,
      antalOvertaliga: brist.antalOvertaliga,
      medlemsIds,
    };
    kretsar.push(krets);

    if (medlemsIds.length === 1) {
      flaggor.push({
        typ: 'ENMANSKRETS_FORSTARKT_MOTIVERING',
        kretsId: krets.id,
        detalj: 'Kretsen omfattar en enda arbetstagare. Praxis kräver att arbetsgivaren övertygande redogör för motiven till snäva kretsar – förstärkt motivering bör dokumenteras.',
      });
    }
  }

  return { status: 'KLAR', kravdaBeslut: [], kretsar, flaggor };
}
