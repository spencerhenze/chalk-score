# Spec: Test Builder

## Implementation Status

> Update this section as work progresses.

### Backend
- [x] `TestType` entity + EF migration (`20260430005832_TestBuilder`)
- [x] `TestConfiguration` — add `TestTypeId`, `Version`, `IsDraft`; remove `Name`/`Description`
- [x] `DataSeeder` — add `TestType` seeds, update existing config seeds
- [x] `ExercisesController` (CRUD)
- [x] `TestTypesController` (GET list, POST, DELETE)
- [x] `TestConfigurationsController` — expanded with POST, PUT exercises, PUT publish, PATCH correction+recalculate, DELETE
- [x] Recalculation logic inline in PATCH endpoint (reuses `ScoringService`)
- [x] Updated `TestConfigurationSummary` response (add `version`, `testTypeName`, filter to published+active)
- [x] Updated `TestEntryResponse` (add `testVersion`)
- [x] Updated `SessionResultsResponse` (add `testVersion`)

### Mobile
- [x] `AdminModeService`
- [x] `TabsPage` — admin mode tab swap
- [x] Profile page — "Enter Admin Mode" button
- [x] `builder/exercises/` — list page, edit modal, service
- [x] `builder/tests/` — Level 1 (types), Level 2 (versions), Level 3 (detail), service
- [x] Swipe-to-delete on Level 1 (all-draft test types) and Level 2 (draft versions)
- [x] Results detail — show version
- [x] Test entry — show version in header

---

## Overview

Admins need to create and manage exercises and test configurations without touching code. This feature adds a dedicated **Admin Mode** (toggled from the Profile page) that replaces the standard tab bar with builder-focused tabs for exercise and test management.

The core versioning challenge: modifying a test configuration must not silently corrupt historical session data. This spec solves it through a **draft/publish model** — configurations are freely editable while in draft, and become immutable once published. Structural changes after publishing require creating a new version; scoring parameter mistakes can be corrected in-place with automatic recalculation.

---

## Data Model Changes

### New Entity: `TestType`

Groups all versions of a logically-related test (e.g., "Advanced", "Beginner").

```csharp
public class TestType
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TestConfiguration> Versions { get; set; } = [];
}
```

### Modified Entity: `TestConfiguration`

```diff
 public class TestConfiguration
 {
     public Guid Id { get; set; }
-    public string Name { get; set; } = null!;        // moved to TestType
-    public string? Description { get; set; }          // moved to TestType
+    public Guid TestTypeId { get; set; }              // FK → TestType
+    public int Version { get; set; } = 1;
+    public bool IsDraft { get; set; } = true;
     public bool IsActive { get; set; } = true;
     public Guid? CreatedByUserId { get; set; }
     public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

+    public TestType TestType { get; set; } = null!;
     public ICollection<TestConfigurationExercise> Exercises { get; set; } = [];
 }
```

**Notes:**
- `IsActive` = false means soft-deleted or superseded by a newer published version.
- `IsDraft` = true means the config is under construction and not visible to regular users.
- A published config (`IsDraft = false`) becomes immutable for structural changes.
- Only one config per `TestType` should have `IsActive = true` at a time.

### No changes to `TestSessionGymnast`

`TestSessionGymnast.TestConfigurationId` already points to a specific config version — historical integrity is preserved without any schema change.

### Migration Plan

The migration (`20260430005832_TestBuilder`) executes in this order to avoid FK violations and data loss:

1. Add `TestTypeId`, `Version`, `IsDraft` columns to `TestConfiguration` (with temporary defaults).
2. Create `TestTypes` table.
3. Backfill: for each existing `TestConfiguration`, insert one `TestType` row using the existing `Name`/`Description` columns, then set `TestTypeId`, `Version = 1`, `IsDraft = false`.
4. Add FK constraint and index (succeeds because all rows are now linked).
5. Drop `Name` and `Description` from `TestConfiguration`.

On a fresh database the `DataSeeder` runs after migration and inserts the canonical Advanced/Beginner `TestType` and `TestConfiguration` rows with stable GUIDs. On an existing database the seeder detects `TestTypes.Any() == true` and skips — existing data is preserved as-is.

---

## TestConfiguration State Machine

```
         Create
           │
           ▼
        [Draft] ─── edit exercises ──▶ [Draft]
           │
           │ Publish
           ▼
       [Published]
           │
           ├── correct scoring params ──▶ [Published] (recalculates scores)
           │
           └── create new version ──▶ new [Draft] for same TestType
```

