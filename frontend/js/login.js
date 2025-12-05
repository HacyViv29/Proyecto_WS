document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Debes llenar todos los campos.");
        return;
    }

    try {
        // Apuntando al Gateway (Puerto 8000)
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

        // Guardamos Access Token y Refresh Token (necesario para el Gateway)
        localStorage.setItem("token", data.access_token);
        if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
        }

        // Guardamos datos del usuario (Nombre y Email para las suscripciones)
        localStorage.setItem("first_name", data.first_name);
        localStorage.setItem("user_email", data.email); // Guardamos el email como ID para suscripciones
        localStorage.setItem("user_role", data.role);

        switch (data.role) {
            case "admin":
                window.location.href = "bienvenidaAdmin.html"; 
                break;

            case "colaborador":
                window.location.href = "bienvenidaColav.html"; 
                break;

            case "client":
            default:
                // Si es cliente o el rol no se reconoce, va a la bienvenida normal
                window.location.href = "bienvenida.html";
                break;
        }

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor (Gateway)");
    }
});
