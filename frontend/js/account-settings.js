// VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}

async function verificarSesion() {
    try {
        const res = await fetch("http://localhost:8000/usuario/validar", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });

        // Si sesión inválida → redirigir
        if (res.status === 401) {
            alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        // Si servidor respondió tokens nuevos → guardarlos
        const newToken = res.headers.get("x-new-access-token");
        const newRefresh = res.headers.get("x-new-refresh-token");

        if (newToken) {
            localStorage.setItem("token", newToken);
            if (newRefresh) {
                localStorage.setItem("refresh_token", newRefresh);
            }
        }

    } catch (err) {
        console.error("Error verificando sesión:", err);
        alert("Error de conexión con el servidor.");
        window.location.href = "login.html";
    }
}

// Ejecutar verificación al cargar página
document.addEventListener("DOMContentLoaded", verificarSesion);
