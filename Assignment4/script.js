// State
let tasks = [];         // array of { id, text, done, dueDate }
let filter = 'all';     // 'all' | 'active' | 'done'
let editingId = null;   // id of the task currently being edited, or null

const STORAGE_KEY = 'taskManager.tasks';

// Dom preferences
const taskInput    = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDateInput');
const addBtn       = document.getElementById('addBtn');
const taskList     = document.getElementById('taskList');
const counter      = document.getElementById('counter');
const clearDoneBtn = document.getElementById('clearDoneBtn');

const showAllBtn    = document.getElementById('showAllBtn');
const showActiveBtn = document.getElementById('showActiveBtn');
const showDoneBtn   = document.getElementById('showDoneBtn');

const filterButtons = {
    all: showAllBtn,
    active: showActiveBtn,
    done: showDoneBtn
};

// Persistence
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (err) {
            console.error('Could not parse saved tasks, starting fresh.', err);
            tasks = [];
        }
    } else {
        // Starter tasks for a first-time visit
        tasks = [
            { id: Date.now() - 2, text: 'Reading a book', done: false, dueDate: null },
            { id: Date.now() - 1, text: 'Writing a personal essay', done: false, dueDate: null },
            { id: Date.now(), text: 'Exercising for an hour', done: false, dueDate: null }
        ];
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Rendering
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getFilteredTasks() {
    let result;
    if (filter === 'active') result = tasks.filter(t => !t.done);
    else if (filter === 'done') result = tasks.filter(t => t.done);
    else result = tasks.slice(); // copy of the full list

    
    return result.sort((a, b) => Number(a.done) - Number(b.done));
}

function formatDueDate(dateStr) {
    // dateStr comes from <input type="date"> as "YYYY-MM-DD"
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    const formatted = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = date < today;

    return { formatted, isOverdue };
}

function render() {
    const visibleTasks = getFilteredTasks();

    if (visibleTasks.length === 0) {
        const message = tasks.length === 0
            ? 'No tasks yet — add one above.'
            : `No ${filter} tasks.`;
        taskList.innerHTML = `<li class="empty-state">${message}</li>`;
    } else {
        taskList.innerHTML = visibleTasks
            .map(task => {
                // If this task is mid-edit, render an input instead of plain text.
                if (task.id === editingId) {
                    return `
                        <li data-id="${task.id}">
                            <button class="task-check ${task.done ? 'done' : ''}" data-action="toggle">
                                ${task.done ? '✓' : ''}
                            </button>
                            <div class="task-body">
                                <input
                                    type="text"
                                    class="task-edit-input"
                                    data-action="edit-input"
                                    value="${escapeHtml(task.text)}"
                                >
                            </div>
                            <button class="delete-btn" data-action="delete" aria-label="Delete task">✕</button>
                        </li>
                    `;
                }

                let dueHtml = '';
                if (task.dueDate) {
                    const { formatted, isOverdue } = formatDueDate(task.dueDate);
                    const overdueClass = (isOverdue && !task.done) ? 'overdue' : '';
                    dueHtml = `<div class="task-due ${overdueClass}">Due ${formatted}</div>`;
                }

                return `
                    <li data-id="${task.id}">
                        <button class="task-check ${task.done ? 'done' : ''}" data-action="toggle">
                            ${task.done ? '✓' : ''}
                        </button>
                        <div class="task-body">
                            <span class="task-text ${task.done ? 'done' : ''}" data-action="start-edit">${escapeHtml(task.text)}</span>
                            ${dueHtml}
                        </div>
                        <button class="delete-btn" data-action="delete" aria-label="Delete task">✕</button>
                    </li>
                `;
            })
            .join('');

        // If a task is being edited, focus its input and put the, cursor at the end of the existing text.
        if (editingId !== null) {
            const input = taskList.querySelector('.task-edit-input');
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
    }

    // Update counter
    const activeCount = tasks.filter(t => !t.done).length;
    counter.textContent = `${activeCount} active / ${tasks.length} total`;

    // Update filter button styling
    Object.keys(filterButtons).forEach(key => {
        filterButtons[key].classList.toggle('active', key === filter);
    });

    // Disable "Clear Done" when there's nothing to clear
    clearDoneBtn.disabled = tasks.every(t => !t.done);

    saveTasks();
}

// Task operations
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push({
        id: Date.now(),
        text: text,
        done: false,
        dueDate: dueDateInput.value || null   // optional
    });

    taskInput.value = '';
    dueDateInput.value = '';
    render();
    taskInput.focus();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    if (editingId === id) editingId = null;
    render();
}

function toggleTask(id) {
    tasks = tasks.map(t =>
        t.id === id ? { ...t, done: !t.done } : t
    );
    render();
}

function clearDone() {
    const doneCount = tasks.filter(t => t.done).length;
    if (doneCount === 0) return;

    const confirmed = confirm(`Delete ${doneCount} completed task${doneCount === 1 ? '' : 's'}?`);
    if (!confirmed) return;

    tasks = tasks.filter(t => !t.done);
    render();
}

function setFilter(newFilter) {
    filter = newFilter;
    render();
}

// Editing (double-click a task's text) 
function startEdit(id) {
    editingId = id;
    render();
}

function commitEdit(id, newText) {
    const trimmed = newText.trim();

    if (!trimmed) {
        // Editing down to empty text deletes the task
        tasks = tasks.filter(t => t.id !== id);
    } else {
        tasks = tasks.map(t =>
            t.id === id ? { ...t, text: trimmed } : t
        );
    }

    editingId = null;
    render();
}

function cancelEdit() {
    editingId = null;
    render();
}

// Event Listeners
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
});

// Event delegation: the list handle every task row, including rows added later.
taskList.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;

    const id = Number(li.dataset.id);
    const action = e.target.dataset.action;

    if (action === 'toggle') toggleTask(id);
    if (action === 'delete') deleteTask(id);
});

taskList.addEventListener('dblclick', (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;

    if (e.target.dataset.action === 'start-edit') {
        startEdit(Number(li.dataset.id));
    }
});

// While a task is being edited, Enter saves and Escape cancels.
taskList.addEventListener('keydown', (e) => {
    if (e.target.dataset.action !== 'edit-input') return;

    const li = e.target.closest('li[data-id]');
    const id = Number(li.dataset.id);

    if (e.key === 'Enter') commitEdit(id, e.target.value);
    if (e.key === 'Escape') cancelEdit();
});

// Clicking away from the edit box also saves it.
// (Guarded by editingId so that a prior Enter/Escape — which already
// cleared editingId and re-rendered — doesn't cause a second, stale save.)
taskList.addEventListener('focusout', (e) => {
    if (e.target.dataset.action !== 'edit-input') return;
    const li = e.target.closest('li[data-id]');
    const id = Number(li.dataset.id);
    if (editingId !== id) return;
    commitEdit(id, e.target.value);
});

clearDoneBtn.addEventListener('click', clearDone);

showAllBtn.addEventListener('click', () => setFilter('all'));
showActiveBtn.addEventListener('click', () => setFilter('active'));
showDoneBtn.addEventListener('click', () => setFilter('done'));

// initialize app
loadTasks();
render();