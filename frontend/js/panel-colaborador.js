// ==========================================
//  PANEL DE COLABORADOR (panel-colaborador.js)
// ==========================================

// 1. VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");
const userEmail = localStorage.getItem("user_email"); // Asegúrate de que el login guarde el "email"

if (!token || !userEmail) {
    window.location.href = "login.html";
}

// 2. REFERENCIAS AL DOM
const tablaContenido = document.getElementById("contenidoDinamico");
const totalPublicado = document.getElementById("totalPublicado");
const filtroTipo = document.getElementById("tipoFiltro");
const busqueda = document.getElementById("busquedaContenido");
const btnAgregar = document.getElementById("agregarContenido");
const btnSalir = document.querySelector(".exit-link");

let datosOriginales = []; // Array completo

// ==========================================
//  CARGAR DATOS (FETCH ENCADENADO)
// ==========================================
async function cargarContenido() {
    try {
        // PASO 1: Obtener el ID de la empresa del usuario actual
        // Llamamos al nuevo endpoint de Auth que creamos previamente
        const authRes = await fetch(`http://localhost:8000/api/v1/users/check-company/${userEmail}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!authRes.ok) {
            throw new Error("No se pudo verificar la empresa del usuario.");
        }

        const authData = await authRes.json();

        // Validamos si el usuario tiene empresa asignada
        if (!authData.pertenece_a_empresa || !authData.id_empresa) {
            if(tablaContenido) {
                tablaContenido.innerHTML = `<tr><td colspan="4" class="text-center text-warning">Este usuario no está vinculado a ninguna empresa.</td></tr>`;
            }
            return; 
        }

        const idEmpresa = authData.id_empresa;
        console.log(`Cargando contenido para la empresa: ${idEmpresa}`);

        // PASO 2: Obtener contenido filtrado por Publisher (Empresa)
        const res = await fetch(`http://localhost:8000/contenido/publisher/${idEmpresa}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                alert("Sesión expirada");
                window.location.href = "login.html";
                return;
            }
            throw new Error("Error al cargar contenido de la empresa");
        }

        const responseBody = await res.json();
        // Dependiendo de tu API de contenido, ajusta si devuelve array directo o { data: ... }
        const dataMap = responseBody.data || responseBody || {};

        // Transformar respuesta a Array
        // Nota: Si el endpoint /publisher/ devuelve ya una lista, ajusta este map.
        // Asumo que devuelve estructura similar al endpoint general (diccionario de objetos)
        datosOriginales = Array.isArray(dataMap) 
            ? dataMap 
            : Object.keys(dataMap).map(key => {
                const item = dataMap[key];
                
                // Inferir tipo por ISBN si no viene explícito
                let tipo = item.tipo || "otro";
                if (!item.tipo) {
                    if (key.startsWith("LIB")) tipo = "libro";
                    else if (key.startsWith("REV")) tipo = "revista";
                    else if (key.startsWith("PER")) tipo = "periodico";
                }

                return {
                    id: key, // ISBN o ID del documento
                    titulo: item.Título || item.Titulo || "Sin Título",
                    autor: item.Autor || "Desconocido",
                    editorial: item.Editorial || "",
                    tipo: tipo.toLowerCase()
                };
            });

        renderTabla(datosOriginales);

    } catch (e) {
        console.error(e);
        if(tablaContenido) tablaContenido.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${e.message}</td></tr>`;
    }
}

// ==========================================
//  RENDERIZAR TABLA
// ==========================================
function renderTabla(lista) {
    if (!tablaContenido) return;
    tablaContenido.innerHTML = "";
    
    // Actualizar contador
    if (totalPublicado) totalPublicado.textContent = lista.length;

    if (lista.length === 0) {
        tablaContenido.innerHTML = `<tr><td colspan="4" class="text-center">No hay contenido publicado por esta empresa.</td></tr>`;
        return;
    }

    lista.forEach(item => {
        const tr = document.createElement("tr");
        
        // Badges con estilo Bootstrap
        let badgeClass = "bg-secondary";
        let tipoTexto = "Otro";
        
        if (item.tipo === "libro") {
            badgeClass = "bg-success";
            tipoTexto = "Libro";
        } else if (item.tipo === "revista") {
            badgeClass = "bg-info text-dark";
            tipoTexto = "Revista";
        } else if (item.tipo === "periodico") {
            badgeClass = "bg-warning text-dark";
            tipoTexto = "Periódico";
        }

        tr.innerHTML = `
            <td>${item.titulo}</td>
            <td><span class="badge ${badgeClass}">${tipoTexto}</span></td>
            <td>${item.autor} <br> <small class="text-muted">${item.editorial}</small></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-info me-1 btn-edit" data-id="${item.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${item.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tablaContenido.appendChild(tr);
    });
}

// ==========================================
//  EVENTOS DE INTERACCIÓN
// ==========================================

// 1. Filtro por Tipo
if (filtroTipo) {
    filtroTipo.addEventListener("change", () => {
        const valor = filtroTipo.value.toLowerCase();
        if (valor === "todos") {
            renderTabla(datosOriginales);
        } else {
            const filtrados = datosOriginales.filter(d => d.tipo === valor);
            renderTabla(filtrados);
        }
    });
}

// 2. Buscador
if (busqueda) {
    busqueda.addEventListener("input", () => {
        const texto = busqueda.value.toLowerCase();
        const filtrados = datosOriginales.filter(item => 
            item.titulo.toLowerCase().includes(texto) ||
            item.autor.toLowerCase().includes(texto)
        );
        renderTabla(filtrados);
    });
}

// 3. Botones de Acción (Delegación de eventos)
if (tablaContenido) {
    tablaContenido.addEventListener("click", async (e) => {
        // EDITAR
        const btnEdit = e.target.closest(".btn-edit");
        if (btnEdit) {
            const id = btnEdit.dataset.id;
            window.location.href = `agregar-contenido.html?isbn=${id}`;
        }

        // ELIMINAR
        const btnDelete = e.target.closest(".btn-delete");
        if (btnDelete) {
            const id = btnDelete.dataset.id;
            if (!confirm("¿Eliminar este contenido permanentemente?")) return;

            try {
                // NOTA: Asegúrate de que la ruta de delete tenga el slash correcto
                const res = await fetch(`http://localhost:8000/contenido/${id}`, { // Corregido path
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Refresh-Token": refreshToken || ""
                    }
                });

                if (res.ok) {
                    alert("Eliminado correctamente");
                    cargarContenido(); // Recargar tabla
                } else {
                    alert("No se pudo eliminar. Verifica permisos.");
                }
            } catch (err) {
                console.error(err);
                alert("Error de conexión");
            }
        }
    });
}

// 4. Botón Nuevo Contenido
if (btnAgregar) {
    btnAgregar.addEventListener("click", () => {
        window.location.href = "agregar-contenido.html";
    });
}

// 5. Salir
if (btnSalir) {
    btnSalir.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "login.html";
    });
}

// INICIALIZAR
document.addEventListener("DOMContentLoaded", cargarContenido);