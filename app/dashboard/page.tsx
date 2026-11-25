"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { isTaskOverdue } from "@/lib/utils";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";

type FilterStatus = TaskStatus | "all" | "overdue";
type FilterPriority = TaskPriority | "all";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [sortByPriority, setSortByPriority] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [username, setUsername] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchTasks = useCallback(
    async (status?: string, priority?: string, search?: string) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (status && status !== "all" && status !== "overdue") params.set("status", status);
      if (priority && priority !== "all") params.set("priority", priority);
      if (search?.trim()) params.set("search", search.trim());
      const url = params.toString() ? `/api/tasks?${params.toString()}` : "/api/tasks";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const json = await res.json();
      setTasks(json.data ?? []);
      setLoading(false);
    },
    [token, router]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedName = localStorage.getItem("name") ?? "";
    if (!storedToken) {
      router.push("/");
      return;
    }
    setUsername(storedName);
  }, [router]);

  // Debounced search effect (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks(filterStatus, filterPriority, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Immediate fetch on status or priority filter changes
  useEffect(() => {
    fetchTasks(filterStatus, filterPriority, searchTerm);
  }, [filterStatus, filterPriority]);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.clear();
    router.push("/");
  }

  async function handleCreate(data: Partial<Task>) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to create task");
    }
    setShowForm(false);
    fetchTasks(filterStatus, filterPriority, searchTerm);
  }

  async function handleUpdate(data: Partial<Task>) {
    if (!editingTask) return;
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to update task");
    }
    setEditingTask(null);
    fetchTasks(filterStatus, filterPriority, searchTerm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to delete task");
      return;
    }
    fetchTasks(filterStatus, filterPriority, searchTerm);
  }

  const statusFilters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "To Do", value: "todo" },
    { label: "In Progress", value: "in-progress" },
    { label: "Done", value: "done" },
    { label: "Overdue", value: "overdue" },
  ];

  const priorityFilters: { label: string; value: FilterPriority }[] = [
    { label: "All", value: "all" },
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
    { label: "Critical", value: "critical" },
  ];

  // Client-side: overdue filter + priority sort
  let displayedTasks = filterStatus === "overdue" ? tasks.filter(isTaskOverdue) : tasks;
  if (sortByPriority) {
    displayedTasks = [...displayedTasks].sort(
      (a, b) => (PRIORITY_ORDER[b.priority ?? ""] ?? 0) - (PRIORITY_ORDER[a.priority ?? ""] ?? 0)
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Task Manager</h1>
          <p className="text-xs text-gray-500">GitHub Copilot Kata</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600" data-testid="logged-in-user">
            {username}
          </span>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            data-testid="search-input"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2" data-testid="status-filter">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                data-testid={`filter-${f.value}`}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
                  filterStatus === f.value
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setShowForm(true); setEditingTask(null); }}
            data-testid="add-task-button"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Add Task
          </button>
        </div>

        {/* Priority filter bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <div className="flex gap-2 flex-wrap" data-testid="priority-filter">
            {priorityFilters.map((pf) => (
              <button
                key={pf.value}
                onClick={() => setFilterPriority(pf.value)}
                data-testid={`filter-priority-${pf.value}`}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
                  filterPriority === pf.value
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortByPriority((prev) => !prev)}
            data-testid="sort-priority-button"
            className={`ml-auto text-sm px-3 py-1.5 rounded-lg font-medium transition ${
              sortByPriority
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {sortByPriority ? "Sorted by Priority" : "Sort by Priority"}
          </button>
        </div>

        {/* Task form modal */}
        {(showForm || editingTask) && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" data-testid="task-modal">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <TaskForm
                initial={editingTask ?? undefined}
                mode={editingTask ? "edit" : "create"}
                onSubmit={editingTask ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditingTask(null); }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm mb-4" data-testid="dashboard-error">
            {error}
          </p>
        )}

        {/* Task list */}
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-12" data-testid="loading-indicator">
            Loading tasks…
          </p>
        ) : displayedTasks.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12" data-testid="empty-state">
            No tasks found. Add one to get started!
          </p>
        ) : (
          <div
            className="grid gap-4 sm:grid-cols-2"
            data-testid="task-list"
          >
            {displayedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => { setEditingTask(t); setShowForm(false); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Task count */}
        {!loading && (
          <p className="text-xs text-gray-400 text-center mt-6" data-testid="task-count">
            {displayedTasks.length} task{displayedTasks.length !== 1 ? "s" : ""}
            {filterStatus !== "all" ? ` · status "${filterStatus}"` : ""}
            {filterPriority !== "all" ? ` · priority "${filterPriority}"` : ""}
            {filterStatus === "all" && filterPriority === "all" ? " total" : ""}
          </p>
        )}
      </main>
    </div>
  );
}
