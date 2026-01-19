# PriceFlow - Logikai Rendszerek PRD

**Verzió:** 1.0
**Dátum:** 2026-01-18
**Státusz:** Tervezés

---

## 1. Összefoglaló

Ez a dokumentum a PriceFlow Shopify alkalmazás árszámítási és termék-személyreszabási logikáinak megvalósítási tervét tartalmazza. A cél egy rugalmas, sablonokra épülő rendszer, amely lehetővé teszi összetett árazási szabályok definiálását admin felületen, és azok megjelenítését a storefront widgeten keresztül.

---

## 2. Meglévő Architektúra (Amit Építünk)

### 2.1 Backend (NestJS API)
- **Template domain**: Sablonok CRUD, mezők kezelése
- **Pricing domain**: Árszámítás mathjs képletekkel
- **Assignment domain**: Sablonok hozzárendelése scope alapján (PRODUCT/COLLECTION/VENDOR/TAG/GLOBAL)
- **Draft Order domain**: Shopify draft order létrehozása egyedi árral

### 2.2 Frontend
- **Admin app**: Shopify beágyazott admin (Next.js + Polaris)
- **Storefront widget**: Theme App Extension (Next.js)

### 2.3 Adatmodell (Már létezik)
- `Template` - Árszámítási sablon képlettel
- `TemplateField` - Dinamikus mezők (NUMBER, TEXT, SELECT, RADIO, CHECKBOX, FILE)
- `Assignment` - Sablon hozzárendelések prioritással
- `Calculation` - Kalkuláció történet

---

## 3. Megvalósítandó Logikák

### 3.1 Kötelező és Nem Kötelező Mezők

**Leírás:** Minden mezőnél beállítható, hogy a vevő csak kitöltés után viheti tovább a rendelést.

**Megvalósítási irány:**
- A `TemplateField.required` mező **már létezik** a sémában
- Admin: Kapcsoló minden mezőhöz a sablon szerkesztőben
- Storefront:
  - Kötelező mezők `*` jellel és "(kötelező)" felirattal
  - "Kosárba" gomb disabled amíg nincs kitöltve
  - Validáció kliens és szerveroldalon is

**Érintett komponensek:**
- Admin: TemplateFieldEditor komponens
- Storefront: ProductConfigurator widget
- API: Pricing endpoint validáció

---

### 3.2 Magyarázó Szöveg és Képek

**Leírás:** Minden mezőhöz csatolható segítő szöveg és kép(ek).

**Megvalósítási irány:**
- `TemplateField.helpText` és `helpContent` **már létezik**
- `helpContent` JSON struktúra bővítése:
  ```
  {
    "text": "Magyarázó szöveg...",
    "images": ["s3://bucket/path/image1.jpg"],
    "video": "https://youtube.com/..."  // opcionális
  }
  ```
- Admin: Rich text editor + képfeltöltés minden mezőhöz
- Storefront: Tooltip/modal a mező mellett info ikonnal

**Érintett komponensek:**
- Admin: HelpContentEditor komponens (új)
- Storefront: FieldHelpTooltip komponens (új)
- API: S3 képfeltöltés endpoint

---

### 3.3 Minimális / Maximális Rendelési Nagyság

**Leírás:** Termék/sablon szinten beállítható min/max mennyiség.

**Megvalósítási irány:**
- Új mezők a `Template` modellben:
  ```
  minQuantity: Int?
  maxQuantity: Int?
  minQuantityMessage: String?  // "Min. 5 db rendelhető"
  maxQuantityMessage: String?  // "Max. 100 db, nagyobb mennyiséghez kérj ajánlatot"
  ```
- Storefront:
  - Mennyiség input korlátozott
  - Határ túllépésénél hibaüzenet a custom message-ből
- Opcionális: Feltételes min/max (lásd 3.13)

**Érintett komponensek:**
- DB: Prisma séma bővítés
- Admin: Min/Max beállítás a sablon szerkesztőben
- Storefront: QuantitySelector komponens

---

### 3.4 Egyedi Méretezés (Magasság x Szélesség)

**Leírás:** Szám beviteli mezők min/max kerettel egyedi méretekhez.

