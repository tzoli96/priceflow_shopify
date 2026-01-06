# PriceFlow Admin - API Végpontok Dokumentáció

## Architektúra Áttekintés

**Next.js Admin (Frontend):**
- Csak UI megjelenítés
- Shopify Polaris komponensek
- App Bridge inicializálás
- API hívások a NestJS backend-hez

**NestJS API (Backend):**
- Összes business logic
- OAuth kezelés
- Shopify API integráció
- Adatbázis műveletek
- LocalStack Secrets Manager integráció

---

## Auth Modul - Shopify OAuth

### 1. GET /api/auth

**Felelősség:** Shopify OAuth folyamat kezdeményezése

**Query Paraméterek:**
- `shop` (kötelező): Shop domain (pl. `example.myshopify.com`)

**Válasz:**
- `302 Redirect`: Shopify OAuth engedélyező oldalra
- `400 Bad Request`: Hiányzó shop paraméter
- `500 Internal Server Error`: Hiba az OAuth kezdeményezésekor

**Folyamat:**
1. Shop domain validálása
2. Shopify credentials betöltése LocalStack Secrets-ből
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `HOST`
3. OAuth authorization URL generálása
4. User átirányítása Shopify-hoz engedélyezésre

**Példa hívás:**
```
GET https://app.teszt.uk/api/auth?shop=example.myshopify.com

→ 302 Redirect to: https://example.myshopify.com/admin/oauth/authorize?client_id=...&scope=read_products,write_products&redirect_uri=...
```

**Használja:**
- Shopify App Installation flow
- User először telepíti az app-ot

---

### 2. GET /api/auth/callback

**Felelősség:** Shopify OAuth callback kezelése és access token tárolása

**Query Paraméterek (Shopify küldi automatikusan):**
- `shop`: Shop domain
- `code`: OAuth authorization code
- `hmac`: Security signature (Shopify validálja)
- `host`: Base64 encoded host parameter
- `timestamp`: Request timestamp

**Válasz:**
- `302 Redirect`: Next.js admin app-ra (`/?shop=...&host=...`)
- `500 Internal Server Error`: OAuth hiba

**Folyamat:**
1. Shopify validálja a callback-et (HMAC signature check)
2. Authorization code → Access token csere (Shopify API hívás)
3. Session adatok:
   - `shop`: Shop domain
   - `accessToken`: Offline access token (nem jár le)
   - `scope`: Engedélyezett scopok
4. Session tárolása PostgreSQL adatbázisban (`Shop` táblában)
   - Ha létezik: frissítés (update access token, reactivate)
   - Ha nem létezik: új rekord létrehozása
5. User átirányítása Next.js admin app-ra

**Adatbázis művelet:**
```sql
-- Ha shop létezik
UPDATE shops
SET access_token = '...', scope = '...', is_active = true, updated_at = NOW()
WHERE domain = 'example.myshopify.com';

-- Ha shop nem létezik
INSERT INTO shops (domain, access_token, scope, is_active, installed_at)
VALUES ('example.myshopify.com', '...', 'read_products,write_products', true, NOW());
```

**Példa hívás:**
```
GET https://app.teszt.uk/api/auth/callback?shop=example.myshopify.com&code=abc123&hmac=...&host=...

→ Session mentve DB-be
→ 302 Redirect to: https://app.teszt.uk/?shop=example.myshopify.com&host=...
```

**Használja:**
- Shopify (automatikusan hívja OAuth után)

---

### 3. GET /api/auth/config

**Felelősség:** Publikus konfiguráció (Shopify API key) visszaadása

**Query Paraméterek:** Nincs

**Válasz:**
```json
{
  "shopifyApiKey": "a2087c36b3d88c748e9e2339ebab5527"
}
```

**Folyamat:**
1. Shopify API key betöltése LocalStack Secrets Manager-ből
2. JSON válaszban visszaadás

**Fontos:** Ez egy publikus adat, nem titkos. Az App Bridge inicializálásához kell a frontend-en.

**Példa hívás:**
```bash
GET https://app.teszt.uk/api/auth/config

Response:
{
  "shopifyApiKey": "a2087c36b3d88c748e9e2339ebab5527"
}
```

