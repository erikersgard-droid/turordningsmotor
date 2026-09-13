// Testbatteri: beräkning av sammanlagd anställningstid (3 § LAS-logik i AB-kontext)
//
// Rättsliga utgångspunkter som testerna kodifierar:
//  - All tid hos arbetsgivaren räknas, oavsett anställningsform, omfattning
//    eller om tiden är sammanhängande. Tjänstledighet ingår.
//  - Tillgodoräknande vid verksamhetsövergång och koncernbyte (3 § LAS),
//    inkl. kedjade byten.
//  - Motorn saknar mekanism för att minska tillgodoräknad tid. Detta är ett
//    MODELLBESLUT för AB-läget (ingen sådan avtalsavvikelse belagd), inte en
//    rättsregel: 22 § är semidispositiv och AD 2011 nr 3 visar tvärtom att
//    avtalade tidsvillkor lagligen kan utesluta överlåtartid för förmåner
//    som inte förelåg vid övergången. Se FLAGGOR.md p. 5.
//  - Kalenderdagar, inklusive start- och slutdag.
//
// FLAGGADE ANTAGANDEN (se FLAGGOR.md): parallella anställningar räknas inte dubbelt.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beraknaAnstallningstid, TILLGODORAKNANDE } from '../src/anstallningstid.js';

const d = (s) => s; // ISO-datum som strängar, för läsbarhet

test('en sammanhängande pågående anställning räknas i kalenderdagar inkl. båda ändpunkter', () => {
  const r = beraknaAnstallningstid(
    [{ fran: d('2024-01-01'), till: null, grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE }],
    d('2024-01-31'),
  );
  assert.equal(r.dagar, 31);
  assert.equal(r.flaggor.length, 0);
});

test('avslutad period räknas t.o.m. sitt slutdatum, inte brytdatumet', () => {
  const r = beraknaAnstallningstid(
    [{ fran: d('2020-01-01'), till: d('2020-01-10'), grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE }],
    d('2024-06-01'),
  );
  assert.equal(r.dagar, 10);
});

test('icke sammanhängande tidigare perioder summeras (sommarvikariat + senare tillsvidare)', () => {
  const r = beraknaAnstallningstid(
    [
      { fran: d('2018-06-01'), till: d('2018-08-31'), grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE }, // 92 dagar
      { fran: d('2020-01-01'), till: null, grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE },
    ],
    d('2020-01-10'), // 10 dagar
  );
  assert.equal(r.dagar, 102);
});

test('anställningsform och sysselsättningsgrad saknar betydelse – deltid räknas som hela kalenderdagar', () => {
  const heltid = beraknaAnstallningstid(
    [{ fran: d('2023-01-01'), till: null, grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE, sysselsattningsgrad: 1.0 }],
    d('2023-12-31'),
  );
  const deltid = beraknaAnstallningstid(
    [{ fran: d('2023-01-01'), till: null, grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE, sysselsattningsgrad: 0.5 }],
    d('2023-12-31'),
  );
  assert.equal(heltid.dagar, deltid.dagar);
});

test('överlappande parallella perioder hos samma arbetsgivare dubbelräknas inte (FLAGGAT ANTAGANDE)', () => {
  const r = beraknaAnstallningstid(
    [
      { fran: d('2023-01-01'), till: d('2023-06-30'), grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE },
      { fran: d('2023-04-01'), till: d('2023-09-30'), grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE },
    ],
    d('2024-01-01'),
  );
  // 2023-01-01..2023-09-30 = 273 dagar, inte 181+183
  assert.equal(r.dagar, 273);
  assert.ok(r.flaggor.some((f) => f.typ === 'OVERLAPPANDE_PERIODER_SAMMANSLAGNA'));
});

test('verksamhetsövergång tillgodoräknas fullt ut (3 § LAS, AD 2019 nr 8-mönstret)', () => {
  const r = beraknaAnstallningstid(
    [
      { fran: d('2010-01-01'), till: d('2015-12-31'), grund: TILLGODORAKNANDE.VERKSAMHETSOVERGANG, tidigareArbetsgivare: 'Kommunalt bolag AB' },
      { fran: d('2016-01-01'), till: null, grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE },
    ],
    d('2016-01-31'),
  );
  assert.equal(r.dagar, 2191 + 31);
});

test('kedjade byten (koncern följt av verksamhetsövergång) summeras alla', () => {
  const r = beraknaAnstallningstid(
    [
      { fran: d('2019-01-01'), till: d('2019-12-31'), grund: TILLGODORAKNANDE.KONCERNBYTE, tidigareArbetsgivare: 'Dotterbolag 1' },
      { fran: d('2020-01-01'), till: d('2020-12-31'), grund: TILLGODORAKNANDE.VERKSAMHETSOVERGANG, tidigareArbetsgivare: 'Dotterbolag 2' },
      { fran: d('2021-01-01'), till: null, grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE },
    ],
    d('2021-12-31'),
  );
  assert.equal(r.dagar, 365 + 366 + 365);
});

test('tjänstledighet ingår – modelleras som att perioden löper vidare, inget avdragsfält finns', () => {
  const period = { fran: d('2020-01-01'), till: null, grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE };
  const r = beraknaAnstallningstid([period], d('2020-12-31'));
  assert.equal(r.dagar, 366);
  // Designkontrakt: motorn exponerar ingen mekanism för att dra av ledighet.
  assert.equal('avdrag' in period, false);
});

test('period som börjar efter brytdatum ger 0 dagar och en varningsflagga', () => {
  const r = beraknaAnstallningstid(
    [{ fran: d('2025-01-01'), till: null, grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE }],
    d('2024-06-01'),
  );
  assert.equal(r.dagar, 0);
  assert.ok(r.flaggor.some((f) => f.typ === 'PERIOD_EFTER_BRYTDATUM'));
});

test('ogiltig period (till före från) ger valideringsfel, inte tyst korrigering', () => {
  assert.throws(
    () =>
      beraknaAnstallningstid(
        [{ fran: d('2024-06-01'), till: d('2024-01-01'), grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE }],
        d('2024-12-31'),
      ),
    /till.*före.*från|ogiltig/i,
  );
});
