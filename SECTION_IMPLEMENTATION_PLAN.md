# Szekció-alapú Template Rendszer - Implementációs Terv

## Összefoglaló

A jelenlegi flat mező struktúra helyett szekció-alapú rendszert vezetünk be, ahol minden szekciónak saját title-je és layout-ja van, és a mezők szekciókba vannak csoportosítva.

---

## Implementációs Feladatok

### Fázis 1: Backend (API)

- [x] **1.1 Prisma migráció - TemplateSection tábla**
  - Új `TemplateSection` model létrehozása
  - `TemplateField` bővítése `sectionId` mezővel
  - Migráció futtatása

- [x] **1.2 Section model és DTO-k**
  - `template-section.model.ts` létrehozása
  - `CreateTemplateSectionDto` hozzáadva a `create-template.dto.ts`-hez
  - `UpdateTemplateDto` frissítve sections támogatással

- [x] **1.3 Repository frissítés**
  - Sections include a template lekéréseknél
  - CRUD műveletek szekciókhoz (save, update)

- [x] **1.4 Pricing service frissítés**
  - Szekció-alapú mező feldolgozás
  - getAllFields helper a standalone + section fields összegyűjtésére
  - sections DTO visszaadása a getTemplateForProduct-ban

---

### Fázis 2: Admin UI

- [x] **2.1 TypeScript típusok**
  - `TemplateSection` interface
  - `LayoutType` és `BuiltInSectionType` típusok

- [x] **2.2 SectionEditor komponens**
  - Modal a szekció szerkesztésére
  - Mezők kezelése a szekcióban
  - Layout választó

- [x] **2.3 SectionsList komponens**
  - Szekciók listázása
  - Fel/le mozgatás sorrend
  - Új szekció hozzáadása

- [x] **2.4 TemplateForm integrálás**
  - Szekciók kártya beépítése
  - Backward compatibility önálló mezőkkel

---

### Fázis 3: Storefront

- [x] **3.1 Típusok frissítése**
  - Section típusok (`TemplateSection`)
  - Layout típusok (`LayoutType`, `BuiltInSectionType`)

- [x] **3.2 SectionRenderer komponens**
  - Layout típus alapú renderelés
  - VERTICAL, HORIZONTAL, GRID, SPLIT, CHECKBOX_LIST

- [x] **3.3 DekormunkaConfigurator átírás**
  - Sections használat fields helyett
  - Fallback régi formátumra (backward compatibility)

---

### Fázis 4: Migráció és tesztelés

- [ ] **4.1 Meglévő template-ek konvertálása** (opcionális - backward compatible)
- [x] **4.2 TypeScript ellenőrzés**
  - API: OK
  - Admin: OK (SectionEditor, SectionsList javítva)
  - Storefront: OK

---

## Adatmodell

### TemplateSection (Prisma)

```prisma
model TemplateSection {
  id              String    @id @default(uuid())
  templateId      String
  template        Template  @relation(fields: [templateId], references: [id], onDelete: Cascade)

  key             String    // Egyedi kulcs (pl. "size", "material")
  title           String    // Megjelenő cím
  description     String?

  layoutType      String    @default("VERTICAL")  // VERTICAL|HORIZONTAL|GRID|SPLIT|CHECKBOX_LIST
  columnsCount    Int?      // GRID esetén: 2, 3, 4

  collapsible     Boolean   @default(true)
  defaultOpen     Boolean   @default(true)
  showNumber      Boolean   @default(true)

  order           Int       @default(0)
  builtInType     String?   // SIZE|QUANTITY|EXPRESS|NOTES|FILE_UPLOAD

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  fields          TemplateField[]

  @@unique([templateId, key])
  @@index([templateId])
}
```

### TemplateField módosítás

```prisma
model TemplateField {
  // ... meglévő mezők ...

  sectionId       String?   // ÚJ: Szekció referencia
  section         TemplateSection? @relation(fields: [sectionId], references: [id], onDelete: SetNull)

  @@index([sectionId])
}
```

---

## Layout típusok

| Layout | Leírás | Használat |
|--------|--------|-----------|
| `VERTICAL` | Mezők egymás alatt | Alapértelmezett |
| `HORIZONTAL` | Mezők egymás mellett | 2-3 mező egy sorban |
| `GRID` | Kártya rács | SELECT/RADIO card megjelenítés |
| `SPLIT` | Bal: inputok, Jobb: presetek | Méret választó |
| `CHECKBOX_LIST` | Checkbox kártyák leírással | Extrák |

---

## Cél szekciók (dekormunka design alapján)

| # | Szekció | Layout | Mezők |
|---|---------|--------|-------|
| 1 | Válassz méretet! | SPLIT | width, height NUMBER |
| 2 | Válassz molinó alapanyagot! | GRID (4 oszlop) | 1 SELECT card |
| 3 | Válassz konfekcionálást! | GRID (4 oszlop) | SELECT/RADIO cards |
| 4 | Válassz extrákat! | CHECKBOX_LIST | Checkbox mezők |
| 5 | Válassz mennyiséget! | BUILT-IN | - |
| 6 | Válassz átfutási időt! | BUILT-IN | - |
| 7 | Válassz grafikát! | BUILT-IN | FILE |
| 8 | Adj meg megjegyzést! | BUILT-IN | - |

---

## Backward compatibility (ELTÁVOLÍTVA)

**A rendszer már CSAK szekció-alapú struktúrát használ!**

- ~~Storefront: Ha nincs `sections`, fallback `fields`-re~~ → Eltávolítva
- ~~Admin: Önálló mezők kezelése~~ → Eltávolítva
- API: `fields` mező megtartva a price calculatorhoz (szekciókból összegyűjtve)
