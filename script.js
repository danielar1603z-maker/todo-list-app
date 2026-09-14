// ---------- Estado ----------
// Algunos navegadores/entornos bloquean localStorage (ej. vistas previas
// dentro de un iframe). Si eso pasa, la app sigue funcionando en memoria
// durante la sesión, solo que no recuerda las tareas al recargar.
let storageAvailable = true;

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem('tasks')) || [];
  } catch (err) {
    storageAvailable = false;
    console.warn('localStorage no disponible, las tareas no se guardarán entre sesiones.');
    return [];
  }
}

let tasks = loadTasks();
let currentFilter = 'all';

// ---------- Elementos del DOM ----------
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterButtons = document.querySelectorAll('.filter-btn');
const dateToday = document.getElementById('dateToday');

// ---------- Fecha de hoy ----------
dateToday.textContent = new Date().toLocaleDateString('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

// ---------- Guardar en localStorage ----------
function saveTasks() {
  if (!storageAvailable) return;
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  } catch (err) {
    storageAvailable = false;
    console.warn('localStorage no disponible, las tareas no se guardarán entre sesiones.');
  }
}

// ---------- Renderizar tareas ----------
function renderTasks() {
  taskList.innerHTML = '';

  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  emptyState.style.display = filteredTasks.length === 0 ? 'block' : 'none';

  filteredTasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Marcar como completada">
      <span class="task-text">${escapeHTML(task.text)}</span>
      <button class="delete-btn" aria-label="Eliminar tarea">✕</button>
    `;

    taskList.appendChild(li);
  });

  const pending = tasks.filter((t) => !t.completed).length;
  taskCount.textContent = `${pending} tarea${pending === 1 ? '' : 's'} pendiente${pending === 1 ? '' : 's'}`;
}

// Evita inyección de HTML si el usuario escribe etiquetas
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Agregar tarea ----------
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({
    id: Date.now().toString(),
    text,
    completed: false,
  });

  taskInput.value = '';
  saveTasks();
  renderTasks();
});

// ---------- Marcar completada / eliminar (delegación de eventos) ----------
taskList.addEventListener('click', (e) => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.matches('input[type="checkbox"]')) {
    const task = tasks.find((t) => t.id === id);
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }

  if (e.target.matches('.delete-btn')) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
  }
});

// ---------- Filtros ----------
filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ---------- Borrar completadas ----------
clearCompletedBtn.addEventListener('click', () => {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
});

// ---------- Inicio ----------
renderTasks();