**Megvalósítási irány:**
- `TemplateField.validation` JSON bővítése:
  ```
  {
    "min": 50,
    "max": 500,
    "step": 1,
    "unit": "cm",
    "errorMessages": {
      "min": "Minimum 50 cm szélesség szükséges",
      "max": "Maximum 500 cm szélesség rendelhető"
    }
  }
  ```
- A mezők értékei bekerülnek a képlet kontextusba (`width_cm`, `height_cm`)
- Storefront: Number input validációval, unit megjelenítéssel

**Érintett komponensek:**
- Admin: NumberFieldConfig komponens
- Storefront: DimensionInput komponens (új)

---

### 3.5 Területalapú Árszámítás (Négyzetméter)

**Leírás:** Alapanyag kiválasztása + méret megadása = négyzetméter ár.

**Megvalósítási irány:**
- Ez **képlettel megoldható**, a meglévő rendszerrel:
  ```
  (width_cm * height_cm / 10000) * material_price_m2
  ```
- Admin:
  - SELECT típusú mező az alapanyagokhoz, ahol minden opció tartalmaz árat
  - A kiválasztott opció értéke (`material_price_m2`) bekerül a képletbe
- Storefront: Valós idejű ár frissítés méret változtatáskor

**Példa sablon konfiguráció:**
```
Mezők:
- material (SELECT): [{"label": "PVC", "value": 5000}, {"label": "Textil", "value": 8000}]
- width_cm (NUMBER): min 50, max 500
- height_cm (NUMBER): min 50, max 300

Képlet: (width_cm * height_cm / 10000) * material
```

---

### 3.6 Konfekcionálás - Kerület Alapú (/m)

**Leírás:** Szegés, ringlizés ára a kerület alapján.

**Megvalósítási irány:**
- **Képlettel megoldható:**
  ```
  // Szegés (Ft/m * kerület)
  hemming_price * ((width_cm + height_cm) * 2 / 100)

  // Ringlizés (25 cm-ként)
  grommet_price * floor(((width_cm + height_cm) * 2) / 25)
  ```
- Admin:
  - RADIO mező a konfekcionálás típusokhoz (nincs/szegés/ringlizés/mindkettő)
  - Minden opcióhoz tartozik ár és képletrészlet
- A választott opció aktiválja a megfelelő képletrészt

**Megjegyzés:** A `floor()` függvény **már támogatott** a formula evaluatorban.

---

### 3.7 Konfekcionálás - Terület Alapú (/m²)

**Leírás:** Ugyanaz mint 3.6, de négyzetméter alapon.

**Megvalósítási irány:**
- Képlet:
  ```
  finishing_price_m2 * (width_cm * height_cm / 10000)
  ```
- Implementáció ugyanaz mint 3.6

---

### 3.8 Fix Felárat Adó Logikák

**Leírás:** Opció kiválasztása fix összeget ad az árhoz.

**Megvalósítási irány:**
- SELECT/RADIO opciók `value` mezője tartalmazza a felárat
- Képletben egyszerűen hozzáadódik: `base_price + selected_addon`
- Admin: Opciók szerkesztése címkével és árral
- Storefront: Opciók megjelenítése az árral együtt ("Nyomtatás +2500 Ft")

---

### 3.9 Árhatást Nem Adó Logikák

**Leírás:** Személyreszabás árhatás nélkül (pl. szín választás).

**Megvalósítási irány:**
- `TemplateField.useInFormula: false` **már létezik**
- Ha `useInFormula = false`, a mező értéke nem kerül a képlet kontextusba
- A választás mentésre kerül a rendelés specifikációjában
- Storefront: Normál megjelenítés, de nincs ár kijelzés mellette

---

### 3.10 Grafika Feltöltés - Fájl Upload

**Leírás:** Vevő feltölti a kreatívját.

**Megvalósítási irány:**
- FILE típusú mező **már létezik** a sémában
- Új: S3 integráció
  - API endpoint: `POST /api/files/upload`
  - LocalStack S3 bucket dev környezetben
  - Éles AWS S3 bucket produkcióban
- Biztonsági szabályok:
  - Max fájlméret: 50MB (konfigurálható)
  - Engedélyezett típusok: PDF, PNG, JPG, AI, EPS, SVG
  - Vírusellenőrzés (AWS Lambda + ClamAV - opcionális, később)
