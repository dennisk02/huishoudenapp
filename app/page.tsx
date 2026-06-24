"use client";

import { useEffect, useMemo, useState } from "react";
import { FREQUENCY_LABELS, type Frequency } from "@/lib/recurrence";

type Member = {
  id: string;
  name: string;
  color: string;
};

type Completion = {
  id: string;
  completedAt: string;
  member: Member;
};

type Task = {
  id: string;
  name: string;
  frequency: Frequency;
  dueDate: string;
  completions: Completion[];
  assigneeId: string | null;
  assignee: Member | null;
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  createdBy: Member | null;
  assigneeId: string | null;
  assignee: Member | null;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isOverdue(task: Task) {
  return new Date(task.dueDate) < startOfToday();
}

function isDueToday(task: Task) {
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === startOfToday().getTime();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function hasTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocalValue(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function startOfWeek(date: Date) {
  const d = startOfDayOf(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfDayOf(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

const WEEKDAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "week" | "agenda">("list");
  const [weekOffset, setWeekOffset] = useState(0);
  const [onlyMine, setOnlyMine] = useState(false);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskFrequency, setNewTaskFrequency] = useState<Frequency>("WEEKLY");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventAssigneeId, setNewEventAssigneeId] = useState("");

  async function loadAll() {
    const [tasksRes, membersRes, eventsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/members"),
      fetch("/api/events"),
    ]);
    setTasks(await tasksRes.json());
    setMembers(await membersRes.json());
    setEvents(await eventsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (members.length > 0 && !activeMemberId) {
      setActiveMemberId(members[0].id);
    }
  }, [members, activeMemberId]);

  const filteredTasks = useMemo(() => {
    if (!onlyMine || !activeMemberId) return tasks;
    return tasks.filter((t) => t.assigneeId === activeMemberId);
  }, [tasks, onlyMine, activeMemberId]);

  const sortedTasks = useMemo(
    () =>
      [...filteredTasks].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    [filteredTasks]
  );

  const weekStart = useMemo(
    () => addDays(startOfWeek(new Date()), weekOffset * 7),
    [weekOffset]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const overdueTasks = useMemo(
    () => sortedTasks.filter((t) => new Date(t.dueDate) < weekStart),
    [sortedTasks, weekStart]
  );
  const tasksByDay = useMemo(() => {
    const map = new Map<number, Task[]>();
    weekDays.forEach((d) => map.set(d.getTime(), []));
    sortedTasks.forEach((t) => {
      const due = startOfDayOf(new Date(t.dueDate));
      const key = due.getTime();
      if (map.has(key)) {
        map.get(key)!.push(t);
      }
    });
    return map;
  }, [sortedTasks, weekDays]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [events]
  );

  const upcomingEvents = useMemo(
    () => sortedEvents.filter((e) => new Date(e.date) >= startOfToday()),
    [sortedEvents]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<number, Event[]>();
    weekDays.forEach((d) => map.set(d.getTime(), []));
    sortedEvents.forEach((e) => {
      const key = startOfDayOf(new Date(e.date)).getTime();
      if (map.has(key)) {
        map.get(key)!.push(e);
      }
    });
    return map;
  }, [sortedEvents, weekDays]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newMemberName.trim() }),
    });
    setNewMemberName("");
    loadAll();
  }

  async function removeMember(id: string) {
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (activeMemberId === id) setActiveMemberId("");
    loadAll();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTaskName.trim(),
        frequency: newTaskFrequency,
        assigneeId: newTaskAssigneeId || null,
      }),
    });
    setNewTaskName("");
    setNewTaskAssigneeId("");
    loadAll();
  }

  async function removeTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    loadAll();
  }

  async function reassignTask(id: string, assigneeId: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: assigneeId || null }),
    });
    loadAll();
  }

  async function rescheduleTask(id: string, dueDate: string) {
    if (!dueDate) return;
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate }),
    });
    loadAll();
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newEventTitle.trim(),
        date: newEventDate,
        description: newEventDescription.trim() || null,
        createdById: activeMemberId || null,
        assigneeId: newEventAssigneeId || null,
      }),
    });
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventDescription("");
    setNewEventAssigneeId("");
    loadAll();
  }

  async function removeEvent(id: string) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    loadAll();
  }

  async function reassignEvent(id: string, assigneeId: string) {
    await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: assigneeId || null }),
    });
    loadAll();
  }

  async function rescheduleEvent(id: string, date: string) {
    if (!date) return;
    await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    loadAll();
  }

  async function completeTask(id: string) {
    if (!activeMemberId) {
      alert("Kies eerst wie de taak heeft afgerond.");
      return;
    }
    await fetch(`/api/tasks/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: activeMemberId }),
    });
    loadAll();
  }

  function renderTaskCard(task: Task) {
    const overdue = isOverdue(task);
    const dueToday = isDueToday(task);
    const lastCompletion = task.completions[0];
    return (
      <div
        key={task.id}
        className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm ${
          overdue ? "border-red-200" : "border-slate-200"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{task.name}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {FREQUENCY_LABELS[task.frequency]}
            </span>
            <select
              value={task.assigneeId ?? ""}
              onChange={(e) => reassignTask(task.id, e.target.value)}
              className="rounded-full border px-2 py-0.5 text-xs"
              style={{
                borderColor: task.assignee?.color ?? "#e2e8f0",
                color: task.assignee?.color ?? "#64748b",
              }}
            >
              <option value="">Iedereen</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <p
            className={`mt-0.5 text-xs ${
              overdue
                ? "font-semibold text-red-600"
                : dueToday
                ? "font-semibold text-amber-600"
                : "text-slate-400"
            }`}
          >
            {overdue
              ? `Te laat sinds ${formatDate(task.dueDate)}`
              : dueToday
              ? "Vandaag te doen"
              : `Volgende keer: ${formatDate(task.dueDate)}`}
          </p>
          {lastCompletion && (
            <p className="mt-0.5 text-xs text-slate-400">
              Laatst gedaan door {lastCompletion.member.name} op{" "}
              {formatDate(lastCompletion.completedAt)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => completeTask(task.id)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            ✓ Afvinken
          </button>
          <button
            onClick={() => removeTask(task.id)}
            className="rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  function renderCompactTask(task: Task) {
    const overdue = isOverdue(task);
    const dateValue = new Date(task.dueDate).toISOString().slice(0, 10);
    return (
      <div
        key={task.id}
        className={`rounded-lg border bg-white p-2.5 text-sm shadow-sm ${
          overdue ? "border-red-200" : "border-slate-200"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="break-words font-medium leading-snug">{task.name}</span>
          <button
            onClick={() => completeTask(task.id)}
            title="Afvinken"
            className="shrink-0 rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            ✓
          </button>
        </div>
        <span className="mt-1 block text-xs text-slate-400">
          {FREQUENCY_LABELS[task.frequency]}
          {task.assignee && ` · ${task.assignee.name}`}
        </span>
        <input
          type="date"
          value={dateValue}
          onChange={(e) => rescheduleTask(task.id, e.target.value)}
          title="Verplaats naar een andere dag"
          className="mt-1.5 w-full rounded border border-slate-200 px-1 py-0.5 text-xs text-slate-500"
        />
      </div>
    );
  }

  function renderCompactEvent(event: Event) {
    return (
      <div
        key={event.id}
        className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="break-words font-medium leading-snug text-amber-800">
            📅 {event.title}
            {hasTime(event.date) && ` · ${formatTime(event.date)}`}
          </span>
          <button
            onClick={() => removeEvent(event.id)}
            title="Verwijderen"
            className="shrink-0 text-xs text-amber-500 hover:text-amber-700"
          >
            ✕
          </button>
        </div>
        {event.description && (
          <p className="mt-1 text-xs text-amber-700">{event.description}</p>
        )}
        {event.assignee && (
          <span className="mt-1 block text-xs text-amber-600">
            {event.assignee.name}
          </span>
        )}
        <input
          type="datetime-local"
          value={toDateTimeLocalValue(event.date)}
          onChange={(e) => rescheduleEvent(event.id, e.target.value)}
          title="Verplaats naar een andere dag/tijd"
          className="mt-1.5 w-full rounded border border-amber-200 bg-white px-1 py-0.5 text-xs text-amber-700"
        />
      </div>
    );
  }

  function renderEventRow(event: Event) {
    return (
      <div
        key={event.id}
        className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{event.title}</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {formatDate(event.date)}
              {hasTime(event.date) && ` ${formatTime(event.date)}`}
            </span>
            <select
              value={event.assigneeId ?? ""}
              onChange={(e) => reassignEvent(event.id, e.target.value)}
              className="rounded-full border px-2 py-0.5 text-xs"
              style={{
                borderColor: event.assignee?.color ?? "#e2e8f0",
                color: event.assignee?.color ?? "#64748b",
              }}
            >
              <option value="">Iedereen</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {event.description && (
            <p className="mt-0.5 text-xs text-slate-500">{event.description}</p>
          )}
          {event.createdBy && (
            <p className="mt-0.5 text-xs text-slate-400">
              Toegevoegd door {event.createdBy.name}
            </p>
          )}
        </div>
        <button
          onClick={() => removeEvent(event.id)}
          className="rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 lg:max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Huishoudtaken</h1>
        <p className="text-sm text-slate-500">
          Vink samen als gezin de huishoudelijke taken af. Taken komen automatisch
          terug volgens hun frequentie.
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Wie ben jij?</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMemberId(m.id)}
              className="group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition"
              style={{
                backgroundColor: activeMemberId === m.id ? m.color : "#f1f5f9",
                color: activeMemberId === m.id ? "white" : "#334155",
              }}
            >
              {m.name}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  removeMember(m.id);
                }}
                className="ml-1 hidden text-xs opacity-70 hover:opacity-100 group-hover:inline"
              >
                ✕
              </span>
            </button>
          ))}
        </div>
        <form onSubmit={addMember} className="mt-3 flex gap-2">
          <input
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Naam toevoegen..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Toevoegen
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Nieuwe taak</h2>
        <form onSubmit={addTask} className="flex flex-wrap gap-2">
          <input
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Bijv. Stofzuigen, Vuilnis buiten zetten..."
            className="min-w-[180px] flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
          />
          <select
            value={newTaskFrequency}
            onChange={(e) => setNewTaskFrequency(e.target.value as Frequency)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
          >
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={newTaskAssigneeId}
            onChange={(e) => setNewTaskAssigneeId(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">Iedereen</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Taak toevoegen
          </button>
        </form>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              view === "list" ? "bg-slate-800 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            Lijst
          </button>
          <button
            onClick={() => setView("week")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              view === "week" ? "bg-slate-800 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView("agenda")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              view === "agenda" ? "bg-slate-800 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            Agenda
          </button>
        </div>
        <button
          onClick={() => setOnlyMine((v) => !v)}
          disabled={!activeMemberId}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${
            onlyMine ? "bg-indigo-600 text-white" : "bg-white text-slate-500 border border-slate-200"
          }`}
        >
          {onlyMine ? "Mijn taken" : "Alle taken"}
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Laden...</p>}

      {!loading && view === "list" && (
        <section className="space-y-3">
          {sortedTasks.length === 0 && (
            <p className="text-sm text-slate-400">
              Nog geen taken. Voeg er hierboven een toe.
            </p>
          )}
          {sortedTasks.map(renderTaskCard)}
        </section>
      )}

      {!loading && view === "week" && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              ← Vorige week
            </button>
            <span className="text-sm font-medium text-slate-600">
              {formatDate(weekStart.toISOString())} –{" "}
              {formatDate(addDays(weekStart, 6).toISOString())}
            </span>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Volgende week →
            </button>
          </div>

          {weekOffset === 0 && overdueTasks.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="mb-2 text-xs font-semibold text-red-600">Te laat</p>
              <div className="space-y-2">{overdueTasks.map(renderTaskCard)}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map((day, i) => {
              const dayTasks = tasksByDay.get(day.getTime()) ?? [];
              const isToday = day.getTime() === startOfDayOf(new Date()).getTime();
              return (
                <div
                  key={day.getTime()}
                  className={`rounded-xl border p-3 ${
                    isToday ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <p
                    className={`mb-2 text-sm font-semibold ${
                      isToday ? "text-indigo-600" : "text-slate-500"
                    }`}
                  >
                    {WEEKDAY_LABELS[i]} {day.getDate()}/{day.getMonth() + 1}
                  </p>
                  <div className="space-y-2">
                    {dayTasks.length === 0 && (eventsByDay.get(day.getTime()) ?? []).length === 0 && (
                      <p className="text-xs text-slate-300">–</p>
                    )}
                    {(eventsByDay.get(day.getTime()) ?? []).map(renderCompactEvent)}
                    {dayTasks.map(renderCompactTask)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!loading && view === "agenda" && (
        <section>
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-600">
              Nieuwe activiteit
            </h2>
            <form onSubmit={addEvent} className="flex flex-wrap gap-2">
              <input
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Bijv. Verjaardag oma, Tandarts..."
                className="min-w-[180px] flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <input
                type="datetime-local"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <select
                value={newEventAssigneeId}
                onChange={(e) => setNewEventAssigneeId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">Iedereen</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Toelichting (optioneel)"
                className="min-w-[180px] flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Toevoegen
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-slate-400">
                Nog geen activiteiten gepland.
              </p>
            )}
            {upcomingEvents.map(renderEventRow)}
          </div>
        </section>
      )}
    </div>
  );
}