**State rules:**
| Action | Draft | Published |
|--------|-------|-----------|
| Edit exercise list (add/remove/reorder) | ✅ | ❌ |
| Edit MaxValue / Weight / ScoringType / ScoringParams | ✅ | ✅ (triggers recalculation) |
| Publish | ✅ | — |
| Delete | ✅ (hard delete) | ❌ |
| Visible in add-gymnast dropdown | ❌ | ✅ (if IsActive) |
| Create new version from this | ✅ | ✅ |

---

## API Contracts

### Authorization

All builder endpoints require the `isAdmin` claim. Non-admin requests return `403 Forbidden`.

---

### Exercises

#### `GET /exercises`
Returns all exercises (active and inactive). Admin only.

**Response `200 OK`:**
```json
[
  {
    "id": "guid",
    "name": "Rope",
    "description": null,
    "measurementType": "Percentage",
    "unit": "%",
    "isActive": true
  }
]
```

---

#### `POST /exercises`
Creates a new exercise.

**Request:**
```json
{
  "name": "Rope",
  "description": null,
  "measurementType": "Percentage",
  "unit": "%"
}
```

**Response `201 Created`:** Exercise object (same shape as GET item).

---

#### `PUT /exercises/{id}`
Updates an exercise.

- `name` and `description` can always be updated.
- `measurementType` and `unit` are blocked (`409 Conflict`) if the exercise appears in any **published** `TestConfiguration`.

**Request:** Same shape as POST.

**Response `200 OK`:** Updated exercise object.

**Error `409 Conflict`:**
```json
{ "error": "Cannot change measurement type or unit — exercise is used in a published test configuration." }
```

---

#### `DELETE /exercises/{id}`
Soft-deletes an exercise (`IsActive = false`).

Blocked (`409 Conflict`) if the exercise appears in any `TestConfiguration` (draft or published).

---

### Test Types

#### `GET /test-types`
Returns all test types with a summary of their versions.

**Response `200 OK`:**
```json
[
  {
    "id": "guid",
    "name": "Advanced",
    "description": null,
    "isActive": true,
    "versions": [
      { "id": "guid", "version": 1, "isDraft": false, "isActive": true, "exerciseCount": 13, "createdAt": "2026-01-01T00:00:00Z" },
      { "id": "guid", "version": 2, "isDraft": true,  "isActive": false, "exerciseCount": 13, "createdAt": "2026-04-28T00:00:00Z" }
    ]
  }
]
```

---

#### `DELETE /test-types/{id}`
Hard-deletes a test type and all its draft versions. Blocked (`409 Conflict`) if any version is published.

**Response `204 No Content`**

**Error `409 Conflict`:**
```json
{ "error": "Cannot delete a test type that has published versions." }
```

---

#### `POST /test-types`
Creates a new `TestType` and an initial empty draft `TestConfiguration` (v1).

**Request:**
```json
{
  "name": "Intermediate",
  "description": null
}
```

**Response `201 Created`:**
```json
{
  "testTypeId": "guid",
  "configurationId": "guid",
  "version": 1
}
```

---

### Test Configurations

#### `POST /test-configurations`
Creates a new **draft** version under an existing `TestType`. Version number is auto-incremented from the highest existing version for that type.

**Request:**
```json
{
  "testTypeId": "guid",
  "copyFromConfigurationId": "guid"  // optional — copies exercises as starting point
}
```

**Response `201 Created`:**
```json
{
  "id": "guid",
  "testTypeId": "guid",
  "version": 2,
  "isDraft": true
}
```

---

#### `PUT /test-configurations/{id}/exercises`
Replaces the full exercise list for a draft configuration. Blocked (`409 Conflict`) if `IsDraft = false`.

**Request:**
```json
{
  "exercises": [
    {
      "exerciseId": "guid",
      "maxValue": 100,
      "weight": 1.5,
      "scoringType": "Percentage",
      "scoringParams": null,
      "displayOrder": 0,
      "required": true
    }
  ]
}
```

**Response `200 OK`:** Updated `TestConfigurationDetail` (same shape as existing `GET /test-configurations/{id}`).

**Error `409 Conflict`:**
```json
{ "error": "Cannot edit exercises on a published configuration. Create a new version instead." }
```

---

#### `PUT /test-configurations/{id}/publish`
Publishes a draft configuration. Sets `IsDraft = false`, `IsActive = true`, and sets `IsActive = false` on all sibling versions (same `TestTypeId`). Irreversible.

Blocked (`400 Bad Request`) if the configuration has no exercises.

**Response `200 OK`:**
```json
{ "id": "guid", "version": 2, "isDraft": false, "isActive": true }
```

