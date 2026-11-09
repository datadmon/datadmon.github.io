# Dubai Property Data: free sample files

Source: **Dubai Land Department (DLD) open data**, read through the DLD open-data gateway by the three Daemon Data Actors on Apify (`data_daemon/dubai-property-transactions`, `data_daemon/dubai-rent-contracts`, `data_daemon/dubai-real-estate-projects`). The files are unmodified Actor output (the optional `arabic` object was left out), saved as JSON and CSV. Attribute the Dubai Land Department when you reuse them. No personal data: the registers carry no owner, buyer, tenant or landlord names, no contract numbers and no contacts.

Captured **9 November 2026** (Dubai time, afternoon). Product page with the cost table and the three Actors: https://datadmon.github.io/dubai-property-data/

| File | Rows | What it is | Actor input | Apify run |
|---|---|---|---|---|
| `dld-sales-sample-500.csv` / `.json` | 500 | the 500 newest registered **sales** (by transaction number) of 2 to 9 November 2026 | `{"transactionGroup": "sales", "sort": "TRANSACTION_NUMBER_DESC", "maxItems": 500, "daysBack": 7}` | `g6nkaB02Q9xry6s5Z` (build 0.2.5) |
| `ejari-rent-contracts-sample-500.csv` / `.json` | 500 | the 500 newest registered **Ejari rent contracts** of 2 to 9 November 2026, one row per contract (multi-unit contracts merged) | `{"sort": "newestFirst", "maxItems": 500, "daysBack": 7, "oneRowPerContract": true}` | `hyCxAUYhR4wduBUDX` (build 0.1.6) |
| `dld-projects-active.csv` / `.json` | 601 | **every active project** in the DLD register (approved and in progress) | `{"status": "active", "maxItems": 0}` | `sXF3x5xXjCJYMy1N6` (build 0.1.1) |

The CSV files are UTF-8 with a header row; nested values, if any, are JSON strings. Each full register costs $0.001 per sales or rent row and $0.005 per project record on Apify; see the product page for what a month, a year or a daily feed costs.

## Field meanings

### Sales (`dld-sales-sample-500`)

| Field | Meaning |
|---|---|
| `transactionNumber`, `transactionDate`, `transactionDateTime` | DLD transaction number and registration date (Dubai time). |
| `group`, `groupId`, `procedure`, `procedureId` | Sales / Mortgages / Gifts, and the exact procedure (`Sale`, `Delayed Sell`, `Sell - Pre registration`, mortgage registration or modification). |
| `usage` | Residential or Commercial. |
| `offPlan`, `freehold` | Developer pre-registration (off-plan) vs ready property; freehold area. |
| `area`, `project`, `masterProject`, `areaId` | DLD area (community), project and master project when DLD has them; `areaId` is 0 on every row as DLD sends it. |
| `propertyType`, `propertySubType`, `rooms`, `parking`, `parcelId`, `buildingAge`, `propertyId` | Unit / Building / Land, Flat / Villa / Office..., bedrooms, parking bays, plot id. |
| `actualAreaSqm`, `procedureAreaSqm` | Size in sq m (actual; the area the procedure refers to). |
| `transactionValueAed`, `pricePerSqmAed` | Registered value in AED and value / actual area. |
| `totalSellers`, `totalBuyers` | 0 on every row as DLD sends it; kept so column layouts stay stable. |
| `nearestMetro`, `nearestMall`, `nearestLandmark` | Location context from DLD. |
| `source`, `scrapedAt` | Provenance and capture time. |

### Rent contracts (`ejari-rent-contracts-sample-500`)

| Field | Meaning |
|---|---|
| `registrationDate`, `registrationDateTime` | When the Ejari contract was registered (Dubai time). |
| `startDate`, `endDate`, `contractDays` | Lease period. |
| `version`, `isNewContract` | New lease or renewal. |
| `annualAmountAed`, `contractAmountAed` | Annual rent and total contract value (they differ for leases shorter or longer than a year). |
| `sizeSqm`, `annualRentPerSqmAed` | Size (sum of the units when merged) and annual rent / size, only when both describe the same thing. |
| `unitsInContract`, `multiUnitContract` | How many units the contract covers; in this file multi-unit contracts are one row. |
| `area`, `project`, `masterProject` | DLD area; project when DLD has it (about 28% of rows). |
| `propertyType`, `propertySubType`, `usage` | Unit / Villa / Land / Building / Virtual Unit; Flat, Office, Shop, Villa...; Residential, Commercial or Other. |
| `freehold`, `rooms`, `parking` | Freehold area; rooms and parking only when DLD has them (rare). |
| `nearestMetro`, `nearestMall`, `nearestLandmark` | Location context from DLD. |
| `source`, `scrapedAt` | Provenance and capture time. |

### Projects (`dld-projects-active`)

| Field | Meaning |
|---|---|
| `projectNumber`, `name`, `developer`, `developerNumber` | DLD project and developer identifiers; higher project numbers are later registrations. |
| `status`, `projectType` | `Active` in this file (approved, in progress). |
| `projectValueAed`, `valuePerUnitAed` | Declared project value; value per apartment or villa when the project has any. |
| `escrowAccountNumber` | Escrow account registered with DLD; off-plan payments must go to it. |
| `percentCompleted` | Construction progress reported to DLD (occasionally inconsistent; treat outliers accordingly). |
| `adoptionDate`, `startDate`, `endDate`, `completionDate`, `inspectionDate` | DLD approval, planned start, planned completion, actual completion, last inspection. |
| `description` | Building description as registered (floors, use, facilities). |
| `area`, `masterProject`, `zone` | DLD area, master community when DLD has it, planning authority. |
| `landCount`, `buildingCount`, `villaCount`, `unitCount`, `totalUnits` | Registered plots, buildings, villas, apartments and their total. |
| `source`, `scrapedAt` | Provenance and capture time. |

## Limits

The DLD gateway serves the current calendar year only (checked 9 November 2026: a 2025 date range returned no rows); earlier years are in the Dubai Pulse open-data files. DLD keeps adding to, and occasionally correcting, the last few days of the sales and rent registers, so a sample taken later for the same dates can differ slightly.
