import {
  agregarTarea,
  eliminarTarea,
  editarTarea,
  toggleEstadoTarea,
  filtrarTareas,
  cargarTareasAsync,
  getTareaById,
  getTareas
} from './store.js';
import { TareaImportante } from './classes.js';

// DOM
const nombreInput = document.getElementById('nombreInput');
const prioridadSelect = document.getElementById('prioridadSelect');
const agregarBtn = document.getElementById('agregarBtn');
const taskContainer = document.getElementById('taskContainer');

const filterAll = document.getElementById('filterAll');
const filterPending = document.getElementById('filterPending');
const filterCompleted = document.getElementById('filterCompleted');

const totalTasksEl = document.getElementById('totalTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const completedTasksEl = document.getElementById('completedTasks');

// Estado UI
let filtroActual = 'all';
let tareaActualId = null;

// Helpers UI
const updateStats = () => {
  const all = getTareas();
  const pending = all.filter(t => !t.estado).length;
  const completed = all.length - pending;

  totalTasksEl.textContent = all.length;
  pendingTasksEl.textContent = pending;
  completedTasksEl.textContent = completed;
};

// Renderizar tareas
const renderTareas = (tareas) => {
  if (!tareas || tareas.length === 0) {
    taskContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <p>No hay tareas ${filtroActual === 'all' ? '' : filtroActual === 'pending' ? 'pendientes' : 'completadas'}</p>
      </div>
    `;
    updateStats();
    return;
  }

  taskContainer.innerHTML = tareas.map(tarea => `
    <div class="task-item" data-id="${tarea.id}">
      <div class="task-info">
        <label class="task-checkbox-container">
          <input
            type="checkbox"
            class="task-checkbox"
            ${tarea.estado ? 'checked' : ''}
            aria-label="Marcar como ${tarea.estado ? 'pendiente' : 'completa'}"
          />
          <span class="checkmark"></span>
        </label>
        <span class="task-name ${tarea.estado ? 'completed' : ''}">${tarea.nombre}</span>
        ${'prioridad' in tarea && tarea.prioridad ? `
          <span class="task-priority ${tarea.getPrioridadColor?.() || ''}">
            ${tarea.prioridad === 'alta' ? '<i class="fas fa-exclamation-circle"></i>' : ''}
            ${tarea.prioridad === 'media' ? '<i class="fas fa-info-circle"></i>' : ''}
            ${tarea.prioridad === 'baja' ? '<i class="fas fa-arrow-down"></i>' : ''}
            ${tarea.prioridad}
          </span>
        ` : ''}
      </div>
      <div class="task-actions">
        <button class="btn-icon secondary" aria-label="Editar tarea" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon danger" aria-label="Eliminar tarea" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  // Listeners
  taskContainer.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const taskId = parseInt(e.target.closest('.task-item').dataset.id, 10);
      toggleEstadoTarea(taskId);
    });
  });

  taskContainer.querySelectorAll('.task-actions .secondary').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = parseInt(e.target.closest('.task-item').dataset.id, 10);
      editarTareaHandler(taskId);
    });
  });

  taskContainer.querySelectorAll('.task-actions .danger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = parseInt(e.target.closest('.task-item').dataset.id, 10);
      eliminarTareaHandler(taskId);
    });
  });

  updateStats();
};

//Modales
const modalEditar = document.createElement('div');
modalEditar.className = 'modal';
modalEditar.innerHTML = `
  <div class="modal-content">
    <span class="close-modal">&times;</span>
    <h3>Editar Tarea</h3>
    <div class="modal-body">
      <div class="form-group">
        <label for="editNombre">Nombre:</label>
        <input type="text" id="editNombre" class="modal-input">
      </div>
      <div class="form-group" id="prioridadContainer">
        <label for="editPrioridad">Prioridad:</label>
        <select id="editPrioridad" class="modal-select">
          <option value="">Normal</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>
      <div class="form-group">
        <button id="guardarCambios" class="btn primary">Guardar</button>
      </div>
    </div>
  </div>
`;