- Admin: Fájltípus és méret korlátozás beállítása mezőnként
- Storefront: Drag & drop feltöltő, progress bar, előnézet

**Új komponensek:**
- API: FileUploadController, S3Service
- Storefront: FileUploader komponens
- Infra: S3 bucket LocalStack-ben

---

### 3.11 Grafika Feltöltés - Linkről (Felhőből)

**Leírás:** Előre feltöltött kreatívok közül választás.

**Megvalósítási irány:**
- Új entitás: `MediaLibrary`
  ```
  model MediaLibrary {
    id        String
    shopId    String
    name      String
    url       String    // S3 URL
    thumbnail String?
    category  String?   // Opcionális kategorizálás
    createdAt DateTime
  }
  ```
- Admin: Média könyvtár kezelő (feltöltés, kategorizálás, törlés)
- Storefront:
  - Feltöltés tab: Saját fájl upload
  - Könyvtár tab: Előre definiált képek grid-ben
- A kiválasztott kép URL-je mentődik a specifikációba

---

### 3.12 Feltételes Logikák - Megjelenés Feltétele

**Leírás:** Mező csak akkor jelenik meg, ha egy másik mező adott értékű.

**Megvalósítási irány:**
- `TemplateField.conditionalRules` **már létezik**
- JSON struktúra:
  ```
  {
    "showIf": {
      "field": "has_print",
      "operator": "equals",
      "value": true
    }
  }
  ```
- Támogatott operátorok: `equals`, `notEquals`, `greaterThan`, `lessThan`, `contains`, `in`
- Admin: Vizuális feltétel szerkesztő (mező kiválasztó + operátor + érték)
- Storefront: Reaktív megjelenítés - mező eltűnik/megjelenik a feltétel alapján

---

### 3.13 Feltételes Logika Árhatással

**Leírás:** Egy mező ára függ egy másik mező értékétől.

**Megvalósítási irány:**
- Kétféle megközelítés:

**A) Képlet alapú (ajánlott):**
```
// Ha prémium display, a nyomat ára 1.5x
print_price * (display_type == "premium" ? 1.5 : 1)
```

**B) Opciók árai feltételesen (bonyolultabb):**
- Minden SELECT/RADIO opció tartalmazhat feltételes árakat:
```
{
  "label": "Nyomtatás",
  "prices": [
    {"condition": {"field": "display_type", "equals": "basic"}, "price": 2000},
    {"condition": {"field": "display_type", "equals": "premium"}, "price": 3000}
  ]
}
```

**Ajánlás:** Az A) megközelítés egyszerűbb és a meglévő képlet rendszerrel működik.

---

### 3.14 Feltételes Min/Max Rendelési Nagyság

**Leírás:** A min/max mennyiség függ egy másik mezőtől.

**Megvalósítási irány:**
- Template szinten:
  ```
  {
    "conditionalQuantityRules": [
      {
        "condition": {"field": "has_print", "equals": false},
        "minQuantity": 10,
        "message": "Nyomat nélkül minimum 10 db rendelhető"
      },
      {
        "condition": {"field": "has_print", "equals": true},
        "minQuantity": 1
      }
    ]
  }
  ```
- Storefront: Dinamikus validáció a feltétel változásakor
- API: Validáció rendelés létrehozásakor

---

### 3.15 Sávos Kedvezmények

**Leírás:** Mennyiségi kedvezmény sávonként, termékenként számítva.

**Megvalósítási irány:**
- Új mező a `Template` modellben:
  ```
  discountTiers: Json?
  // Struktúra:
  [
    {"minQty": 1, "maxQty": 5, "discount": 0},
    {"minQty": 6, "maxQty": 9, "discount": 10},  // 10%
    {"minQty": 10, "maxQty": null, "discount": 15}  // 15%
  ]
  ```
- Pricing service:
  - A végső ár számításánál alkalmazza a mennyiségi kedvezményt
  - `finalPrice = calculatedPrice * (1 - discount/100)`
- Storefront:
  - Kedvezmény sáv megjelenítése a mennyiség választónál
  - "6+ db esetén 10% kedvezmény" jelzés
  - Ár frissül mennyiség változtatáskor
