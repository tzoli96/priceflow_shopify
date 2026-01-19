# Dekormunka Konfigurátor - Implementációs Terv

## Tartalomjegyzék
1. [Képernyőkép Elemzés](#1-képernyőkép-elemzés)
2. [Jelenlegi Állapot](#2-jelenlegi-állapot)
3. [Hiányzó Funkciók](#3-hiányzó-funkciók)
4. [Részletes Implementációs Terv](#4-részletes-implementációs-terv)
5. [Prioritások](#5-prioritások)

---

## 1. Képernyőkép Elemzés

A `docs/images/dekormunka_pc.jpg` alapján a következő szekciók láthatók:

### 1.1 Válassz méretet! (Méret választó)
- **Szélesség dropdown** - előre definiált vagy egyedi méret
- **Magasság dropdown** - előre definiált vagy egyedi méret
- **Gyorsgombok** - előre definiált méretek chips formában (100x50 cm, 500x100 cm, stb.)

### 1.2 Válassz molinó alapanyagot! (Anyag választó - KÁRTYA STÍLUS)
- **4 kártya** képekkel és leírással
- Minden kártya tartalmaz:
  - Kép/ikon
  - Cím (Standard molinó, Fénylátta, stb.)
  - Felsorolás pontokkal (tulajdonságok)
  - Ár ("XXX Ft-tól")
- **Radio-szerű viselkedés** - csak egy választható

### 1.3 Összegzés (Jobb oldali sidebar)
- Méret megjelenítés
- Molinó alapanyag
- Konfekcionálás
- Zsugás
- Mennyiség
- Árkalkuláció dátum
- Normál / Expressz
- Grafika
- Megjegyzés
- **Végösszeg kiemelve**

### 1.4 Válassz konfekcionálást! (Szegély/él kezelés)
- **6 kártya** képekkel
- Minden opció vizuális megjelenítése
- Ár minden opcióhoz
- Radio-szerű viselkedés

### 1.5 Válassz zsugászt! (Bújtatás típus)
- **Több kártya** különböző bújtatós típusokhoz
- Képek a különböző méretekhez/stílusokhoz
- Árak megjelenítése

### 1.6 Válassz extrát! (Kiegészítők)
- **Checkbox típusú** opciók
- "Szélítékkel" checkbox
- Banner magyarázó szöveggel
- Opcionális felár

### 1.7 Válassz mennyiséget!
- **+/- gombok** mennyiség állításhoz
- **Gyorsgombok**: 1 db, 5 db, 10 db
- Közvetlen szám bevitel

### 1.8 Válassz átfutási időt!
- **Normál** - alapértelmezett
- **Expressz** - gyorsított (felár)
- Mindkettőhöz szállítási idő kiírva

### 1.9 Válassz grafikát!
- **Radio opciók**:
  - "Feltöltöm most"
  - "Grafikai tervezést kérek"
  - "Később töltöm fel"
- **Fájl feltöltés** drag & drop területtel
- Fájl formátum és méret információk

### 1.10 Adj meg megjegyzést!
- **Szöveges mező** egyedi kérésekhez
- Karakterszám kijelzés

---

## 2. Jelenlegi Állapot

### 2.1 ✅ AMI MÁR MŰKÖDIK

#### Admin App
| Funkció | Státusz | Megjegyzés |
|---------|---------|------------|
| NUMBER mező típus | ✅ Kész | Min/max/step validációval |
| TEXT mező típus | ✅ Kész | Placeholder, helpText támogatás |
| TEXTAREA mező típus | ✅ Kész | Többsoros bevitel |
| SELECT mező típus | ✅ Kész | Opciók árfelárakkal |
| RADIO mező típus | ✅ Kész | Opciók árfelárakkal |
| CHECKBOX mező típus | ✅ Kész | Egyszerű igen/nem |
| FILE mező típus | ⚠️ Részleges | Típus létezik, backend hiányzik |
| Mennyiség korlátok | ✅ Kész | Min/max + üzenetek |
| Sávos kedvezmények | ✅ Kész | JSON struktúra |
| Expressz opció | ✅ Kész | Szorzó + címkék |
| Megjegyzés mező | ✅ Kész | Címke + placeholder |
| Képlet szerkesztő | ✅ Kész | Rendszer változók + függvények |
| Sablon hatókör | ✅ Kész | Product/Collection/Vendor/Tag/Global |

#### Storefront App
| Funkció | Státusz | Megjegyzés |
|---------|---------|------------|
| Mező renderelés | ✅ Kész | Mind a 7 típus |
| Mennyiség választó | ✅ Kész | +/- gombok, validáció |
| Expressz választó | ✅ Kész | Radio toggle, ár megjelenítés |
| Kedvezmény kijelzés | ✅ Kész | Aktuális sáv kiemelése |
| Ár megjelenítés | ✅ Kész | Összegzés, lebontás |
| Kosárba helyezés | ✅ Kész | postMessage kommunikáció |
| Ár kalkuláció | ✅ Kész | API hívás, formula kiértékelés |

#### API
| Funkció | Státusz | Megjegyzés |
|---------|---------|------------|
| Sablon CRUD | ✅ Kész | Create/Read/Update/Delete |
| Ár kalkuláció endpoint | ✅ Kész | Formula kiértékelés |
| Rendszer változók | ✅ Kész | base_price, quantity |
| Matematikai függvények | ✅ Kész | floor, ceil, round, min, max, if, abs, sqrt, pow |
| Formula validáció | ✅ Kész | Biztonsági ellenőrzés |

### 2.2 ⚠️ AMI RÉSZLEGESEN KÉSZ

| Funkció | Állapot | Hiány |
|---------|---------|-------|
| Fájl feltöltés | Típus kész | S3 integráció, backend endpoint |
| Feltételes mezők | Séma kész | UI logika implementáció |
| Help tartalom képekkel | Típus kész | Admin UI + Storefront renderelés |
| Opció képek | Struktúra bővíthető | Képes kártya UI |

### 2.3 ❌ AMI TELJESEN HIÁNYZIK

| Funkció | Prioritás | Komplexitás |
|---------|-----------|-------------|
| **Kártya stílusú választó (képekkel)** | 🔴 Magas | Közepes |
| **Előre definiált méret gyorsgombok** | 🟡 Közepes | Alacsony |
| **Összegzés sidebar** | 🔴 Magas | Közepes |
| **Fájl feltöltés backend** | 🔴 Magas | Magas |
| **Grafika típus választó** | 🟡 Közepes | Közepes |
| **Drag & drop feltöltés UI** | 🟡 Közepes | Közepes |
| **Szekció összecsukhatóság** | 🟢 Alacsony | Alacsony |
| **Progresszív form (lépések)** | 🟢 Alacsony | Közepes |

---

## 3. Hiányzó Funkciók Részletesen

### 3.1 Kártya Stílusú Választó (IMAGE_CARD típus)

**Mit kell csinálni:**
A jelenlegi RADIO/SELECT mezőket ki kell egészíteni egy új megjelenítési móddal, ahol:
- Minden opció egy kártya
- Kép/ikon megjelenítése
- Cím és leírás
- Ár megjelenítése
- Vizuális kijelölés (border/háttér)

**Szükséges változtatások:**

```typescript
// apps/admin/types/template.ts - FieldOption bővítése
export interface FieldOption {
  label: string;
  value: string;
  price?: number;
  // ÚJ MEZŐK:
  imageUrl?: string;        // Kép URL (S3)
  description?: string;     // Hosszabb leírás
  features?: string[];      // Felsorolás pontok
}

// ÚJ: Mező megjelenítési stílus
export type FieldDisplayStyle = 'default' | 'card' | 'chip';

// TemplateField bővítése
export interface TemplateField {
  // ... meglévő mezők
  displayStyle?: FieldDisplayStyle;  // Megjelenítési stílus
}
```

**Admin UI változások:**
- FieldEditor: Opció szerkesztő kibővítése kép feltöltéssel
- FieldEditor: Megjelenítési stílus választó (default/card/chip)

**Storefront UI változások:**
- Új komponens: `CardSelector.tsx`
- ConfiguratorField: displayStyle alapján komponens választás

---

### 3.2 Előre Definiált Értékek (Gyorsgombok/Chips)

**Mit kell csinálni:**
NUMBER és egyéb mezőkhöz előre definiált értékek, amiket egy kattintással ki lehet választani.

**Szükséges változtatások:**

```typescript
// TemplateField bővítése
export interface TemplateField {
  // ... meglévő mezők
  presetValues?: PresetValue[];  // Előre definiált értékek
}

export interface PresetValue {
  label: string;    // "100 x 50 cm"
  value: number | string | Record<string, number>;  // Egyszerű vagy összetett érték
}
```

**Példa használat:**
```json
{
  "key": "dimensions",
  "presetValues": [
    { "label": "100 x 50 cm", "value": { "width": 100, "height": 50 } },
    { "label": "500 x 100 cm", "value": { "width": 500, "height": 100 } }
  ]
}
```

---

### 3.3 Összegzés Sidebar

**Mit kell csinálni:**
Jobb oldalon sticky összegzés panel, ami valós időben mutatja:
- Minden kiválasztott opciót
- Árat lebontva
- Végösszeget kiemelve

**Szükséges változtatások:**

```typescript
// Új komponens: apps/storefront/components/pricing/ConfigSummary.tsx
interface ConfigSummaryProps {
  template: TemplateInfo;
  fieldValues: Record<string, any>;
  priceResult: PriceCalculationResult | null;
  quantity: number;
  isExpress: boolean;
  notes: string;
}
```

**Layout változás:**
```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCT PAGE                             │
├─────────────────────────────────┬───────────────────────────┤
│                                 │                           │
│   KONFIGURÁTOR FORM             │    ÖSSZEGZÉS SIDEBAR     │
│   (Scrollable)                  │    (Sticky)              │
│                                 │                           │
│   - Méret választó              │    Méret: 100x50 cm      │
│   - Anyag választó              │    Anyag: Standard       │
│   - Konfekcionálás              │    Konfekció: Zsebelt    │
│   - Mennyiség                   │    Mennyiség: 5 db       │
│   - Grafika                     │    ──────────────────     │
│   - Megjegyzés                  │    Részösszeg: 25,000 Ft │
│                                 │    Kedvezmény: -10%      │
│                                 │    ══════════════════     │
│                                 │    VÉGÖSSZEG: 22,500 Ft  │
│                                 │                           │
│                                 │    [KOSÁRBA]             │
│                                 │                           │
└─────────────────────────────────┴───────────────────────────┘
```

---

### 3.4 Fájl Feltöltés Backend

**Mit kell csinálni:**
Teljes fájl feltöltés implementáció:
- S3 bucket konfiguráció
- Presigned URL generálás
- Fájl validáció (méret, típus)
- Feltöltés progress
- Feltöltött fájlok listázása

**Szükséges változtatások:**

```typescript
// API endpoint: POST /api/uploads/presigned-url
// Request: { filename: string, contentType: string, templateId: string }
// Response: { uploadUrl: string, fileKey: string }

// API endpoint: POST /api/uploads/confirm
// Request: { fileKey: string, originalName: string }
// Response: { fileUrl: string, fileId: string }
```

**Új szolgáltatások:**
- `apps/api/src/domains/upload/upload.service.ts`
- `apps/api/src/domains/upload/upload.controller.ts`
- S3 client konfiguráció

---

### 3.5 Grafika Típus Választó

**Mit kell csinálni:**
Speciális mező típus a grafika kezeléshez:
- "Feltöltöm most" - fájl feltöltés megjelenik
- "Grafikai tervezést kérek" - extra szolgáltatás (felár)
- "Később töltöm fel" - nincs feltöltés

**Megvalósítás:**
Ez egy RADIO mező speciális viselkedéssel, ahol az érték alapján más UI jelenik meg.

```typescript
// Feltételes mező megjelenítés
{
  key: "graphic_option",
  type: "RADIO",
  options: [
    { label: "Feltöltöm most", value: "upload_now" },
    { label: "Grafikai tervezést kérek", value: "design_service", price: 5000 },
    { label: "Később töltöm fel", value: "upload_later" }
  ]
}

{
  key: "graphic_file",
  type: "FILE",
  conditionalRules: {
    showIf: { field: "graphic_option", operator: "equals", value: "upload_now" }
  }
}
```

---

### 3.6 Szekció Összecsukhatóság

**Mit kell csinálni:**
Minden konfigurátor szekció összecsukható legyen:
- Fejléc sorszámmal és címmel
- Összegzés a kiválasztott értékről csukott állapotban
- Nyíl ikon a nyitás/záráshoz

**Új komponens:**
```typescript
// apps/storefront/components/ui/CollapsibleSection.tsx
interface CollapsibleSectionProps {
  number: number;
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}
```

---

## 4. Részletes Implementációs Terv

### Fázis 1: Alapvető UI Fejlesztések (1-2 hét)

#### 1.1 Kártya Stílusú Választó
**Fájlok:**
- `apps/admin/types/template.ts` - FieldOption bővítése
- `apps/admin/components/templates/FieldEditor.tsx` - Opció szerkesztő UI
- `apps/storefront/components/pricing/CardSelector.tsx` - ÚJ
- `apps/storefront/components/pricing/ConfiguratorField.tsx` - Módosítás

**Lépések:**
1. FieldOption interface bővítése (imageUrl, description, features)
2. FieldDisplayStyle típus hozzáadása
3. Admin FieldEditor: kép URL mező + leírás + felsorolás szerkesztő
4. Storefront CardSelector komponens létrehozása
5. ConfiguratorField: displayStyle alapján CardSelector használata

#### 1.2 Összegzés Sidebar
**Fájlok:**
- `apps/storefront/components/pricing/ConfigSummary.tsx` - ÚJ
- `apps/storefront/components/pricing/ProductConfigurator.tsx` - Layout módosítás

**Lépések:**
1. ConfigSummary komponens létrehozása
2. ProductConfigurator layout átalakítása (2 oszlop: form + sidebar)
3. Sticky pozícionálás CSS
4. Valós idejű összegzés frissítés

#### 1.3 Gyorsgombok/Preset Values
**Fájlok:**
- `apps/admin/types/template.ts` - PresetValue típus
- `apps/admin/components/templates/FieldEditor.tsx` - Preset szerkesztő
- `apps/storefront/components/pricing/PresetChips.tsx` - ÚJ

**Lépések:**
1. PresetValue interface létrehozása
2. Admin UI preset értékek szerkesztéséhez
3. Storefront PresetChips komponens
4. Integráció a NUMBER mezővel

### Fázis 2: Fájl Feltöltés (1 hét)

#### 2.1 Backend
**Fájlok:**
- `apps/api/src/domains/upload/upload.module.ts` - ÚJ
- `apps/api/src/domains/upload/upload.service.ts` - ÚJ
- `apps/api/src/domains/upload/upload.controller.ts` - ÚJ
- `apps/api/src/config/s3.config.ts` - ÚJ

**Lépések:**
1. S3 client konfiguráció
2. Presigned URL generálás endpoint
3. Fájl validáció (típus, méret)
4. Upload confirm endpoint

#### 2.2 Frontend
**Fájlok:**
- `apps/storefront/components/ui/FileUploader.tsx` - ÚJ
- `apps/storefront/lib/api/endpoints/upload.ts` - ÚJ

**Lépések:**
1. Drag & drop UI komponens
2. Upload progress megjelenítés
3. Feltöltött fájl előnézet
4. Hibakezelés

### Fázis 3: Feltételes Mezők (3-4 nap)

#### 3.1 Logika Implementáció
**Fájlok:**
- `apps/storefront/hooks/useConditionalFields.ts` - ÚJ
- `apps/storefront/components/pricing/ProductConfigurator.tsx` - Módosítás

**Lépések:**
1. Hook létrehozása a feltételes logikához
2. Operátorok implementálása (equals, notEquals, greaterThan, stb.)
3. Mező láthatóság számítása
4. Required státusz dinamikus kezelése

### Fázis 4: Design Finomhangolás (3-4 nap)

#### 4.1 Dekormunka Stílus
**Fájlok:**
- `apps/storefront/styles/configurator.css` - ÚJ vagy módosítás
- Minden komponens stílus frissítése

**Elemek:**
1. Magenta/pink színséma
2. Lekerekített sarkok
3. Árnyékok és hover effektek
4. Tipográfia
5. Spacing és padding

#### 4.2 Összecsukható Szekciók
**Fájlok:**
- `apps/storefront/components/ui/CollapsibleSection.tsx` - ÚJ

**Lépések:**
1. Komponens létrehozása
2. Animáció (slide down/up)
3. Sorszám és cím megjelenítés
4. Összegzés csukott állapotban

---

## 5. Prioritások

### 🔴 KRITIKUS (Első 1-2 hét)
1. **Kártya stílusú választó** - A legfontosabb vizuális elem
2. **Összegzés sidebar** - Felhasználói élmény szempontjából kritikus
3. **Design implementáció** - Dekormunka 1:1 kinézet

### 🟡 FONTOS (2-3. hét)
4. **Fájl feltöltés backend** - Grafika feltöltéshez kell
5. **Gyorsgombok/Preset values** - Méret választó gyorsításához
6. **Feltételes mezők** - Grafika opció működéséhez

### 🟢 KIEGÉSZÍTŐ (4+ hét)
7. **Összecsukható szekciók** - Nice to have
8. **Help content képekkel** - Dokumentáció jellegű
9. **Progresszív form** - Opcionális UX javítás

---

## 6. Technikai Megjegyzések

### Prisma Migráció Szükséges
```prisma
// TemplateField model bővítése
model TemplateField {
  // ... meglévő mezők
  displayStyle    String?   // 'default' | 'card' | 'chip'
  presetValues    Json?     // PresetValue[]
}
```

### API DTO Frissítések
- CreateTemplateFieldDto
- UpdateTemplateFieldDto
- TemplateFieldResponseDto

### Új API Endpointok
- `POST /api/uploads/presigned-url`
- `POST /api/uploads/confirm`
- `GET /api/uploads/:id`
- `DELETE /api/uploads/:id`

### Környezeti Változók (S3)
```env
AWS_REGION=eu-central-1
AWS_S3_BUCKET=priceflow-uploads
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

---

## Összefoglalás

A jelenlegi implementáció **jó alapot** ad:
- Mező típusok és validáció kész
- Ár kalkuláció működik
- Express/Normal opció kész
- Kedvezmények működnek
- Kosár integráció kész

**Fő fejlesztési területek:**
1. **Vizuális komponensek** - Kártya választó, összegzés sidebar
2. **Fájl kezelés** - S3 integráció, feltöltés UI
3. **Feltételes logika** - Mezők közötti függőségek
4. **Design** - Dekormunka 1:1 megjelenés

Becsült összesített fejlesztési idő: **3-4 hét**
