document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Debes llenar todos los campos.");
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/api/v1/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            alert("Correo o contraseña incorrectos");
            return;
        }

        const data = await response.json();

        // Guardar token
        localStorage.setItem("token", data.access_token);

        // Guardar nombre del usuario
        localStorage.setItem("first_name", data.first_name);

        // Redirigir
        window.location.href = "bienvenida.html";

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor");
    }
});