**Error `400 Bad Request`:**
```json
{ "error": "Cannot publish a configuration with no exercises." }
```

---

#### `DELETE /test-configurations/{id}`
Hard-deletes a draft configuration. Blocked (`409 Conflict`) if `IsDraft = false`.

**Response `204 No Content`**

---

#### `PATCH /test-configurations/{id}/exercises/{exerciseId}`
Corrects scoring parameters on a **published** configuration. Blocked (`409 Conflict`) if `IsDraft = true` (use the full PUT instead).

Allowed fields: `maxValue`, `weight`, `scoringType`, `scoringParams`.  
Structural fields (`exerciseId`, `displayOrder`, `required`) are ignored.

After updating, the backend recalculates `TestResult.CalculatedScore` for every result tied to this exercise in every session using this config, then recalculates `TestSessionGymnast.FinalScore` for each affected gymnast.

**Request:**
```json
{
  "maxValue": 100,
  "weight": 1.5,
  "scoringType": "Percentage",
  "scoringParams": null
}
```

**Response `200 OK`:**
```json
{ "affectedSessions": 3, "affectedGymnasts": 12 }
```

---

### Updated Existing Responses

#### `GET /test-configurations` (add-gymnast dropdown)
Filter to **published + active** only. Add `version` and `testTypeName` fields.

```json
[
  {
    "id": "guid",
    "testTypeName": "Advanced",
    "version": 2,
    "exerciseCount": 13
  }
]
```

Display format in UI: `"Advanced (v2)"` — show version only when `version > 1`.

Only one version per `TestType` is ever returned (the currently active published version). Coaches always get the latest without any manual selection. Historical sessions are unaffected — `TestSessionGymnast.TestConfigurationId` is frozen at the version that was active when the gymnast was added.

#### `GET /sessions/{sessionId}/gymnasts/{tsgId}` (test entry)
Add `testVersion: int` to `TestEntryResponse`.

#### `GET /sessions/{id}/results` (results detail)
Add `testVersion: int` to each gymnast row in `SessionResultsResponse`.

---

## Mobile: Admin Mode

### Entry / Exit

- **Entry:** "Enter Admin Mode" button on the Profile page, visible only when `profile.isAdmin === true`. Navigates to `/tabs/builder-exercises`.
- **Exit:** Persistent "Exit Admin Mode" banner across the top of every builder tab. Tapping navigates back to `/tabs/gymnasts`.

### Tab Bar (Admin Mode)

Replaces the standard Gymnasts / Sessions / Results tabs:

```
[ Exercises ]  [ Tests ]
```

`TabsPage` injects `AdminModeService` (singleton, `isAdminMode: boolean`) and uses `*ngIf` to swap between the two tab bar configurations.

### New Routes

```
/tabs/builder-exercises           → ExercisesBuilderPageModule
/tabs/builder-tests               → TestsBuilderPageModule
/tabs/builder-tests/:typeId       → TestVersionsPageModule
/tabs/builder-tests/:typeId/:configId  → TestVersionDetailPageModule
```

---

## Mobile: Exercises Tab

**`src/app/builder/exercises/`**

- `exercises-builder.page` — List of all exercises (active + inactive).
  - Each row: exercise name, unit, measurement type badge, inactive indicator.
  - FAB → `ExerciseEditModal` (create mode).
  - Tap row → `ExerciseEditModal` (edit mode, pre-filled).

- `exercise-edit-modal.component` — Form:
  - Name (required)
  - Description
  - Measurement Type (ion-select)
  - Unit (text)
  - Save → `POST /exercises` or `PUT /exercises/{id}`; display backend error inline if blocked.
  - Delete button (edit mode only) → confirmation alert → `DELETE /exercises/{id}`.

- `exercises-builder.service` — wraps `/exercises` HTTP calls.

---

## Mobile: Tests Tab

**`src/app/builder/tests/`**

Three-level drill-down via standard Ionic push navigation.

### Level 1 — Test Types list (`tests-builder.page`)

- Rows: test type name, active version label (e.g., "v2 active"), draft count badge.
- FAB → alert with name/description inputs → `POST /test-types` → navigate to Level 2 (versions list for the new type).
- Tap row → Level 2.
- Swipe left → delete (only when all versions are drafts) → confirmation alert noting how many draft versions will be cascade-deleted → `DELETE /test-types/{id}`.

### Level 2 — Versions list (`test-versions.page`)

Route: `/tabs/builder-tests/:typeId`

- Rows: "v1", "v2 (draft)", etc. with active/draft badges and exercise count.
- "New Version" button → `POST /test-configurations` (copies latest published version if one exists, otherwise empty) → navigate to Level 3.
- Tap row → Level 3.
- Swipe left → delete (draft versions only) → confirmation alert → `DELETE /test-configurations/{id}`.

