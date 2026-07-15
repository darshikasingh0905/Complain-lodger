# AI Priority Prediction System

Implement a modular **AI-assisted Priority Prediction System** for the AI-Powered Grievance Lodging and Tracking System.

## Goal

Every complaint must include:

* `priorityScore` (0–100)
* `priorityLevel` (`Low`, `Medium`, `High`, `Critical`)
* `priorityBreakdown`
* Human-readable explanation

The **LLM should only analyze the complaint and extract structured information**. The **backend must calculate the final priority** using a transparent rule-based scoring engine.

---

## Workflow

```
Complaint Submitted
        ↓
LLM extracts metadata
        ↓
Backend fetches contextual data
(duplicates, location, pending time, etc.)
        ↓
Priority Engine
        ↓
Store score & explanation
        ↓
Display on User/Admin Dashboard
```

---

## 1. LLM Output

Return structured JSON only (no priority calculation):

```json
{
  "category": "Roads",
  "department": "PWD",
  "summary": "...",
  "severity": "High",
  "urgency": "High",
  "safetyRisk": "High",
  "publicImpact": "High",
  "essentialService": true,
  "reasoning": "..."
}
```

---

## 2. Backend Priority Engine

Create:

```
backend/services/priorityEngine.js
```

The engine should compute the final score using configurable weights.

### Scoring

| Factor               | Max |
| -------------------- | --: |
| Safety Risk          |  30 |
| Public Impact        |  20 |
| Essential Service    |  20 |
| Urgency              |  10 |
| Duplicate Complaints |  10 |
| Location Importance  |   5 |
| Time Pending         |   5 |

```
Priority Score =
Safety +
Impact +
Essential +
Urgency +
Duplicates +
Location +
Pending
```

Maximum score: **100**

### Priority Levels

* 0–30 → Low
* 31–60 → Medium
* 61–80 → High
* 81–100 → Critical

The service should return:

```json
{
  "priorityScore": 86,
  "priorityLevel": "Critical",
  "priorityBreakdown": {
    "safetyRisk": 30,
    "publicImpact": 18,
    "essentialService": 20,
    "urgency": 8,
    "duplicates": 5,
    "location": 5,
    "timePending": 0
  },
  "reason": "Hospital access road is flooded, creating a high public safety risk."
}
```

---

## 3. Database

Extend the `Complaint` model:

```javascript
priorityScore: Number,

priorityLevel: {
  type: String,
  enum: ["Low", "Medium", "High", "Critical"]
},

priorityBreakdown: Object
```

---

## 4. Integration

Calculate or recalculate priority when:

* Complaint is created
* Duplicate complaints are detected
* Status changes
* Complaint is reopened
* New evidence/media is added
* Pending time changes

Store the updated priority in MongoDB.

---

## 5. Frontend

### User Dashboard

Display:

* Priority Badge
* Priority Score (e.g. 86/100)

### Admin Dashboard

Display:

* Priority Badge
* Priority Score
* Priority Breakdown
* Explanation

Support:

* Sort by priority (highest first)
* Filter by priority

Color coding:

* Green → Low
* Blue → Medium
* Orange → High
* Red → Critical

---

## 6. Code Requirements

* Keep all scoring logic inside `priorityEngine.js`.
* Use configurable constants (no hardcoded values).
* Make each scoring factor modular and independently adjustable.
* Handle missing data gracefully.
* Return the score, level, breakdown, and explanation.
* Follow the existing project architecture and coding standards.
