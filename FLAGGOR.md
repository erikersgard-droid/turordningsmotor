# FLAGGOR

Varje punkt är ett ställe där motorn vilar på en tolkning som inte är
självklar ur källorna, eller där en parameter medvetet gjorts konfigurerbar
i väntan på verifiering. Ingen av dessa har automatiserats tyst: de är
antingen konfigurerbara, flaggade i motorns utdata, eller spärrade bakom
manuella beslut.

**Verifieringsomgång 2026-09-12.** Primärkällor genomgångna:
Allmänna Bestämmelser AB 25 i lydelse 2025-04-01, § 35, samt
*Kommentarer till AB i lydelse 25-04-01*, § 35 (s. 176–185).
Punkterna 2, 7 och 8 är därmed avförda. Nya punkter 10–13 är
modellbrister som verifieringen blottlade.

---

## AVFÖRDA EFTER VERIFIERING

### ~~2. LAS-åldern~~ — AVFÖRD
Parametern `lasAlder` med default 69 behålls som parameter. AB § 35
innehåller ingen avvikande åldershantering; Mom. 1 anger uttryckligen att
22 och 29 §§ LAS gäller med endast de avvikelser som räknas upp, och
ålder finns inte bland dem. Flaggan i utdata behålls eftersom
åldersgränsen är lagstiftningsberoende.

### ~~7c. Tiebreakregeln~~ — AVFÖRD
Belagd i primärkälla. Kommentaren till Mom. 1 (s. 177): vid lika
anställningstid ger högre ålder företräde. Ingen avvikelse från
22 § fjärde stycket LAS. Partsmaterialet från 2017 behövs inte längre
som stöd.

### ~~7b. Utökat tillgodoräknande i AB~~ — AVFÖRD, MEN OMVÄND
AB innehåller inget *utökat* tillgodoräknande utöver 3 § LAS. Däremot
finns en **inskränkning** som motorn saknar — se ny punkt 10.

### ~~8. Ort- och driftsenhetsbegreppen~~ — AVFÖRD som tolkningsfråga
Samtliga tre begrepp definieras i kommentaren s. 176. De förblir manuell
inmatning per design, men definitionerna ska in i UI:ts hjälptexter och
i valideringen:

- **Driftsenhet**: samma innebörd som i 22 § LAS. Geografiskt begrepp —
  typiskt en byggnad eller flera byggnader inom inhägnat område, t.ex. en
  vårdcentral eller en skola. Kan också avse verksamhet som bedrivs
  gemensamt där byggnaderna ligger i nära geografisk anslutning.
  *Tillägg som motorn saknar:* bedriver flera förvaltningar verksamhet
  inom samma driftsenhet utgör respektive förvaltningsområde den yttersta
  gränsen för turordningskretsen inom driftsenheten. För arbetstagare som
  arbetar på flera arbetsställen avgör den organisatoriska hemvisten, om
  det inte tydligt framgår på annat sätt.
- **Förvaltningsområde**: organisatoriskt begrepp frikopplat från den
  politiska nämndstrukturen. Ett organisatoriskt område med egen budget
  och egen chef. Har arbetsgivaren en enda förvaltning med självständiga
  verksamhetsområden under sig är det dessa som utgör förvaltningsområde
  i avtalets mening.
- **Ort**: samma som ortsbegreppet i 22 § LAS enligt AD:s praxis.
  Kommentaren hänvisar till AD 1984 nr 4, AD 1984 nr 59 och AD 1993 nr 99.
  → Dessa tre bör läsas innan ortsbegreppet får hjälptext i UI:t.

---

## KVARSTÅENDE

### 1. Parallella/överlappande anställningsperioder (anstallningstid.js)
ANTAGANDE: en kalenderdag räknas aldrig dubbelt även om arbetstagaren haft
två samtidiga anställningar hos arbetsgivaren (t.ex. deltid +
timanställning). Ingen AD-praxis som prövar frågan har hittats. Motorn slår
samman intervallen och sätter flaggan `OVERLAPPANDE_PERIODER_SAMMANSLAGNA`
så att fallet alltid syns.
→ Verifiera i JUNO-kommentaren till 3 § LAS.

