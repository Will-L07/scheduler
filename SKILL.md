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
6. **Write the JSON to a file** - Use the Write tool to save it to `C:\Repos\Wills projects\Random files\<schedule-name>.json`, then tell the user the file path so they can import it directly into the app.

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
  "subjectColors": {
    "Physics": "#ef4444",
    "Maths": "#f59e0b",
    "Chemistry": "#3b82f6"
  },
  "weeklyReset": false,
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
- `subjectColors`: Optional. Maps each subject name to a hex color. Subjects without a color will show as plain text. **Always include this** — assign a distinct color to every subject in the schedule.
- `weeklyReset`: **Always include this field.** Set to `true` for training/fitness schedules with recurring entries (sessions stay checked all week, reset each Monday). Set to `false` for revision schedules.
- `phases`: Required for recurring entries. Dates are YYYY-MM-DD.
- `exams`: Optional. `session` is "AM" or "PM".

## ENTRY FORMAT

There are two entry types. Choose based on the schedule's duration:

- **Use dated entries** when the schedule spans a short period (roughly 1-2 weeks) or when each day has unique tasks. This is the **default choice** — when in doubt, use dated entries.
- **Use recurring entries** only when the same tasks genuinely repeat weekly across multiple weeks (e.g. a 6-week training plan where every Monday is the same session). Recurring entries require at least one phase and will repeat every week within that phase's date range.

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
- **IMPORTANT: Never mix entry types for the same day.** If a schedule uses dated entries, ALL entries should be dated. If a schedule uses recurring entries, ALL entries should be recurring. Do not mix `date: null` and `date: "YYYY-MM-DD"` entries within the same schedule.
- **Default to dated entries.** Only use recurring entries when the schedule spans 3+ weeks and tasks repeat identically each week.
- **Training schedules with recurring entries MUST include `"weeklyReset": true`** at the schedule level. Revision schedules MUST include `"weeklyReset": false`.

## GUIDELINES

- For revision schedules, spread subjects across the week and vary topics to avoid fatigue.
- For training plans, include rest days and progressive overload across phases.
- Use descriptive phase names like "Phase 1: Foundation" or "Phase 2: Intensity".
- Pick distinct hex colors for each schedule so they're easy to tell apart in the app.
- **Always include `subjectColors`** with a distinct hex color for every subject used in the schedule. Use visually distinct, readable colors (avoid very light or very dark shades). Good defaults: red `#ef4444`, amber `#f59e0b`, blue `#3b82f6`, green `#10b981`, purple `#8b5cf6`, indigo `#6366f1`, pink `#ec4899`, teal `#14b8a6`.
- `weeklyReset` is already enforced as a RULE above — do not omit it from any schedule.
- If the user mentions exam dates, include them in the exams array.
- Do NOT print the JSON as a code block in the chat. Write it to a file using the Write tool and give the user the file path to import.
