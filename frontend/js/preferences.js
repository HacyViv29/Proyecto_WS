//   VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}

//  REFERENCIAS A LOS SWITCHES
const swLibros = document.getElementById("switchLibros");
const swRevistas = document.getElementById("switchRevistas");
const swPeriodicos = document.getElementById("switchPeriodicos");
const swUsuarios = document.getElementById("switchUsuarios");
const form = document.querySelector("form");

//  CARGAR PREFERENCIAS
async function cargarPreferencias() {
    try {
        const res = await fetch("http://localhost:8000/api/v1/suscripcionnes", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });

        // Sesión inválida
        if (res.status === 401) {
            alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        // Renovar tokens (si el gateway los envía)
        const newToken = res.headers.get("X-New-Access-Token");
        const newRefresh = res.headers.get("X-New-Refresh-Token");
        if (newToken) localStorage.setItem("token", newToken);
        if (newRefresh) localStorage.setItem("refresh_token", newRefresh);

        const data = await res.json();

        // Autorellenar switches
        swLibros.checked = data.nuevos_libros ?? false;
        swRevistas.checked = data.nuevas_revistas ?? false;
        swPeriodicos.checked = data.nuevos_periodicos ?? false;
        swUsuarios.checked = data.nuevos_usuarios ?? false;

    } catch (err) {
        console.error("Error cargando preferencias:", err);
        alert("No se pudieron cargar las preferencias");
    }
}

cargarPreferencias();

//     GUARDAR CAMBIOS
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
        nuevos_libros: swLibros.checked,
        nuevas_revistas: swRevistas.checked,
        nuevos_periodicos: swPeriodicos.checked,
        nuevos_usuarios: swUsuarios.checked
    };

    try {
        const res = await fetch("http://localhost:8000/api/v1/suscripciones", {
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
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        const newToken = res.headers.get("X-New-Access-Token");
        const newRefresh = res.headers.get("X-New-Refresh-Token");
        if (newToken) localStorage.setItem("token", newToken);
        if (newRefresh) localStorage.setItem("refresh_token", newRefresh);

        if (!res.ok) {
            alert("No se pudieron guardar los cambios");
            return;
        }

        alert("Preferencias actualizadas correctamente");

    } catch (err) {
        console.error("Error guardando preferencias:", err);
        alert("Error al conectar con el servidor");
    }
});