*Not:* RiB-fallet (ny punkt 10) är ett belagt specialfall av just
dubbelanställning, men med motsatt utfall — där ska tiden inte räknas alls.

### 3. Tremånadersspärrens gränsdag (regelset.js, endast REN_LAS)
TOLKNING: dagen exakt tre månader efter föregående uppsägning är fortfarande
spärrad; först dagen därpå är fri. Lagtexten ("inom tre månader efter") är
inte entydig på dagsnivå. Berör bara jämförelseläget — AB Mom. 2 undantar
22 § andra stycket helt, vilket nu är verifierat i primärkälla.

### 4. Spärrens starttidpunkt (regelset.js, endast REN_LAS)
Fristen räknas från datum för föregående uppsägning där undantag gjordes
(fältet `senasteUppsagningMedUndantag`). 22 § andra stycket talar om
uppsägning som sker inom tre månader efter att den första uppsägningen
skett — vid flera uppsägningstillfällen i samma arbetsbristomgång kan
startpunkten diskuteras. Manuell inmatning, ingen härledning.

### 5. Tillgodoräknande och avtalade inskränkningar (anstallningstid.js)
TIDIGARE FELAKTIGT påstående (struket): att AD 2011 nr 3 skulle förbjuda
avtalsvillkor som minskar tillgodoräkningsbar tid. Verifiering i fulltext
visar det motsatta: AD avslog förbundets talan och godtog att en
kollektivavtalad förmån (förlängd uppsägningstid) villkorades av
sammanhängande tid hos samma juridiska person, utan tillgodoräknande av
överlåtartid, eftersom förmånen inte förelåg vid övergången (6 b § LAS /
Collino C-343/98). Målet rör dessutom uppsägningstid enligt avtal, inte
3 §/22 §-beräkning för turordning.

**Modellbeslutet är nu överspelat.** Motorn saknade avdrags- och
inskränkningsfält med motiveringen att ingen avtalad avvikelse var belagd
i AB. AB § 35 Mom. 1 anmärkning 3 är en sådan avvikelse — se punkt 10.
Fältet behöver alltså införas.

### 6. Avtalsturlistans giltighet (avtalsturlista.js)
Motorn diffar endast; den värderar ALDRIG om en avtalsturlista håller
rättsligt (diskriminerings- och god sed-prövningen). Rättsfallsstöd för
god sed-gränsen (AD 1983 nr 107-linjen) är INTE verifierat i öppna källor
— kontrollera i JUNO innan det citeras i verktygets hjälptexter.

*Tillägg efter verifiering:* AB § 35 Mom. 5 ger uttryckligt utrymme för
lokala kollektivavtal om avvikelse från hela bestämmelsen. Kommentaren
(s. 185) nämner särskilt att lokala avtal kan träffas om andra
turordningskretsar, sammanläggning av fler driftsenheter än avtalet anger,
och lokala definitioner av begreppet driftsenhet. UI:t bör ha en flagga
som frågar om lokalt avtal finns, eftersom ett sådant kan sätta motorns
samtliga AB-regler ur spel.

### 9. Utanför scope, medvetet
- KOM-KR/TLO (tidig lokal omställning) — processteg före turordning,
  ej beräkning. Beslut om UI-plats utestående.
- Företrädesrätt till återanställning — egen modul i senare fas.
  *Underlaget är nu verifierat och sammanfattat i punkt 13.*
- Uppsägningstidens förläggning för föräldralediga (11 § tredje stycket
  LAS) — påverkar inte turordningen, men bör bli en informationsflagga.

---

## NYA — MODELLBRISTER SOM VERIFIERINGEN BLOTTLADE

