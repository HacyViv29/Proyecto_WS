// ==========================================
//  AGREGAR CONTENIDO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. VERIFICAR SESIÓN
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");
    const userRole = localStorage.getItem("user_role");

    if (!token) {
        alert("Debes iniciar sesión para realizar esta acción.");
        window.location.href = "login.html";
        return;
    }

    const publisherContainer = document.getElementById("publisher_container");
    
    // Verificamos si el rol contiene "colab" (colaborador, collaborator)
    if (userRole.includes("colab") || userRole.includes("writ")) {
        if (publisherContainer) {
            publisherContainer.style.display = "block"; // Mostramos el campo
        }
    }

    const dateInput = document.getElementById("fecha_publicacion");
    
    if (dateInput) {
        dateInput.addEventListener("input", function(e) {
            // 1. Eliminar cualquier caracter que no sea número
            let value = this.value.replace(/\D/g, '');
            
            // 2. Limitar a 8 dígitos (2 mes + 2 dia + 4 año)
            if (value.length > 8) value = value.slice(0, 8);

            // 3. Agregar las barras '/'
            if (value.length > 4) {
                // Si hay más de 4 números (ej: 122520...), formato: 12/25/20...
                value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
            } else if (value.length > 2) {
                // Si hay más de 2 números (ej: 122...), formato: 12/2...
                value = value.slice(0, 2) + '/' + value.slice(2);
            }
            
            // 4. Asignar valor de vuelta al input
            this.value = value;
        });

        // (Opcional) Evitar que el usuario borre la barra manualmente y rompa el formato
        dateInput.addEventListener("keydown", function(e) {
            if (e.key === "Backspace" && this.value.slice(-1) === "/") {
                // Si borra una barra, borramos el número anterior también para mayor comodidad
                // this.value = this.value.slice(0, -1); 
            }
        });
    }

    // 3. REFERENCIAS AL DOM
    const form = document.querySelector("form");
    const btnCancel = document.querySelector(".btn-secondary");

    // 4. MANEJAR ENVÍO DEL FORMULARIO
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // A) Capturar valores del formulario
        const tipoInput = document.getElementById("tipo_contenido").value;
        const titulo = document.getElementById("titulo").value.trim();
        const autor = document.getElementById("autor").value.trim();
        const editorial = document.getElementById("editorial").value.trim();
        const isbn = document.getElementById("isbn").value.trim();
        const fecha = document.getElementById("fecha_publicacion").value.trim();
        const urlImg = document.getElementById("url_portada").value.trim();
        let publisherValue = "Admin"; // Valor por defecto para administradores
        const publisherInput = document.getElementById("publisher");
            
        // Si el campo es visible y tiene valor, lo usamos
        if (publisherContainer.style.display !== "none" && publisherInput && publisherInput.value.trim() !== "") {
            publisherValue = publisherInput.value.trim();
        }

        // B) Validaciones básicas
        if (!tipoInput || !titulo || !isbn) {
            alert("Los campos Tipo, Título e ISBN son obligatorios.");
            return;
        }

        // C) Normalizar categoría para el backend
        // El backend espera: "libros", "revistas" o "periodicos" (en plural y minúsculas)
        let categoriaBackend = tipoInput.toLowerCase();
        
        // Mapeo simple para asegurar compatibilidad
        if (categoriaBackend.includes("libro")) categoriaBackend = "libros";
        else if (categoriaBackend.includes("revista")) categoriaBackend = "revistas";
        else if (categoriaBackend.includes("period") || categoriaBackend.includes("periód")) categoriaBackend = "periodicos";

        // D) Construir el Payload (JSON) según Postman
        const payload = {
            isbn: isbn,
            categoria: categoriaBackend,
            nombre: titulo, // El backend usa este campo para la lista general
            detalles: {
                Titulo: titulo,
                Autor: autor || "Varios Autores",
                Editorial: editorial || "Sin Editorial",
                Fecha: fecha || new Date().getFullYear().toString(),
                img: urlImg,
                Publisher: publisherValue
            }
        };

        console.log("Enviando payload:", payload);

        try {
            // E) Petición POST al Gateway (Puerto 8000)
            const response = await fetch("http://localhost:8000/contenido", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "X-Refresh-Token": refreshToken || ""
                },
                body: JSON.stringify(payload)
            });

            // F) Manejo de respuesta
            if (response.status === 401) {
                alert("Tu sesión ha expirado.");
                localStorage.clear();
                window.location.href = "login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                // Mostrar error específico del backend (ej. "ISBN ya existe")
                throw new Error(data.detail || data.message || "Error al guardar");
            }

            // G) Éxito
            alert("¡Contenido agregado exitosamente!");
            
            // Redirigir según el rol (opcional, o volver atrás)
            const rol = localStorage.getItem("user_role");
            if (rol && rol.toLowerCase().includes("admin")) {
                window.location.href = "panel-admin.html";
            } else {
                window.location.href = "panel-colaborador.html";
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Error al guardar: " + error.message);
        }
    });

    // 4. BOTÓN CANCELAR
    if (btnCancel) {
        btnCancel.addEventListener("click", () => {
            window.history.back();
        });
    }
});