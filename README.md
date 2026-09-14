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

## Ansvarsfriskrivning

Detta är ett utvecklingsprojekt och ett studiematerial. Motorn är inte
juridiskt granskad, inte validerad mot verkliga ärenden och inte avsedd
för produktionsbruk.

FLAGGOR.md innehåller en förteckning över de rättsliga tolkningar som
konstruktionen vilar på. Flera av dem är uttryckligen overifierade.
Motorn kan därför ge felaktiga resultat, även när den inte flaggar för
det.

Beräkningar från motorn får inte läggas till grund för beslut om
uppsägning, turordning eller företrädesrätt utan att underlaget har
prövats rättsligt av behörig person. Den som använder materialet gör
det helt på eget ansvar.

Innehållet utgör inte juridisk rådgivning och kan inte åberopas som
sådan. Materialet speglar enbart upphovsmannens egna slutsatser och har
ingen anknytning till hans arbetsgivare.

Programvaran tillhandahålls i befintligt skick, utan garantier av något
slag. Se LICENSE för fullständiga villkor.
