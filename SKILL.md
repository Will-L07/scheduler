---
name: scheduler
description: Generate importable schedule JSON for William's Scheduler PWA. Use this when the user requests creating a revision timetable, training plan, study schedule, or any recurring/dated task schedule. Outputs JSON that can be pasted into the app's Settings > Import function.
---

When the user describes a schedule they want (revision timetable, training plan, study schedule, etc.), generate valid JSON that can be imported directly into William's Scheduler app.

## HOW TO GENERATE A SCHEDULE

1. **Understand the request** - What subjects, activities, dates, and frequency does the user need?
2. **Choose the schedule type** - "revision" for study/exam prep, "training" for fitness/sport plans, "custom" for anything else.
3. **Define phases** - Time periods the schedule spans. Recurring entries only appear within phases.
4. **Add exams if relevant** - Exam dates with AM/PM sessions show countdown timers in the app.
5. **Create entries** - Either dated (one-off) or recurring (weekly). See format below.
6. **Output the JSON** - Wrapped in `{"schedules":[...]}`, ready to paste into Settings > Import.

## JSON STRUCTURE

The top-level wrapper:

```json
{"schedules": [...array of schedule objects...]}
```

Each schedule object:

```json
{
  "id": "short-slug",
  "name": "Display Name",
  "type": "revision",
  "color": "#4A90D9",
  "phases": [
    {"name": "Phase 1", "startDate": "2026-02-09", "endDate": "2026-03-26"}
  ],
  "exams": [
    {"name": "Paper 1", "date": "2026-05-20", "session": "PM"}
  ],
  "entries": [],
  "createdAt": "2026-02-09T00:00:00.000Z"
}
```

- `type`: "revision", "training", or "custom"
- `phases`: Required for recurring entries. Dates are YYYY-MM-DD.
- `exams`: Optional. `session` is "AM" or "PM".

## ENTRY FORMAT

There are two entry types. Choose based on the user's needs.

**Dated entry** — a one-off task on a specific date:

```json
{
  "id": "rev-1", "date": "2026-02-09", "dayOfWeek": null, "block": 1,
  "subject": "Physics", "topic": "Mechanics revision",
  "duration": "1h", "taskFocus": "Forces and Newton's laws",
  "completed": false, "completedAt": null, "notes": ""
}
```

**Recurring entry** — repeats weekly on a given day, only within phases:

```json
{
  "id": "train-1", "date": null, "dayOfWeek": "Monday", "block": 1,
  "subject": "Running", "topic": "Easy recovery run",
  "duration": "30m", "taskFocus": "Conversational pace",
  "completed": false, "completedAt": null, "notes": "",
  "completedDates": [], "notesByDate": {}
}
```

## RULES

- **IDs** must be unique within a schedule. Use prefix + number: "rev-1", "rev-2", "hike-1".
- **block** sets display order within a day (1, 2, 3...).
- **duration** is free text: "1h", "45m", "1.5h", "60-90m", "-" for rest days.
- **taskFocus** is optional detail shown below the topic.
- **Recurring entries MUST include** `completedDates: []` and `notesByDate: {}`.
- **Dated entries must NOT include** those two fields.
- **dayOfWeek** values: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday".
- All new entries have `completed: false`, `completedAt: null`, `notes: ""`.

## GUIDELINES

- For revision schedules, spread subjects across the week and vary topics to avoid fatigue.
- For training plans, include rest days and progressive overload across phases.
- Use descriptive phase names like "Phase 1: Foundation" or "Phase 2: Intensity".
- Pick distinct hex colors for each schedule so they're easy to tell apart in the app.
- If the user mentions exam dates, include them in the exams array.
- Output ONLY the JSON — the user will copy-paste it into the app's import function.
