document.getElementById("createForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const nombre = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirmPassword").value.trim();

    if (!nombre || !email || !pass || !confirm) {
        alert("Todos los campos son obligatorios");
        return;
    }

    if (pass !== confirm) {
        alert("Las contraseñas no coinciden");
        return;
    }

    // Separar nombre en 2 partes
    const partes = nombre.split(" ");
    const first_name = partes[0];
    const last_name = partes.slice(1).join(" ") || " ";

    try {
        const response = await fetch("http://localhost:8000/api/v1/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password: pass,
                first_name,
                last_name
            })
        });

        if (!response.ok) {
            alert("No se pudo crear el usuario");
            return;
        }

        alert("Usuario creado correctamente. Ahora inicia sesión.");
        window.location.href = "login.html";

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor");
    }
});