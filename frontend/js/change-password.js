//  VERIFICAR SESIÓN
const token = localStorage.getItem("token");
// const refreshToken = localStorage.getItem("refresh_token"); // Opcional si no se usa aquí

if (!token) {
    window.location.href = "login.html";
}

// URL DEL ENDPOINT (Ajustada al prefijo /api/v1)
const CHANGE_PASSWORD_URL = "http://localhost:8000/api/v1/change-password";

//  REFERENCIAS DEL FORMULARIO
const form = document.querySelector("form");
const actual = document.getElementById("contrasenaActual");
const nueva = document.getElementById("nuevaContrasena");
const confirmar = document.getElementById("confirmarContrasena");

//  CAMBIAR CONTRASEÑA
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (nueva.value !== confirmar.value) {
        alert("La nueva contraseña no coincide con la confirmación.");
        return;
    }

    if (!actual.value || !nueva.value) {
        alert("Completa todos los campos.");
        return;
    }

    if (nueva.value.length < 8) {
        alert("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
    }

    const payload = {
        old_password: actual.value,
        new_password: nueva.value
    };

    try {
        const res = await fetch(CHANGE_PASSWORD_URL, {
            method: "POST", // CORRECCIÓN: El backend espera POST
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        // Manejo de sesión expirada
        if (res.status === 401) {
            alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            // Muestra el detalle del error (ej. "La contraseña actual es incorrecta")
            alert(err.detail || "No se pudo cambiar la contraseña.");
            return;
        }

        alert("Contraseña cambiada correctamente.");

        // Limpiar campos
        actual.value = "";
        nueva.value = "";
        confirmar.value = "";

        // Opcional: Redirigir al perfil o cerrar sesión
        window.location.href = "acount-settings.html";

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor.");
    }
});
