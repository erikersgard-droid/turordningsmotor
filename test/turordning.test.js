// Testbatteri: rangordning inom turordningskrets
//
// Rättsliga utgångspunkter:
//  - Sist in, först ut: längre sammanlagd anställningstid ger företräde.
//  - Vid lika anställningstid ger högre ålder företräde (AB § 35 / 22 § 4 st LAS).
//  - Lika tid OCH lika ålder: rättsläget ger ingen ytterligare regel –
//    motorn får ALDRIG avgöra tyst, utan flaggar för manuellt beslut.
//  - Tjänstlediga ingår i turordningen.
//  - Tillräckliga kvalifikationer vid omplacering är ett manuellt beslut:
//    motorn identifierar VILKA som kräver prövning men avgör aldrig utfallet.
//  - Arbetstagare över LAS-åldern (32 a §/33 d § LAS – FLAGGAD parameter):
//    saknar företrädesrätt enligt turordningen.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rangordnaKrets } from '../src/turordning.js';

const P = (id, dagar, fodd, extra = {}) => ({
  id,
  namn: id,
  anstallningstidDagar: dagar,
  fodelsedatum: fodd,
  ...extra,
});

test('grundfall: längre anställningstid ger företräde (sist in, först ut)', () => {
  const r = rangordnaKrets({
    medlemmar: [P('kort', 100, '1990-01-01'), P('lang', 5000, '1995-01-01')],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01',
  });
  assert.deepEqual(r.rangordning.map((m) => m.id), ['lang', 'kort']);
  assert.deepEqual(r.preliminarUppsagningslista.map((m) => m.id), ['kort']);
});

test('tiebreak: lika anställningstid → äldre går före', () => {
  const r = rangordnaKrets({
    medlemmar: [P('yngre', 3000, '1985-06-01'), P('aldre', 3000, '1962-03-01')],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01',
  });
  assert.deepEqual(r.rangordning.map((m) => m.id), ['aldre', 'yngre']);
});

test('lika tid och lika födelsedatum → status kräver manuellt beslut, ingen tyst ordning', () => {
  const r = rangordnaKrets({
    medlemmar: [P('a', 3000, '1980-01-01'), P('b', 3000, '1980-01-01')],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01',
  });
  assert.equal(r.status, 'KRAVER_MANUELLA_BESLUT');
  assert.ok(r.kravdaBeslut.some((b) => b.typ === 'TIEBREAK_OLOST' && b.beror.includes('a') && b.beror.includes('b')));
});

test('tjänstledig arbetstagare ingår i turordningen på samma villkor', () => {
  const r = rangordnaKrets({
    medlemmar: [P('ledig', 4000, '1980-01-01', { tjanstledig: true }), P('itjanst', 2000, '1985-01-01')],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01',
  });
  assert.deepEqual(r.preliminarUppsagningslista.map((m) => m.id), ['itjanst']);
});

test('omplaceringsbehov utan kvalifikationsbeslut → motorn stannar och listar vilka beslut som krävs', () => {
  // "senior" har längst tid men sin nuvarande befattning försvinner: kan bara
  // stanna genom omplacering → kvalifikationsprövning krävs (manuell).
  const r = rangordnaKrets({
    medlemmar: [
      P('senior', 6000, '1970-01-01', { kraverOmplacering: true }),
      P('junior', 1000, '1990-01-01'),
    ],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01',
  });
  assert.equal(r.status, 'KRAVER_MANUELLA_BESLUT');
  assert.ok(r.kravdaBeslut.some((b) => b.typ === 'TILLRACKLIGA_KVALIFIKATIONER' && b.beror.includes('senior')));
  assert.equal(r.preliminarUppsagningslista, null);
});