### 10. RiB-tid ska inte tillgodoräknas (anstallningstid.js) — BELAGD
AB § 35 Mom. 1 anmärkning 3: anställningstid intjänad enligt
kollektivavtalet RiB tillgodoräknas inte tidsmässigt vid tillämpning av
22 § LAS. Kommentaren (s. 177) preciserar: gäller arbetstagare som har
anställning som beredskapsbrandman enligt RiB och samtidigt har sin
huvudanställning hos samma arbetsgivare.

Motsvarande gäller vid 25 § LAS enligt Mom. 4 a — anställningstiden
tillgodoräknas i övrigt enligt LAS.

ÅTGÄRD: inför ett fält för avtalad inskränkning per period, med RiB som
första — och tills vidare enda — belagda fall. Inte ett generellt
avdragsfält som handläggaren kan fylla fritt, utan en uppräkning som kan
utökas när fler avvikelser beläggs.

### 11. Sammanläggningstaket är inte bara tre (krets.js) — BELAGD
Motorn kodar taket som högst tre driftsenheter. Det är ofullständigt.

Kommentaren (s. 178) och exempel 35:2: berör arbetsbristen fler än tre
driftsenheter får sammanläggning ske med ytterligare driftsenheter upp
till närmaste antal som är delbart med tre — och resultatet blir då
**flera separata turordningskretsar**, ett kluster per tre enheter.

Exemplets utfall: arbetsbrist på fyra driftsenheter → högst två
ytterligare får läggas till → sex enheter totalt → två kluster om tre →
två separata turordningskretsar.

Vidare: de tre enheterna räknas **inklusive** den driftsenhet där
arbetsbristen uppstått.

ÅTGÄRD: klusterbildningen måste modelleras. Motorn kan inte välja hur
enheterna fördelas mellan klustren — det är ett partsbeslut respektive
arbetsgivarbeslut. Motorn ska beräkna taket, validera att inmatad
gruppering håller sig inom det, och i övrigt kräva manuellt beslut.

### 12. Tiodagarsfristen är en tillståndsmaskin, inte en timer (krets.js)
Grundregeln (Mom. 1): begär berörd arbetstagarorganisation sammanläggning
ska sådan göras. Har samtliga berörda organisationer inte enats om **och**
inom tio kalenderdagar från dagen för första förhandlingstillfället
meddelat arbetsgivaren vilka driftsenheter som ska läggas samman, beslutar
arbetsgivaren. Organisationerna måste enas om både antalet och vilka
specifika enheter, annars beslutar arbetsgivaren fritt.

**Fristen kan starta om.** Kommentaren (s. 181 och 182): drar en
sammanläggning in arbetstagare från en organisation som inte tidigare var
berörd blir den förhandlingsberättigad enligt 29 § LAS och därmed också
berörd i sammanläggningshänseende. Då uppkommer en ny tiodagarsfrist innan
beslutanderätten går över till arbetsgivaren.

*Berörd arbetstagarorganisation* definieras som kollektivavtalsbärande
organisation som har medlemmar i turordningskretsen.

ÅTGÄRD: modellera som tillstånd med möjlig omstart, inte som ett enda
datum. Varje omstart ska loggas i beslutsloggen med orsak.

### 13. Enmanskretsar spränger taket (krets.js) — BELAGD
Två separata undantag, båda gäller **enbart för den befattning som utgör
enmanskretsen**:

a) Identifieras en enmanskrets efter sammanläggning **som beslutats av
   arbetsgivaren** ska på begäran av berörd facklig organisation
   sammanläggning ske av **samtliga** driftsenheter inom förvaltningen på
   orten. Inget tak om tre.

b) Identifieras en enmanskrets i en situation där det **endast finns en
   driftsenhet** inom förvaltningen på orten kan berörd facklig
   organisation begära sammanläggning av upp till tre driftsenheter inom
   förvaltningen i arbetsgivarens **hela verksamhet** — alltså utan
   ortsbegränsning.

Notera villkoret i a): undantaget är knutet till att sammanläggningen
beslutats av arbetsgivaren, vilket i sin tur förutsätter att facken inte
enats inom tiodagarsfristen. Punkterna 11, 12 och 13 hänger alltså ihop
och bör modelleras tillsammans.

