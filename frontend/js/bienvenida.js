// VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}

document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.clear(); // Borra todo (token, refresh, user, etc)
    window.location.href = "login.html";
});

// CARGAR CONTENIDOS
const contenedor = document.getElementById("contenedor-contenidos");
let listaCompleta = [];

async function cargarContenidos() {
    try {
        // Petición al Gateway con Headers de Seguridad
        const res = await fetch("http://localhost:8000/contenido", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "X-Refresh-Token": refreshToken || "" // Enviamos el refresh para que el Gateway renueve si hace falta
            }
        });

        // 1. Verificar si el Gateway nos rechazó (Token inválido)
        if (res.status === 401) {
            alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) {
            throw new Error("Error al obtener contenidos");
        }

        // 2. Lógica de Renovación de Token (Gateway Pattern)
        // Si el gateway renovó el token, vendrá en los headers de respuesta
        const newToken = res.headers.get("x-new-access-token");
        const newRefresh = res.headers.get("x-new-refresh-token");

        if (newToken) {
            console.log("🔄 Token renovado automáticamente por el Gateway");
            localStorage.setItem("token", newToken);
            if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
        }

        const data = await res.json();

        // Procesar datos (igual que antes)
        listaCompleta = [
            ...convertir("libro", data.data.libros || {}),
            ...convertir("revista", data.data.revistas || {}),
            ...convertir("periodico", data.data.periodicos || {})
        ];

        renderizar(listaCompleta);

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el sistema.");
    }
}

// ... (El resto de las funciones 'convertir', 'renderizar' y filtros quedan IGUAL)
function convertir(tipo, objeto) {
    return Object.keys(objeto).map(key => ({
        id: key,
        titulo: objeto[key],
        autor: "Desconocido", // Tu endpoint actual solo devuelve título
        tipo: tipo
    }));
}

// Ejecutar carga
cargarContenidos();

// ... (Mantén el resto de tu código de renderizado y filtros aquí abajo)
function renderizar(lista) {
    contenedor.innerHTML = "";
    lista.forEach(item => {
        contenedor.innerHTML += `
            <div class="col">
                <div class="card h-100 shadow-sm border-0 book-card">
                    <img src="images/default.jpg" class="card-img-top" alt="${item.titulo}">
                    <div class="card-body p-3">
                        <h5 class="card-title fw-bold mb-0">${item.titulo}</h5>
                        <p class="card-text text-muted small mb-2">${item.autor}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="badge category-badge bg-primary">${item.tipo}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Event Listeners de Filtros y Buscador (Igual que tu original)
document.querySelectorAll(".filter-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".active-tab").classList.remove("active-tab");
        btn.classList.add("active-tab");
        const filtro = btn.dataset.filter;
        if (filtro === "todo") {
            renderizar(listaCompleta);
        } else {
            const filtrados = listaCompleta.filter(item => item.tipo === filtro);
            renderizar(filtrados);
        }
    });
});

document.getElementById("searchInput").addEventListener("input", e => {
    const texto = e.target.value.toLowerCase();
    const filtrados = listaCompleta.filter(item =>
        item.titulo.toLowerCase().includes(texto)
    );
    renderizar(filtrados);
});
