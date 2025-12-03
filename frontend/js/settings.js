// VERIFICAR SESIÓN
let token = localStorage.getItem("token");
let refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}
const GET_USER_URL = "/api/v1/user/me";
const UPDATE_USER_URL = "/api/v1/user/update";

// Campos del formulario
const inputNombre = document.getElementById("nombreCompleto");
const inputCorreo = document.getElementById("correoElectronico");
const inputTelefono = document.getElementById("telefono");
const form = document.querySelector("form");

// --- Guardar tokens nuevos si vienen en headers ---
function actualizarTokens(headers) {
    const newAccess = headers.get("X-New-Access-Token");
    const newRefresh = headers.get("X-New-Refresh-Token");

    if (newAccess) {
        localStorage.setItem("token", newAccess);
        token = newAccess;
    }
    if (newRefresh) {
        localStorage.setItem("refresh_token", newRefresh);
        refreshToken = newRefresh;
    }
}

// --- Cargar datos del usuario ---
async function cargarDatos() {
    try {
        const res = await fetch(GET_USER_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken
            }
        });

        if (res.status === 401) {
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        actualizarTokens(res.headers);

        const data = await res.json();

        inputNombre.value = `${data.first_name || ""} ${data.last_name || ""}`.trim();
        inputCorreo.value = data.email || "";
        inputTelefono.value = data.phone || "";
    } catch (err) {
        console.log("Error al cargar datos:", err);
    }
}

document.addEventListener("DOMContentLoaded", cargarDatos);

// --- Guardar cambios ---
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim().split(" ");
    const first_name = nombre[0] || "";
    const last_name = nombre.slice(1).join(" ") || "";

    const payload = {
        first_name,
        last_name,
        email: inputCorreo.value.trim(),
        phone: inputTelefono.value.trim()
    };

    try {
        const res = await fetch(UPDATE_USER_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 401) {
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        actualizarTokens(res.headers);

        if (res.ok) {
            alert("Datos actualizados correctamente.");
        } else {
            alert("No se pudieron guardar los cambios.");
        }

    } catch (err) {
        console.log("Error al guardar cambios:", err);
        alert("Error de conexión.");
    }
});