- Breakdown: Külön sor a kedvezménynek

**Fontos:** Ez termékenként működik (7 molinó = 15% a molinókra), nem kosárszinten.

---

### 3.16 Expressz Ár

**Leírás:** Gyorsított gyártás feláras opcióként.

**Megvalósítási irány:**
- Új mezők a `Template` modellben:
  ```
  hasExpressOption: Boolean  @default(false)
  expressMultiplier: Decimal?  @default(1.5)
  expressLabel: String?  // "Expressz gyártás (3 munkanap)"
  normalLabel: String?   // "Normál gyártás (7-10 munkanap)"
  ```
- Storefront:
  - RADIO választó: Normál / Expressz
  - Expressz kiválasztásakor: `végár * expressMultiplier`
  - Felirat: "Expressz: +50%"
- A választás mentődik a draft order megjegyzésébe

---

### 3.17 Megjegyzés Mező

**Leírás:** Szabadszöveges megjegyzés árhatás nélkül.

**Megvalósítási irány:**
- TEXTAREA típusú mező, `useInFormula: false`
- **Már támogatott** a jelenlegi rendszerrel
- Storefront: Multi-line text input
- A megjegyzés mentődik a draft order `note` mezőjébe

---

### 3.18 API Behívású Termékek (Malfini)

**Leírás:** Külső API-ból (pl. Malfini) jövő termékek kezelése.

**Megvalósítási irány (manuális opciók):**
- Admin: A tipikus opciókat (méretek, színek) kézzel rögzítem a sablonban
  - SELECT mező: Méretek (XS, S, M, L, XL, XXL)
  - SELECT mező: Színek (a Malfini katalógus alapján)
- Storefront:
  - Kiválasztás után API hívás a Malfini-hoz a készlet/ár ellenőrzésére
  - Ha nincs készleten, jelzés a felhasználónak
- A Malfini ár már tartalmazza a felárat (előre bekalkulálva)

**Új komponensek:**
- API: MalfiniService (külső API kliens)
- Storefront: StockChecker komponens

**Későbbi fejlesztés:** Automatikus szinkronizálás a Malfini API-val.

---

### 3.19 Kiszállítási Ár

**Leírás:** 40.000 Ft felett ingyenes szállítás.

**Megvalósítási irány:**
- **Shopify natív Shipping Rules** használata
- Nem kell egyedi fejlesztés
- Konfiguráció: Shopify Admin > Settings > Shipping and delivery
- A PriceFlow nem avatkozik bele a shipping logikába

---

## 4. Theme App Extension Integráció

### 4.1 Widget Megjelenés

**Elhelyezés:** Termékoldal, "Add to Cart" gomb felett/helyett

**Blokkok:**
1. **PriceFlow Configurator** - Fő konfigurátor widget
2. **PriceFlow Price Display** - Csak ár megjelenítés (opcionális elhelyezés)
3. **PriceFlow Mini Cart** - Kosár összegző egyedi árakkal

### 4.2 Kommunikáció

```
Storefront Widget <---> PriceFlow API <---> Shopify Admin API
                                      <---> PostgreSQL
                                      <---> S3 (fájlok)
```

### 4.3 Kosár Integráció

- A standard "Add to Cart" lecserélése egyedi flow-ra
- LocalStorage: Ideiglenes konfiguráció tárolás
- Draft Order: Végleges rendelés egyedi árral
- Cart átirányítás a draft order checkout URL-re

---

## 5. Admin Felület Tervezés

### 5.1 Fő Menüpontok

1. **Sablonok** - Árszámítási sablonok kezelése
2. **Hozzárendelések** - Sablonok termékekhez rendelése
3. **Média Könyvtár** - Előre feltöltött kreatívok
4. **Beállítások** - Globális konfigurációk

### 5.2 Sablon Szerkesztő

**Általános beállítások:**
- Név, leírás
- Min/Max rendelési mennyiség
- Feltételes min/max szabályok
- Sávos kedvezmények
- Expressz opció

