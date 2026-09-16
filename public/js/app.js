const estado = {
  jugadoresActivos: 0,
  saldoCirculacion: 0,
  apuestasHoy: 0,
  puestosActivos: 0
};

const dinero = valor => new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
}).format(valor);

function actualizarPanel() {
  document.getElementById('jugadoresActivos').textContent = estado.jugadoresActivos;
  document.getElementById('saldoCirculacion').textContent = dinero(estado.saldoCirculacion);
  document.getElementById('apuestasHoy').textContent = estado.apuestasHoy;
  document.getElementById('puestosActivos').textContent = estado.puestosActivos;
}

async function cargarEstado() {
  try {
    const respuesta = await fetch('/api/estado');
    if (!respuesta.ok) throw new Error('Servidor no disponible');
    Object.assign(estado, await respuesta.json());
    actualizarPanel();
  } catch (error) {
    console.error(error);
    actualizarPanel();
    mostrarAviso('No se pudo conectar con el servidor.');
  }
}

async function comprobarBaseDeDatos() {
  try {
    const respuesta = await fetch('/api/salud');
    if (!respuesta.ok) throw new Error('PostgreSQL no disponible');
    return true;
  } catch (error) {
    mostrarAviso('PostgreSQL no está disponible. Revisa DATABASE_URL en Railway.');
    return false;
  }
}

function abrirModalJugador() {
  document.getElementById('modalJugador').classList.remove('hidden');
  setTimeout(() => document.getElementById('jugadorId').focus(), 50);
}

function cerrarModalJugador() {
  document.getElementById('modalJugador').classList.add('hidden');
}

function mostrarAviso(mensaje) {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.classList.remove('hidden');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

async function registrarJugadorDemo() {
  const id = document.getElementById('jugadorId').value.trim();
  const saldo = Number(document.getElementById('saldoInicial').value);

  if (!id) {
    mostrarAviso('Ingresa un identificador para el jugador.');
    return;
  }

  if (!Number.isSafeInteger(saldo) || saldo < 0) {
    mostrarAviso('El saldo inicial debe ser un número válido mayor o igual a 0.');
    return;
  }

  const boton = document.querySelector('#modalJugador button[type="submit"], #modalJugador .btn-primary');
  if (boton) boton.disabled = true;

  try {
    const respuesta = await fetch('/api/jugadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identificador: id,
        saldoInicial: saldo
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || 'No se pudo registrar el jugador.');
    }

    cerrarModalJugador();
    document.getElementById('jugadorId').value = '';
    document.getElementById('saldoInicial').value = '';

    mostrarAviso(`Jugador ${id} registrado con ${dinero(saldo)}.`);
    await cargarEstado();
  } catch (error) {
    console.error(error);
    mostrarAviso(error.message);
  } finally {
    if (boton) boton.disabled = false;
  }
}

document.getElementById('modalJugador').addEventListener('click', event => {
  if (event.target.id === 'modalJugador') cerrarModalJugador();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') cerrarModalJugador();
});

cargarEstado();
comprobarBaseDeDatos();
