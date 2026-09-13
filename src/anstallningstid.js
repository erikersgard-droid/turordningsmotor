// Sammanlagd anställningstid (3 § LAS-logik, tillämpad i AB-kontext).
//
// Principer som avsiktligt saknar undantag i koden:
//  - Avtalad inskränkning av tid är en SLUTEN UPPRÄKNING, inte ett fritt
//    avdragsfält. Endast avvikelser som är belagda i primärkälla får
//    förekomma. Hittills en enda: RiB-tid (AB 25 § 35 mom. 1 anm. 3).
//    22 § är semidispositiv (2 § LAS), så fler avvikelser KAN finnas i
//    andra avtal – de ska beläggas innan de kodas. Se FLAGGOR.md p. 5 och 10.
//  - Sysselsättningsgrad ignoreras: kalenderdagar räknas lika för alla.

export const TILLGODORAKNANDE = Object.freeze({
  SAMMA_ARBETSGIVARE: 'SAMMA_ARBETSGIVARE',
  KONCERNBYTE: 'KONCERNBYTE', // 3 § 1 st 1 p LAS
  VERKSAMHETSOVERGANG: 'VERKSAMHETSOVERGANG', // 3 § 1 st 2 p LAS
});

/**
 * Avtalade inskränkningar av tillgodoräknandebar tid.
 *
 * Sluten uppräkning. Ett värde får läggas till först när inskränkningen är
 * belagd i primärkälla (avtalstext eller partsgemensam kommentar).
 *
 * RIB: AB 25 § 35 mom. 1 anmärkning 3 – anställningstid intjänad enligt
 * kollektivavtalet RiB tillgodoräknas inte tidsmässigt vid tillämpning av
 * 22 § LAS. Enligt kommentaren (s. 177) avser regeln arbetstagare som har
 * anställning som beredskapsbrandman enligt RiB och samtidigt har sin
 * huvudanställning hos samma arbetsgivare. Motsvarande gäller vid 25 § LAS
 * enligt mom. 4 a). Anställningstiden tillgodoräknas i övrigt enligt LAS.
 */
export const AVTALAD_INSKRANKNING = Object.freeze({
  RIB: 'RIB',
});

const DAG_MS = 24 * 60 * 60 * 1000;

function tillUtc(iso) {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) throw new Error(`Ogiltigt datum: ${iso}`);
  return t;
}

/**
 * @param {Array<{fran: string, till: string|null, grund: string}>} perioder
 * @param {string} berakningsdatum ISO-datum (brytdatum; pågående perioder räknas t.o.m. detta)
 * @returns {{dagar: number, flaggor: Array<{typ: string, detalj?: string}>}}
 */
export function beraknaAnstallningstid(perioder, berakningsdatum) {
  const bryt = tillUtc(berakningsdatum);
  const flaggor = [];

  const intervall = [];
  const inskrankta = [];
  let harOinskranktPeriod = false;

  for (const p of perioder) {
    if (!Object.values(TILLGODORAKNANDE).includes(p.grund)) {
      throw new Error(`Okänd tillgodoräknandegrund: ${p.grund}`);
    }
    const inskrankning = p.inskrankning ?? null;
    if (inskrankning !== null && !Object.values(AVTALAD_INSKRANKNING).includes(inskrankning)) {
      throw new Error(
        `Okänd avtalad inskränkning: ${inskrankning}. Uppräkningen är sluten – ` +
          'en inskränkning får läggas till först när den är belagd i primärkälla.',
      );
    }
    const fran = tillUtc(p.fran);
    const till = p.till === null || p.till === undefined ? bryt : tillUtc(p.till);
    if (p.till !== null && p.till !== undefined && till < fran) {
      throw new Error(`Ogiltig period: till (${p.till}) ligger före från (${p.fran})`);
    }
    if (fran > bryt) {
      flaggor.push({ typ: 'PERIOD_EFTER_BRYTDATUM', detalj: `Period från ${p.fran} börjar efter beräkningsdatumet och ger 0 dagar.` });
      continue;
    }
    if (inskrankning !== null) {
      // Tiden räknas inte, men den får aldrig försvinna tyst ur underlaget.
      inskrankta.push({ inskrankning, fran, till: Math.min(till, bryt), rad: p });
      continue;
    }
    harOinskranktPeriod = true;
    intervall.push([fran, Math.min(till, bryt)]);
  }

  if (inskrankta.length > 0) {
    const ribPerioder = inskrankta.filter((i) => i.inskrankning === AVTALAD_INSKRANKNING.RIB);
    if (ribPerioder.length > 0) {
      const dagar = ribPerioder.reduce(
        (summa, i) => summa + Math.round((i.till - i.fran) / DAG_MS) + 1,
        0,
      );
      flaggor.push({
        typ: 'RIB_TID_EJ_TILLGODORAKNAD',
        detalj:
          `${dagar} dagar intjänade enligt kollektivavtalet RiB har inte tillgodoräknats ` +
          `(${ribPerioder.length} period(er)). AB 25 § 35 mom. 1 anm. 3.`,
      });
      if (!harOinskranktPeriod) {
        // Undantaget förutsätter huvudanställning hos samma arbetsgivare.
        // Finns ingen sådan i underlaget kan motorn inte avgöra saken.
        flaggor.push({
          typ: 'RIB_UTAN_HUVUDANSTALLNING',
          detalj:
            'Underlaget innehåller endast RiB-tid. Undantaget i AB 25 § 35 mom. 1 anm. 3 ' +
            'förutsätter att arbetstagaren samtidigt har sin huvudanställning hos samma ' +
            'arbetsgivare. Kräver manuellt ställningstagande.',
        });
      }
    }
  }

  // Slå samman överlappande/parallella intervall så att en kalenderdag
  // aldrig räknas mer än en gång. FLAGGAT ANTAGANDE – se FLAGGOR.md.
  intervall.sort((a, b) => a[0] - b[0]);
  const sammanslagna = [];
  let overlappFanns = false;
  for (const [fran, till] of intervall) {
    const sista = sammanslagna[sammanslagna.length - 1];
    if (sista && fran <= sista[1] + DAG_MS) {
      if (fran <= sista[1]) overlappFanns = true;
      sista[1] = Math.max(sista[1], till);
    } else {
      sammanslagna.push([fran, till]);
    }
  }
  if (overlappFanns) {
    flaggor.push({ typ: 'OVERLAPPANDE_PERIODER_SAMMANSLAGNA', detalj: 'Parallella perioder har slagits samman; ingen kalenderdag dubbelräknas.' });
  }

  let dagar = 0;
  for (const [fran, till] of sammanslagna) {
    dagar += Math.round((till - fran) / DAG_MS) + 1; // inklusive båda ändpunkter
  }
  return { dagar, flaggor };
}

/** Ålder i hela år vid ett givet datum (för tiebreak och LAS-ålder). */
export function alderVid(fodelsedatum, datum) {
  const f = new Date(`${fodelsedatum}T00:00:00Z`);
  const d = new Date(`${datum}T00:00:00Z`);
  if (Number.isNaN(f.getTime()) || Number.isNaN(d.getTime())) {
    throw new Error(`Ogiltigt datum: ${fodelsedatum} / ${datum}`);
  }
  let alder = d.getUTCFullYear() - f.getUTCFullYear();
  const foddSenareUnderAret =
    d.getUTCMonth() < f.getUTCMonth() ||
    (d.getUTCMonth() === f.getUTCMonth() && d.getUTCDate() < f.getUTCDate());
  if (foddSenareUnderAret) alder -= 1;
  return alder;
}
