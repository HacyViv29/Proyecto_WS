//   VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");
if (!token) window.location.href = "login.html";

let usersData = [];
let contentData = [];

// ENDPOINTS (ajusta estas rutas si tu gateway/microservicio usa otras)
const USERS_LIST_URL = "/api/v1/admin/users";           
const USERS_DELETE_URL = "/api/v1/admin/users";         
const CONTENT_LIST_URL = "/contenido/admin/list";       
const CONTENT_DELETE_URL = "/contenido";                

// Helpers tokens
function saveNewTokens(headers) {
    const newA = headers.get("x-new-access-token") || headers.get("X-New-Access-Token");
    const newR = headers.get("x-new-refresh-token") || headers.get("X-New-Refresh-Token");
    if (newA) {
        localStorage.setItem("token", newA);
    }
    if (newR) {
        localStorage.setItem("refresh_token", newR);
    }
}

// Selectores a partir del HTML (sin IDs)
const logoutBtn = document.querySelector(".container-fluid .d-flex .btn:last-child");
const usersTab = document.querySelector("#pills-users");
const contentTab = document.querySelector("#pills-content");

// Usuarios: select, input, tabla, nuevo btn
const usersFilterSelect = usersTab?.querySelector("select.form-select");
const usersSearchInput = usersTab?.querySelector("input[type='text']");
const usersNewBtn = usersTab?.querySelector("button.btn-primary");
const usersTbody = usersTab?.querySelector("tbody");

// Contenido: select, input, tabla, agregar btn
const contentFilterSelect = contentTab?.querySelector("select.form-select");
const contentSearchInput = contentTab?.querySelector("input[type='text']");
const contentAddBtn = contentTab?.querySelector("button.btn-primary");
const contentTbody = contentTab?.querySelector("tbody");

// Mostrar alert y logout en 401
function handle401() {
    localStorage.clear();
    alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
    window.location.href = "login.html";
}

// Render usuarios en tabla
function renderUsers(list) {
    if (!usersTbody) return;
    usersTbody.innerHTML = "";
    list.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.nombre || u.first_name || u.full_name || "Sin nombre"}</td>
            <td>${u.email || u.correo || ""}</td>
            <td><span class="badge ${u.role === 'Administrador' ? 'bg-primary' : (u.role === 'Colaborador' ? 'bg-info' : 'bg-secondary')}">${u.role || 'Usuario'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info btn-edit-user" data-id="${u.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${u.id}"><i class="bi bi-trash"></i></button>
            </td>
        `;
        usersTbody.appendChild(tr);
    });
}

// Render contenido en tabla
function renderContent(list) {
    if (!contentTbody) return;
    contentTbody.innerHTML = "";
    list.forEach(it => {
        const tr = document.createElement("tr");
        const tipoBadge = it.tipo && it.tipo.toLowerCase().includes("revista")
            ? `<span class="badge bg-purple">Revista</span>`
            : (it.tipo && it.tipo.toLowerCase().includes("periód") ? `<span class="badge bg-warning">Periódico</span>` : `<span class="badge bg-success">Libro</span>`);
        tr.innerHTML = `
            <td>${it.titulo || it.title || "Sin título"}</td>
            <td>${tipoBadge}</td>
            <td>${it.autor || it.author || ""}</td>
            <td>${it.subido_por || it.uploader || ""}</td>
            <td>
                <button class="btn btn-sm btn-outline-info btn-edit-content" data-id="${it.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-delete-content" data-id="${it.id}"><i class="bi bi-trash"></i></button>
            </td>
        `;
        contentTbody.appendChild(tr);
    });
}

// Fetch lista de usuarios
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
    } catch (err) {
        console.error("Error cargando usuarios:", err);
        alert("Error al cargar usuarios.");
    }
}

// Fetch lista de contenido
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
        const data = await res.json();
        contentData = Array.isArray(data) ? data : (data.data || []);
        renderContent(contentData);
    } catch (err) {
        console.error("Error cargando contenido:", err);
        alert("Error al cargar contenido.");
    }
}

// Delete usuario
async function deleteUser(id) {
    if (!confirm("¿Eliminar este usuario?")) return;
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
        if (!res.ok) { alert("No se pudo eliminar el usuario."); return; }
        alert("Usuario eliminado.");
        loadUsers();
    } catch (err) {
        console.error(err);
        alert("Error eliminando usuario.");
    }
}

// Delete contenido
async function deleteContent(id) {
    if (!confirm("¿Eliminar este contenido?")) return;
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
        if (!res.ok) { alert("No se pudo eliminar el contenido."); return; }
        alert("Contenido eliminado.");
        loadContent();
    } catch (err) {
        console.error(err);
        alert("Error eliminando contenido.");
    }
}

// Eventos delegados: editar/eliminar en tablas
document.addEventListener("click", (e) => {
    // Usuarios
    if (e.target.closest(".btn-edit-user")) {
        const id = e.target.closest(".btn-edit-user").dataset.id;
        window.location.href = `edit-user.html?id=${id}`;
    }
    if (e.target.closest(".btn-delete-user")) {
        const id = e.target.closest(".btn-delete-user").dataset.id;
        deleteUser(id);
    }

    // Contenido
    if (e.target.closest(".btn-edit-content")) {
        const id = e.target.closest(".btn-edit-content").dataset.id;
        window.location.href = `edit.html?id=${id}`;
    }
    if (e.target.closest(".btn-delete-content")) {
        const id = e.target.closest(".btn-delete-content").dataset.id;
        deleteContent(id);
    }
});

// Filtros y búsquedas (Usuarios)
if (usersFilterSelect) {
    usersFilterSelect.addEventListener("change", () => {
        const val = usersFilterSelect.value;
        const filtered = (val === "Todos los roles") ? usersData : usersData.filter(u => (u.role || "").toLowerCase() === val.toLowerCase());
        renderUsers(filtered);
    });
}
if (usersSearchInput) {
    usersSearchInput.addEventListener("input", () => {
        const q = usersSearchInput.value.toLowerCase();
        renderUsers(usersData.filter(u => (u.nombre || u.email || u.correo || "").toString().toLowerCase().includes(q)));
    });
}
if (usersNewBtn) {
    usersNewBtn.addEventListener("click", () => window.location.href = "create-user.html");
}

// Filtros y búsquedas (Contenido)
if (contentFilterSelect) {
    contentFilterSelect.addEventListener("change", () => {
        const val = contentFilterSelect.value;
        const filtered = (val === "Todos los tipos") ? contentData : contentData.filter(c => (c.tipo || "").toLowerCase() === val.toLowerCase());
        renderContent(filtered);
    });
}
if (contentSearchInput) {
    contentSearchInput.addEventListener("input", () => {
        const q = contentSearchInput.value.toLowerCase();
        renderContent(contentData.filter(c => (c.titulo || c.autor || "").toString().toLowerCase().includes(q)));
    });
}
if (contentAddBtn) {
    contentAddBtn.addEventListener("click", () => window.location.href = "create.html");
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "login.html";
    });
}

// Inicializar datos al cargar
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    loadContent();
});
