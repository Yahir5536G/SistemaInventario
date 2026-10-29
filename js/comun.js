"use strict";


// CÓDIGO COMPARTIDO POR TODAS LAS PÁGINAS

const SUPABASE_URL = "https://bakwbbfsrulakgcwhrxo.supabase.co";
const SUPABASE_KEY = "sb_publishable_ujkSPM_sZLjAp57s0tSrFA_eqSqLRbZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// Mostrar mensajes


let temporizadorMensaje;

function mostrarMensaje(texto, error = false) {
    let mensaje = document.getElementById("mensaje");

    if (!mensaje) {
        mensaje = document.createElement("p");
        mensaje.id = "mensaje";
        document.querySelector("main form").before(mensaje);
    }

    mensaje.textContent = texto;
    mensaje.classList.toggle("error", error);
    mensaje.setAttribute("role", error ? "alert" : "status");
    mensaje.hidden = false;

    clearTimeout(temporizadorMensaje);

    if (!error) {
        temporizadorMensaje = setTimeout(() => {
            mensaje.hidden = true;
        }, 5000);
    }
}

// Traducir errores de la base de datos

function traducirErrorBD(error) {
    switch (error.code) {
        case "23505": // unique_violation
            return "Ya existe un registro con ese nombre.";
        case "23514": // check_violation
            return "Los datos no cumplen las reglas de la base de datos (revisa precio, cantidad y longitudes).";
        case "22003": // numeric_value_out_of_range
            return "Alguno de los números es demasiado grande.";
        case "42501": // insufficient_privilege (RLS)
            return "No tienes permiso para esta operación. Revisa las políticas RLS en Supabase.";
        default:
            return error.message;
    }
}

// Estado de carga de las tablas
// Mientras una tabla consulta o modifica datos se atenua y no
// responde a clics, para evitar acciones duplicadas.

function iniciarCarga(tbody) {
    const contenedor = tbody.closest(".tabla-contenedor");
    contenedor.classList.add("cargando");
    contenedor.setAttribute("aria-busy", "true");
}

function terminarCarga(tbody) {
    const contenedor = tbody.closest(".tabla-contenedor");
    contenedor.classList.remove("cargando");
    contenedor.removeAttribute("aria-busy");
}

// Dibujar tablas 

function mostrarTablaVacia(tbody, texto, columnas) {
    tbody.replaceChildren();

    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = columnas;
    celda.className = "sin-datos";
    celda.textContent = texto;

    fila.appendChild(celda);
    tbody.appendChild(fila);
}

function renderizarTabla(tbody, { etiquetas, filas, textoVacio }) {
    const columnas = etiquetas.length + 1; // + Acciones

    tbody.replaceChildren();

    if (!filas || filas.length === 0) {
        mostrarTablaVacia(tbody, textoVacio, columnas);
        return;
    }

    filas.forEach(({ id, valores }) => {
        const fila = document.createElement("tr");

        valores.forEach((valor, indice) => {
            const celda = document.createElement("td");
            celda.dataset.label = etiquetas[indice];
            celda.textContent = String(valor);
            fila.appendChild(celda);
        });

        const acciones = document.createElement("td");
        acciones.dataset.label = "Acciones";

        const contenedor = document.createElement("div");
        contenedor.className = "acciones-tabla";

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.textContent = "Editar";
        botonEditar.className = "boton";
        botonEditar.dataset.accion = "editar";
        botonEditar.dataset.id = id;

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";
        botonEliminar.className = "boton boton-peligro";
        botonEliminar.dataset.accion = "eliminar";
        botonEliminar.dataset.id = id;

        contenedor.append(botonEditar, botonEliminar);
        acciones.appendChild(contenedor);
        fila.appendChild(acciones);
        tbody.appendChild(fila);
    });
}
