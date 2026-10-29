"use strict";


// Referencia al HTML 

const formCategoria = document.getElementById("formCategoria");
const tablaCategorias = document.getElementById("listaCategorias");
const tituloFormulario = document.getElementById("tituloFormulario");
const cancelarCategoria = document.getElementById("cancelarCategoria");

const camposCategoria = {
    id: document.getElementById("categoriaId"),
    nombre: document.getElementById("nombreCategoria"),
    descripcion: document.getElementById("descripcionCategoria")
};

const ETIQUETAS_CATEGORIAS = ["ID", "Nombre", "Descripción"];

// Copia local de las categorías, usada para detectar nombres repetidos.
let categoriasRegistradas = [];

// Validar categoria 

function validarCategoria(categoria, idActual) {
    if (!categoria.nombre) {
        return "El nombre de la categoría es obligatorio.";
    }

    if (categoria.nombre.length > 100) {
        return "El nombre no puede superar los 100 caracteres.";
    }

    if (categoria.descripcion.length > 500) {
        return "La descripción no puede superar los 500 caracteres.";
    }

    const repetida = categoriasRegistradas.some(existente =>
        existente.nombre.toLowerCase() === categoria.nombre.toLowerCase() &&
        String(existente.id) !== String(idActual)
    );

    if (repetida) {
        return "Ya existe una categoría con ese nombre.";
    }

    return null;
}

// Consultar categorias desde supabase

async function cargarCategorias() {
    iniciarCarga(tablaCategorias);

    try {
        const { data, error } = await supabaseClient
            .from("categorias")
            .select("id, nombre, descripcion")
            .order("id", { ascending: true });

        if (error) {
            console.error("Error al consultar categorías:", error);

            mostrarMensaje(
                "No se pudieron cargar las categorías. Revisa la conexión y los permisos.",
                true
            );

            mostrarTablaVacia(
                tablaCategorias,
                "Error al cargar las categorías.",
                ETIQUETAS_CATEGORIAS.length + 1
            );
            return;
        }

        categoriasRegistradas = data;

        renderizarTabla(tablaCategorias, {
            etiquetas: ETIQUETAS_CATEGORIAS,
            textoVacio: "No hay categorías registradas.",
            filas: data.map(categoria => ({
                id: categoria.id,
                valores: [
                    categoria.id,
                    categoria.nombre,
                    categoria.descripcion || "Sin descripción"
                ]
            }))
        });

    } finally {
        terminarCarga(tablaCategorias);
    }
}

// Registrar o actualizar categoria
formCategoria.addEventListener("submit", async event => {
    event.preventDefault();

    const id = camposCategoria.id.value;

    const categoria = {
        nombre: camposCategoria.nombre.value.trim(),
        descripcion: camposCategoria.descripcion.value.trim()
    };

    const errorValidacion = validarCategoria(categoria, id);

    if (errorValidacion) {
        mostrarMensaje(errorValidacion, true);
        return;
    }

    // nombres de las columnas correspondientes a supabase
    const datos = {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || null
    };

    const botonGuardar = formCategoria.querySelector(
        'button[type="submit"]'
    );

    botonGuardar.disabled = true;

    try {
        let error;

        if (id) {
            // Actualizar categoria existente.
            const resultado = await supabaseClient
                .from("categorias")
                .update(datos)
                .eq("id", Number(id));

            error = resultado.error;
        } else {
            // Registrar categoria nueva.
            const resultado = await supabaseClient
                .from("categorias")
                .insert([datos]);

            error = resultado.error;
        }

        if (error) {
            console.error("Error al guardar la categoría:", error);
            mostrarMensaje(
                "No se pudo guardar la categoría: " + traducirErrorBD(error),
                true
            );
            return;
        }

        mostrarMensaje(
            id
                ? "Categoría actualizada correctamente."
                : "Categoría registrada correctamente."
        );

        limpiarFormularioCategoria();
        await cargarCategorias();

    } catch (error) {
        console.error("Error inesperado:", error);
        mostrarMensaje("Ocurrió un error al guardar la categoría.", true);

    } finally {
        botonGuardar.disabled = false;
    }
});

// Editar categoria

async function editarCategoria(id) {
    const { data: categoria, error } = await supabaseClient
        .from("categorias")
        .select("id, nombre, descripcion")
        .eq("id", id)
        .maybeSingle();

    if (error || !categoria) {
        console.error("Error al obtener la categoría:", error);
        mostrarMensaje("No se encontró la categoría seleccionada.", true);
        return;
    }

    camposCategoria.id.value = categoria.id;
    camposCategoria.nombre.value = categoria.nombre;
    camposCategoria.descripcion.value = categoria.descripcion || "";

    tituloFormulario.textContent = "Editar categoría";

    formCategoria.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    camposCategoria.nombre.focus();
}

// Eliminar categoria

// Código de error cuando una llave foránea impide borrar
// (productos_categoria_id_fkey está configurada con ON DELETE RESTRICT).

const ERROR_LLAVE_FORANEA = "23503";

async function eliminarCategoria(id) {
    const confirmar = confirm(
        "¿Estás seguro de que deseas eliminar esta categoría?"
    );

    if (!confirmar) {
        return;
    }

    const { error } = await supabaseClient
        .from("categorias")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error al eliminar la categoría:", error);

        if (error.code === ERROR_LLAVE_FORANEA) {
            mostrarMensaje(
                "No se puede eliminar la categoría porque tiene productos asignados. " +
                "Elimina esos productos o cámbialos de categoría primero.",
                true
            );
        } else {
            mostrarMensaje(
                "No se pudo eliminar la categoría: " + traducirErrorBD(error),
                true
            );
        }

        return;
    }

    if (String(camposCategoria.id.value) === String(id)) {
        limpiarFormularioCategoria();
    }

    mostrarMensaje("Categoría eliminada correctamente.");
    await cargarCategorias();
}

//  Botones de acciones de la tabla
tablaCategorias.addEventListener("click", async event => {
    const boton = event.target.closest("button[data-accion]");

    if (!boton) {
        return;
    }

    const id = Number(boton.dataset.id);

    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    // La tabla queda bloqueada durante la operacion
    iniciarCarga(tablaCategorias);

    try {
        if (boton.dataset.accion === "editar") {
            await editarCategoria(id);
        } else if (boton.dataset.accion === "eliminar") {
            await eliminarCategoria(id);
        }
    } finally {
        terminarCarga(tablaCategorias);
    }
});

// Limpiar formulario y cancelar
function limpiarFormularioCategoria() {
    formCategoria.reset();
    camposCategoria.id.value = "";
    tituloFormulario.textContent = "Registrar categoría";
}

cancelarCategoria.addEventListener(
    "click",
    limpiarFormularioCategoria
);

// Inicializar la pagina  
cargarCategorias();