const modalEliminar = document.createElement('div');
modalEliminar.className = 'modal';
modalEliminar.innerHTML = `
  <div class="modal-content">
    <span class="close-modal">&times;</span>
    <h3>Confirmar Eliminación</h3>
    <div class="modal-body">
      <p>¿Estás seguro de que deseas eliminar esta tarea?</p>
      <div class="modal-actions">
        <button id="confirmarEliminar" class="btn danger">Eliminar</button>
        <button id="cancelarEliminar" class="btn secondary">Cancelar</button>
      </div>
    </div>
  </div>
`;

document.body.appendChild(modalEditar);
document.body.appendChild(modalEliminar);

// (declarados ANTES de usarlos, pobando y.y)
const mostrarModal = (modal) => { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; };
const ocultarModal = (modal) => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; tareaActualId = null; };

const guardarCambiosHandler = () => {
  if (tareaActualId === null) return;
  const nuevoNombre = modalEditar.querySelector('#editNombre').value.trim();
  if (!nuevoNombre) return;

  const tarea = getTareaById(tareaActualId);
  const prioridad = modalEditar.querySelector('#editPrioridad').value || null;

  editarTarea(tareaActualId, {
    nombre: nuevoNombre,
    prioridad: tarea instanceof TareaImportante ? prioridad : null
  });

  ocultarModal(modalEditar);
};

const confirmarEliminarHandler = () => {
  if (tareaActualId === null) return;
  const index = getTareas().findIndex(t => t.id === tareaActualId);
  if (index !== -1) eliminarTarea(index);
  ocultarModal(modalEliminar);
};

const editarTareaHandler = (id) => {
  const tarea = getTareaById(id);
  if (!tarea) return;
  tareaActualId = id;

  const editNombre = modalEditar.querySelector('#editNombre');
  const editPrioridad = modalEditar.querySelector('#editPrioridad');
  const prioridadContainer = modalEditar.querySelector('#prioridadContainer');

  editNombre.value = tarea.nombre;

  if (tarea instanceof TareaImportante) {
    prioridadContainer.style.display = 'block';
    editPrioridad.value = tarea.prioridad ?? '';
  } else {
    prioridadContainer.style.display = 'none';
    editPrioridad.value = '';
  }
  mostrarModal(modalEditar);
};

const eliminarTareaHandler = (id) => { tareaActualId = id; mostrarModal(modalEliminar); };

// Configurar eventos de modales
modalEditar.querySelector('.close-modal').addEventListener('click', () => ocultarModal(modalEditar));
modalEliminar.querySelector('.close-modal').addEventListener('click', () => ocultarModal(modalEliminar));
modalEditar.querySelector('#guardarCambios').addEventListener('click', guardarCambiosHandler);
modalEliminar.querySelector('#confirmarEliminar').addEventListener('click', confirmarEliminarHandler);
modalEliminar.querySelector('#cancelarEliminar').addEventListener('click', () => ocultarModal(modalEliminar));

// Filtros
const aplicarFiltro = (filtro) => {
  filtroActual = filtro;
  [filterAll, filterPending, filterCompleted].forEach(btn => btn.classList.remove('active'));
  document.getElementById(`filter${filtro.charAt(0).toUpperCase() + filtro.slice(1)}`)?.classList.add('active');
  renderTareas(filtrarTareas(filtro));
};

//Crear
const agregarTareaHandler = () => {
  const nombre = nombreInput.value.trim();
  if (!nombre) {
    nombreInput.focus();
    return;
  }
  const prioridad = prioridadSelect.value || null;
  agregarTarea(nombre, false, prioridad);
  nombreInput.value = '';
  prioridadSelect.value = '';
  nombreInput.focus();
};

// Listeners principales
agregarBtn.addEventListener('click', agregarTareaHandler);
nombreInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarTareaHandler(); });

filterAll.addEventListener('click', () => aplicarFiltro('all'));
filterPending.addEventListener('click', () => aplicarFiltro('pending'));
filterCompleted.addEventListener('click', () => aplicarFiltro('completed'));

// Re-render cuando cambie el estado del store
document.addEventListener('tareasActualizadas', () => {
  renderTareas(filtrarTareas(filtroActual));
});

// Inicio
aplicarFiltro('all');
cargarTareasAsync().then(() => console.log('Tareas cargadas correctamente'));