**Használja:**
- Next.js App Layout (App Bridge inicializáláshoz)

---

## Shop Modul - Shop Session Kezelés

### 4. POST /api/shopify/session

**Felelősség:** Shop session tárolása vagy frissítése (már létező endpoint, de most csak OAuth callback használja)

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "shop": "example.myshopify.com",
  "accessToken": "shpat_...",
  "scope": "read_products,write_products"
}
```

**Válasz:**
```json
{
  "success": true,
  "shop": "example.myshopify.com",
  "isActive": true,
  "installedAt": "2025-12-28T10:53:00Z"
}
```

**Folyamat:**
1. Shop létezésének ellenőrzése domain alapján
2. Ha létezik:
   - Access token frissítése
   - Shop reaktiválása (`isActive = true`)
   - `updatedAt` frissítése
3. Ha nem létezik:
   - Új shop rekord létrehozása
   - `installedAt` beállítása aktuális időre
4. Válasz visszaadása

**Példa hívás:**
```bash
POST https://app.teszt.uk/api/shopify/session
Content-Type: application/json

{
  "shop": "example.myshopify.com",
  "accessToken": "shpat_abc123...",
  "scope": "read_products,write_products,read_orders"
}
```

**Használja:**
- Auth Controller (OAuth callback után)
- Webhook handlers (jövőbeli implementáció)

---

### 5. GET /api/shopify/session/:shop

**Felelősség:** Shop session lekérése

**Path Paraméterek:**
- `shop`: Shop domain

**Válasz:**
```json
{
  "success": true,
  "shop": "example.myshopify.com",
  "isActive": true,
  "installedAt": "2025-12-28T10:53:00Z"
}
```

**Hiba:**
```json
{
  "success": false,
  "error": "Shop not found"
}
```

**Folyamat:**
1. Shop keresése domain alapján
2. Ha létezik: adatok visszaadása
3. Ha nem létezik: error üzenet

**Biztonsági megjegyzés:** Access token NEM kerül visszaadásra (csak backend használja)

**Példa hívás:**
```bash
GET https://app.teszt.uk/api/shopify/session/example.myshopify.com
```

**Használja:**
- Admin dashboard (shop status ellenőrzés)

---

### 6. DELETE /api/shopify/session/:shop

**Felelősség:** Shop deaktiválása (app uninstall)

**Path Paraméterek:**
- `shop`: Shop domain

**Válasz:**
```json
{
  "success": true,
  "shop": "example.myshopify.com",
  "isActive": false,
  "installedAt": "2025-12-28T10:53:00Z"
}
```

**Folyamat:**
1. Shop keresése domain alapján
2. `isActive = false` beállítása
3. `uninstalledAt` beállítása aktuális időre
4. Adatbázis frissítése
5. Válasz visszaadása

**Fontos:** Soft delete - shop nem törlődik, csak deaktiválódik

**Példa hívás:**
```bash
DELETE https://app.teszt.uk/api/shopify/session/example.myshopify.com
```

**Használja:**
- Shopify uninstall webhook (jövőbeli implementáció)

---

## Template Modul - ✅ Implementálva

### 7. GET /api/templates

**Felelősség:** Template lista lekérése pagination-nel

**Headers:**
- `X-Shopify-Shop: example.myshopify.com` (kötelező)

**Query Paraméterek:**
- `page` (opcionális): Oldal szám (default: 1)
- `limit` (opcionális): Elemek száma oldalanként (default: 20, max: 100)
- `isActive` (opcionális): Szűrés aktív template-ekre (`true`/`false`)

**Válasz:**
```json
{
  "data": [
    {
      "id": "uuid-123",
      "shopId": "uuid-shop",
      "name": "Banner Pricing",
      "description": "Calculate banner price based on dimensions",
      "pricingFormula": "(width_cm * height_cm / 10000) * unit_m2_price",
      "pricingMeta": null,
      "scopeType": "GLOBAL",
      "scopeValues": [],
      "isActive": true,
      "fields": [
        {
          "id": "uuid-field-1",
          "key": "width_cm",
          "type": "NUMBER",
          "label": "Width (cm)",
          "required": true,
          "useInFormula": true,
          "order": 0
        },
        {
          "id": "uuid-field-2",
          "key": "height_cm",
          "type": "NUMBER",
          "label": "Height (cm)",
          "required": true,
          "useInFormula": true,
          "order": 1
        }
      ],
      "createdAt": "2025-12-28T12:00:00Z",
      "updatedAt": "2025-12-28T12:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

**Folyamat:**
1. Shop header validálás (ShopHeaderInterceptor)
2. Shop ID kiolvasása header-ből
3. Template-ek lekérése DB-ből (shop szerint szűrve)
4. Pagination alkalmazása
5. Field-ek betöltése (order szerint rendezve)
6. JSON válasz

**Példa hívás:**
```bash
GET https://app.teszt.uk/api/templates?page=1&limit=10&isActive=true
Header: X-Shopify-Shop: example.myshopify.com
```

**Használja:** Next.js Admin (Template lista oldal)

---

### 8. GET /api/templates/:id

**Felelősség:** Egy template lekérése ID alapján (field-ekkel együtt)

**Headers:**
- `X-Shopify-Shop: example.myshopify.com` (kötelező)

**Path Paraméterek:**
- `id`: Template ID (UUID)

**Válasz:** TemplateResponseDto (lásd fent)

**Hiba:**
- `404 Not Found`: Template nem található vagy másik shop-é
- `401 Unauthorized`: Hiányzó shop header

**Folyamat:**
1. Shop header validálás
2. Template keresése ID + shopId alapján (multi-tenant security)
3. Ha nem található vagy másik shop-é: 404
4. Field-ek betöltése
5. JSON válasz

**Példa hívás:**
```bash
GET https://app.teszt.uk/api/templates/uuid-123
Header: X-Shopify-Shop: example.myshopify.com
```

**Használja:** Next.js Admin (Template szerkesztés oldal)

---

### 9. POST /api/templates

**Felelősség:** Új template létrehozása validációval

**Headers:**
- `X-Shopify-Shop: example.myshopify.com` (kötelező)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Banner Pricing",
  "description": "Calculate banner price based on dimensions",
  "pricingFormula": "(width_cm * height_cm / 10000) * unit_m2_price + floor(width_cm / 25) * grommet_fee",
  "scopeType": "GLOBAL",
  "scopeValues": [],
  "fields": [
    {
      "key": "width_cm",
      "type": "NUMBER",
      "label": "Width (cm)",
      "required": true,
      "placeholder": "Enter width in centimeters",
      "validation": {
        "min": 1,
        "max": 1000
      },
      "useInFormula": true,
      "order": 0
    },
    {
      "key": "height_cm",
      "type": "NUMBER",
      "label": "Height (cm)",
      "required": true,
      "useInFormula": true,
      "order": 1
    },
    {
      "key": "unit_m2_price",
      "type": "NUMBER",
      "label": "Price per m²",
      "required": true,
      "useInFormula": true,
      "order": 2
    },
    {
      "key": "grommet_fee",
      "type": "NUMBER",
      "label": "Grommet fee per 25cm",
      "required": false,
      "useInFormula": true,
      "order": 3
    }
  ]
}
```

**Válasz:** `201 Created` + TemplateResponseDto

**Validációk:**
1. **Name:** Kötelező, max 255 karakter
2. **Formula:** Kötelező, nem lehet üres
3. **Formula syntax:**
   - Zárójel párosítás
   - Csak engedélyezett függvények (floor, ceil, round, min, max, if)
   - Csak létező field változók
   - Nincs veszélyes kód (eval, require, stb.)
4. **Field key:** Alphanumeric + underscore, nem kezdődhet számmal
5. **Field types:** Enum (NUMBER, TEXT, SELECT, RADIO, CHECKBOX, TEXTAREA, FILE)
6. **Scope type:** Enum (PRODUCT, COLLECTION, VENDOR, TAG, GLOBAL)

**Hiba válaszok:**
```json
{
  "message": "Invalid pricing formula",
  "errors": [
    "Unknown variable: \"invalid_field\". Available fields: width_cm, height_cm",
    "Unknown function: badFunc()"
  ],
  "warnings": [
    "Unused fields in formula: optional_field"
  ],
  "statusCode": 400
}
```

**Folyamat:**
1. Shop header validálás
2. DTO validálás (class-validator)
3. Formula validálás (FormulaValidatorService)
4. Field models létrehozása
5. Template domain model építése
6. Perzisztálás (Transaction: Template + Fields INSERT)
7. JSON válasz

**Példa hívás:**
```bash
POST https://app.teszt.uk/api/templates
Header: X-Shopify-Shop: example.myshopify.com
Body: {...}
```

**Használja:** Next.js Admin (Template létrehozás form)

---

### 10. PUT /api/templates/:id

**Felelősség:** Template frissítése (minden mező opcionális)

**Headers:**
- `X-Shopify-Shop: example.myshopify.com` (kötelező)
- `Content-Type: application/json`

**Path Paraméterek:**
- `id`: Template ID (UUID)

**Request Body:** UpdateTemplateDto (minden mező opcionális)
```json
{
  "name": "Updated Banner Pricing",
  "pricingFormula": "(width_cm * height_cm / 10000) * unit_m2_price * 1.1"
}
```

**Válasz:** TemplateResponseDto

**Folyamat:**
1. Shop header validálás
2. Template létezés ellenőrzése (findById with shopId)
3. Formula validálás (ha frissítve)
4. Domain model frissítése
5. Perzisztálás (Transaction: UPDATE Template + DELETE old fields + INSERT new fields)
6. JSON válasz

**Példa hívás:**
```bash
PUT https://app.teszt.uk/api/templates/uuid-123
Header: X-Shopify-Shop: example.myshopify.com
Body: { "name": "Updated name" }
```

**Használja:** Next.js Admin (Template szerkesztés)

---

### 11. DELETE /api/templates/:id

**Felelősség:** Template törlése (cascade: field-ek is törlődnek)

**Headers:**
- `X-Shopify-Shop: example.myshopify.com` (kötelező)

**Path Paraméterek:**
- `id`: Template ID (UUID)

**Válasz:** `204 No Content`

**Folyamat:**
1. Shop header validálás
2. Template létezés ellenőrzése
3. Cascade delete (Prisma: onDelete: Cascade)
   - Template törlése
   - TemplateField-ek automatikusan törlődnek
   - (Jövő: Assignment-ek ellenőrzése)
4. No content válasz

**SQL:**
```sql
DELETE FROM template_fields WHERE template_id = ?;
DELETE FROM templates WHERE id = ? AND shop_id = ?;
```

**Példa hívás:**
```bash
DELETE https://app.teszt.uk/api/templates/uuid-123
Header: X-Shopify-Shop: example.myshopify.com
```

**Használja:** Next.js Admin (Template törlés gomb)

---

### 12. PUT /api/templates/:id/activate

**Felelősség:** Template aktiválása (isActive = true)

**Használat:** Deaktivált template újra bekapcsolása

**Válasz:** TemplateResponseDto (isActive = true)

**Példa hívás:**
```bash
PUT https://app.teszt.uk/api/templates/uuid-123/activate
Header: X-Shopify-Shop: example.myshopify.com
```

---

### 13. PUT /api/templates/:id/deactivate

**Felelősség:** Template deaktiválása (isActive = false)

**Használat:** Template kikapcsolása törlés nélkül (soft delete)

**Válasz:** TemplateResponseDto (isActive = false)

**Példa hívás:**
```bash
PUT https://app.teszt.uk/api/templates/uuid-123/deactivate
Header: X-Shopify-Shop: example.myshopify.com
```

---

## Jövőbeli Végpontok (Terv szerint)

### Assignment Modul

- `GET /api/assignments` - Assignment lista
- `POST /api/assignments` - Assignment létrehozása
- `POST /api/assignments/bulk-assign` - Tömeges hozzárendelés
- `DELETE /api/assignments/:id` - Assignment törlése
- `GET /api/assignments/collisions` - Ütközések detektálása

### Shopify Data Modul

- `GET /api/shopify/products` - Shopify products lekérése
- `GET /api/shopify/collections` - Shopify collections
- `GET /api/shopify/vendors` - Vendors lista
- `GET /api/shopify/tags` - Tags lista

### Calculation Modul

- `POST /api/calculations/calculate` - Ár kalkuláció futtatása
- `GET /api/calculations/logs` - Calculation history

---

## Multi-Tenant Security

**Minden API kérés tartalmazza:**
- Header: `X-Shopify-Shop: example.myshopify.com`

**Backend validálja:**
1. Shop header jelenléte
2. Shop létezése adatbázisban
3. Shop aktív állapota (`isActive = true`)
4. Minden query automatikusan shop szerint szűrve

**Shop Header Interceptor** (jövőbeli implementáció):
```typescript
// Példa: Template lista csak az adott shop-hoz
GET /api/templates
Header: X-Shopify-Shop: example.myshopify.com

→ SQL: SELECT * FROM templates WHERE shop_id = (SELECT id FROM shops WHERE domain = 'example.myshopify.com')
```

---

## LocalStack Secrets Manager Integráció

**Betöltött secrets:**
- `SHOPIFY_API_KEY`: App publikus kulcsa
- `SHOPIFY_API_SECRET`: App titkos kulcsa
- `HOST`: Application host (app.teszt.uk)
- `API_URL`: Backend URL
- `DATABASE_URL`: PostgreSQL connection string

**Betöltési folyamat:**
1. Development: LocalStack (http://localstack:4566)
2. Production: AWS Secrets Manager
3. Cache: Első betöltés után memóriában tárolva

---

## Error Handling

**Standard error válasz formátum:**
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "statusCode": 400
}
```

**HTTP Status Codes:**
- `200 OK`: Sikeres művelet
- `201 Created`: Új resource létrehozva
- `204 No Content`: Sikeres törlés
- `400 Bad Request`: Hibás kérés (pl. hiányzó paraméter)
- `401 Unauthorized`: Hiányzó vagy érvénytelen auth
- `404 Not Found`: Resource nem található
- `500 Internal Server Error`: Szerver hiba

---

## Next.js Admin App

**Felelősség: CSAK UI**

**Funkciók:**
1. Shopify Polaris UI komponensek renderelése
2. App Bridge inicializálása (Shopify API key-vel)
3. Shop domain kezelése (localStorage)
4. API hívások a NestJS backend-hez

**NEM végez:**
- ❌ OAuth kezelést
- ❌ Shopify API hívásokat
- ❌ Business logic-ot
- ❌ Adatbázis műveleteket
- ❌ Secret management-et

**Használt endpointok:**
- `GET /api/auth/config` - Shopify API key betöltése
- `GET /api/templates` - Template lista (jövőbeli)
- `POST /api/templates` - Template létrehozása (jövőbeli)
- stb.

**API Client használat:**
```typescript
import { apiClient } from '@/lib/api/client';

// Automatikusan hozzáadja az X-Shopify-Shop header-t
const templates = await apiClient.get('/api/templates');
const newTemplate = await apiClient.post('/api/templates', { name: 'My Template' });
```

---

## Összefoglalás

**Architektúra:**
```
Shopify Admin
    ↓ (OAuth redirect)
NestJS Backend (/api/auth)
    ↓ (OAuth flow)
Shopify API
    ↓ (Access Token)
NestJS Backend (/api/auth/callback)
    ↓ (Store session)
PostgreSQL Database
    ↓ (Redirect)
Next.js Admin (Frontend UI)
    ↓ (Fetch config)
NestJS Backend (/api/auth/config)
    ↓ (Shopify API key)
Next.js Admin (App Bridge initialized)
    ↓ (User interactions)
NestJS Backend (Templates, Assignments, Calculations)
    ↓ (Shopify API calls if needed)
Shopify API
```

**Clean Separation:**
- **Next.js**: 100% UI, 0% logic
- **NestJS**: 100% logic, 0% UI
- **LocalStack**: Centralized secret management
- **PostgreSQL**: Centralized data storage