### Level 3 — Version detail (`test-version-detail.page`)

Route: `/tabs/builder-tests/:typeId/:configId`

Header: `"Advanced v2 — Draft"` or `"Advanced v1 — Active"`

**Draft mode (`IsDraft = true`):**
- `ion-reorder-group` exercise list.
- Per-exercise row: name label, scoring type select, max value input, weight input, required toggle, remove button.
- "Add Exercise" → modal with searchable exercise library.
- "Save" → `PUT /test-configurations/{id}/exercises`.
- "Publish" → confirmation: *"Publishing activates this version and locks the exercise list. Scoring parameters can still be corrected after publishing."* → `PUT /test-configurations/{id}/publish`.
- "Delete Draft" → confirmation → `DELETE /test-configurations/{id}`.

**Published mode (`IsDraft = false`):**
- Exercise list is read-only for structure (name, add, remove, reorder disabled).
- Scoring fields (`maxValue`, `weight`, `scoringType`, `scoringParams`) remain editable inline.
- "Correct & Recalculate" save button appears on any change → confirmation: *"This will recalculate scores for all sessions using this configuration."* → `PATCH /test-configurations/{id}/exercises/{exerciseId}` per changed exercise.
- "Create New Version" shortcut → same as Level 2 "New Version" flow.

---

## Results & Test Entry Updates

**Results detail** ([result-detail.page.html](mobile/chalk-score-app/src/app/results/result-detail/result-detail.page.html)):
- Show `"Advanced (v2)"` next to the test name when `testVersion > 1`.

**Test entry** ([test-entry.page.html](mobile/chalk-score-app/src/app/sessions/test-entry/test-entry.page.html)):
- Show version in the header subtitle (e.g., `"Advanced · v2"`).

---

## Files to Create / Modify

### Backend

| File | Action |
|------|--------|
| `Data/Entities/TestType.cs` | Create |
| `Data/Entities/TestConfiguration.cs` | Add `TestTypeId`, `Version`, `IsDraft`; remove `Name`, `Description` |
| `Data/Migrations/<timestamp>_TestBuilder.cs` | Create via EF migration |
| `Data/DataSeeder.cs` | Add `TestType` seeds; update existing config seeds |
| `Controllers/ExercisesController.cs` | Create |
| `Controllers/TestTypesController.cs` | Create |
| `Controllers/TestConfigurationsController.cs` | Expand with POST, PUT (exercises + publish), PATCH, DELETE |
| `DTOs/` | Add request/response DTOs for all new endpoints |
| `Services/ScoringService.cs` | Recalculation logic implemented inline in the PATCH endpoint (no separate method needed) |

### Mobile

| File | Action |
|------|--------|
| `core/services/admin-mode.service.ts` | Create |
| `tabs/tabs.page.html` | Swap tab bar based on admin mode |
| `tabs/tabs.page.ts` | Inject `AdminModeService` |
| `tabs/tabs-routing.module.ts` | Add builder routes |
| `profile/profile.page.html` | Add "Enter Admin Mode" button |
| `profile/profile.page.ts` | Navigate to builder-exercises |
| `builder/exercises/` | Create (page + modal + service) |
| `builder/tests/` | Create (3 pages + service) |
| `results/result-detail/result-detail.page.html` | Show version |
| `sessions/test-entry/test-entry.page.html` | Show version in header |

---

## Business Rules Summary

1. A `TestConfiguration` is only visible to regular users when `IsDraft = false` and `IsActive = true`.
2. Only one `TestConfiguration` per `TestType` may have `IsActive = true` at a time. Publishing a new version deactivates all siblings.
3. Exercise list edits (`PUT /exercises`) are blocked on published configurations.
4. Scoring parameter corrections (`PATCH /exercises/{exerciseId}`) are only allowed on published configurations; use the full PUT for drafts.
5. A configuration cannot be published with zero exercises.
6. Deleting an exercise is blocked if it belongs to any configuration (draft or published).
7. Changing an exercise's `measurementType` or `unit` is blocked if it belongs to any published configuration.
8. Draft configurations can be hard-deleted; published configurations cannot be deleted.
9. Only one `TestConfiguration` per `TestType` is ever shown in the add-gymnast dropdown — the currently active published version. Coaches always get the latest automatically.
10. Historical sessions preserve their original version. `TestSessionGymnast.TestConfigurationId` is set at the time a gymnast is added and never changes, so old results remain accurate even after a new version is published.
