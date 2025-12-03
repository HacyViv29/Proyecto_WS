// VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}

document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

// CARGAR CONTENIDOS
const contenedor = document.getElementById("contenedor-contenidos");
let listaCompleta = [];

async function cargarContenidos() {
    try {
        console.log("Iniciando petición a /contenido/detalles...");
        
        const res = await fetch("http://localhost:8000/contenido/detalles", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || ""
            }
        });

        console.log("Estado de respuesta:", res.status);

        if (res.status === 401) {
            alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.statusText}`);
        }

        // Renovación de tokens
        const newToken = res.headers.get("x-new-access-token");
        const newRefresh = res.headers.get("x-new-refresh-token");
        if (newToken) {
            console.log("Token renovado");
            localStorage.setItem("token", newToken);
            if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
        }

        const responseBody = await res.json();
        console.log("Datos recibidos:", responseBody);

        const dataObjects = responseBody.data || {};
        const keys = Object.keys(dataObjects);

        if (keys.length === 0) {
            console.warn("La respuesta no contiene datos en 'data'");
            contenedor.innerHTML = "<p class='text-center mt-5'>No se encontraron contenidos.</p>";
            return;
        }

        listaCompleta = keys.map(key => {
            const item = dataObjects[key];
            
            // Determinar tipo
            let tipoItem = "otro";
            if (key.startsWith("LIB")) tipoItem = "libro";
            else if (key.startsWith("REV")) tipoItem = "revista";
            else if (key.startsWith("PER")) tipoItem = "periodico";

            // CORRECCIÓN PRINCIPAL: Manejo seguro de campos faltantes o mal escritos
            return {
                id: key,
                // Busca "Título" O "Titulo" (con o sin acento)
                titulo: item.Título || item.Titulo || "Sin Título", 
                autor: item.Autor || "Desconocido",
                editorial: item.Editorial || "Editorial desconocida",
                fecha: item.Fecha || "s/f",
                // Si no hay img, enviamos null para que el renderizador use la default
                imagen: item.img || null,
                tipo: tipoItem
            };
        });

        console.log("Lista procesada:", listaCompleta);
        renderizar(listaCompleta);

    } catch (error) {
        console.error("Error grave en cargarContenidos:", error);
        contenedor.innerHTML = `<p class='text-danger text-center'>Error cargando datos: ${error.message}</p>`;
    }
}

function renderizar(lista) {
    contenedor.innerHTML = "";
    
    if(!lista || lista.length === 0){
        contenedor.innerHTML = "<p>No hay elementos para mostrar.</p>";
        return;
    }

    lista.forEach(item => {
        // Usar imagen real si existe, sino default
        const imagenSrc = item.imagen ? `images/${item.imagen}` : 'images/default.jpg';

        contenedor.innerHTML += `
            <div class="col">
                <div class="card h-100 shadow-sm border-0 book-card">
                    
                    <img src="${imagenSrc}" 
                         class="card-img-top" 
                         alt="${item.titulo}" 
                         style="height: 250px; object-fit: cover;"
                         onerror="this.onerror=null; this.src='images/default.jpg';"> 
                    
                    <div class="card-body p-3 d-flex flex-column">
                        <h5 class="card-title fw-bold mb-0 text-truncate" title="${item.titulo}">${item.titulo}</h5>
                        <p class="card-text text-muted small mb-1">Por: ${item.autor}</p>
                        <p class="card-text text-muted small mb-2" style="font-size: 0.8rem;">
                            Ed. ${item.editorial} (${item.fecha})
                        </p>
                        
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <span class="badge category-badge bg-primary text-uppercase">${item.tipo}</span>
                            <button class="btn btn-sm btn-outline-secondary">Ver más</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Event Listeners (Filtros y Buscador)
document.querySelectorAll(".filter-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".active-tab").classList.remove("active-tab");
        btn.classList.add("active-tab");
        const filtro = btn.dataset.filter;
        
        if (filtro === "todo") renderizar(listaCompleta);
        else renderizar(listaCompleta.filter(item => item.tipo === filtro));
    });
});

document.getElementById("searchInput").addEventListener("input", e => {
    const texto = e.target.value.toLowerCase();
    renderizar(listaCompleta.filter(item =>
        item.titulo.toLowerCase().includes(texto) || 
        item.autor.toLowerCase().includes(texto)
    ));
});

