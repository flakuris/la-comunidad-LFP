// --- CONFIGURACIÓN GLOBAL ---
const ADMIN_PASSWORD = "LFP2025";
const rubroColors = {
    'Industria / Producción': '#B0BEC5', 'Comercio / Ventas': '#66BB6A', 'Servicios / Oficios': '#7E57C2',
    'Construcción': '#FFEE58', 'Transporte / Logística': '#8D6E63', 'Gastronomía': '#FF7043',
    'Educación / Cultura': '#26A69A', 'Salud / Bienestar': '#EC407A', 'Tecnología / Comunicación': '#42A5F5',
    'Agro / Medioambiente': '#9CCC65', 'Administración / Finanzas': '#26C6DA', 'Estudiante': '#AB47BC',
    'Otro': '#BDBDBD'
};

// --- ESTADO DE LA APLICACIÓN ---
let miembros = [];
let eventos = [];
let isAdmin = false;
let map;
let markersLayer;

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupEventListeners();
    checkAuthStatus();
    showPage('inicio');
});

// --- EVENT LISTENERS ---
function setupEventListeners() {
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => showPage(link.dataset.page));
    });
    document.getElementById('goto-members-btn').addEventListener('click', () => showPage('miembros'));
    document.getElementById('open-member-modal-hero').addEventListener('click', () => openMemberModal());
    document.getElementById('open-member-modal-members').addEventListener('click', () => openMemberModal());
    document.getElementById('login-btn').addEventListener('click', () => toggleModal('login-modal', true));
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('open-event-modal-btn').addEventListener('click', openEventModal);
    // NUEVO: Listener para el botón de descarga
    document.getElementById('download-members-csv-btn').addEventListener('click', downloadMembersCSV); 
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.modal').classList.remove('active'));
    });
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('member-form').addEventListener('submit', handleMemberForm);
    document.getElementById('event-form').addEventListener('submit', handleEventForm);
    document.getElementById('search-members').addEventListener('input', renderMiembros);
    document.getElementById('filter-rubro').addEventListener('change', renderMiembros);
    document.getElementById('rubro').addEventListener('change', handleRubroChange);
}

// --- NAVEGACIÓN Y MODALES ---
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    document.getElementById(`page-${pageId}`).classList.add("active");
    document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
    if (pageId === "mapa") initMap();
}
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.toggle("active", show);
}

// --- ADMINISTRACIÓN ---
function checkAuthStatus() {
    isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    // Muestra/oculta elementos de administrador
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'inline-block' : 'none');
    document.getElementById('login-btn').style.display = isAdmin ? 'none' : 'block';
    document.getElementById('logout-btn').style.display = isAdmin ? 'block' : 'none';
    renderAll();
}
function handleLogin(event) {
    event.preventDefault();
    if (document.getElementById('login-password').value === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdmin', 'true');
        toggleModal('login-modal', false);
        checkAuthStatus();
    } else {
        alert("Clave incorrecta.");
    }
}
function logout() {
    sessionStorage.removeItem('isAdmin');
    checkAuthStatus();
}

