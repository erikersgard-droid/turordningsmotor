// Testbatteri: kretsbildning (AB § 35) och regelset (AB vs REN_LAS)
//
// Rättsliga utgångspunkter:
//  - AB-krets = driftsenhet × befattningsgrupp med "i huvudsak jämförbara
//    arbetsuppgifter"; kollektivavtalsområde saknar betydelse.
//  - Gruppindelningen är ett MANUELLT beslut med obligatorisk motivering
//    (vidsträckt tolkning som utgångspunkt; AD 1992 nr 90, 1993 nr 85).
//  - Kretsar upprättas endast där arbetsbrist finns (AD 1993 nr 220).
//  - Enmanskrets → förstärkt motivering krävs (jfr praxis om snäva kretsar).
//  - Sammanläggning: på arbetstagarorganisations begäran, högst tre
//    driftsenheter inom förvaltningens verksamhetsområde på orten.
//  - Regelset AB: INGEN undantagsmöjlighet (HÖK/AB har avtalat bort 22 § 2 st).
//  - Regelset REN_LAS (jämförelseläge): högst tre undantag, tremånadersspärr.
//  - Avtalsturlista: manuell lista som diffas mot beräknad – motorn värderar
//    aldrig dess giltighet (god sed-prövning är en rättslig fråga utanför scope).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bildaKretsar } from '../src/krets.js';
import { valideraUndantag, REGELSET } from '../src/regelset.js';
import { diffaAvtalsturlista } from '../src/avtalsturlista.js';

const enheter = [
  { id: 'sjukhusA', namn: 'Sjukhus A', ort: 'Malmö', forvaltningId: 'F1' },
  { id: 'sjukhusB', namn: 'Sjukhus B', ort: 'Malmö', forvaltningId: 'F1' },
  { id: 'vcLund', namn: 'Vårdcentral Lund', ort: 'Lund', forvaltningId: 'F1' },
  { id: 'kontorMalmo', namn: 'Förvaltningskontor', ort: 'Malmö', forvaltningId: 'F2' },
];

const grupp = (id, motivering = 'Faktiskt innehåll jämfört; kan utföra varandras uppgifter efter skälig upplärningstid.') => ({
  id,
  namn: id,
  motivering,
  faststalldIForhandling: false,
});

const anst = (id, enhet, gruppId) => ({ id, namn: id, driftsenhetId: enhet, gruppId });

test('krets = driftsenhet × befattningsgrupp; kollektivavtalsområde påverkar inte indelningen', () => {
  const r = bildaKretsar({
    driftsenheter: enheter,
    grupper: [grupp('usk'), grupp('ssk')],
    anstallda: [
      anst('a1', 'sjukhusA', 'usk'),
      anst('a2', 'sjukhusA', 'usk'),
      anst('a3', 'sjukhusA', 'ssk'),
      anst('a4', 'sjukhusB', 'usk'),
    ],
    arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'usk', antalOvertaliga: 1 }],
  });
  assert.equal(r.kretsar.length, 1); // endast där arbetsbrist finns (AD 1993 nr 220)
  assert.deepEqual(r.kretsar[0].medlemsIds.sort(), ['a1', 'a2']);
});

test('anställd utan gruppbeslut → motorn kräver manuellt beslut i stället för att gissa grupp', () => {
  const r = bildaKretsar({
    driftsenheter: enheter,
    grupper: [grupp('usk')],
    anstallda: [anst('a1', 'sjukhusA', 'usk'), anst('a2', 'sjukhusA', null)],
    arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'usk', antalOvertaliga: 1 }],
  });
  assert.equal(r.status, 'KRAVER_MANUELLA_BESLUT');
  assert.ok(r.kravdaBeslut.some((b) => b.typ === 'GRUPPINDELNING_SAKNAS' && b.beror.includes('a2')));
});

test('befattningsgrupp utan motivering avvisas', () => {
  assert.throws(
    () =>
      bildaKretsar({
        driftsenheter: enheter,
        grupper: [grupp('usk', '')],
        anstallda: [anst('a1', 'sjukhusA', 'usk')],
        arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'usk', antalOvertaliga: 1 }],
      }),
    /motivering/i,
  );
});

