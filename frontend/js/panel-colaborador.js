//  VERIFICAR SESIÓN
const token = localStorage.getItem("token");
const refreshToken = localStorage.getItem("refresh_token");

if (!token) {
    window.location.href = "login.html";
}

//  REFERENCIAS HTML
const tablaContenido = document.getElementById("contenidoDinamico");
const totalPublicado = document.getElementById("totalPublicado");
const filtroTipo = document.getElementById("tipoFiltro");
const busqueda = document.getElementById("busquedaContenido");
const btnAgregar = document.getElementById("agregarContenido");

const btnSalir = document.querySelector(".exit-link");

let datosOriginales = []; // Para filtrar y buscar sin perder datos

//  CARGAR PUBLICACIONES
async function cargarContenido() {
    try {
        const res = await fetch("http://localhost:8000/contenido/mis-publicaciones", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            alert("No se pudo obtener tu contenido.");
            return;
        }

        datosOriginales = await res.json();
        renderTabla(datosOriginales);

    } catch (e) {
        console.error(e);
        alert("Error al conectar con el servidor.");
    }
}

//  RENDERIZAR TABLA
function renderTabla(lista) {
    tablaContenido.innerHTML = "";

    lista.forEach(item => {
        const fila = document.createElement("tr");

        let badge = "";
        if (item.tipo === "Libro") {
            badge = `<span class="badge badge-libro"><i class="fas fa-book"></i> Libro</span>`;
        } else if (item.tipo === "Revista") {
            badge = `<span class="badge badge-revista"><i class="fas fa-journal-whills"></i> Revista</span>`;
        }

        fila.innerHTML = `
            <td data-label="Título">${item.titulo}</td>
            <td data-label="Tipo">${badge}</td>
            <td data-label="Autor">${item.autor}</td>
            <td data-label="Vistas"><i class="fas fa-eye"></i> ${item.vistas}</td>
            <td data-label="Acciones" class="actions-cell">
                <i class="fas fa-pen-square icon-edit" data-id="${item.id}"></i>
                <i class="fas fa-trash-alt icon-delete" data-id="${item.id}"></i>
            </td>
        `;

        tablaContenido.appendChild(fila);
    });

    totalPublicado.textContent = lista.length;
}

//  FILTRAR POR TIPO
filtroTipo.addEventListener("change", () => {
    const tipo = filtroTipo.value;

    if (tipo === "Todos los tipos") {
        renderTabla(datosOriginales);
        return;
    }

    const filtrado = datosOriginales.filter(item => item.tipo === tipo);
    renderTabla(filtrado);
});

//  BUSQUEDA
busqueda.addEventListener("input", () => {
    const texto = busqueda.value.toLowerCase();

    const filtrado = datosOriginales.filter(item =>
        item.titulo.toLowerCase().includes(texto) ||
        item.autor.toLowerCase().includes(texto)
    );

    renderTabla(filtrado);
});

//  ACCIONES: EDITAR / ELIMINAR
tablaContenido.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    // EDITAR
    if (e.target.classList.contains("icon-edit")) {
        window.location.href = `edit.html?id=${id}`;
        return;
    }

    // ELIMINAR
    if (e.target.classList.contains("icon-delete")) {
        const confirmar = confirm("¿Eliminar este contenido?");

        if (!confirmar) return;

        try {
            const res = await fetch(`http://localhost:8005/contenido/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                alert("No se pudo eliminar.");
                return;
            }

            alert("Contenido eliminado.");
            cargarContenido();

        } catch (err) {
            console.error(err);
            alert("Error al intentar eliminar.");
        }
    }
});

//  BOTÓN AGREGAR
btnAgregar.addEventListener("click", () => {
    window.location.href = "agregar-contenido.html";
});

//  CERRAR SESIÓN
btnSalir.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

//  INICIAR
cargarContenido();