// --- MIEMBROS ---
function renderMiembros() {
    const container = document.getElementById("members-container");
    const searchTerm = document.getElementById('search-members').value.toLowerCase();
    const filterValue = document.getElementById('filter-rubro').value;
    let filteredMiembros = miembros;

    if (searchTerm) {
        filteredMiembros = filteredMiembros.filter(m =>
            `${m.nombre} ${m.apellido}`.toLowerCase().includes(searchTerm) ||
            m.empresa.toLowerCase().includes(searchTerm)
        );
    }
    if (filterValue) {
        filteredMiembros = filteredMiembros.filter(m => m.rubro === filterValue);
    }

    container.innerHTML = "";
    if (filteredMiembros.length === 0) {
        container.innerHTML = `<p class="card">No se encontraron miembros con esos criterios.</p>`;
        return;
    }

    filteredMiembros.forEach(m => {
        const originalIndex = miembros.indexOf(m);
        const adminButtons = isAdmin ? `<div class="card-admin-actions">
            <button class="btn-outline" onclick="openMemberModal(${originalIndex})">Editar</button>
            <button class="btn-danger" onclick="deleteMember(${originalIndex})">X</button>
        </div>` : '';
        
        container.innerHTML += `
            <div class="card member-card">
                ${adminButtons}
                <h3>${m.nombre} ${m.apellido}</h3>
                <p class="empresa">${m.empresa}</p>
                ${m.descripcion ? `<p class="descripcion">${m.descripcion}</p>` : ''}
                <p>Email: <a href="mailto:${m.email}">${m.email}</a></p>
                ${m.telefono ? `<p>Teléfono: <a href="tel:${m.telefono}">${m.telefono}</a></p>` : ''}
                <div class="member-links">
                    ${m.instagram ? `<a href="https://instagram.com/${m.instagram}" target="_blank" class="btn-primary btn-social">IG Empresa</a>` : ''}
                    ${m.instagram_personal ? `<a href="https://instagram.com/${m.instagram_personal}" target="_blank" class="btn-primary btn-social">IG Personal</a>` : ''}
                    ${m.x_twitter ? `<a href="https://x.com/${m.x_twitter}" target="_blank" class="btn-primary btn-social">X</a>` : ''}
                    ${m.web ? `<a href="${m.web.startsWith('http') ? m.web : 'https://' + m.web}" target="_blank" class="btn-secondary btn-social">Web</a>` : ''}
                </div>
            </div>`;
    });
}
function openMemberModal(index = null) {
    const form = document.getElementById("member-form");
    form.reset();
    handleRubroChange();
    if (index !== null && miembros[index]) {
        const m = miembros[index];
        document.getElementById("member-modal-title").textContent = "Editar Miembro";
        document.getElementById("member-edit-index").value = index;
        document.getElementById("nombre").value = m.nombre;
        document.getElementById("apellido").value = m.apellido;
        document.getElementById("empresa").value = m.empresa;
        document.getElementById("descripcion").value = m.descripcion;
        document.getElementById("email").value = m.email;
        document.getElementById("telefono").value = m.telefono || ""; // Cargar nuevo campo
        document.getElementById("direccion").value = m.direccion;
        document.getElementById("rubro").value = m.rubro;
        document.getElementById("instagram").value = m.instagram;
        document.getElementById("instagram-personal").value = m.instagram_personal;
        document.getElementById("x-twitter").value = m.x_twitter;
        document.getElementById("web").value = m.web;
        document.getElementById("estudiante-detalle").value = m.estudianteDetalle || "";
        handleRubroChange();
    } else {
        document.getElementById("member-modal-title").textContent = "Agregar Nuevo Miembro";
        document.getElementById("member-edit-index").value = "";
    }
    toggleModal('member-modal', true);
}
async function handleMemberForm(event) {
    event.preventDefault();
    const form = event.target;
    const address = form.querySelector("#direccion").value.trim();
    const coords = await geocodeAddress(address);
    if (!coords && address) alert("No se pudo encontrar la dirección. Se guardará sin ubicación en el mapa.");

    const miembro = {
        nombre: form.querySelector("#nombre").value.trim(),
        apellido: form.querySelector("#apellido").value.trim(),
        empresa: form.querySelector("#empresa").value.trim(),
        descripcion: form.querySelector("#descripcion").value.trim(),
        email: form.querySelector("#email").value.trim(),
        telefono: form.querySelector("#telefono").value.trim(), // Guardar nuevo campo
        direccion: address,
        rubro: form.querySelector("#rubro").value,
        estudianteDetalle: form.querySelector("#estudiante-detalle").value.trim(),
        instagram: form.querySelector("#instagram").value.trim(),
        instagram_personal: form.querySelector("#instagram-personal").value.trim(),
        x_twitter: form.querySelector("#x-twitter").value.trim(),
        web: form.querySelector("#web").value.trim(),
        lat: coords ? coords.lat : null,
        lng: coords ? coords.lng : null
    };

    const editIndex = form.querySelector("#member-edit-index").value;
    if (editIndex !== "") miembros[editIndex] = miembro;
    else miembros.push(miembro);
    
    saveAndRenderAll();
    toggleModal('member-modal', false);
}
function deleteMember(index) {
    if (confirm(`¿Seguro que quieres eliminar a ${miembros[index].nombre} ${miembros[index].apellido}?`)) {
        miembros.splice(index, 1);
        saveAndRenderAll();
    }
}
function handleRubroChange() {
    const rubroSelect = document.getElementById('rubro');
    const estudianteGroup = document.getElementById('estudiante-group');
    // Mostrar campo de detalle solo si el rubro es "Estudiante"
    estudianteGroup.style.display = (rubroSelect.value === 'Estudiante') ? 'block' : 'none';
    if (rubroSelect.value !== 'Estudiante') document.getElementById('estudiante-detalle').value = '';
}