test('enmanskrets tillåts men flaggas: förstärkt motivering krävs', () => {
  const r = bildaKretsar({
    driftsenheter: enheter,
    grupper: [grupp('antikvarie')],
    anstallda: [anst('ensam', 'sjukhusA', 'antikvarie')],
    arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'antikvarie', antalOvertaliga: 1 }],
  });
  assert.equal(r.kretsar.length, 1);
  assert.ok(r.flaggor.some((f) => f.typ === 'ENMANSKRETS_FORSTARKT_MOTIVERING' && f.kretsId === r.kretsar[0].id));
});

test('sammanläggning: tre enheter, samma förvaltning, samma ort, facklig begäran → OK, en gemensam krets', () => {
  const enh3 = [...enheter, { id: 'sjukhusC', namn: 'Sjukhus C', ort: 'Malmö', forvaltningId: 'F1' }];
  const r = bildaKretsar({
    driftsenheter: enh3,
    grupper: [grupp('usk')],
    anstallda: [anst('a1', 'sjukhusA', 'usk'), anst('a2', 'sjukhusB', 'usk'), anst('a3', 'sjukhusC', 'usk')],
    arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'usk', antalOvertaliga: 1 }],
    sammanlaggning: { begardAvArbetstagarorganisation: true, driftsenhetIds: ['sjukhusA', 'sjukhusB', 'sjukhusC'] },
  });
  assert.equal(r.status, 'KLAR');
  assert.equal(r.kretsar.length, 1);
  assert.deepEqual(r.kretsar[0].medlemsIds.sort(), ['a1', 'a2', 'a3']);
});

test('sammanläggning av fler än tre driftsenheter avvisas (AB-gränsen, snävare än LAS)', () => {
  const enh4 = [...enheter, { id: 'sjukhusC', namn: 'C', ort: 'Malmö', forvaltningId: 'F1' }, { id: 'sjukhusD', namn: 'D', ort: 'Malmö', forvaltningId: 'F1' }];
  assert.throws(
    () =>
      bildaKretsar({
        driftsenheter: enh4,
        grupper: [grupp('usk')],
        anstallda: [anst('a1', 'sjukhusA', 'usk')],
        arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'usk', antalOvertaliga: 1 }],
        sammanlaggning: { begardAvArbetstagarorganisation: true, driftsenhetIds: ['sjukhusA', 'sjukhusB', 'sjukhusC', 'sjukhusD'] },
      }),
    /högst tre/i,
  );
});

test('sammanläggning över ortsgräns avvisas', () => {
  assert.throws(
    () =>
      bildaKretsar({
        driftsenheter: enheter,
        grupper: [grupp('usk')],
        anstallda: [anst('a1', 'sjukhusA', 'usk')],
        arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'usk', antalOvertaliga: 1 }],
        sammanlaggning: { begardAvArbetstagarorganisation: true, driftsenhetIds: ['sjukhusA', 'vcLund'] },
      }),
    /ort/i,
  );
});

test('sammanläggning över förvaltningsgräns avvisas', () => {
  assert.throws(
    () =>
      bildaKretsar({
        driftsenheter: enheter,
        grupper: [grupp('usk')],
        anstallda: [anst('a1', 'sjukhusA', 'usk')],
        arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'usk', antalOvertaliga: 1 }],
        sammanlaggning: { begardAvArbetstagarorganisation: true, driftsenhetIds: ['sjukhusA', 'kontorMalmo'] },
      }),
    /förvaltning/i,
  );
});

test('sammanläggning utan facklig begäran avvisas – arbetsgivaren kan inte initiera den ensidigt', () => {
  assert.throws(
    () =>
      bildaKretsar({
        driftsenheter: enheter,
        grupper: [grupp('usk')],
        anstallda: [anst('a1', 'sjukhusA', 'usk')],
        arbetsbrist: [{ driftsenhetId: 'sjukhusA', gruppId: 'usk', antalOvertaliga: 1 }],
        sammanlaggning: { begardAvArbetstagarorganisation: false, driftsenhetIds: ['sjukhusA', 'sjukhusB'] },
      }),
    /arbetstagarorganisation/i,
  );
});

