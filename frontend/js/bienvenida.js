// VERIFICAR SESIÓN
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
});

// CARGAR CONTENIDOS
const contenedor = document.getElementById("contenedor-contenidos");
let listaCompleta = [];

async function cargarContenidos() {
    try {
        const res = await fetch("http://localhost:8001/contenido");

        if (!res.ok) {
            alert("Error al obtener los contenidos");
            return;
        }

        const data = await res.json();

        // Convierte la estructura del backend en una lista uniforme:
        listaCompleta = [
            ...convertir("libro", data.data.libros),
            ...convertir("revista", data.data.revistas),
            ...convertir("periodico", data.data.periodicos)
        ];

        renderizar(listaCompleta);

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el microservicio de contenidos.");
    }
}

// Convierte el JSON del backend en un array de objetos
function convertir(tipo, objeto) {
    return Object.keys(objeto).map(key => ({
        id: key,
        titulo: objeto[key],
        autor: "Desconocido",
        tipo: tipo
    }));
}

cargarContenidos();

// RENDERIZAR TARJETAS
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
                            <span class="badge category-badge">${item.tipo}</span>
                            <div class="rating-display">
                                <i class="bi bi-star-fill text-warning me-1"></i>
                                <span class="fw-semibold">4.5</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// FILTROS (libro/revista/periodico/todo)
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

// BUSCADOR
document.getElementById("searchInput").addEventListener("input", e => {
    const texto = e.target.value.toLowerCase();

    const filtrados = listaCompleta.filter(item =>
        item.titulo.toLowerCase().includes(texto)
    );

    renderizar(filtrados);
});
