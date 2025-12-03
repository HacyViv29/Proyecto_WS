//  VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}

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

    const payload = {
        old_password: actual.value,
        new_password: nueva.value
    };

    try {
        const res = await fetch("http://localhost:8000/users/change-password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.detail || "No se pudo cambiar la contraseña.");
            return;
        }

        alert("Contraseña cambiada correctamente.");

        // Limpiar campos
        actual.value = "";
        nueva.value = "";
        confirmar.value = "";

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor.");
    }
});
