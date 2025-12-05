// CONFIGURACIÓN DE URLS
// Asegúrate de que el puerto sea el correcto (8000 u otro)
const BASE_URL = "http://localhost:8000/api/v1";
const GET_USER_URL = `${BASE_URL}/data`;
const UPDATE_USER_URL = `${BASE_URL}/users`;

// Referencias al DOM
const inputNombre = document.getElementById("nombre");
const inputApellido = document.getElementById("apellido");
const inputTelefono = document.getElementById("telefono");
const inputCorreo = document.getElementById("correo"); // Si existe
const form = document.querySelector("form");

// Variable para almacenar el email actual (ID para actualizar)
let currentUserEmail = "";

// --- FUNCIÓN MÁSCARA DE TELÉFONO ---
function aplicarMascaraTelefono(valor) {
    if (!valor) return "";
    
    // 1. Limpiar: Eliminar todo lo que no sea número
    // y limitar a 10 dígitos numéricos
    const limpio = valor.replace(/\D/g, "").substring(0, 10);
    
    // 2. Formatear: (XXX-XXX-XXXX)
    const match = limpio.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (match) {
        // match[1] = primeros 3, match[2] = siguientes 3, match[3] = últimos 4
        if (!match[2]) return match[1];
        if (!match[3]) return `${match[1]}-${match[2]}`;
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return limpio;
}

// Evento para formatear mientras el usuario escribe
if (inputTelefono) {
    inputTelefono.addEventListener("input", (e) => {
        e.target.value = aplicarMascaraTelefono(e.target.value);
    });
}

// 1. VERIFICAR SESIÓN Y CARGAR DATOS AL INICIO
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch(GET_USER_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (res.status === 401) {
            alert("Sesión expirada");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        const data = await res.json();

        // Verificar y llenar datos
        if (data.user) {
            // Guardamos el email para usarlo en la URL de actualización
            currentUserEmail = data.user.email;

            inputNombre.value = data.user.first_name || "";
            inputApellido.value = data.user.last_name || "";
            inputTelefono.value = data.user.telephone || ""; // Backend usa 'telephone'

            if (inputCorreo) {
                inputCorreo.value = data.user.email || "";
                inputCorreo.disabled = true; // El email no se debe editar aquí
            }
        }

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
});

// 2. GUARDAR CAMBIOS (SUBMIT)
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUserEmail) {
        alert("Error: No se ha identificado al usuario (falta email).");
        return;
    }

    // Preparamos los datos EXACTAMENTE como los espera el esquema UserUpdate
    const payload = {
        first_name: inputNombre.value.trim(),
        last_name: inputApellido.value.trim(),
        telephone: inputTelefono.value.trim() // IMPORTANTE: 'telephone', no 'phone'
        // No enviamos 'email' ni 'password' ni 'role' si no se cambian
    };

    try {
        // Construimos la URL: /users/{email}
        const url = `${UPDATE_USER_URL}/${currentUserEmail}`;

        const token = localStorage.getItem("token");

        const res = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 401) {
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        if (res.ok) {
            alert("Datos actualizados correctamente.");
            // REDIRECCIÓN AGREGADA AQUÍ:
            window.location.href = "acount-settings.html"; 
        } else {
            const errorData = await res.json();
            console.error("Error del servidor:", errorData);
            alert("No se pudieron guardar los cambios: " + (errorData.detail || "Error desconocido"));
        }

    } catch (err) {
        console.error("Error de conexión:", err);
        alert("Error al intentar guardar los cambios.");
    }
});