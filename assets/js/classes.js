// Variable global con var
var appName = 'TaskMaster ES6';

export class Tarea {
  constructor(nombre, estado = false, id) {
    this.nombre = nombre;
    this.estado = estado;
    this.id = id;
    this.fechaCreacion = new Date();
  }

  mostrarDetalles() {
    return {
      id: this.id,
      nombre: this.nombre,
      estado: this.estado,
      fecha: this.fechaCreacion.toLocaleDateString()
    };
  }

  toggleEstado() {
    this.estado = !this.estado;
    return this.estado;
  }
}

export class TareaImportante extends Tarea {
  constructor(nombre, estado = false, id, prioridad = 'media') {
    super(nombre, estado, id);
    this.prioridad = prioridad;
  }

  mostrarDetalles() {
    return {
      ...super.mostrarDetalles(),
      prioridad: this.prioridad,
      esImportante: true
    };
  }

  getPrioridadColor() {
    switch (this.prioridad) {
      case 'alta': return 'priority-high';
      case 'media': return 'priority-medium';
      case 'baja': return 'priority-low';
      default: return '';
    }
  }
}