// ---------- Regelset: undantag ----------

test('AB-regelsetet tillåter inga undantag alls', () => {
  const r = valideraUndantag({ regelset: REGELSET.AB_HOK, undantagnaIds: ['x'], datum: '2026-01-01' });
  assert.equal(r.giltigt, false);
  assert.match(r.skal, /HÖK\/AB|avtalat bort/i);
});

test('AB-regelsetet med noll undantag är giltigt', () => {
  const r = valideraUndantag({ regelset: REGELSET.AB_HOK, undantagnaIds: [], datum: '2026-01-01' });
  assert.equal(r.giltigt, true);
});

test('REN_LAS: upp till tre undantag är giltigt', () => {
  const r = valideraUndantag({ regelset: REGELSET.REN_LAS, undantagnaIds: ['a', 'b', 'c'], datum: '2026-01-01' });
  assert.equal(r.giltigt, true);
});

test('REN_LAS: fyra undantag avvisas', () => {
  const r = valideraUndantag({ regelset: REGELSET.REN_LAS, undantagnaIds: ['a', 'b', 'c', 'd'], datum: '2026-01-01' });
  assert.equal(r.giltigt, false);
  assert.match(r.skal, /tre/i);
});

test('REN_LAS: tremånadersspärren – nytt undantag inom tre månader efter föregående uppsägning avvisas', () => {
  const r = valideraUndantag({
    regelset: REGELSET.REN_LAS,
    undantagnaIds: ['a'],
    datum: '2026-03-01',
    senasteUppsagningMedUndantag: '2026-01-15',
  });
  assert.equal(r.giltigt, false);
  assert.match(r.skal, /tre månader/i);
});

test('REN_LAS: undantag är åter tillåtet när tre månader passerat', () => {
  const r = valideraUndantag({
    regelset: REGELSET.REN_LAS,
    undantagnaIds: ['a'],
    datum: '2026-04-16',
    senasteUppsagningMedUndantag: '2026-01-15',
  });
  assert.equal(r.giltigt, true);
});

// ---------- Avtalsturlista ----------

test('avtalsturlista diffas mot beräknad lista: avvikelser redovisas per individ, ingen giltighetsvärdering', () => {
  const beraknad = ['junior1', 'junior2'];
  const avtalad = ['junior1', 'senior1'];
  const r = diffaAvtalsturlista({
    beraknadUppsagningslista: beraknad,
    avtalsturlista: { uppsagningslista: avtalad, motivering: 'Lokal överenskommelse om kompetensbehov.', parterGodkant: { arbetsgivare: true, arbetstagarorganisation: true } },
  });
  assert.deepEqual(r.tillkommer, ['senior1']); // sägs upp enligt avtal men inte enligt beräkning
  assert.deepEqual(r.utgar, ['junior2']);      // skyddas av avtalet
  assert.deepEqual(r.oforandrade, ['junior1']);
  assert.equal('giltig' in r, false); // motorn uttalar sig aldrig om giltighet
});

test('avtalsturlista utan båda parters godkännande avvisas som underlag', () => {
  assert.throws(
    () =>
      diffaAvtalsturlista({
        beraknadUppsagningslista: [],
        avtalsturlista: { uppsagningslista: ['x'], motivering: 'test', parterGodkant: { arbetsgivare: true, arbetstagarorganisation: false } },
      }),
    /godkän/i,
  );
});

test('REN_LAS: gränsdagen exakt tre månader senare är fortfarande spärrad (FLAGGAD tolkning)', () => {
  const r = valideraUndantag({
    regelset: REGELSET.REN_LAS,
    undantagnaIds: ['a'],
    datum: '2026-04-15',
    senasteUppsagningMedUndantag: '2026-01-15',
  });
  assert.equal(r.giltigt, false);
});