**Mező szerkesztő:**
- Típus kiválasztás
- Címke, placeholder
- Kötelező kapcsoló
- Validációs szabályok (min/max/step)
- Magyarázó tartalom (szöveg + képek)
- Feltételes megjelenés szabályok
- Használat képletben (igen/nem)

**Képlet szerkesztő:**
- Szöveges képlet bevitel
- Elérhető változók listája (mezőkből)
- Szintaxis ellenőrzés
- Teszt kalkulátor (próba értékekkel)

---

## 6. Prioritási Sorrend

### Fázis 1 - Alapok (MVP)
1. Admin sablon szerkesztő UI
2. Storefront konfigurátor widget
3. Kötelező mezők validáció
4. Egyedi méretezés (szélesség x magasság)
5. Területalapú árszámítás
6. Fix felárak

### Fázis 2 - Bővítések
7. Magyarázó szövegek és képek
8. Feltételes megjelenés
9. Min/Max rendelési mennyiség
10. S3 fájl feltöltés

### Fázis 3 - Haladó funkciók
11. Sávos kedvezmények
12. Expressz ár opció
13. Média könyvtár (felhőből választás)
14. Konfekcionálás (kerület/terület alapú)

### Fázis 4 - Integrációk
15. Malfini API integráció
16. Feltételes min/max szabályok
17. Feltételes árhatások

---

## 7. Technikai Megfontolások

### 7.1 Teljesítmény
- Árszámítás kliens oldalon is (azonnali feedback)
- API validáció szerver oldalon (biztonság)
- Képletek cache-elése Redis-ben (későbbi fejlesztés)

### 7.2 Biztonság
- Fájl feltöltés: típus és méret validáció
- Képlet sandbox: mathjs restricted mode (már implementálva)
- Multi-tenant izoláció: shopId minden táblában (már implementálva)

### 7.3 Skálázhatóság
- S3 CDN a feltöltött fájlokhoz
- Stateless API (horizontális skálázás)
- PostgreSQL read replicas (ha szükséges)

---

## 8. Nyitott Kérdések

1. ~~Sávos kedvezmény: termékenként vagy kosárszinten?~~ → **Termékenként**
2. ~~Fájl tárolás: S3 vagy Shopify Files API?~~ → **AWS S3**
3. ~~Malfini integráció mélysége?~~ → **Manuális opciók, API csak készlet ellenőrzésre**
4. ~~Shipping logika?~~ → **Shopify natív**
5. ~~Widget típus?~~ → **Theme App Extension**
6. ~~Expressz ár hol választható?~~ → **Termékoldalon**

---

## 9. Függelék

### 9.1 Példa Képletek

```javascript
// Egyszerű területalapú
(width_cm * height_cm / 10000) * price_per_m2

// Kerület alapú szegés
base_price + (((width_cm + height_cm) * 2) / 100) * hemming_price_per_m

// Ringlizés 25cm-ként
base_price + floor(((width_cm + height_cm) * 2) / 25) * grommet_price

// Feltételes nyomat ár
base_price + (has_print ? print_price * (display_type == "premium" ? 1.5 : 1) : 0)

// Komplex molinó ár
(width_cm * height_cm / 10000) * material_price
+ (has_hemming ? (((width_cm + height_cm) * 2) / 100) * hemming_price : 0)
+ (has_grommets ? floor(((width_cm + height_cm) * 2) / 25) * grommet_price : 0)
```

### 9.2 Adatmodell Bővítések Összefoglalása

```prisma
// Template model bővítések
model Template {
  // ... meglévő mezők ...

  // Új mezők
  minQuantity           Int?
  maxQuantity           Int?
  minQuantityMessage    String?
  maxQuantityMessage    String?
  conditionalQtyRules   Json?
  discountTiers         Json?
  hasExpressOption      Boolean   @default(false)
  expressMultiplier     Decimal?  @default(1.5)
  expressLabel          String?
  normalLabel           String?
}

// Új model
model MediaLibrary {
  id        String   @id @default(uuid())
  shopId    String
  shop      Shop     @relation(fields: [shopId], references: [id])
  name      String
  url       String
  thumbnail String?
  category  String?
  fileSize  Int?
  mimeType  String?
  createdAt DateTime @default(now())

  @@index([shopId])
}
```

---

**Dokumentum vége**