// --- EXPORTAR CSV (NUEVA FUNCIÓN) ---
function downloadMembersCSV() {
    if (miembros.length === 0) {
        alert("No hay miembros para exportar.");
        return;
    }

    const headers = [
        "Nombre", "Apellido", "Empresa", "Rubro", "Estudiante_Detalle", "Email", "Telefono",
        "Descripcion", "Direccion", "Instagram_Empresa", "Instagram_Personal", "X_Twitter", "Web", "Latitud", "Longitud"
    ];

    let csvContent = headers.join(";") + "\n"; // Usamos punto y coma (;) como separador para compatibilidad con Excel

    miembros.forEach(m => {
        const row = [
            m.nombre, m.apellido, m.empresa, m.rubro, m.estudianteDetalle, m.email, m.telefono, // Incluir Teléfono
            `"${(m.descripcion || "").replace(/"/g, '""')}"`, // Escapar comillas en la descripción
            `"${(m.direccion || "").replace(/"/g, '""')}"`, 
            m.instagram, m.instagram_personal, m.x_twitter, m.web, m.lat, m.lng
        ];
        csvContent += row.map(item => item !== null ? item : '').join(";") + "\n";
    });

    // Crear el enlace de descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Miembros_Comunidad_LFP_${new Date().toISOString().slice(0, 10)}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// --- EVENTOS ---
function renderEventos(containerId = "events-container", limit = 0) {
    const container = document.getElementById(containerId);
    // ... (El resto del código de renderEventos es el mismo)
    container.innerHTML = "";
    
    let eventsToShow = [...eventos].reverse();
    if (limit > 0) eventsToShow = eventsToShow.slice(0, limit);

    if (eventsToShow.length === 0) {
        container.innerHTML = `<div class="card"><p>No hay eventos programados.</p></div>`;
        return;
    }
    eventsToShow.forEach(evento => {
        const originalIndex = eventos.indexOf(evento);
        const adminButton = isAdmin && containerId === "events-container" ? `<div class="card-admin-actions"><button class="btn-danger" onclick="deleteEvent(${originalIndex})">X</button></div>` : '';
        container.innerHTML += `
            <div class="card event-card">
                ${adminButton}
                <h3>${evento.title}</h3>
                <p class="date">Fecha: ${new Date(evento.date + 'T00:00:00').toLocaleDateString()}</p>
                <p>${evento.desc}</p>
            </div>`;
    });
}
function openEventModal() { document.getElementById("event-form").reset(); toggleModal('event-modal', true); }
function handleEventForm(event) {
    event.preventDefault();
    eventos.push({
        title: document.getElementById("event-title").value,
        date: document.getElementById("event-date").value,
        desc: document.getElementById("event-desc").value
    });
    saveAndRenderAll();
    toggleModal('event-modal', false);
}
function deleteEvent(index) {
    if (confirm(`¿Seguro que quieres eliminar el evento "${eventos[index].title}"?`)) {
        eventos.splice(index, 1);
        saveAndRenderAll();
    }
}

// --- MAPA ---
function createCustomIcon(color) {
    const markerHtml = `<div style="background-color: ${color}; width: 2rem; height: 2rem; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 1px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`;
    return L.divIcon({ html: markerHtml, className: "dummy", iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -24] });
}
function initMap() {
    if (!map) {
        map = L.map('map').setView([-38, -63], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
        markersLayer = L.layerGroup().addTo(map);
    }
    renderMapMarkers();
    renderMapLegend();
}
function renderMapLegend() {
    const legendContainer = document.getElementById('map-legend');
    legendContainer.innerHTML = '<h3>Leyenda de Rubros</h3><ul>';
    for (const rubro in rubroColors) {
        legendContainer.innerHTML += `
            <li>
                <span class="legend-color" style="background-color: ${rubroColors[rubro]}"></span>
                ${rubro}
            </li>
        `;
    }
    legendContainer.innerHTML += '</ul>';
}
function renderMapMarkers() {
    if (!markersLayer) return;
    markersLayer.clearLayers();
    miembros.filter(m => m.lat && m.lng).forEach(miembro => {
        const color = rubroColors[miembro.rubro] || rubroColors['Otro'];
        L.marker([miembro.lat, miembro.lng], { icon: createCustomIcon(color) })
         .bindPopup(`<b>${miembro.nombre} ${miembro.apellido}</b><br>${miembro.empresa}`)
         .addTo(markersLayer);
    });
}
async function geocodeAddress(address) {
    if (!address) return null;
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        return data && data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
    } catch (error) { console.error("Error de geocodificación:", error); return null; }
}

// --- GUARDADO Y CARGA ---
function saveAndRenderAll() {
    localStorage.setItem("miembros", JSON.stringify(miembros));
    localStorage.setItem("eventos", JSON.stringify(eventos));
    renderAll();
}
function loadData() {
    miembros = JSON.parse(localStorage.getItem("miembros")) || [];
    eventos = JSON.parse(localStorage.getItem("eventos")) || [];
}
function renderAll() {
    renderMiembros();
    renderEventos("events-container");
    renderEventos("home-events-container", 3);
    renderMapMarkers();
}
