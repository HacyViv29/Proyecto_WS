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

  const partes = nombreCompleto.split(/\s+/).filter(p => p.length > 0);

    let first_name = "";
    let last_name = "";

    if (partes.length === 1) {
        first_name = partes[0];
        last_name = ""; 
    } else if (partes.length >= 2) {
        first_name = partes[0];
        last_name = partes.slice(1).join(" "); 
    }
    
   
    const payload = {
        first_name: first_name,
        last_name: last_name, 
        email: email,
        password: pass,
    };

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