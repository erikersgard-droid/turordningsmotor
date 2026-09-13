// Rangordning inom en turordningskrets.
//
// Regelstyrt (beräknas): sist in först ut, ålderstiebreak, LAS-åldersgräns.
// Skönsmässigt (kräver manuellt beslut, motorn stannar annars):
//  - olöst tiebreak (lika tid OCH lika födelsedatum),
//  - tillräckliga kvalifikationer vid omplacering.

import { alderVid } from './anstallningstid.js';

/**
 * @param {object} inp
 * @param {Array} inp.medlemmar  {id, namn, anstallningstidDagar, fodelsedatum, kraverOmplacering?, tjanstledig?}
 * @param {number} inp.antalOvertaliga
 * @param {string} inp.berakningsdatum
 * @param {Array=} inp.kvalifikationsbeslut  {employeeId, harTillrackligaKvalifikationer, motivering, beslutsfattare}
 * @param {number=} inp.lasAlder  FLAGGAD parameter (default 69, 32 a §/33 d § LAS – verifieras mot gällande lydelse)
 */
export function rangordnaKrets({ medlemmar, antalOvertaliga, berakningsdatum, kvalifikationsbeslut = [], lasAlder = 69 }) {
  const flaggor = [];
  const kravdaBeslut = [];
  const beslutslogg = [];

  for (const b of kvalifikationsbeslut) {
    if (!b.motivering || b.motivering.trim() === '') {
      throw new Error(`Kvalifikationsbeslut för ${b.employeeId} saknar motivering – spårbarheten är obligatorisk.`);
    }
  }
  const beslutPerId = new Map(kvalifikationsbeslut.map((b) => [b.employeeId, b]));

  // 1. LAS-åldersgränsen (regelstyrd men parameterflaggad).
  const utanforTurordning = [];
  const rangordningsbara = [];
  for (const m of medlemmar) {
    if (alderVid(m.fodelsedatum, berakningsdatum) >= lasAlder) {
      utanforTurordning.push({ ...m, skal: 'UPPNADD_LAS_ALDER' });
    } else {
      rangordningsbara.push(m);
    }
  }
  if (utanforTurordning.length > 0) {
    flaggor.push({
      typ: 'LAS_ALDER_TILLAMPAD',
      detalj: `Arbetstagare som uppnått ${lasAlder} år saknar företrädesrätt enligt turordningen (33 d § LAS) och särredovisas. Verifiera åldersparametern mot gällande lydelse.`,
    });
  }

  // 2. Sortering: tid fallande, därefter äldst först.
  const sorterade = [...rangordningsbara].sort((a, b) => {
    if (b.anstallningstidDagar !== a.anstallningstidDagar) return b.anstallningstidDagar - a.anstallningstidDagar;
    return a.fodelsedatum.localeCompare(b.fodelsedatum); // tidigare födelsedatum = äldre = före
  });

  // 3. Olösta tiebreaks: identiska på båda kriterierna, OCH ordningen spelar roll
  //    (dvs. strecket för övertalighet skär mellan eller genom gruppen).
  const streck = sorterade.length - antalOvertaliga;
  for (let i = 0; i < sorterade.length - 1; i++) {
    const a = sorterade[i];
    const b = sorterade[i + 1];
    if (a.anstallningstidDagar === b.anstallningstidDagar && a.fodelsedatum === b.fodelsedatum) {
      const skarStrecket = i < streck && i + 1 >= streck;
      if (skarStrecket || streck <= 0) {
        kravdaBeslut.push({
          typ: 'TIEBREAK_OLOST',
          beror: [a.id, b.id],
          detalj: 'Lika anställningstid och lika födelsedatum. Rättsläget ger ingen ytterligare rangordningsregel – parterna avgör.',
        });
      }
    }
  }

  // 4. Kvalifikationsprövning för dem som bara kan stanna genom omplacering.
  const preliminar = [];
  const kvar = [];
  let uppsagda = 0;
  // Gå nedifrån: kortast tid först mot uppsägning; den som kräver omplacering
  // och underkänts i kvalifikationsprövning sägs upp oavsett tid.
  const underkanda = new Set();
  for (const m of rangordningsbara) {
    if (m.kraverOmplacering) {
      const beslut = beslutPerId.get(m.id);
      if (!beslut) {
        kravdaBeslut.push({
          typ: 'TILLRACKLIGA_KVALIFIKATIONER',
          beror: [m.id],
          detalj: `${m.namn} kan endast beredas fortsatt arbete genom omplacering. Tillräckliga kvalifikationer måste bedömas manuellt (guidad checklista).`,
        });
      } else {
        beslutslogg.push({ typ: 'TILLRACKLIGA_KVALIFIKATIONER', employeeId: m.id, ...beslut });
        if (!beslut.harTillrackligaKvalifikationer) underkanda.add(m.id);
      }
    }
  }

  if (kravdaBeslut.length > 0) {
    return {
      status: 'KRAVER_MANUELLA_BESLUT',
      kravdaBeslut,
      rangordning: sorterade,
      utanforTurordning,
      preliminarUppsagningslista: null,
      beslutslogg,
      flaggor,
    };
  }

  // Underkända sägs upp först (saknar företräde till fortsatt arbete),
  // därefter fylls listan nedifrån i rangordningen.
  for (const m of sorterade) {
    if (underkanda.has(m.id)) preliminar.push(m);
    else kvar.push(m);
  }
  while (preliminar.length < antalOvertaliga && kvar.length > 0) {
    preliminar.push(kvar.pop()); // kortast tid sist i "kvar"
  }
  if (preliminar.length < antalOvertaliga) {
    flaggor.push({ typ: 'OVERTALIGHET_OVERSTIGER_KRETS', detalj: 'Antalet övertaliga överstiger kretsens storlek.' });
  }

  return {
    status: 'KLAR',
    kravdaBeslut: [],
    rangordning: sorterade,
    utanforTurordning,
    preliminarUppsagningslista: preliminar,
    beslutslogg,
    flaggor,
  };
}
