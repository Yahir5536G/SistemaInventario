# Sistema de Inventario

CRUD de categorías y productos (relación uno a muchos) con HTML5, CSS3 y JavaScript,
usando Supabase como base de datos.

## Demostracion

**Enlaces**
URL publica: 
Video de funcionamiento:
Repositorio:

**Recorrido de la demostracion**

- Mostrar la URL publica y la pagina de productos.
- En categorias: intentar guardar sin nombre (error), crear una categoria y editarla.
- En productos: intentar un precio negativo (error), crear un producto con datos correctos, verlo en la tabla y eliminarlo.
- Intentar eliminar una categoria con productos (el mensaje explica por que no se puede) y luego una sin productos.
- Abrir el sistema en celular para ver como se ajusta el contenido.

**Datos de prueba**

sql/schema.sql crea tres categorias (Electronica, Papeleria y Hogar) y dos productos.
Hogar no tiene productos, y se usa para mostrar un borrado permitido.

**validaciones**

Campo                  | Entrada invalida              | Resultado esperado
---------------------------------------------------------------------------------------------------
Nombre de categoria    | Vacio                         | Mensaje de error: el nombre es obligatorio
Nombre de categoria    | Repetido                      | Mensaje de error: ya existe
Precio                 | Negativo o mas de 2 decimales | Mensaje de error
Categoria del producto | Sin elegir                    | No se envia el formulario

## Estructura

```
index.html        Página principal: agregar, editar, consultar y eliminar productos
categorias.html   Agregar, editar, consultar y eliminar categorías
styles.css        Estilos (responsive: escritorio y celular)
js/comun.js       Conexión a Supabase, mensajes y funciones de tabla (compartido)
js/productos.js   Lógica de productos
js/categorias.js  Lógica de categorías
```

## Requisitos

- Un navegador y conexión a internet (se carga `supabase-js` desde un CDN).
- Un proyecto de Supabase con las tablas descritas abajo.
- Para probarlo localmente basta con abrir `index.html`.

## Base de datos

El script `sql/schema.sql` crea las dos tablas, la llave foránea, las restricciones,
las políticas RLS y datos de prueba opcionales. Pégalo completo en Supabase → SQL Editor.
Es repetible: se puede ejecutar más de una vez sin duplicar nada.

Las reglas se validan en tres capas: atributos del HTML (`required`, `min`, `max`, `maxlength`),
JavaScript antes de enviar, y restricciones `CHECK`, `NOT NULL`, `UNIQUE` en la base de datos.

| Tabla | Columna | Tipo | Notas |
|-------|---------|------|-------|
| `categorias` | `id` | entero | Llave primaria |
| | `nombre` | texto | Obligatorio, único (sin distinguir mayúsculas), máx. 100 caracteres |
| | `descripcion` | texto | Opcional, máx. 500 caracteres |
| `productos` | `id` | entero | Llave primaria |
| | `nombre` | texto | Obligatorio, máx. 100 caracteres |
| | `descripcion` | texto | Opcional, máx. 500 caracteres |
| | `precio` | numérico(12,2) | Mayor o igual que 0 |
| | `cantidad` | entero | Mayor o igual que 0 |
| | `categoria_id` | entero | Llave foránea → `categorias.id` |

La llave foránea `productos_categoria_id_fkey` usa `ON UPDATE CASCADE ON DELETE RESTRICT`:
una categoría con productos asignados no se puede eliminar. La aplicación muestra un
mensaje indicando que primero hay que eliminar esos productos o cambiarlos de categoría.

## Configuración

La conexión está en `js/comun.js` (`SUPABASE_URL` y `SUPABASE_KEY`).

## Cómo probar cada operación

1. **Crear categoría:** en *Categorías*, escribe un nombre y pulsa *Guardar categoría*. Aparece un mensaje verde y la fila en la tabla.
2. **Validar categoría:** intenta guardar sin nombre o con un nombre repetido; aparece un mensaje rojo.
3. **Editar categoría:** pulsa *Editar* en una categoria, cambia los datos y guarda.
4. **Eliminar categoría:** pulsa *Eliminar* en una categoría sin productos y confirma. Si tiene productos, aparece el mensaje de que no se puede eliminar.
5. **Crear producto:** en *Productos*, llena el formulario, elige una categoría del desplegable y guarda.
6. **Validar producto:** prueba precio negativo, más de dos decimales, cantidad con decimales o sin categoría.
7. **Editar producto:** pulsa *Editar*; el formulario se llena con los datos y cambia uno de los datos.
8. **Eliminar producto:** pulsa *Eliminar* y confirma.
9. **Responsive:** reduce el ancho de la ventana (o abre la página en el celular); la tabla se adapta.

## Credenciales y publicación en GitHub Pages

GitHub Pages solo sirve archivos estáticos: todo lo que esté en el repositorio
(HTML, JS, CSS) lo puede leer cualquiera desde el navegador. Por eso se publico de la siguiente manera:

| URL del proyecto (`https://xxxx.supabase.co`) | Es pública |
| Clave publishable (`sb_publishable_...`)  | Está diseñada para ir en el navegador |

La seguridad se maneja mediante las politicas RLS

## Activar RLS

`sql/schema.sql` ya incluye estas políticas. Esta sección explica qué hacen.
Sin RLS, la clave publishable da acceso total. En Supabase → SQL Editor:

```sql
alter table categorias enable row level security;
alter table productos  enable row level security;

-- Lectura pública
create policy "leer categorias" on categorias for select to anon using (true);
create policy "leer productos"  on productos  for select to anon using (true);
```

Con solo esas políticas, cualquiera puede ver los datos pero nadie puede modificarlos
(la aplicación mostrará un error al guardar o eliminar). Para que el CRUD funcione sin
inicio de sesión hay que permitir escritura a `anon`:

```sql
create policy "escribir categorias" on categorias for all to anon using (true) with check (true);
create policy "escribir productos"  on productos  for all to anon using (true) with check (true);
```


