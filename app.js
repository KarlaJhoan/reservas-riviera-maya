
let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";

const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const estado = document.querySelector("#estado");

async function cargarExperiencias() {
    try {
        if (estado) estado.textContent = "Cargando experiencias...";
        const respuesta = await fetch("./data/experiencias.json");
        if (!respuesta.ok) {
            throw new Error("No fue posible cargar las experiencias");
        }
        experiencias = await respuesta.json();
        if (estado) estado.textContent = `${experiencias.length} experiencias disponibles`;
        actualizarCatalogo();
    } catch (error) {
        if (estado) estado.textContent = "Error al cargar la información";
        console.error("Detalle del error:", error);
    }
}

function obtenerResultados() {
    let resultados = [...experiencias];

    // 1. Filtro por categoría (lo que ya tenías)
    if (categoriaActual !== "todas") {
        resultados = resultados.filter(
            experiencia => experiencia.categoria === categoriaActual
        );

    }

    // 2. Filtro de precio máximo (Punto 10 del reto)
    const precioMax = Number(document.querySelector("#filtroPrecioMax")?.value);
    if (precioMax && precioMax > 0) {
        resultados = resultados.filter(
            experiencia => experiencia.precio <= precioMax
        );
    }

    // ¡¡ESTA ES LA LÍNEA QUE TE FALTA!!
    return resultados; 
}

function actualizarCatalogo() {
    const resultados = obtenerResultados();
    if (resultados.length === 0) {
        if (catalogo) catalogo.innerHTML = `<p class="sin-resultados">No se encontraron experiencias</p>`;
        if (estado) estado.textContent = "0 resultados";
        return;
    }
    if (catalogo) {
        catalogo.innerHTML = resultados.map(experiencia => `
            <article class="tarjeta">
                <div class="imagen">${experiencia.icono}</div>
                <div class="informacion">
                    <span class="categoria">${experiencia.categoria}</span>
                    <h3>${experiencia.nombre}</h3>
                    <p>Cupo disponible: ${experiencia.cupo}</p>
                    <p class="precio">$${experiencia.precio} MXN</p>
                    <label>Personas:
                        <input type="number" id="cantidad-${experiencia.id}" min="1" max="${experiencia.cupo}" value="1">
                    </label>
                    <button class="btn-reservar" data-id="${experiencia.id}">
                        Agregar
                    </button>
                </div>
            </article>
        `).join('');
    }
    if (estado) estado.textContent = `${resultados.length} resultados`;
    agregarEventosReservar();
}

function agregarEventosReservar() {
    const botonesReservar = document.querySelectorAll(".btn-reservar");
    botonesReservar.forEach(boton => {
        boton.addEventListener("click", () => {
            const id = Number(boton.dataset.id);
            agregarReserva(id);
        });
    });
}

function agregarReserva(id) {
    const experiencia = experiencias.find(elemento => elemento.id === id);
    const entradaCantidad = document.querySelector(`#cantidad-${id}`);
    const cantidad = Number(entradaCantidad.value);

    if (cantidad < 1 || cantidad > experiencia.cupo) {
        alert("Cantidad no válida");
        return;
    }
    const reservaExistente = reservas.find(
        reserva => reserva.experienciaId === id
    );
    if (reservaExistente) {
        const nuevaCantidad = reservaExistente.cantidad + cantidad;
        if (nuevaCantidad > experiencia.cupo) {
            alert("La cantidad supera el cupo disponible");
            return;
        }
        reservaExistente.cantidad = nuevaCantidad;
        reservaExistente.subtotal = nuevaCantidad * experiencia.precio;
    } else {
        reservas.push({
            experienciaId: experiencia.id,
            nombre: experiencia.nombre,
            precio: experiencia.precio,
            cantidad,
            subtotal: experiencia.precio * cantidad
        });
    }
    mostrarReservas() 
    {
      let totalPersonas = 0;
    reservas.forEach(reserva => {
        totalPersonas += reserva.cantidad;
    });

    const elementoTotalPersonas = document.querySelector("#totalPersonas");
    if (elementoTotalPersonas) {
        elementoTotalPersonas.textContent = totalPersonas;
    }
}

function mostrarReservas() {
    if (reservas.length === 0) {
        if (listaReservas) listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
        if (total) total.textContent = "$0 MXN";
        return;
    }
    if (listaReservas) {
        listaReservas.innerHTML = reservas.map(reserva => `
            <article class="item-reserva">
                <div>
                    <strong>${reserva.nombre}</strong>
                    <p>${reserva.cantidad} persona(s) x $${reserva.precio}</p>
                </div>
                <div>
                    <strong>$${reserva.subtotal} MXN</strong>
                    <button class="btn-eliminar" data-id="${reserva.experienciaId}">
                        Eliminar
                    </button>
                </div>
            </article>
        `).join("");
    }

    const totalReserva = reservas.reduce(
        (acumulado, reserva) => acumulado + reserva.subtotal, 0
    );
    if (total) total.textContent = `$${totalReserva} MXN`;
    agregarEventosEliminar();
}

function agregarEventosEliminar() {
    const botonesEliminar = document.querySelectorAll(".btn-eliminar");
    botonesEliminar.forEach(boton => {
        boton.addEventListener("click", () => {
            const id = Number(boton.dataset.id);
            eliminarReserva(id);
        });
    });
}

function eliminarReserva(id) {
    reservas = reservas.filter(reserva => reserva.experienciaId !== id);
    mostrarReservas();
}

if (buscador) {
    buscador.addEventListener("input", () => {
        textoBusqueda = buscador.value.trim().toLowerCase();
        actualizarCatalogo();
    });
}

if (filtroCategoria) {
    filtroCategoria.addEventListener("change", () => {
        categoriaActual = filtroCategoria.value;
        actualizarCatalogo();
    });
}

if (ordenPrecio) {
    ordenPrecio.addEventListener("change", () => {
        ordenActual = ordenPrecio.value;
        actualizarCatalogo();
    });
}

cargarExperiencias();

const btnVaciar = document.querySelector("#btnVaciar");


if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
    
        if (reservas.length > 0 && confirm("¿Estás seguro de que deseas vaciar toda tu reservación?")) {
            reservas = [];             
            renderizarReservas();      
        }
    });
  }
}
// Iniciar la aplicación
cargarExperiencias(); 