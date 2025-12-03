//  PANEL DESPLEGABLE

const panel = document.getElementById("notificationPanel");
const btn = document.getElementById("btnNotifications");

btn.addEventListener("click", async () => {
    // Despliega el panel
    panel.style.transform = "translateX(0)";

    // Carga la vista HTML solo la primera vez
    if (!panel.dataset.loaded) {
        const html = await fetch("notification.html").then(r => r.text());
        panel.innerHTML = html;
        panel.dataset.loaded = "true";
    }
});

// Cerrar el panel haciendo clic afuera
document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
        panel.style.transform = "translateX(100%)";
    }
});

// =======================
//  CONSULTAR NOTIFICACIONES
// =======================

const API_NOTIFICACIONES = "https://localhost:8000/webhook";

// Cargar lista desde endpoint
async function cargarNotificaciones() {
    try {
        const response = await fetch(API_NOTIFICACIONES);
        const notificaciones = await response.json();

        console.log("Notificaciones recibidas:", notificaciones);
        // Aquí insertas las notificaciones en el panel si quieres
    } catch (err) {
        console.error("Error cargando notificaciones:", err);
    }
}

// =======================
//  ESCUCHAR WEBHOOK (EVENTSOURCE)
// =======================

function iniciarWebhook() {
    const eventSource = new EventSource("https://tu-backend.com/webhook/notificaciones");

    eventSource.onmessage = (event) => {
        console.log("Webhook recibido:", event.data);

        // Actualiza la lista de notificaciones
        cargarNotificaciones();

        // Opcional: animación del icono con un punto rojo
        marcarCampana();
    };

    eventSource.onerror = () => {
        console.warn("Conexión con webhook perdida, reconectando...");
    };
}

function marcarCampana() {
    btn.innerHTML = `<i class="bi bi-bell-fill text-danger"></i>`;
}

// Inicializar procesos
cargarNotificaciones();
iniciarWebhook();