test('kvalifikationsbeslut JA med motivering → senior stannar, junior sägs upp', () => {
  const r = rangordnaKrets({
    medlemmar: [
      P('senior', 6000, '1970-01-01', { kraverOmplacering: true }),
      P('junior', 1000, '1990-01-01'),
    ],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01',
    kvalifikationsbeslut: [
      { employeeId: 'senior', harTillrackligaKvalifikationer: true, motivering: 'Uppfyller minimikraven; skälig upplärningstid ca 2 mån.', beslutsfattare: 'EA' },
    ],
  });
  assert.equal(r.status, 'KLAR');
  assert.deepEqual(r.preliminarUppsagningslista.map((m) => m.id), ['junior']);
});

test('kvalifikationsbeslut NEJ → senior sägs upp trots längre anställningstid, med spårbar motivering i resultatet', () => {
  const r = rangordnaKrets({
    medlemmar: [
      P('senior', 6000, '1970-01-01', { kraverOmplacering: true }),
      P('junior', 1000, '1990-01-01'),
    ],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01',
    kvalifikationsbeslut: [
      { employeeId: 'senior', harTillrackligaKvalifikationer: false, motivering: 'Saknar legitimation som krävs för kvarvarande arbete.', beslutsfattare: 'EA' },
    ],
  });
  assert.equal(r.status, 'KLAR');
  assert.deepEqual(r.preliminarUppsagningslista.map((m) => m.id), ['senior']);
  const spar = r.beslutslogg.find((b) => b.employeeId === 'senior');
  assert.equal(spar.typ, 'TILLRACKLIGA_KVALIFIKATIONER');
  assert.match(spar.motivering, /legitimation/);
});

test('kvalifikationsbeslut utan motivering avvisas – spårbarheten är obligatorisk', () => {
  assert.throws(
    () =>
      rangordnaKrets({
        medlemmar: [P('senior', 6000, '1970-01-01', { kraverOmplacering: true }), P('junior', 1000, '1990-01-01')],
        antalOvertaliga: 1,
        berakningsdatum: '2026-01-01',
        kvalifikationsbeslut: [{ employeeId: 'senior', harTillrackligaKvalifikationer: true, motivering: '', beslutsfattare: 'EA' }],
      }),
    /motivering/i,
  );
});

test('arbetstagare över LAS-åldern rangordnas inte utan särredovisas med flagga (33 d § – parameter att verifiera)', () => {
  const r = rangordnaKrets({
    medlemmar: [P('70aring', 15000, '1955-01-01'), P('ung', 500, '1998-01-01')],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01',
    lasAlder: 69,
  });
  assert.deepEqual(r.rangordning.map((m) => m.id), ['ung']);
  assert.ok(r.utanforTurordning.some((m) => m.id === '70aring' && m.skal === 'UPPNADD_LAS_ALDER'));
  assert.ok(r.flaggor.some((f) => f.typ === 'LAS_ALDER_TILLAMPAD'));
});

test('åldern bedöms vid beräkningsdatumet, inte idag: 68-åring ingår när LAS-åldern är 69', () => {
  const r = rangordnaKrets({
    medlemmar: [P('nastanLasAlder', 9000, '1957-06-15'), P('ung', 500, '1998-01-01')],
    antalOvertaliga: 1,
    berakningsdatum: '2026-01-01', // 68 år gammal
    lasAlder: 69,
  });
  assert.equal(r.utanforTurordning.length, 0);
  assert.deepEqual(r.preliminarUppsagningslista.map((m) => m.id), ['ung']);
});

test('antalOvertaliga större än kretsen → hela kretsen på listan plus varningsflagga', () => {
  const r = rangordnaKrets({
    medlemmar: [P('a', 100, '1990-01-01')],
    antalOvertaliga: 5,
    berakningsdatum: '2026-01-01',
  });
  assert.deepEqual(r.preliminarUppsagningslista.map((m) => m.id), ['a']);
  assert.ok(r.flaggor.some((f) => f.typ === 'OVERTALIGHET_OVERSTIGER_KRETS'));
});
