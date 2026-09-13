// Regelset: AB/HÖK (skarpt läge) respektive REN_LAS (pedagogiskt jämförelseläge).
//
// AB/HÖK: undantagsregeln i 22 § 2 st LAS är bortavtalad – inga undantag,
// oavsett antal. REN_LAS: högst tre undantag, tremånadersspärr räknad från
// föregående uppsägning där undantag gjordes.

export const REGELSET = Object.freeze({
  AB_HOK: 'AB_HOK',
  REN_LAS: 'REN_LAS',
});

const DAG_MS = 24 * 60 * 60 * 1000;

export function valideraUndantag({ regelset, undantagnaIds, datum, senasteUppsagningMedUndantag = null }) {
  if (regelset === REGELSET.AB_HOK) {
    if (undantagnaIds.length > 0) {
      return {
        giltigt: false,
        skal: 'Undantag från turordningen är inte möjligt i HÖK/AB-läget: 22 § 2 st LAS är avtalat bort för kommuner, regioner och kommunala bolag.',
      };
    }
    return { giltigt: true, skal: null };
  }

  if (regelset === REGELSET.REN_LAS) {
    if (undantagnaIds.length > 3) {
      return { giltigt: false, skal: 'Högst tre arbetstagare får undantas (22 § 2 st LAS).' };
    }
    if (undantagnaIds.length > 0 && senasteUppsagningMedUndantag) {
      const senast = Date.parse(`${senasteUppsagningMedUndantag}T00:00:00Z`);
      const nu = Date.parse(`${datum}T00:00:00Z`);
      const treManaderSenare = new Date(senast);
      treManaderSenare.setUTCMonth(treManaderSenare.getUTCMonth() + 3);
      // Gränsdagstolkning (FLAGGAD): "inom tre månader efter" läses som att
      // även dagen exakt tre månader senare är spärrad; först dagen därpå är fri.
      if (nu <= treManaderSenare.getTime()) {
        return {
          giltigt: false,
          skal: `Nya undantag får inte göras vid uppsägning inom tre månader efter föregående uppsägning där undantag gjordes (${senasteUppsagningMedUndantag}).`,
        };
      }
    }
    return { giltigt: true, skal: null };
  }

  throw new Error(`Okänt regelset: ${regelset}`);
}
