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
let beneficios = []; // ✅ NUEVO: Array para beneficios
let isAdmin = false;
let map;
let markersLayer;

// --- FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
function initializeApp() {
    loadData();
    setupEventListeners();
    checkAuthStatus();
    // Inicia en 'inicio' y asegura que si el mapa está activo, se renderice
    showPage(document.querySelector('.page.active')?.id.replace('page-', '') || 'inicio');
    renderEventos("home-events-container", 3);
}

// --- ESCUCHADOR QUE GARANTIZA LA EJECUCIÓN (CLAVE PARA BOTONES) ---
document.addEventListener("DOMContentLoaded", initializeApp);
window.onload = function() {
    // Asegura que el mapa se inicialice si el usuario va directamente a esa URL
    if (document.getElementById('page-mapa') && document.getElementById('page-mapa').classList.contains('active')) {
        initMap();
    }
}


// --- EVENT LISTENERS (VINCULA LOS BOTONES) ---
function setupEventListeners() {
    // 1. Navegación Principal
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            showPage(link.dataset.page);
        });
    });

    // 2. Botones de Acción
    const gotoMembersBtn = document.getElementById('goto-members-btn');
    if (gotoMembersBtn) gotoMembersBtn.addEventListener('click', () => showPage('miembros'));
    
    const openMemberModalHero = document.getElementById('open-member-modal-hero');
    if (openMemberModalHero) openMemberModalHero.addEventListener('click', () => openMemberModal());
    
    const openMemberModalMembers = document.getElementById('open-member-modal-members');
    if (openMemberModalMembers) openMemberModalMembers.addEventListener('click', () => openMemberModal());

    // 3. Admin / Login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', () => toggleModal('login-modal', true));
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    const openEventModalBtn = document.getElementById('open-event-modal-btn');
    if (openEventModalBtn) openEventModalBtn.addEventListener('click', openEventModal);
    
    // ✅ NUEVO: Botón para abrir modal de beneficio
    const openBenefitModalBtn = document.getElementById('open-benefit-modal-btn');
    if (openBenefitModalBtn) openBenefitModalBtn.addEventListener('click', openBenefitModal);


    // 4. Funcionalidad de datos
    const downloadCsvBtn = document.getElementById('download-members-csv-btn');
    if (downloadCsvBtn) downloadCsvBtn.addEventListener('click', downloadMembersCSV); 
    
    const searchMembers = document.getElementById('search-members');
    if (searchMembers) searchMembers.addEventListener('input', renderMiembros);
    
    const filterRubro = document.getElementById('filter-rubro');
    if (filterRubro) filterRubro.addEventListener('change', renderMiembros);
    
    const rubroSelect = document.getElementById('rubro');
    if (rubroSelect) rubroSelect.addEventListener('change', handleRubroChange);
    
    // 5. Modales y Formularios
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.modal').classList.remove('active'));
    });
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const memberForm = document.getElementById('member-form');
    if (memberForm) memberForm.addEventListener('submit', handleMemberForm);
    
    const eventForm = document.getElementById('event-form');
    if (eventForm) eventForm.addEventListener('submit', handleEventForm);
    
    // ✅ NUEVO: Formulario de Beneficio
    const benefitForm = document.getElementById('benefit-form');
    if (benefitForm) benefitForm.addEventListener('submit', handleBenefitForm);
}

// --- NAVEGACIÓN Y MODALES ---
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    const pageElement = document.getElementById(`page-${pageId}`);
    if (pageElement) pageElement.classList.add("active");
    
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
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'inline-block' : 'none');
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.style.display = isAdmin ? 'none' : 'block';
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = isAdmin ? 'block' : 'none';
    
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

