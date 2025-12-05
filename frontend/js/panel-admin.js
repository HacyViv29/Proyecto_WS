// ==========================================
//  PANEL DE ADMINISTRADOR (panel-admin.js)
// ==========================================

// 1. VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}

let usersData = [];
let contentData = [];

// 2. CONFIGURACIÓN DE ENDPOINTS
const USERS_LIST_URL = "http://localhost:8000/api/v1/users";
const USERS_DELETE_URL = "http://localhost:8000/api/v1/users";
const CONTENT_LIST_URL = "http://localhost:8000/contenido/detalles";
const CONTENT_DELETE_URL = "http://localhost:8000/contenido";

// 3. HELPERS
function saveNewTokens(headers) {
    const newA = headers.get("x-new-access-token") || headers.get("X-New-Access-Token");
    const newR = headers.get("x-new-refresh-token") || headers.get("X-New-Refresh-Token");
    if (newA) localStorage.setItem("token", newA);
    if (newR) localStorage.setItem("refresh_token", newR);
}

function handle401() {
    localStorage.clear();
    alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
    window.location.href = "login.html";
}

// 4. SELECTORES DOM
const logoutBtn = document.querySelector("#btnLogout") || document.querySelector(".btn-outline-light");
const usersTab = document.querySelector("#pills-users");
const contentTab = document.querySelector("#pills-content");

// Usuarios
const usersFilterSelect = usersTab?.querySelector("select.form-select");
const usersSearchInput = usersTab?.querySelector("input[type='text']");
const usersNewBtn = usersTab?.querySelector(".animated-gradient-button") || usersTab?.querySelector("button"); 
const usersTbody = usersTab?.querySelector("tbody");

// Contenido
const contentFilterSelect = contentTab?.querySelector("select.form-select");
const contentSearchInput = contentTab?.querySelector("input[type='text']");
const contentAddBtn = contentTab?.querySelector(".animated-gradient-button") || contentTab?.querySelector("button.btn-primary");
const contentTbody = contentTab?.querySelector("tbody");


// ==========================================
//  ESTADÍSTICAS DEL DASHBOARD
// ==========================================
function actualizarEstadisticas() {
    // 1. Calcular Usuarios
    const totalUsuarios = usersData.length;
    const totalAdmins = usersData.filter(u => (u.role || "").toLowerCase().includes("admin")).length;
    const totalColabs = usersData.filter(u => (u.role || "").toLowerCase().includes("colab") || (u.role || "").toLowerCase().includes("writ")).length;
    const totalClientes = usersData.filter(u => {
        const r = (u.role || "").toLowerCase();
        return r.includes("client") || r.includes("user") || r.includes("usuario");
    }).length;

    // 2. Calcular Contenido
    const totalContenidos = contentData.length;
    const totalLibros = contentData.filter(c => c.tipo === "Libro").length;
    const totalRevistas = contentData.filter(c => c.tipo === "Revista").length;
    const totalPeriodicos = contentData.filter(c => c.tipo === "Periódico").length;

    // 3. Actualizar DOM
    safeSetText("stat-total-users", totalUsuarios);
    safeSetText("stat-admins", totalAdmins);
    safeSetText("stat-colabs", totalColabs);
    safeSetText("stat-clients", totalClientes);

    safeSetText("stat-total-content", totalContenidos);
    safeSetText("stat-books", totalLibros);
    safeSetText("stat-magazines", totalRevistas);
    safeSetText("stat-newspapers", totalPeriodicos);
}

function safeSetText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}


// ==========================================
//  FUNCIONES DE RENDERIZADO
// ==========================================

