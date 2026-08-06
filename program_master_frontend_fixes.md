# Program Master - Save Payload Frontend Fixes

## Changes Needed in Frontend Payload

### 1. Remove `dateAcc` when no date is selected

- **Current (wrong):** `dateAcc = T00:00:00`
- **Fix:** Only include `dateAcc` in the payload if the user has actually selected a date. If no date is selected, omit the field entirely from the form data.

---

### 2. Replace `currencyCode` with `currencyGuid`

- **Current (wrong):** `currencyCode = 3` (integer)
- **Fix:** Send `currencyGuid = <actual-currency-guid>` instead. Use the GUID value from the currency dropdown, not the integer code.

---

### 3. Replace `FeeStructures[0].IntakeCode` with `FeeStructures[0].IntakeGuid`

- **Current (wrong):** `FeeStructures[0].IntakeCode = 20261` (integer)
- **Fix:** Send `FeeStructures[0].IntakeGuid = <actual-intake-guid>` instead. Use the intake GUID from the intake dropdown, not the integer intake code.

---

## Summary Table

| # | Current (wrong) | Should be |
|---|---|---|
| 1 | `dateAcc = T00:00:00` | Omit field if no date selected |
| 2 | `currencyCode = 3` | `currencyGuid = <guid>` |
| 3 | `FeeStructures[0].IntakeCode = 20261` | `FeeStructures[0].IntakeGuid = <guid>` |

---

> **Note:** No backend changes are required. All three issues are frontend payload problems.
> The backend `SaveProgramWithDetailsRequest` and `SaveFeeHdWithLinesRequest` DTOs are correct.
> `DateAcc` is nullable (`DateTime?`) in both the DTO and database, so omitting it entirely is safe.

---

## Edit Program Master (Update-Complete API) - Payload Issues

### 1. `streamGuid` Missing from Payload

- **Issue:** The specialization/stream GUID is not included in the edit payload at all, so the program's specialization is always cleared on save.
- **Fix:** Include `streamGuid = <guid>` in the payload when a specialization is selected. This is why specialization is not appearing after edit.

---

### 2. `intakeGuid` Missing from Payload

- **Issue:** The intake GUID is not included in the edit payload, so the program's intake is always cleared on save.
- **Fix:** Include `intakeGuid = <guid>` in the payload when an intake is selected. This is why intake is not appearing after edit.

---

### 3. `LedgerNum` Always Sent as `0` for All Fee Lines

- **Issue:** Every fee line in the payload has `LedgerNum = 0`. The frontend is not sending the actual ledger priority/sequence number.
- **Fix:** The frontend should send the correct `LedgerNum` value for each fee line (auto-incremented per fee structure, e.g. 1, 2, 3...). This is why ledger number is not appearing in semester-wise fee structure in edit.

---

### 4. `AmtPer` Missing from Fee Structures

- **Issue:** The `AmtPer` field is not present in any of the fee structure entries in the payload. The backend DTO has this as a nullable field so it won't cause an error, but the value will always be lost on save.
- **Fix:** Include `FeeStructures[n][AmtPer]` in the payload when it has a value.

---

## Programme Details - Fee Section Bugs

### 1. Fee Currency - Set a Default When No Currency is Selected

- **Issue:** When a fee structure has no currency selected, no default is applied — the field is left blank.
- **Fix:** Auto-select a default currency (e.g. the base/local currency) when the fee form is opened or a new fee structure is added, so the currency field is never empty on save.

---

### 2. Copy Fee Code Dropdown - No Values Appearing

- **Issue:** When using the Copy Fee feature, the fee code dropdown is empty and shows no values to select from.
- **Fix:** Ensure the fee code dropdown is populated when the Copy Fee dialog/form is opened. Check that the API call to fetch existing fee codes is being triggered correctly on open, and that the response is bound to the dropdown options.

---

### 3. Adding New Fee Structure - Ledger Priority Not Auto-incrementing

- **Issue:** When adding a new fee line in the fee structure, the ledger priority (sequence number) is not automatically assigned — similar to how study sequence is auto-incremented in the Course Unit feature.
- **Fix:** Auto-generate the ledger priority/sequence number when a new fee line is added, incrementing from the last existing value (e.g. if last priority is 2, next should be 3). This should mirror the study sequence behaviour in the Course Unit feature.

---

### 4. Fee Structure (Main Menu) - Get All API Not Integrated

- **Issue:** The Get All fee structure API is not integrated in the Fee Structure section under the main menu — no data is being loaded/displayed.
- **Fix:** Wire up the `GET /api/v1/academic/Programfee-structure/` endpoint on page load, passing the required filters (pageNumber, pageSize, programGuid) to populate the fee structure list.

---

### 5. Copy Fee Code Dropdown - No Values Appearing

- **Issue:** When using the Copy Fee feature, the fee code dropdown is empty and shows no values.
- **Fix:** Ensure the API call to fetch existing fee codes is triggered when the Copy Fee dialog opens, and that the response is correctly bound to the dropdown options.
