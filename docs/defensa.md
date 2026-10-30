# Defensa técnica: Sistema de Inventario

## 1. Qué resuelve

Es una aplicacion web que permite administrar un inventario pequeño. Cada producto pertenece a una categoría, el usuario puede crear, consultar,editar y eliminar tanto categorías como productos. Después de cada operación la página muestra un mensaje de éxito o de error, sin necesidad de recargarse.

## 2. Decisiones técnicas

| Decisión | Por qué |
| --- | --- |
| Dos tablas con llave foránea (`productos.categoria_id → categorias.id`) | Un producto solo puede tener una categoría, pero una categoría puede tener muchos productos (relación de uno a muchos). |
| `ON DELETE RESTRICT` | Impide borrar una categoría que todavía tiene productos, para no dejar productos sin categoría. La app traduce el error de la base a un mensaje claro. |
| Validar en tres capas | El HTML ayuda al usuario, JavaScript valida antes de enviar, y la base de datos (`CHECK`, `NOT NULL`, `UNIQUE`, llave foránea) es la última barrera si alguien se salta las otras dos. |
| Nombre de categoría único sin distinguir mayúsculas | Evita duplicados como "Hogar" y "hogar". Se valida en JavaScript y también con un índice único sobre `lower(nombre)`. |
| Tabla que se convierte en tarjetas en el celular | En pantallas pequeñas una tabla de siete columnas obliga a deslizar. Con CSS cada fila pasa a ser una tarjeta con sus etiquetas. |
| Código compartido en `js/comun.js` | La conexión, los mensajes y el dibujo de tablas se usan en ambas páginas; asi evitando codigo duplicado. |

## 3. Estructura del código

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Página de productos: formulario y tabla. |
| `categorias.html` | Página de categorias: formulario y tabla. |
| `styles.css` | Diseño, colores y adaptación a móvil y tableta. |
| `js/comun.js` | Conexión a Supabase, mensajes, estado de carga, traducción de errores y dibujo de tablas. |
| `js/productos.js` | Lógica de productos: validar, guardar, editar, eliminar y cargar el desplegable de categorías. |
| `js/categorias.js` | Lógica de categorías: validar, guardar, editar y eliminar. |
| `sql/schema.sql` | Crea tablas, restricciones, índices, políticas de seguridad (RLS) y datos de prueba. |

**Qué corresponde a cada tecnología**

| Tecnología | Dónde se ve | Qué aporta |
| --- | --- | --- |
| HTML5 | `index.html`, `categorias.html` | Estructura semántica (`header`, `nav`, `main`, `form`, `table`, `footer`) y accesibilidad (`label`, `scope`. |
| CSS3 | `styles.css` | Diseño responsive con dos anchos, estados de botones y campos, foco visible y estado de carga. |
| JavaScript | `js/` | Eventos, validaciones, manipulación del DOM y comunicación con Supabase. |
| Supabase | `sql/schema.sql` y `supabaseClient` | Almacena los datos, aplica las restricciones y controla el acceso con RLS. |

## 4. Flujo de datos

Así viaja un producto desde la pantalla hasta la base de datos y de regreso:

1. El usuario llena el formulario y presiona **Guardar producto**. Se activa el evento `submit` y `preventDefault` evita que la página se recargue.
2. Se leen los campos y `validarProducto` comprueba nombre, precio, cantidad y categoría. Si algo falla, se muestra un mensaje de error y no se envía nada.
3. Se arma el objeto `datos` con los nombres de las columnas y se envía con `supabaseClient.from("productos").insert(...)`. Si se está editando, se usa `update(...).eq("id", ...)`.
4. Supabase comprueba las políticas RLS, y PostgreSQL aplica `CHECK`, `NOT NULL` y la llave foránea.
5. Si hay error, `traducirErrorBD` lo convierte en un mensaje comprensible. Si todo sale bien, se muestra un mensaje verde y se limpia el formulario.
6. `cargarProductos()` consulta la tabla otra vez y `renderizarTabla` la dibuja de nuevo, sin recargar la página.

**Cómo se relaciona un producto con su categoría.** El desplegable se llena con las categorías que están en Supabase: cada opción muestra el nombre y guarda el `id` como valor. Ese `id` se guarda en `productos.categoria_id`. Al consultar los productos, `categorias(nombre)` une ambas tablas para mostrar el nombre en lugar del número.

## 5. Seguridad y credenciales

- La aplicación usa solo la URL del proyecto y la clave `sb_publishable_`, que están en `js/comun.js`. Esa clave está diseñada para ir en el navegador y entra con el rol `anon`.
- Lo que realmente protege los datos son las políticas RLS: solo permiten lo que está escrito en `sql/schema.sql`.
- Las políticas actuales permiten escribir sin iniciar sesión. 

## 6. Límites y mejoras

**Límites actuales**

- No hay inicio de sesión: cualquiera con la URL puede crear, editar y borrar registros.
- No hay funcion de busqueda, con muchos productos la tabla sería larga.

**Mejoras posibles**

- Agregar inicio de sesión con Supabase Auth y limitar la escritura a usuarios autenticados.
- Agregar un filtro por categoría y una búsqueda por nombre.
- Verificar cuántas filas se afectan en cada `update` y `delete`.
- Agregar busqueda a las tablas.


