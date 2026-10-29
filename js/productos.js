"use strict";



// Referencias al HTML


const formularioProducto = document.getElementById("formProducto");
const tablaProductos = document.getElementById("listaProductos");
const tituloFormulario = document.getElementById("tituloFormulario");
const cancelarProducto = document.getElementById("cancelarProducto");

const camposProducto = {
    id: document.getElementById("productoId"),
    nombre: document.getElementById("nombreProducto"),
    descripcion: document.getElementById("descripcionProducto"),
    precio: document.getElementById("precioProducto"),
    cantidad: document.getElementById("cantidadProducto"),
    categoria: document.getElementById("categoriaProducto")
};

// Limites de la base de datos
const PRECIO_MAXIMO = 9999999999.99;
const CANTIDAD_MAXIMA = 2147483647;

// Codigo de error por llave foránea inexistente.
const ERROR_LLAVE_FORANEA = "23503";

const ETIQUETAS_PRODUCTOS = [
    "ID",
    "Producto",
    "Descripción",
    "Precio",
    "Cantidad",
    "Categoría"
];

// Cargar categorias desde supabase

async function cargarCategorias() {
    const { data, error } = await supabaseClient
        .from("categorias")
        .select("id, nombre")
        .order("nombre");

    if (error) {
        console.error("Error al cargar categorías:", error);
        mostrarMensaje(
            "No se pudieron cargar las categorías. Revisa la conexión y los permisos.",
            true
        );
        return;
    }

    camposProducto.categoria.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Selecciona una categoría";
    camposProducto.categoria.appendChild(opcionInicial);

    data.forEach(categoria => {
        const opcion = document.createElement("option");
        opcion.value = String(categoria.id);
        opcion.textContent = categoria.nombre;
        camposProducto.categoria.appendChild(opcion);
    });

    if (data.length === 0) {
        mostrarMensaje(
            "No hay categorías registradas. Crea una en la sección Categorías antes de agregar productos.",
            true
        );
    }
}

// Validar producto

function validarProducto(producto) {
    if (!producto.nombre) {
        return "El nombre del producto es obligatorio.";
    }

    if (producto.nombre.length > 100) {
        return "El nombre no puede superar los 100 caracteres.";
    }

    if (producto.descripcion.length > 500) {
        return "La descripción no puede superar los 500 caracteres.";
    }

    const precio = Number(producto.precio);

    if (
        producto.precio === "" ||
        !Number.isFinite(precio) ||
        precio < 0
    ) {
        return "Ingresa un precio válido.";
    }

    // Máximo dos decimales (centavos).
    if (Math.round(precio * 100) / 100 !== precio) {
        return "El precio solo puede tener hasta dos decimales.";
    }

    if (precio > PRECIO_MAXIMO) {
        return "El precio es demasiado grande.";
    }

    if (
        producto.cantidad === "" ||
        !Number.isInteger(Number(producto.cantidad)) ||
        Number(producto.cantidad) < 0
    ) {
        return "La cantidad debe ser un número entero igual o mayor que 0.";
    }

    if (Number(producto.cantidad) > CANTIDAD_MAXIMA) {
        return "La cantidad es demasiado grande.";
    }

    if (
        !producto.categoriaId ||
        !camposProducto.categoria.querySelector(
            `option[value="${producto.categoriaId}"]`
        )
    ) {
        return "Debes seleccionar una categoría válida.";
    }

    return null;
}

// Consultar productos

async function cargarProductos() {
    iniciarCarga(tablaProductos);

    try {
        const { data, error } = await supabaseClient
            .from("productos")
            .select(`
                id,
                nombre,
                descripcion,
                precio,
                cantidad,
                categoria_id,
                categorias(nombre)
            `)
            .order("id", { ascending: true });

        if (error) {
            console.error("Error al consultar productos:", error);

            mostrarMensaje(
                "No se pudieron cargar los productos. Revisa la conexión y los permisos.",
                true
            );

            mostrarTablaVacia(
                tablaProductos,
                "Error al cargar los productos.",
                ETIQUETAS_PRODUCTOS.length + 1
            );
            return;
        }

        renderizarTabla(tablaProductos, {
            etiquetas: ETIQUETAS_PRODUCTOS,
            textoVacio: "No hay productos registrados.",
            filas: data.map(producto => ({
                id: producto.id,
                valores: [
                    producto.id,
                    producto.nombre,
                    producto.descripcion || "Sin descripción",
                    `$${Number(producto.precio).toFixed(2)}`,
                    producto.cantidad,
                    producto.categorias?.nombre || "Sin categoría"
                ]
            }))
        });

    } finally {
        terminarCarga(tablaProductos);
    }
}