function renderUsers(list) {
    if (!usersTbody) return;
    usersTbody.innerHTML = "";
    
    list.forEach(u => {
        const roleRaw = (u.role || 'usuario').toLowerCase();
        let badgeClass = 'bg-secondary'; 
        let roleDisplay = u.role || 'Usuario';

        if (roleRaw.includes('admin')) {
            badgeClass = 'bg-primary'; 
            roleDisplay = 'Administrador';
        } else if (roleRaw.includes('colab') || roleRaw.includes('writ')) {
            badgeClass = 'bg-info text-dark'; 
            roleDisplay = 'Colaborador';
        } else if (roleRaw.includes('client') || roleRaw.includes('user')) {
            badgeClass = 'bg-success'; 
            roleDisplay = 'Cliente';
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.nombre || u.first_name || "Sin nombre"} ${u.last_name || ""}</td>
            <td>${u.email || u.correo || ""}</td>
            <td><span class="badge ${badgeClass}">${roleDisplay}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info btn-edit-user" data-id="${u.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${u.id}"><i class="bi bi-trash"></i></button>
            </td>
        `;
        usersTbody.appendChild(tr);
    });
}

function renderContent(list) {
    if (!contentTbody) return;
    contentTbody.innerHTML = "";
    
    list.forEach(it => {
        const tr = document.createElement("tr");
        
        let tipoBadge = `<span class="badge bg-secondary">Otro</span>`;
        if (it.tipo && it.tipo.toLowerCase().includes("revista")) {
            tipoBadge = `<span class="badge bg-info text-dark">Revista</span>`; 
        } else if (it.tipo && it.tipo.toLowerCase().includes("periód")) {
            tipoBadge = `<span class="badge bg-warning text-dark">Periódico</span>`;
        } else if (it.tipo && it.tipo.toLowerCase().includes("libro")) {
            tipoBadge = `<span class="badge bg-success">Libro</span>`;
        }

        tr.innerHTML = `
            <td>${it.titulo}</td>
            <td>${tipoBadge}</td>
            <td>${it.autor}</td>
            <td>${it.subido_por}</td>
            <td>
                <button class="btn btn-sm btn-outline-info btn-edit-content" data-id="${it.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-delete-content" data-id="${it.id}"><i class="bi bi-trash"></i></button>
            </td>
        `;
        contentTbody.appendChild(tr);
    });
}

// ==========================================
//  FUNCIONES DE CARGA DE DATOS (FETCH)
// ==========================================

async function loadUsers() {
    try {
        const res = await fetch(USERS_LIST_URL, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });
        if (res.status === 401) return handle401();
        saveNewTokens(res.headers);
        
        const data = await res.json();
        usersData = Array.isArray(data) ? data : (data.data || []);
        
        renderUsers(usersData);
        actualizarEstadisticas();

    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

async function loadContent() {
    try {
        const res = await fetch(CONTENT_LIST_URL, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });
        
        if (res.status === 401) return handle401();
        saveNewTokens(res.headers);
        
        const responseBody = await res.json();
        const dataObjects = responseBody.data || {};

        contentData = Object.keys(dataObjects).map(key => {
            const item = dataObjects[key];
            
            let tipoInferred = "Desconocido";
            if (key.startsWith("LIB")) tipoInferred = "Libro";
            else if (key.startsWith("REV")) tipoInferred = "Revista";
            else if (key.startsWith("PER")) tipoInferred = "Periódico";

            return {
                id: key,
                titulo: item.Título || item.Titulo || "Sin Título",
                autor: item.Autor || "Desconocido",
                editorial: item.Editorial || "",
                tipo: tipoInferred,
                subido_por: item.Publisher || "Admin" 
            };
        });

        renderContent(contentData);
        actualizarEstadisticas();

    } catch (err) {
        console.error("Error cargando contenido:", err);
        alert("Error al cargar contenido.");
    }
}

// ==========================================
//  FUNCIONES DE ELIMINACIÓN
// ==========================================

async function deleteUser(id) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
        const res = await fetch(`${USERS_DELETE_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });
        if (res.status === 401) return handle401();
        saveNewTokens(res.headers);
        
        if (res.ok) {
            alert("Usuario eliminado.");
            loadUsers();
        } else {
            alert("No se pudo eliminar el usuario.");
        }
    } catch (err) {
        console.error(err);
        alert("Error eliminando usuario.");
    }
}

async function deleteContent(id) {
    if (!confirm("¿Estás seguro de eliminar este contenido?")) return;
    try {
        const res = await fetch(`${CONTENT_DELETE_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });
        if (res.status === 401) return handle401();
        saveNewTokens(res.headers);
        
        if (res.ok) {
            alert("Contenido eliminado correctamente.");
            loadContent();
        } else {
            alert("Error al eliminar contenido.");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión eliminando contenido.");
    }
}

// ==========================================
//  EVENT LISTENERS (AQUÍ ESTÁ EL CAMBIO CLAVE)
// ==========================================

document.addEventListener("click", (e) => {
    // 1. EDITAR USUARIO (CORREGIDO)
    if (e.target.closest(".btn-edit-user")) {
        const id = e.target.closest(".btn-edit-user").dataset.id;
        // ANTES: window.location.href = `edit-user.html?id=${id}`;
        // AHORA: Usamos el archivo unificado create.html
        window.location.href = `create.html?id=${id}`; 
    }
    
    // 2. ELIMINAR USUARIO
    if (e.target.closest(".btn-delete-user")) {
        const id = e.target.closest(".btn-delete-user").dataset.id;
        deleteUser(id);
    }

    // 3. EDITAR CONTENIDO
    if (e.target.closest(".btn-edit-content")) {
        const id = e.target.closest(".btn-edit-content").dataset.id;
        window.location.href = `agregar-contenido.html?isbn=${id}`; 
    }
    
    // 4. ELIMINAR CONTENIDO
    if (e.target.closest(".btn-delete-content")) {
        const id = e.target.closest(".btn-delete-content").dataset.id;
        deleteContent(id);
    }
});

// Filtros y Búsquedas
if (usersFilterSelect) {
    usersFilterSelect.addEventListener("change", () => {
        const val = usersFilterSelect.value.toLowerCase();
        if (val.includes("todos")) {
            renderUsers(usersData);
        } else {
            const filtered = usersData.filter(u => {
                const roleBackend = (u.role || "").toLowerCase();
                if (val.includes("admin")) return roleBackend.includes("admin");
                if (val.includes("colaborador")) return roleBackend.includes("colab") || roleBackend.includes("writ");
                if (val.includes("usuario") || val.includes("cliente")) return roleBackend.includes("client") || roleBackend.includes("user");
                return roleBackend.includes(val);
            });
            renderUsers(filtered);
        }
    });
}
if (usersSearchInput) {
    usersSearchInput.addEventListener("input", () => {
        const q = usersSearchInput.value.toLowerCase();
        const filtered = usersData.filter(u => 
            (u.nombre || "").toLowerCase().includes(q) || 
            (u.email || "").toLowerCase().includes(q)
        );
        renderUsers(filtered);
    });
}

// BOTÓN NUEVO USUARIO (Confirmar que vaya a create.html)
if (usersNewBtn) {
    usersNewBtn.addEventListener("click", () => window.location.href = "create.html"); 
}

if (contentFilterSelect) {
    contentFilterSelect.addEventListener("change", () => {
        const val = contentFilterSelect.value.toLowerCase();
        if (val.includes("todos")) {
            renderContent(contentData);
        } else {
            const filtered = contentData.filter(c => c.tipo.toLowerCase().includes(val));
            renderContent(filtered);
        }
    });
}
if (contentSearchInput) {
    contentSearchInput.addEventListener("input", () => {
        const q = contentSearchInput.value.toLowerCase();
        const filtered = contentData.filter(c => 
            c.titulo.toLowerCase().includes(q) || 
            c.autor.toLowerCase().includes(q)
        );
        renderContent(filtered);
    });
}
if (contentAddBtn) {
    contentAddBtn.addEventListener("click", () => window.location.href = "agregar-contenido.html");
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    loadContent();
});