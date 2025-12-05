// ==========================================
//  AGREGAR / EDITAR CONTENIDO (add-content.js)
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. VERIFICAR SESIÓN
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");
    const userRole = (localStorage.getItem("user_role") || "").toLowerCase();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // 2. OBTENER PARÁMETROS DE URL (Detectar si es Edición)
    const urlParams = new URLSearchParams(window.location.search);
    const isbnToEdit = urlParams.get('isbn'); // Obtiene el ISBN si existe en la URL
    const isEditMode = !!isbnToEdit;

    // 3. REFERENCIAS AL DOM
    const form = document.getElementById("contentForm");
    const pageTitle = document.getElementById("pageTitle");
    const btnText = document.getElementById("btnText");
    const publisherContainer = document.getElementById("publisher_container");
    
    // Inputs
    const tipoInput = document.getElementById("tipo_contenido");
    const tituloInput = document.getElementById("titulo");
    const autorInput = document.getElementById("autor");
    const editorialInput = document.getElementById("autor_editorial");
    const descripcionInput = document.getElementById("descripcion");
    const isbnInput = document.getElementById("isbn_issn");
    const fechaInput = document.getElementById("fecha_publicacion");
    const urlImgInput = document.getElementById("url_portada");
    const publisherInput = document.getElementById("publisher");

    // 4. CONFIGURACIÓN INICIAL (UI)
    
    // Mostrar campo empresa si es colaborador
    if (userRole.includes("colab") || userRole.includes("writ")) {
        if (publisherContainer) publisherContainer.style.display = "block";
    }

    // Configurar textos según modo
    if (isEditMode) {
        console.log("Modo Edición Activado para:", isbnToEdit);
        pageTitle.textContent = "Editar Contenido";
        btnText.textContent = "Actualizar Contenido";
        isbnInput.disabled = true; // No permitir cambiar la llave primaria (ISBN)
        
        // Cargar datos del backend
        await cargarDatosParaEditar(isbnToEdit);
    } else {
        console.log("Modo Creación Activado");
        pageTitle.textContent = "Nuevo Contenido";
        btnText.textContent = "Guardar y Publicar";
        isbnInput.disabled = false;
    }


    // ==========================================
    //  FUNCIÓN: CARGAR DATOS (GET)
    // ==========================================
    async function cargarDatosParaEditar(isbn) {
        try {
            const res = await fetch(`http://localhost:8000/contenido/detalles/${isbn}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Refresh-Token": refreshToken || ""
                }
            });

            if (!res.ok) throw new Error("No se encontró el contenido o error de conexión");

            const json = await res.json();
            // Postman: { status: "success", data: { isbn: "...", detalles: { ... } } }
            const data = json.data?.detalles || {};
            const isbnData = json.data?.isbn || isbn;

            // Rellenar formulario
            tituloInput.value = data.Título || data.Titulo || "";
            autorInput.value = data.Autor || "";
            editorialInput.value = data.Editorial || "";
            descripcionInput.value = data.Descripcion || "";
            fechaInput.value = data.Fecha || "";
            urlImgInput.value = data.img || "";
            isbnInput.value = isbnData; // Rellenar ISBN aunque esté disabled
            
            if (data.Publisher && publisherInput) {
                publisherInput.value = data.Publisher;
            }

            // Inferir tipo para el select (Si el backend no devuelve 'tipo' explícito)
            if (isbnData.startsWith("LIB")) tipoInput.value = "libros";
            else if (isbnData.startsWith("REV")) tipoInput.value = "revistas";
            else if (isbnData.startsWith("PER")) tipoInput.value = "periodicos";

        } catch (err) {
            console.error("Error cargando detalles:", err);
            alert("Error cargando el contenido. Redirigiendo...");
            window.history.back();
        }
    }


    // ==========================================
    //  FUNCIÓN: GUARDAR (POST / PUT)
    // ==========================================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validaciones básicas
        if (!tituloInput.value.trim() || !isbnInput.value.trim()) {
            alert("Título e ISBN son obligatorios");
            return;
        }

        // Normalizar categoría
        let categoriaBackend = tipoInput.value.toLowerCase();
        if (categoriaBackend.includes("libro")) categoriaBackend = "libros";
        else if (categoriaBackend.includes("revista")) categoriaBackend = "revistas";
        else if (categoriaBackend.includes("period")) categoriaBackend = "periodicos";

        // Construir Payload (Estructura según Postman)
        const payload = {
            categoria: categoriaBackend,
            nombre: tituloInput.value.trim(),
            detalles: {
                Titulo: tituloInput.value.trim(),
                Autor: autorInput.value.trim() || "Varios",
                Editorial: editorialInput.value.trim() || "Sin Editorial",
                Descripcion: descripcionInput.value.trim(),
                Fecha: fechaInput.value.trim() || new Date().getFullYear().toString(),
                img: urlImgInput.value.trim(),
                Publisher: (publisherInput && publisherInput.value) ? publisherInput.value : "Admin"
            }
        };

        // Configurar URL y Método
        let url, method;

        if (isEditMode) {
            // PUT http://localhost:8000/contenido/{isbn}
            // Nota: En PUT, el ISBN va en la URL, el body lleva el resto.
            url = `http://localhost:8000/contenido/${isbnToEdit}`;
            method = "PUT";
        } else {
            // POST http://localhost:8000/contenido
            // Nota: En POST, el ISBN va dentro del body
            url = "http://localhost:8000/contenido";
            method = "POST";
            payload.isbn = isbnInput.value.trim();
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "X-Refresh-Token": refreshToken || ""
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                alert("Tu sesión ha expirado.");
                window.location.href = "login.html";
                return;
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || result.message || "Error al guardar");
            }

            // Éxito
            alert(isEditMode ? "Contenido actualizado correctamente" : "Contenido creado correctamente");
            window.history.back(); // Volver al panel

        } catch (error) {
            console.error("Error:", error);
            alert("Error: " + error.message);
        }
    });

    // Máscara de fecha simple
    fechaInput.addEventListener("input", function(e) {
        let val = this.value.replace(/\D/g, '');
        if (val.length > 8) val = val.slice(0, 8);
        if (val.length > 4) val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
        else if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
        this.value = val;
    });

});