// --- MIEMBROS (EL RESTO ES IGUAL) ---
function renderMiembros() {
    const container = document.getElementById("members-container");
    if (!container) return; 
    
    const searchTerm = document.getElementById('search-members')?.value.toLowerCase() || '';
    const filterValue = document.getElementById('filter-rubro')?.value;
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
    if (!form) return;
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
        document.getElementById("telefono").value = m.telefono || "";
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
    
    let coords = { lat: null, lng: null };
    try {
        coords = await geocodeAddress(address);
    } catch (e) {
        console.error("Error al obtener coordenadas:", e);
    }
    
    const miembro = {
        nombre: form.querySelector("#nombre").value.trim(),
        apellido: form.querySelector("#apellido").value.trim(),
        empresa: form.querySelector("#empresa").value.trim(),
        descripcion: form.querySelector("#descripcion").value.trim(),
        email: form.querySelector("#email").value.trim(),
        telefono: form.querySelector("#telefono").value.trim(),
        direccion: address,
        rubro: form.querySelector("#rubro").value,
        estudianteDetalle: form.querySelector("#estudiante-detalle").value.trim(),
        instagram: form.querySelector("#instagram").value.trim(),
        instagram_personal: form.querySelector("#instagram-personal").value.trim(),
        x_twitter: form.querySelector("#x-twitter").value.trim(),
        web: form.querySelector("#web").value.trim(),
        lat: coords.lat,
        lng: coords.lng
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
    if (!rubroSelect || !estudianteGroup) return;
    estudianteGroup.style.display = (rubroSelect.value === 'Estudiante') ? 'block' : 'none';
    if (rubroSelect.value !== 'Estudiante' && document.getElementById('estudiante-detalle')) {
        document.getElementById('estudiante-detalle').value = '';
    }
}
function downloadMembersCSV() {
    if (miembros.length === 0) {
        alert("No hay miembros para exportar.");
        return;
    }
    const headers = [
        "Nombre", "Apellido", "Empresa", "Rubro", "Estudiante_Detalle", "Email", "Telefono",
        "Descripcion", "Direccion", "Instagram_Empresa", "Instagram_Personal", "X_Twitter", "Web", "Latitud", "Longitud"
    ];

    let csvContent = headers.join(";") + "\n"; 

    miembros.forEach(m => {
        const row = [
            m.nombre, m.apellido, m.empresa, m.rubro, m.estudianteDetalle, m.email, m.telefono, 
            `"${(m.descripcion || "").replace(/"/g, '""')}"`, 
            `"${(m.direccion || "").replace(/"/g, '""')}"`, 
            m.instagram, m.instagram_personal, m.x_twitter, m.web, m.lat, m.lng
        ];
        csvContent += row.map(item => item !== null ? item : '').join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Miembros_Comunidad_LFP_${new Date().toISOString().slice(0, 10)}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// --- EVENTOS (EL RESTO ES IGUAL) ---
function renderEventos(containerId = "events-container", limit = 0) {
    const container = document.getElementById(containerId);
    if (!container) return; 
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
                <h3>${evento.title}</h3>
                <p class="date">Fecha: ${new Date(evento.date + 'T00:00:00').toLocaleDateString()}</p>
                <p>${evento.desc}</p>
                ${adminButton}
            </div>`;
    });
}
function openEventModal() { 
    const form = document.getElementById("event-form");
    if(form) form.reset();
    toggleModal('event-modal', true); 
}
function handleEventForm(event) {
    event.preventDefault();
    const titleInput = document.getElementById("event-title");
    const dateInput = document.getElementById("event-date");
    const descInput = document.getElementById("event-desc");
    
    if (!titleInput || !dateInput || !descInput) return;

    eventos.push({
        title: titleInput.value,
        date: dateInput.value,
        desc: descInput.value
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


// --- ✅ NUEVAS FUNCIONES DE BENEFICIOS ---

function renderBeneficios() {
    const container = document.getElementById("benefits-container");
    if (!container) return; 
    container.innerHTML = "";
    
    if (beneficios.length === 0) {
        container.innerHTML = `<div class="card"><p>Aún no hay beneficios exclusivos disponibles.</p></div>`;
        return;
    }
    
    beneficios.forEach((b, index) => {
        const adminButton = isAdmin ? `<div class="card-admin-actions"><button class="btn-danger" onclick="deleteBenefit(${index})">X</button></div>` : '';
        const codeDisplay = b.code ? `<p class="highlight-text">Código: <strong>${b.code}</strong></p>` : '';
        const linkButton = b.link ? `<a href="${b.link.startsWith('http') ? b.link : 'https://' + b.link}" target="_blank" class="btn-primary">Ver Oferta</a>` : '';
        
        container.innerHTML += `
            <div class="card benefit-card">
                ${adminButton}
                <h3>${b.title}</h3>
                <p>${b.desc}</p>
                ${codeDisplay}
                <div class="member-links" style="margin-top: 1rem;">${linkButton}</div>
            </div>`;
    });
}
function openBenefitModal() {
    const form = document.getElementById("benefit-form");
    if(form) form.reset();
    document.getElementById("benefit-modal-title").textContent = "Crear Nuevo Beneficio";
    toggleModal('benefit-modal', true); 
}
function handleBenefitForm(event) {
    event.preventDefault();
    const form = event.target;
    
    const beneficio = {
        title: form.querySelector("#benefit-title").value.trim(),
        desc: form.querySelector("#benefit-desc").value.trim(),
        code: form.querySelector("#benefit-code").value.trim(),
        link: form.querySelector("#benefit-link").value.trim()
    };
    
    beneficios.push(beneficio);
    saveAndRenderAll();
    toggleModal('benefit-modal', false);
}
function deleteBenefit(index) {
    if (confirm(`¿Seguro que quieres eliminar el beneficio "${beneficios[index].title}"?`)) {
        beneficios.splice(index, 1);
        saveAndRenderAll();
    }
}


// --- MAPA (EL RESTO ES IGUAL) ---
function createCustomIcon(color) {
    const markerHtml = `<div style="background-color: ${color}; width: 2rem; height: 2rem; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 1px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`;
    return L.divIcon({ html: markerHtml, className: "dummy", iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -24] });
}
function initMap() {
    if (!document.getElementById('map')) return; 
    if (!map) {
        map = L.map('map').setView([-38, -63], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
        markersLayer = L.layerGroup().addTo(map);
    }
    setTimeout(() => { 
        if(map) map.invalidateSize();
    }, 10);
    renderMapMarkers();
    renderMapLegend();
}
function renderMapLegend() {
    const legendContainer = document.getElementById('map-legend');
    if (!legendContainer) return;
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
    if (!address) return { lat: null, lng: null };
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        return data && data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : { lat: null, lng: null };
    } catch (error) { console.error("Error de geocodificación:", error); return { lat: null, lng: null }; }
}

// --- GUARDADO Y CARGA ---
function saveAndRenderAll() {
    localStorage.setItem("miembros", JSON.stringify(miembros));
    localStorage.setItem("eventos", JSON.stringify(eventos));
    localStorage.setItem("beneficios", JSON.stringify(beneficios)); // ✅ NUEVO: Guardar beneficios
    renderAll();
}
function loadData() {
    miembros = JSON.parse(localStorage.getItem("miembros")) || [];
    eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    beneficios = JSON.parse(localStorage.getItem("beneficios")) || []; // ✅ NUEVO: Cargar beneficios
}
function renderAll() {
    renderMiembros();
    renderEventos("events-container");
    renderEventos("home-events-container", 3);
    renderBeneficios(); // ✅ NUEVO: Renderizar beneficios
    if(map) renderMapMarkers(); 
}
