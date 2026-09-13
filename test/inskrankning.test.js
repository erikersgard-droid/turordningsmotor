// Testbatteri: avtalad inskränkning av tillgodoräknandebar tid.
//
// Rättslig grund (verifierad i primärkälla 2026-09-12):
//  - AB 25 § 35 mom. 1, anmärkning 3: anställningstid intjänad enligt
//    kollektivavtalet RiB tillgodoräknas inte tidsmässigt vid tillämpning
//    av 22 § LAS.
//  - Kommentarer till AB i lydelse 25-04-01, § 35 (s. 177): regeln avser
//    arbetstagare som har anställning som beredskapsbrandman enligt RiB
//    OCH samtidigt har sin huvudanställning hos samma arbetsgivare.
//  - Mom. 4 a) + kommentaren s. 183: motsvarande gäller vid 25 § LAS.
//    Anställningstiden tillgodoräknas i övrigt enligt LAS.
//
// MODELLBESLUT: inskränkningen är en sluten uppräkning, inte ett fritt
// avdragsfält. Endast belagda avvikelser får förekomma. Se FLAGGOR.md p. 10.
//
// Villkoret om huvudanställning kan motorn inte avgöra på egen hand när
// underlaget bara innehåller RiB-tid — då ska den flagga, inte gissa.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  beraknaAnstallningstid,
  TILLGODORAKNANDE,
  AVTALAD_INSKRANKNING,
} from '../src/anstallningstid.js';

const d = (s) => s;

const huvud = (fran, till = null) => ({
  fran: d(fran),
  till: till === null ? null : d(till),
  grund: TILLGODORAKNANDE.SAMMA_ARBETSGIVARE,
});

const rib = (fran, till = null) => ({
  ...huvud(fran, till),
  inskrankning: AVTALAD_INSKRANKNING.RIB,
});

function harFlagga(resultat, typ) {
  return resultat.flaggor.some((f) => f.typ === typ);
}

test('RiB-tid som löper parallellt med huvudanställning ökar inte anställningstiden', () => {
  const utan = beraknaAnstallningstid([huvud('2020-01-01')], d('2020-12-31'));
  const med = beraknaAnstallningstid(
    [huvud('2020-01-01'), rib('2020-03-01', '2020-09-30')],
    d('2020-12-31'),
  );
  assert.equal(med.dagar, utan.dagar);
});

test('RiB-tid som ligger utanför huvudanställningens period tillgodoräknas inte', () => {
  const r = beraknaAnstallningstid(
    [
      rib('2010-01-01', '2014-12-31'), // ska inte räknas
      huvud('2020-01-01', '2020-01-10'), // 10 dagar
    ],
    d('2024-06-01'),
  );
  assert.equal(r.dagar, 10);
});

test('RiB-tid som ansluter direkt till huvudanställningen förlänger den inte', () => {
  const r = beraknaAnstallningstid(
    [
      rib('2019-01-01', '2019-12-31'),
      huvud('2020-01-01', '2020-01-31'), // 31 dagar
    ],
    d('2024-06-01'),
  );
  assert.equal(r.dagar, 31);
});

test('borträknad RiB-tid flaggas så att den syns i beslutsunderlaget', () => {
  const r = beraknaAnstallningstid(
    [huvud('2020-01-01'), rib('2018-01-01', '2019-12-31')],
    d('2020-12-31'),
  );
  assert.ok(
    harFlagga(r, 'RIB_TID_EJ_TILLGODORAKNAD'),
    'RiB-tid får aldrig räknas bort tyst',
  );
});

test('flera RiB-perioder ger en samlad flagga med angiven borträknad tid', () => {
  const r = beraknaAnstallningstid(
    [
      huvud('2020-01-01', '2020-01-10'),
      rib('2015-01-01', '2015-01-31'),
      rib('2017-01-01', '2017-01-31'),
    ],
    d('2024-06-01'),
  );
  assert.equal(r.dagar, 10);
  const flagga = r.flaggor.find((f) => f.typ === 'RIB_TID_EJ_TILLGODORAKNAD');
  assert.ok(flagga, 'flagga saknas');
  assert.match(String(flagga.detalj), /62/, 'borträknad tid ska framgå av detaljen');
});

test('underlag som enbart innehåller RiB-tid kräver manuellt ställningstagande', () => {
  // Villkoret i AB förutsätter huvudanställning hos samma arbetsgivare.
  // Saknas sådan i underlaget kan motorn inte avgöra om undantaget gäller.
  const r = beraknaAnstallningstid([rib('2015-01-01', '2015-01-31')], d('2024-06-01'));
  assert.ok(
    harFlagga(r, 'RIB_UTAN_HUVUDANSTALLNING'),
    'motorn ska flagga, inte gissa, när huvudanställning saknas i underlaget',
  );
});

test('okänd inskränkning avvisas – uppräkningen är sluten, inte ett fritt avdragsfält', () => {
  assert.throws(
    () =>
      beraknaAnstallningstid(
        [{ ...huvud('2020-01-01', '2020-12-31'), inskrankning: 'EGET_AVDRAG' }],
        d('2024-06-01'),
      ),
    /inskränkning/i,
  );
});

test('perioder utan inskränkning påverkas inte av den nya logiken', () => {
  const r = beraknaAnstallningstid(
    [
      huvud('2018-06-01', '2018-08-31'), // 92 dagar
      huvud('2020-01-01', null),
    ],
    d('2020-01-10'), // 10 dagar
  );
  assert.equal(r.dagar, 102);
  assert.equal(r.flaggor.length, 0);
});
