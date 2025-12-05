// ==========================================
//  GESTIÓN DE USUARIOS (create.js)
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. CONTEXTO
    const token = localStorage.getItem("token");
    const userRole = (localStorage.getItem("user_role") || "").toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const userIdToEdit = urlParams.get('id'); 

    // Referencias al DOM
    const adminFields = document.getElementById("adminFields");
    const loginLinkContainer = document.getElementById("loginLinkContainer");
    const formTitle = document.getElementById("formTitle");
    const btnSubmit = document.getElementById("btnSubmit");
    const btnCancel = document.getElementById("btnCancel");
    
    const roleSelect = document.getElementById("role");
    const companyField = document.getElementById("companyField");
    const idEmpresaInput = document.getElementById("id_empresa"); // Nuevo campo ID Empresa

    const nameInput = document.getElementById("name");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");

    // 2. CONFIGURACIÓN SEGÚN ROL (ADMIN)
    const isAdmin = token && (userRole.includes("admin") || userRole.includes("administrador"));

    if (isAdmin) {
        // Interfaz de Administrador
        if(loginLinkContainer) loginLinkContainer.style.display = "none";
        if(adminFields) adminFields.style.display = "block";
        
        if(btnCancel) {
            btnCancel.style.display = "block";
            btnCancel.addEventListener("click", () => window.location.href = "panel-admin.html");
        }

        // Lógica para mostrar campo 'id_empresa' solo si es Colaborador
        roleSelect.addEventListener("change", () => {
            const val = roleSelect.value.toLowerCase();
            // Revisar si es colaborador (collaborator, colaborador, writer, etc)
            if (val.includes("colab") || val.includes("writ") || val === "collaborator") {
                companyField.style.display = "block";
            } else {
                companyField.style.display = "none";
                if(idEmpresaInput) idEmpresaInput.value = ""; 
            }
        });

        // Modo Edición o Creación
        if (userIdToEdit) {
            prepararModoEdicion(userIdToEdit);
        } else {
            formTitle.textContent = "Nuevo Usuario";
            btnSubmit.textContent = "Registrar Usuario";
        }

    } else {
        // Interfaz Pública (Registro normal)
        // Se asume rol 'client' por defecto, id_empresa no se usa
    }

    // ==========================================
    //  FUNCIÓN: CARGAR DATOS (Modo Edición)
    // ==========================================
    async function prepararModoEdicion(id) {
        formTitle.textContent = "Editar Usuario";
        btnSubmit.textContent = "Guardar Cambios";
        if(passwordInput) passwordInput.placeholder = "(Dejar vacío para mantener actual)";
        if(confirmInput) confirmInput.placeholder = "(Dejar vacío para mantener actual)";
        
        try {
            // GET /users/{id} -> Devuelve esquema UserGet
            const res = await fetch(`http://localhost:8000/api/v1/users/detail/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("No se pudieron cargar los datos del usuario");

            const user = await res.json(); 
            // user tiene: { id, email, first_name, last_name, role, id_empresa, ... }

            // Rellenar campos básicos
            nameInput.value = user.first_name || "";
            lastNameInput.value = user.last_name || "";
            emailInput.value = user.email || "";
            
            // Configurar Rol
            if (roleSelect && user.role) {
                const r = user.role.toLowerCase();
                if (r.includes("admin")) roleSelect.value = "admin";
                else if (r.includes("colab") || r.includes("writ")) roleSelect.value = "collaborator";
                else roleSelect.value = "client";
                
                // Disparar evento para mostrar/ocultar campo empresa
                roleSelect.dispatchEvent(new Event('change'));
            }

            // Rellenar ID Empresa si existe
            if (idEmpresaInput && user.id_empresa) {
                idEmpresaInput.value = user.id_empresa;
            }

            // Bloquear email en edición
            emailInput.disabled = true;

        } catch (err) {
            console.error(err);
            alert("Error al cargar usuario: " + err.message);
            window.location.href = "panel-admin.html";
        }
    }

    // ==========================================
    //  ENVIAR FORMULARIO
    // ==========================================
    document.getElementById("createForm").addEventListener("submit", async function(event) {
        event.preventDefault();

        // Captura de valores
        const first_name = nameInput.value.trim();
        const last_name = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirm = confirmInput.value.trim();
        
        const role = isAdmin ? roleSelect.value : "client";
        const id_empresa = idEmpresaInput ? idEmpresaInput.value.trim() : null;

        // Validaciones
        if (!userIdToEdit && (!first_name || !last_name || !email || !password)) {
            alert("Todos los campos son obligatorios para crear un usuario.");
            return;
        }

        if (password && password !== confirm) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        // Validación específica: Si es colaborador, debe tener empresa
        if (role === "collaborator" && !id_empresa) {
             alert("Debes asignar un ID de Empresa para el rol de Colaborador.");
             return;
        }

        // Construcción del Payload (UserPost / UserUpdate)
        const payload = {
            first_name: first_name,
            last_name: last_name,
            role: role
        };

        // Email solo si es nuevo
        if (!userIdToEdit) {
            payload.email = email;
        }

        // Password solo si se escribió
        if (password) {
            payload.password = password; 
        }

        // ID Empresa solo si es colaborador
        if (role === "collaborator" && id_empresa) {
            payload.id_empresa = id_empresa;
        }

        // Configurar Petición
        let url = "http://localhost:8000/api/v1/register";
        let method = "POST";

        if (userIdToEdit) {
            url = `http://localhost:8000/api/v1/users/${userIdToEdit}`;
            method = "PUT";
        }

        try {
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            console.log("Enviando payload:", payload);

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Error al procesar la solicitud");
            }

            alert(userIdToEdit ? "Usuario actualizado correctamente" : "Usuario registrado correctamente");
            
            if (isAdmin) {
                window.location.href = "panel-admin.html";
            } else {
                window.location.href = "login.html";
            }

        } catch (error) {
            console.error("Error en submit:", error);
            alert("Error: " + error.message);
        }
    });
});