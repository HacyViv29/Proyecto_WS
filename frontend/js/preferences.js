// ==========================================
//  PREFERENCIAS DE SUSCRIPCIÓN (preferences.js)
// ==========================================

// 1. VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");
const userEmail = localStorage.getItem("user_email"); // Asegúrate de que login.js guarde esto

if (!token || !userEmail) {
    alert("Debes iniciar sesión.");
    window.location.href = "login.html";
}

// 2. REFERENCIAS AL DOM
const swLibros = document.getElementById("switchLibros");
const swRevistas = document.getElementById("switchRevistas");
const swPeriodicos = document.getElementById("switchPeriodicos");
const swUsuarios = document.getElementById("switchUsuarios");
const form = document.querySelector("form");

// 3. HELPER: Sanitizar correo (puntos por comas) para Firebase
function getEmailSanitizado() {
    // Ejemplo: 'marydoe@mail.com' -> 'marydoe@mail,com'
    return userEmail.replace(/\./g, ',');
}

// 4. HELPERS DE TOKEN (Reutilizable)
function saveNewTokens(headers) {
    const newA = headers.get("x-new-access-token") || headers.get("X-New-Access-Token");
    const newR = headers.get("x-new-refresh-token") || headers.get("X-New-Refresh-Token");
    if (newA) localStorage.setItem("token", newA);
    if (newR) localStorage.setItem("refresh_token", newR);
}

// ==========================================
//  CARGAR PREFERENCIAS (GET)
// ==========================================
async function cargarPreferencias() {
    const correoID = getEmailSanitizado();
    
    // Usamos el endpoint específico de usuario: /suscripciones/{correo}
    const endpoint = `http://localhost:8000/suscripciones/${correoID}`;

    try {
        const res = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });

        if (res.status === 401) {
            alert("Tu sesión ha expirado.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        saveNewTokens(res.headers);

        const respuesta = await res.json();
        
        // Validar estructura de respuesta según Postman
        // Postman devuelve: { status: "success", data: { suscripciones: { libros: true... } } }
        if (respuesta.data && respuesta.data.suscripciones) {
            const subs = respuesta.data.suscripciones;
            
            // Asignar valores a los switches
            swLibros.checked = subs.libros === true;
            swRevistas.checked = subs.revistas === true;
            swPeriodicos.checked = subs.periodicos === true;
            swUsuarios.checked = subs.usuarios === true;
        } else {
            console.warn("El usuario no tiene suscripciones configuradas aún.");
        }

    } catch (err) {
        console.error("Error cargando preferencias:", err);
        // No alertamos al usuario para no molestar al cargar, pero lo logueamos
    }
}

// Ejecutar al inicio
document.addEventListener("DOMContentLoaded", cargarPreferencias);

// ==========================================
//  GUARDAR CAMBIOS (PUT)
// ==========================================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correoID = getEmailSanitizado();

    // Construir Payload según Postman (Endpoint: suscripciones/actualizar)
    const payload = {
        correo: correoID,
        libros: swLibros.checked,
        revistas: swRevistas.checked,
        periodicos: swPeriodicos.checked,
        usuarios: swUsuarios.checked
    };

    console.log("Enviando actualización:", payload);

    try {
        const res = await fetch("http://localhost:8000/suscripciones/actualizar", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "X-Refresh-Token": localStorage.getItem("refresh_token") || ""
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 401) {
            alert("Tu sesión ha expirado.");
            window.location.href = "login.html";
            return;
        }

        saveNewTokens(res.headers);

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "No se pudieron guardar los cambios");
        }

        alert("Preferencias actualizadas correctamente");
        window.location.href = "acount-settings.html";

    } catch (err) {
        console.error("Error guardando preferencias:", err);
        alert("Error al conectar con el servidor: " + err.message);
    }
});