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

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskFrequency, setNewTaskFrequency] = useState<Frequency>("WEEKLY");
  const [newMemberName, setNewMemberName] = useState("");

  async function loadAll() {
    const [tasksRes, membersRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/members"),
    ]);
    setTasks(await tasksRes.json());
    setMembers(await membersRes.json());
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

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    [tasks]
  );

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
      body: JSON.stringify({ name: newTaskName.trim(), frequency: newTaskFrequency }),
    });
    setNewTaskName("");
    loadAll();
  }

  async function removeTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
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

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
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
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Taak toevoegen
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {loading && <p className="text-sm text-slate-400">Laden...</p>}
        {!loading && sortedTasks.length === 0 && (
          <p className="text-sm text-slate-400">
            Nog geen taken. Voeg er hierboven een toe.
          </p>
        )}
        {sortedTasks.map((task) => {
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
                <div className="flex items-center gap-2">
                  <span className="font-medium">{task.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {FREQUENCY_LABELS[task.frequency]}
                  </span>
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
        })}
      </section>
    </div>
  );
}