### 14. Kretsindelningens innehållskriterium behöver ett stöd i UI:t
Kretsen bildas av befattningar med **i huvudsak jämförbara
arbetsuppgifter** inom samma förvaltningsområde på driftsenheten, oavsett
facklig tillhörighet. Oorganiserade och arbetstagare i organisation som
arbetsgivaren saknar kollektivavtal med ingår också i kretsen.

Bedömningen är skönsmässig och ska förbli ett manuellt beslut. Men
kommentaren (s. 177) ger konkreta hållpunkter som bör presenteras för
handläggaren vid beslutstillfället:

- Det faktiska innehållet jämförs, inte yrkes- eller
  befattningsbenämningen.
- Skälig upplärningstid ska beaktas. Kan innehavarna efter sådan tid
  utföra samtliga arbetsuppgifter i de jämförda befattningarna är de
  i huvudsak jämförbara.
- Enligt AD:s praxis är utbildningstid **överstigande sex månader**
  typiskt sett inte att betrakta som skälig och rimlig inlärningstid.
- För legitimationsyrken ska legitimation, behörighet och specialistexamen
  beaktas vid indelningen.
- Arbetstagare med befattningen lärare anses alltid ha i huvudsak
  jämförbara arbetsuppgifter och turordnas tillsammans inom
  driftsenheten. Kravet på tillräckliga kvalifikationer upprätthålls
  ändå inom kretsen, med hänsyn till legitimation, behörighet och
  specialistkompetens.

ÅTGÄRD: ingen beräkningsändring. Hållpunkterna in som beslutsstöd vid
kvalifikations- och kretsbeslut, med sexmånadersregeln synlig.

---

## ATT VERIFIERA HÄRNÄST

- AD 1984 nr 4, AD 1984 nr 59, AD 1993 nr 99 — ortsbegreppet (punkt 8).
- JUNO-kommentaren till 3 § LAS — dubbelräkning vid parallella
  anställningar (punkt 1).
- AD 1983 nr 107-linjen — god sed vid avtalsturlista (punkt 6).
- Cirkulär 20:23 med parternas gemensamma kommentar om turordning och
  företrädesrätt. Kommentaren till § 35 hänvisar till den som bilaga;
  den har inte lästs och kan innehålla ytterligare tillämpningsanvisningar.

## UNDERLAG FÖR SENARE FAS: FÖRETRÄDESRÄTT (Mom. 4)

Sammanfattat men inte modellerat. Relevant när modulen byggs:

- Anmälan om anspråk ska vara **skriftlig** och ha kommit in senast **en
  månad** efter att anställningen upphört. Har anmälan inte gjorts
  föreligger ingen företrädesrätt. Hård formregel, lämpad för motorn.
- **För regioner** gäller företrädesrätten, oavsett avtalsområde, på
  samma ort och inom samma förvaltningsområde där arbetstagaren senast
  var verksam. För kommuner och Sobona-medlemmar gäller motsvarande men
  utan ortsbegränsning.
- Avgränsningen är befattningar vars kvalifikationskrav **i huvudsak
  motsvarar** kraven i den senaste anställningen. Kommentaren anger
  uttryckligen att detta är en **vidare** bedömning än "i huvudsak
  jämförbara arbetsuppgifter" i Mom. 1 — de två begreppen får inte
  modelleras som samma sak.
- Bedömningen avser kvalifikationskraven för arbetet generellt, inte om
  arbetstagaren har tillräckliga kvalifikationer för den specifika
  befattningen. Den prövningen görs i ett senare led.
- Undantag: vikariat kortare än 14 kalenderdagar; arbete som behöver
  disponeras för omplacering enligt 7 § andra stycket LAS, förflyttning
  enligt AB § 6, eller höjd sysselsättningsgrad enligt AB § 5 mom. 2 b);
  samt anställningar enligt AB § 4 mom. 2 och mom. 3 b) och c).
- RiB-tid räknas inte heller här (se punkt 10).
