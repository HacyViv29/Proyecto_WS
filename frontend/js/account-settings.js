// VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}

async function verificarSesion() {
    try {
        // CORRECCIÓN: Usamos el endpoint '/api/v1/data' que SÍ existe en tu AuthWS.
        // Al hacer este GET, el Gateway valida el token automáticamente.
        const res = await fetch("http://localhost:8000/api/v1/data", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });

        // Si la sesión es inválida (401) y el Gateway no pudo renovarla
        if (res.status === 401) {
            console.warn("Sesión expirada o token inválido");
            alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        // Si hay error de servidor (500, 503), solo avisamos pero no sacamos al usuario todavía
        if (!res.ok) {
            console.error("Error en servidor al validar sesión:", res.status);
            return; 
        }

        // Lógica de Renovación de Tokens (El Gateway te los manda en los headers)
        const newAccessToken = res.headers.get("x-new-access-token") || res.headers.get("X-New-Access-Token");
        const newRefreshToken = res.headers.get("x-new-refresh-token") || res.headers.get("X-New-Refresh-Token");

        if (newAccessToken) {
            console.log("Token renovado automáticamente por el Gateway");
            localStorage.setItem("token", newAccessToken);
        }
        if (newRefreshToken) {
            localStorage.setItem("refresh_token", newRefreshToken);
        }

        // (Opcional) Podrías actualizar los datos del usuario en localStorage aquí
        const userData = await res.json();
        if (userData.user) {
            localStorage.setItem("first_name", userData.user.first_name);
            localStorage.setItem("user_role", userData.user.role);
        }

    } catch (err) {
        console.error("Error de conexión verificando sesión:", err);
        // No redirigimos al login inmediatamente por un error de red, 
        // para no molestar al usuario si solo se le fue el internet un segundo.
    }
}

// Ejecutar verificación al cargar página
document.addEventListener("DOMContentLoaded", verificarSesion);
