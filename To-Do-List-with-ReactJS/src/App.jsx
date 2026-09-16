import { useState } from "react";
import "./App.css";

const FILTERS = {
  all: () => true,
  active: (task) => !task.done,
  completed: (task) => task.done,
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");

  function addTask(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false },
    ]);
    setDraft("");
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  const visibleTasks = tasks.filter(FILTERS[filter]);
  const remaining = tasks.filter((task) => !task.done).length;

  return (
    <main className="board">
      <header className="board__header">
        <h1>To Do List</h1>
        <p className="board__count">
          {tasks.length === 0
            ? "Nothing on the list yet"
            : `${remaining} of ${tasks.length} left`}
        </p>
      </header>

      <form className="add-row" onSubmit={addTask}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs doing?"
          aria-label="New task"
        />
        <button type="submit">Add</button>
      </form>

      <nav className="filters" role="tablist" aria-label="Filter tasks">
        {Object.keys(FILTERS).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={filter === key ? "filters__btn is-active" : "filters__btn"}
            onClick={() => setFilter(key)}
          >
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </nav>

      <ul className="list">
        {visibleTasks.length === 0 && (
          <li className="list__empty">
            {filter === "completed"
              ? "No completed tasks yet."
              : filter === "active"
              ? "No active tasks — you're caught up."
              : "Add your first task above."}
          </li>
        )}
        {visibleTasks.map((task) => (
          <li key={task.id} className="list__item">
            <label className="list__label">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <span className={task.done ? "is-done" : ""}>{task.text}</span>
            </label>
            <button
              className="list__delete"
              onClick={() => deleteTask(task.id)}
              aria-label={`Delete "${task.text}"`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}