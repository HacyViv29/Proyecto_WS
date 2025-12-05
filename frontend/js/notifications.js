// ==========================================
// 1. CONFIGURACIÓN Y REFERENCIAS
// ==========================================
const panel = document.getElementById("notificationPanel");
const btnBell = document.getElementById("btnNotifications");

// Apuntamos al API Gateway
const API_BASE = "http://localhost:8000"; 

// Estructura interna del panel
const panelTemplate = `
    <div class="notif-header">
        <h5 class="mb-0"><i class="bi bi-bell-fill me-2"></i>Notificaciones</h5>
        <div>
            <button class="btn btn-sm btn-outline-light me-1" onclick="verificarNotificaciones()" title="Actualizar">
                <i class="bi bi-arrow-clockwise"></i>
            </button>
            <button class="btn btn-sm btn-light text-primary" id="btnClosePanel">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
    </div>
    <div id="notifList" class="notif-container">
        <div class="text-center text-muted mt-5">
            <small>Cargando notificaciones...</small>
        </div>
    </div>
`;

// Inicializar HTML
panel.innerHTML = panelTemplate;

const notifList = document.getElementById("notifList");
const btnClose = document.getElementById("btnClosePanel");

// ==========================================
// 2. LÓGICA DE UI (ABRIR/CERRAR)
// ==========================================

btnBell.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.style.transform = "translateX(0)";
    quitarBadge();
});

btnClose.addEventListener("click", () => {
    panel.style.transform = "translateX(100%)";
});

document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && !btnBell.contains(e.target)) {
        panel.style.transform = "translateX(100%)";
    }
});

// ==========================================
// 3. LÓGICA DE CONEXIÓN (POLLING)
// ==========================================

async function verificarNotificaciones() {
    // 1. Obtener credenciales
    const usuarioEmail = localStorage.getItem("user_email"); 
    const token = localStorage.getItem("token");

    // Si no hay usuario o token, mostramos mensaje y salimos
    if (!usuarioEmail || !token) {
        notifList.innerHTML = `<div class="text-center text-muted mt-5"><small>Inicia sesión para ver notificaciones</small></div>`;
        return;
    }

    // 2. Preparar ID para la URL (cambiar puntos por comas para Firebase)
    const emailKey = usuarioEmail.replaceAll('.', ',');

    try {
        // 3. Consultar al API Gateway (Enviando Token)
        // La ruta final será: http://localhost:8000/notificaciones/{email}
        const res = await fetch(`${API_BASE}/notificaciones/${emailKey}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        // Manejo de errores comunes
        if (res.status === 401) {
            console.warn("Sesión expirada en notificaciones. Deteniendo polling.");
            // Opcional: localStorage.clear(); window.location.href = "login.html";
            return;
        }

        if (!res.ok) {
            // Si es 404, es probable que el usuario aun no tenga notificaciones creadas
            if (res.status !== 404) {
                console.warn(`Error polling notificaciones: ${res.status}`);
            }
            return; 
        }

        const data = await res.json();

        if (data.status === 'success') {
            renderizarNotificaciones(data.data);
        }

    } catch (error) {
        console.error("Error de conexión polling:", error);
    }
}

// ==========================================
// 4. RENDERIZADO
// ==========================================

function renderizarNotificaciones(lista) {
    if (!lista || lista.length === 0) {
        notifList.innerHTML = `
            <div class="text-center text-muted mt-5 d-flex flex-column align-items-center">
                <i class="bi bi-inbox fs-1 mb-2 opacity-50"></i>
                <small>Sin notificaciones</small>
            </div>`;
        return;
    }

    if (lista.length > 0) {
        actualizarBadge(true);
    }

    let html = "";
    lista.forEach(n => {
        let icon = "bi-info-circle";
        if(n.categoria === "libros") icon = "bi-book";
        if(n.categoria === "revistas") icon = "bi-journal-text";
        if(n.categoria === "periodicos") icon = "bi-newspaper";
        if(n.categoria === "usuarios") icon = "bi-person-plus";

        html += `
            <div class="notif-card animate__animated animate__fadeIn" id="notif-${n.id}">
                <button class="btn-delete-notif" onclick="ocultarNotificacion('${n.id}')">
                    <i class="bi bi-x"></i>
                </button>
                <div class="notif-title">
                    <i class="bi ${icon} me-1 text-primary"></i> ${n.titulo}
                </div>
                <div class="notif-body">
                    ${n.mensaje}
                </div>
                <div class="notif-time">
                    ${n.fecha || ''}
                </div>
            </div>
        `;
    });

    notifList.innerHTML = html;
}

window.ocultarNotificacion = function(id) {
    const card = document.getElementById(`notif-${id}`);
    if (card) {
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
    }
}

window.limpiarTodo = function() {
    if(confirm("¿Limpiar vista?")) {
        notifList.innerHTML = '';
    }
}

// ==========================================
// 5. BADGES Y UTILIDADES
// ==========================================

function actualizarBadge(hayNuevas) {
    if (panel.style.transform === "translateX(0px)") return;

    if (hayNuevas) {
        if (!btnBell.querySelector(".position-absolute")) {
            const badge = document.createElement("span");
            badge.className = "position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle badge-notif";
            badge.innerHTML = '<span class="visually-hidden">New alerts</span>';
            
            const contenedorIcono = btnBell.querySelector("div") || btnBell;
            if(contenedorIcono.tagName === 'DIV') {
                 if(!contenedorIcono.querySelector('.badge-notif')) contenedorIcono.appendChild(badge);
            } else {
                 btnBell.style.position = 'relative';
                 btnBell.appendChild(badge);
            }
        }
    }
}

function quitarBadge() {
    const badge = btnBell.querySelector(".badge-notif");
    if (badge) badge.remove();
}

// ==========================================
// 6. INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    verificarNotificaciones();
    setInterval(verificarNotificaciones, 5000);
});