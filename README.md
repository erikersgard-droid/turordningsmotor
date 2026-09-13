# Turordningsmotor (MVP-kärna)

Fristående beräkningsmotor för turordning vid arbetsbrist i kommunal/regional
sektor (AB/HÖK-kontext), med REN_LAS som pedagogiskt jämförelseläge.
Noll externa beroenden: modern ESM-JavaScript + Nodes inbyggda testrunner,
direkt återanvändbar i React-frontenden.

## Körning
    node --test 'test/*.test.js'     # 47 tester

## Moduler
    src/anstallningstid.js   3 §-logik: kalenderdagar, tillgodoräknande, sammanslagning
    src/krets.js             AB § 35-kretsbildning + sammanläggningens formkrav
    src/turordning.js        SIFU, ålderstiebreak, LAS-ålder, manuella beslutspunkter
    src/regelset.js          AB_HOK (inga undantag) / REN_LAS (3 undantag + spärr)
    src/avtalsturlista.js    diff avtalad vs beräknad lista, per individ

## Designkontrakt
Regelstyrt beräknas; skönsmässigt stannar motorn med status
KRAVER_MANUELLA_BESLUT och en lista över exakt vilka beslut som saknas.
Alla manuella beslut kräver motivering (kastas annars) och loggas i
beslutslogg. Se FLAGGOR.md för alla juridiska tolkningar som ska sakgranskas.
