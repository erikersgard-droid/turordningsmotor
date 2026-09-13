// Avtalsturlista: manuellt förhandlad avvikande lista. Motorn gör EN sak:
// redovisar transparent hur den avviker från den beräknade listan, per individ.
// Motorn värderar aldrig avtalsturlistans rättsliga giltighet (god sed-
// prövningen är en rättslig fråga utanför verktygets scope – se FLAGGOR.md).

export function diffaAvtalsturlista({ beraknadUppsagningslista, avtalsturlista }) {
  const { uppsagningslista, motivering, parterGodkant } = avtalsturlista;
  if (!motivering || motivering.trim() === '') {
    throw new Error('Avtalsturlistan saknar motivering.');
  }
  if (!parterGodkant?.arbetsgivare || !parterGodkant?.arbetstagarorganisation) {
    throw new Error('Avtalsturlistan kräver båda parters godkännande för att användas som underlag.');
  }

  const beraknad = new Set(beraknadUppsagningslista);
  const avtalad = new Set(uppsagningslista);

  return {
    tillkommer: [...avtalad].filter((id) => !beraknad.has(id)),
    utgar: [...beraknad].filter((id) => !avtalad.has(id)),
    oforandrade: [...avtalad].filter((id) => beraknad.has(id)),
  };
}