// Registrar o actualizar producto

formularioProducto.addEventListener("submit", async event => {
    event.preventDefault();

    const producto = {
        nombre: camposProducto.nombre.value.trim(),
        descripcion: camposProducto.descripcion.value.trim(),
        precio: camposProducto.precio.value,
        cantidad: camposProducto.cantidad.value,
        categoriaId: camposProducto.categoria.value
    };

    const errorValidacion = validarProducto(producto);

    if (errorValidacion) {
        mostrarMensaje(errorValidacion, true);
        return;
    }

    // nombres de las columnas correspondientes a supabase 
    const datos = {
        nombre: producto.nombre,
        descripcion: producto.descripcion || null,
        precio: Number(producto.precio),
        cantidad: Number(producto.cantidad),
        categoria_id: Number(producto.categoriaId)
    };

    const id = camposProducto.id.value;
    const botonGuardar = formularioProducto.querySelector(
        'button[type="submit"]'
    );

    botonGuardar.disabled = true;

    try {
        let error;

        if (id) {
            // Actualizar producto existente.
            const resultado = await supabaseClient
                .from("productos")
                .update(datos)
                .eq("id", Number(id));

            error = resultado.error;
        } else {
            // Registrar producto nuevo.
            const resultado = await supabaseClient
                .from("productos")
                .insert([datos]);

            error = resultado.error;
        }

        if (error) {
            console.error("Error al guardar el producto:", error);

            if (error.code === ERROR_LLAVE_FORANEA) {
                // La categoría elegida ya no existe
                mostrarMensaje(
                    "La categoría seleccionada ya no existe. Recarga la página y elige otra.",
                    true
                );
            } else {
                mostrarMensaje(
                    "No se pudo guardar el producto: " + traducirErrorBD(error),
                    true
                );
            }
            return;
        }

        mostrarMensaje(
            id
                ? "Producto actualizado correctamente."
                : "Producto registrado correctamente."
        );

        limpiarFormularioProducto();
        await cargarProductos();

    } catch (error) {
        console.error("Error inesperado:", error);
        mostrarMensaje("Ocurrió un error al guardar el producto.", true);

    } finally {
        botonGuardar.disabled = false;
    }
});

// Editar producto
async function editarProducto(id) {
    const { data: producto, error } = await supabaseClient
        .from("productos")
        .select("id, nombre, descripcion, precio, cantidad, categoria_id")
        .eq("id", id)
        .maybeSingle();

    if (error || !producto) {
        console.error("Error al obtener el producto:", error);
        mostrarMensaje("No se encontró el producto seleccionado.", true);
        return;
    }

    camposProducto.id.value = producto.id;
    camposProducto.nombre.value = producto.nombre;
    camposProducto.descripcion.value = producto.descripcion || "";
    camposProducto.precio.value = producto.precio;
    camposProducto.cantidad.value = producto.cantidad;
    camposProducto.categoria.value = producto.categoria_id ?? "";

    tituloFormulario.textContent = "Editar producto";

    formularioProducto.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    camposProducto.nombre.focus();
}

// Eliminar producto
async function eliminarProducto(id) {
    const confirmar = confirm(
        "¿Estás seguro de que deseas eliminar este producto?"
    );

    if (!confirmar) {
        return;
    }

    const { error } = await supabaseClient
        .from("productos")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error al eliminar el producto:", error);
        mostrarMensaje(
            "No se pudo eliminar el producto: " + traducirErrorBD(error),
            true
        );
        return;
    }

    if (String(camposProducto.id.value) === String(id)) {
        limpiarFormularioProducto();
    }

    mostrarMensaje("Producto eliminado correctamente.");
    await cargarProductos();
}

// Botones de acciones de la tabla

tablaProductos.addEventListener("click", async event => {
    const boton = event.target.closest("button[data-accion]");

    if (!boton) {
        return;
    }

    const id = Number(boton.dataset.id);

    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    // La tabla queda bloqueada mientras dura la operación.
    iniciarCarga(tablaProductos);

    try {
        if (boton.dataset.accion === "editar") {
            await editarProducto(id);
        } else if (boton.dataset.accion === "eliminar") {
            await eliminarProducto(id);
        }
    } finally {
        terminarCarga(tablaProductos);
    }
});

// limpiar formulario y cancelar
function limpiarFormularioProducto() {
    formularioProducto.reset();
    camposProducto.id.value = "";
    tituloFormulario.textContent = "Registrar producto";
}

cancelarProducto.addEventListener(
    "click",
    limpiarFormularioProducto
);

// inicializar la pagina
async function iniciarPagina() {
    await cargarCategorias();
    await cargarProductos();
}

iniciarPagina();
