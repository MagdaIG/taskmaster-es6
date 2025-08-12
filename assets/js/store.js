import { Tarea, TareaImportante } from './classes.js';

// Estado interno
let ultimoId = 0;
const nextId = () => ++ultimoId;

let tareas = [];
const tareasMap = new Map();     // id -> tarea

// Utilidad: notificar a la UI
const notify = () => {
  document.dispatchEvent(
    new CustomEvent('tareasActualizadas', { detail: { tareas: getTareas() } })
  );
};

// API pública
export const getTareas = () => [...tareas];
export const getTareaById = (id) => tareasMap.get(id) || null;

export const agregarTarea = (nombre, estado = false, prioridad = null) => {
  const id = nextId();
  const tarea = prioridad
    ? new TareaImportante(nombre, estado, id, prioridad)
    : new Tarea(nombre, estado, id);

  tareas = [...tareas, tarea];
  tareasMap.set(id, tarea);
  notify();
  return tarea;
};

// Eliminar por índices (rest). como por ej: eliminarTarea(0) o eliminarTarea(0,2)
export const eliminarTarea = (...indices) => {
  const idxDesc = [...new Set(indices)].sort((a, b) => b - a);
  let copia = [...tareas];
  for (const i of idxDesc) {
    const t = copia[i];
    if (t) {
      tareasMap.delete(t.id);
      copia.splice(i, 1);
    }
  }
  tareas = copia;
  notify();
};

// Editar por ID
export const editarTarea = (id, { nombre, estado, prioridad } = {}) => {
  const t = tareasMap.get(id);
  if (!t) return null;

  const esImportante = t instanceof TareaImportante;
  const nueva = esImportante
    ? new TareaImportante(
      nombre ?? t.nombre,
      estado ?? t.estado,
      t.id,
      prioridad ?? t.prioridad
    )
    : new Tarea(
      nombre ?? t.nombre,
      estado ?? t.estado,
      t.id
    );

  tareas = tareas.map(x => (x.id === id ? nueva : x));
  tareasMap.set(id, nueva);
  notify();
  return nueva;
};

export const toggleEstadoTarea = (id) => {
  const t = tareasMap.get(id);
  if (!t) return;
  editarTarea(id, { estado: !t.estado });
};

export const filtrarTareas = (filtro = 'all') => {
  const lista = getTareas();
  if (filtro === 'pending') return lista.filter(t => !t.estado);
  if (filtro === 'completed') return lista.filter(t => t.estado);
  return lista;
};

// Async demo
export const cargarTareasAsync = async () => {
  const simularFetch = () =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve([
          { nombre: 'Leer sobre ES6', estado: true, prioridad: null },
          { nombre: 'Practicar Map/Set', estado: false, prioridad: 'alta' },
          { nombre: 'Probar generadores', estado: false, prioridad: 'baja' },
        ]);
      }, 500)
    );

  const data = await simularFetch();
  for (const t of data) agregarTarea(t.nombre, t.estado, t.prioridad);
};
