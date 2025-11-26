import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdTokenResult, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js';

const firebaseConfig = {
    apiKey: "AIzaSyDwkWddfY-Dl71L8WK-RHnZozEOcfUDw-I",
    authDomain: "casajoyasf.firebaseapp.com",
    projectId: "casajoyasf",
    storageBucket: "casajoyasf.firebasestorage.app",
    messagingSenderId: "515728386769",
    appId: "1:515728386769:web:5c89d9a5ccec9aab79b3f0",
    measurementId: "G-R7B71Q0T29"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const COLL_JOYA = 'joya';
const COLL_ORDEN = 'orden';
const COLL_USERS = 'users';

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const logoutTopBtn = document.getElementById('logoutTopBtn');
const authMsg = document.getElementById('authMsg');
const joyasList = document.getElementById('joyasList');
const addBtn = document.getElementById('addBtn');
const adminEmailSpan = document.getElementById('adminEmail');
const searchInput = document.getElementById('searchInput');

const ordenesPanel = document.getElementById('ordenesPanel');
const productosPanel = document.getElementById('productosPanel');
const usuariosPanel = document.getElementById('usuariosPanel');
const ordenesList = document.getElementById('ordenesList');
const usersList = document.getElementById('usersList');
const adminsList = document.getElementById('adminsList');
const newAdminBtn = document.getElementById('newAdminBtn');
const navItems = document.querySelectorAll('.nav-item');

const orderSearchInput = document.getElementById('orderSearchInput');
const modalEdit = document.getElementById("modalEditBackdrop");
const editId = document.getElementById("editId");
const editNombre = document.getElementById("editNombre");
const editPrecio = document.getElementById("editPrecio");
const editMaterial = document.getElementById("editMaterial");
const editTipo = document.getElementById("editTipo");
const editStock = document.getElementById("editStock");
const editImageUrl = document.getElementById("editImageUrl");
const editDescripcion = document.getElementById("editDescripcion");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const modalDetail = document.getElementById('modalDetailBackdrop');
const detailCloseBtn = document.getElementById('detailCloseBtn');
const detailClientName = document.getElementById('detailClientName');
const detailClientPhone = document.getElementById('detailClientPhone');
const detailOrderDate = document.getElementById('detailOrderDate');
const detailOrderTotal = document.getElementById('detailOrderTotal');
const detailItemsList = document.getElementById('detailItemsList');
const detailStatusSelect = document.getElementById('detailStatusSelect');
const detailSaveBtn = document.getElementById('detailSaveBtn');

const adminNombreInput = document.getElementById('adminNombre');
const adminEmailInput = document.getElementById('adminEmailInput');
const adminPasswordInput = document.getElementById('adminPassword');
const adminNumeroInput = document.getElementById('adminNumero');
const addAdminSaveBtn = document.getElementById('addAdminSaveBtn');

let currentEditData = null;
let isCreatingUser = false;
let currentOrderData = null;

function showMsg(msg, isError = false) {
    if (authMsg) {
        authMsg.innerText = msg;
        authMsg.style.color = isError ? 'crimson' : 'green';
        if (!isError) setTimeout(() => authMsg.innerText = '', 3500);
    }
}

const PLACEHOLDER_SVG =
    `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
    <rect width='100%' height='100%' fill='%23071227'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
    fill='%2394a3b8' font-family='Arial' font-size='28'>No image</text></svg>`;

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value;
        if (!email || !password) return showMsg('Completa email y contraseña', true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMsg('Iniciando sesión...');
        } catch (err) {
            console.error(err);
            showMsg('Error al iniciar sesión', true);
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth).catch(console.error);
        window.__ui?.hideMainPanel();
    });
}

if (logoutTopBtn) {
    logoutTopBtn.addEventListener('click', () => logoutBtn?.click());
}

onAuthStateChanged(auth, async (user) => {
    if (typeof isCreatingUser !== 'undefined' && isCreatingUser) {
        return;
    }
    
    if (!user) return window.__ui?.hideMainPanel();

    try {
        await user.getIdToken(true);
        const claims = await getIdTokenResult(user);

        if (!claims.claims?.admin) {
            showMsg("No tienes permisos", true);
            return signOut(auth);
        }

        window.__ui?.showMainPanel(user.email);
        adminEmailSpan.innerText = user.email;
        
        loadJoyas();
        loadUsers();
        loadOrders(orderSearchInput?.value || "");
        
        changeSection('productos');

    } catch (err) {
        console.error("Error verificando permisos:", err);
        showMsg("Error verificando permisos", true);
    }
});

async function loadJoyas(filter = "") {
    joyasList.innerHTML = "Cargando...";

    try {
        const snap = await getDocs(collection(db, COLL_JOYA));
        joyasList.innerHTML = "";

        const docs = [];
        snap.forEach(s => docs.push({ id: s.id, ...s.data() }));

        const filtered = docs.filter(d =>
            !filter || (d.nombre || "").toLowerCase().includes(filter.toLowerCase())
        );

        if (!filtered.length) {
            joyasList.innerHTML = "<div style='color:var(--muted);padding:12px'>No hay productos</div>";
            return;
        }

        for (const d of filtered) {
            const card = document.createElement("article");
            card.className = "product-card";

            const imgEl = document.createElement("img");
            imgEl.className = "product-thumb";
            imgEl.src = d.imageUrl || PLACEHOLDER_SVG;

            const body = document.createElement("div");
            body.className = "product-body";

            const title = document.createElement("h3");
            title.className = "title";
            title.textContent = d.nombre;

            const desc = document.createElement("div");
            desc.className = "desc";
            desc.textContent = d.descripcion;

            const tipoLine = document.createElement("div");
            tipoLine.className = "meta-line";
            tipoLine.innerHTML = `<strong>Tipo:</strong> ${escapeHtml(d.tipo || "")}`;

            const materialLine = document.createElement("div");
            materialLine.className = "meta-line";
            materialLine.innerHTML = `<strong>Material:</strong> ${escapeHtml(d.material || "")}`;

            const priceStock = document.createElement("div");
            priceStock.className = "price-stock";
            priceStock.innerHTML = `
                <strong>Precio:</strong> S/${d.precio ?? 0} &nbsp;|&nbsp;
                <strong>Stock:</strong> ${d.stock ?? 0}
            `;

            const actions = document.createElement("div");
            actions.className = "product-actions";

            const editBtn = document.createElement("button");
            editBtn.className = "action-btn";
            editBtn.textContent = "Editar";
            editBtn.onclick = () => openEditModal(d);

            const delBtn = document.createElement("button");
            delBtn.className = "action-btn";
            delBtn.textContent = "Eliminar";
            delBtn.onclick = () => deleteProduct(d.id);

            actions.append(editBtn, delBtn);

            body.append(title, desc, tipoLine, materialLine, priceStock, actions);

            card.append(imgEl, body);
            joyasList.appendChild(card);
        }

    } catch (err) {
        console.error(err);
        joyasList.innerHTML = "Error cargando joyas";
    }
}

async function loadUsers() {
    usersList.innerHTML = "Cargando clientes...";
    adminsList.innerHTML = "Cargando administradores...";

    try {
        const snap = await getDocs(collection(db, 'users'));
        const allUsers = snap.docs.map(s => ({
            id: s.id,
            ...s.data()
        }));

        const admins = allUsers.filter(u => u.admin === true || u.rol === 'admin');
        const clients = allUsers.filter(u => u.admin !== true && u.rol !== 'admin');

        renderUsers(clients, usersList);
        renderUsers(admins, adminsList);

    } catch (err) {
        console.error("Error al cargar usuarios:", err);
        usersList.innerHTML = "<div style='color:crimson;padding:12px'>Error al cargar la lista de clientes.</div>";
        adminsList.innerHTML = "<div style='color:crimson;padding:12px'>Error al cargar la lista de administradores.</div>";
    }
}

async function addNewUser(e) {
    e.preventDefault();
    const nombre = adminNombreInput.value.trim();
    const email = adminEmailInput.value.trim();
    const password = adminPasswordInput.value.trim();
    const numero = adminNumeroInput.value.trim();

    if (!nombre || !email || !password) {
        showMsg('Rellena nombre, email y contraseña.', true);
        return;
    }
    if (password.length < 6) {
        showMsg('La contraseña debe tener al menos 6 caracteres.', true);
        return;
    }
    if (typeof isCreatingUser !== 'undefined') {
        isCreatingUser = true;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const userDocRef = doc(db, COLL_USERS, uid);
        await setDoc(userDocRef, {
            nombre: nombre,
            email: email,
            numero: numero,
            rol: 'cliente',
            admin: false,
            createdAt: serverTimestamp(),
        });
        await signOut(auth);
        if (typeof isCreatingUser !== 'undefined') {
            isCreatingUser = false;
        }
        showMsg(`Nuevo usuario "${email}" creado exitosamente.`);

        adminNombreInput.value = '';
        adminEmailInput.value = '';
        adminPasswordInput.value = '';
        adminNumeroInput.value = '';

        window.__ui.closeAdminModal();

    } catch (err) {
        if (typeof isCreatingUser !== 'undefined') {
            isCreatingUser = false;
        }

        console.error("Error al crear usuario:", err);
        let errorMsg = "Error al crear la cuenta. Intenta con otro email.";
        if (err.code === 'auth/email-already-in-use') {
            errorMsg = "El email ya está registrado.";
        } else if (err.code === 'auth/weak-password') {
            errorMsg = "La contraseña es muy débil (mínimo 6 caracteres).";
        } else if (err.code === 'permission-denied' || err.message.includes('permission')) {
             errorMsg = "¡Error de permisos! Revisa las Reglas de Seguridad de Firestore para la colección 'users'.";
        } else {
             errorMsg = "Error desconocido al crear usuario.";
        }
        
        showMsg(errorMsg, true);
        window.__ui.closeAdminModal();
    }
}

if (addAdminSaveBtn) {
    addAdminSaveBtn.onclick = addNewUser;
}

window.promptPromotion = (uid, name) => {
    alert(
        `PASO MANUAL REQUERIDO: Promover a ${name} a Administrador.\n\n` +
        `1. Ve a la consola de Firebase > Authentication.\n` +
        `2. Asigna manualmente el "Custom Claim" admin: true al siguiente UID:\n` +
        `UID: ${uid}\n\n` +
        `¡Solo después de esto podrá iniciar sesión en el panel!`
    );
}

function renderUsers(users, container) {
    if (users.length === 0) {
        container.innerHTML = "<p>No hay usuarios en esta categoría.</p>";
        return;
    }

    const isClientList = container.id === 'usersList';

    let html = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>UID</th>
                    ${isClientList ? '<th>Acción</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(user => {
        const name = escapeHtml(user.nombre || 'N/A');
        const email = escapeHtml(user.email || 'N/A');
        const phone = escapeHtml(user.numero || 'N/A');
        
        const isAdmin = user.admin === true || user.rol === 'admin';
        const roleHtml = isAdmin ? `<span class="user-role">ADMIN</span>` : 'Cliente';

        const uid = escapeHtml(user.id);

        const actionHtml = isClientList 
            ? `<td><button class="btn small primary promote-btn" onclick="promptPromotion('${uid}', '${name}')">Promover a Admin</button></td>`
            : '';

        html += `
            <tr>
                <td>${name}</td>
                <td>${email}</td>
                <td>${phone}</td>
                <td>${roleHtml}</td>
                <td><span class="user-id-short">${uid.substring(0, 10)}...</span></td>
                ${actionHtml}
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

function openEditModal(data) {
    currentEditData = data;
    window.__ui.openEditModal(data);
}

if (cancelEditBtn) {
    cancelEditBtn.onclick = () => window.__ui.closeEditModal();
}

if (modalEdit) {
    modalEdit.onclick = e => {
        if (e.target === modalEdit) window.__ui.closeEditModal();
    };
}

if (saveEditBtn) {
    saveEditBtn.onclick = async () => {
        if (!currentEditData) return;

        const id = editId.value;
        const updated = {
            nombre: editNombre.value.trim() || currentEditData.nombre,
            precio: Number(editPrecio.value || currentEditData.precio),
            material: editMaterial.value.trim() || currentEditData.material,
            tipo: editTipo.value.trim() || currentEditData.tipo,
            stock: Number(editStock.value || currentEditData.stock),
            imageUrl: editImageUrl.value.trim() || currentEditData.imageUrl,
            descripcion: editDescripcion.value.trim() || currentEditData.descripcion
        };

        try {
            await updateDoc(doc(db, COLL_JOYA, id), updated);
            showMsg("Producto actualizado");
            window.__ui.closeEditModal();
            loadJoyas(searchInput?.value || "");
        } catch (err) {
            console.error(err);
            showMsg("Error actualizando", true);
        }
    };
}

async function deleteProduct(id) {
    if (!confirm("¿Eliminar este producto?")) return;

    try {
        await deleteDoc(doc(db, COLL_JOYA, id));
        showMsg("Joya eliminada");
        loadJoyas(searchInput?.value || "");
    } catch (err) {
        console.error(err);
        showMsg("No se pudo eliminar", true);
    }
}

if (searchInput) {
    searchInput.addEventListener("input", e => loadJoyas(e.target.value));
}

if (addBtn) {
    addBtn.addEventListener("click", async () => {
        const nombre = document.getElementById("nombre").value.trim();
        const precio = Number(document.getElementById("precio").value || 0);
        const material = document.getElementById("material").value.trim();
        const tipo = document.getElementById("tipo").value.trim() || "";
        const stock = Number(document.getElementById("stock").value || 0);
        const imageUrl = document.getElementById("imageUrl").value.trim();
        const descripcion = document.getElementById("descripcion").value.trim();

        if (!nombre) return showMsg("Nombre requerido", true);

        try {
            await addDoc(collection(db, COLL_JOYA), {
                nombre, precio, material, tipo, stock, imageUrl, descripcion
            });

            showMsg("Producto añadido");
            window.__ui?.closeNewModal();

            ["nombre", "precio", "material", "tipo", "stock", "imageUrl", "descripcion"]
                .forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.value = "";
                });

            loadJoyas();
        } catch (err) {
            console.error(err);
            showMsg("Error guardando", true);
        }
    });
}

async function getClientName(userId) {
    if (!userId) return "Desconocido";

    try {
        const userRef = doc(db, COLL_USERS, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return data.nombre || `Usuario (ID: ${userId.substring(0, 5)}...)`;
        } else {
            return `Cliente ID ${userId.substring(0, 5)}... (No encontrado)`;
        }
    } catch (err) {
        console.error(`Error obteniendo nombre para ${userId}:`, err);
        return `Error (ID ${userId.substring(0, 5)}...)`;
    }
}

async function getClientDetails(userId) {
    try {
        const userRef = doc(db, COLL_USERS, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return data.numero || 'N/A';
        } else {
            return 'N/A';
        }
    } catch (err) {
        console.error(`Error obteniendo detalles del cliente ${userId}:`, err);
        return 'Error';
    }
}

function renderOrders(orders) {
    ordenesList.innerHTML = "";

    if (!orders.length) {
        ordenesList.innerHTML = "<div style='color:var(--muted);padding:12px'>No hay órdenes registradas</div>";
        return;
    }

    for (const orden of orders) {
        const card = document.createElement("article");
        
        const statusClass = (orden.estado || "pendiente").toLowerCase().replace(/\s/g, "");
        card.className = `order-card ${statusClass}`;
        
        card.onclick = () => handleOrderCardClick(orden);

        let dateStr = 'Fecha desconocida';
        if (orden.fecha && typeof orden.fecha.toDate === 'function') {
            const date = orden.fecha.toDate();
            dateStr = date.toLocaleDateString("es-ES", {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }

        card.innerHTML = `
            <h4>Pedido del ${dateStr}</h4>
            <div class="meta-line">Cliente: <strong>${orden.clientName || 'Cargando...'}</strong></div>
            <div class="meta-line">Total: <strong>S/${(orden.total || 0).toFixed(2)}</strong></div>
            <div class="status ${statusClass}">${orden.estado}</div>
        `;

        ordenesList.appendChild(card);
    }
}

async function loadOrders(filter = "") {
    ordenesList.innerHTML = "Cargando órdenes...";
    const normalizedFilter = filter.toLowerCase().trim();

    try {
        const snap = await getDocs(collection(db, COLL_ORDEN));
        
        const ordersPromises = snap.docs.map(async (s) => {
            const data = s.data();
            const clientName = await getClientName(data.userId);

            return { id: s.id, ...data, clientName };
        });

        const allOrders = await Promise.all(ordersPromises);

        const filteredOrders = allOrders.filter(orden => {
            if (!normalizedFilter) return true;
            
            const name = orden.clientName || '';
            return name.toLowerCase().includes(normalizedFilter);
        });
        
        filteredOrders.sort((a, b) => {
            const timeA = a.fecha && a.fecha.seconds ? a.fecha.seconds : 0;
            const timeB = b.fecha && b.fecha.seconds ? b.fecha.seconds : 0;
            return timeB - timeA;
        });

        renderOrders(filteredOrders);
    } catch (err) {
        console.error("Error al cargar órdenes:", err);
        ordenesList.innerHTML = "<div style='color:crimson;padding:12px'>Error al cargar las órdenes</div>";
    }
}

async function displayOrderDetails(orden) {
    if (!modalDetail) {
        console.error("El modal de detalles no está definido.");
        return;
    }
    
    currentOrderData = orden;
    modalDetail.style.display = 'flex';
    detailItemsList.innerHTML = 'Cargando productos...';
    
    detailClientName.textContent = orden.clientName || 'Desconocido';
    const clientPhone = await getClientDetails(orden.userId);
    detailClientPhone.textContent = clientPhone;

    let dateStr = 'Fecha desconocida';
    if (orden.fecha && typeof orden.fecha.toDate === 'function') {
        const date = orden.fecha.toDate();
        dateStr = date.toLocaleDateString("es-ES", {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    }
    
    detailOrderDate.textContent = dateStr;
    detailOrderTotal.textContent = `S/. ${(orden.total || 0).toFixed(2)}`;
    
    if (detailStatusSelect) detailStatusSelect.value = orden.estado || 'Pendiente';

    detailItemsList.innerHTML = '';
    const items = orden.items || [];
    
    if (items.length === 0) {
        detailItemsList.innerHTML = '<div style="padding: 10px; color: var(--muted);">No hay productos registrados en esta orden.</div>';
        return;
    }
    
    items.forEach(item => {
        const quantity = Number(item.cantidad) || 0;
        const price = Number(item.precioUnitario) || 0;
        const name = item.joyaNombre || 'Producto Desconocido';
        const itemTotal = (quantity * price).toFixed(2);
        const imgSource = item.joyaURL || PLACEHOLDER_SVG;

        const itemEl = document.createElement('div');
        itemEl.className = 'detail-item';
        itemEl.innerHTML = `
            <img src="${imgSource}" alt="${name}" class="item-thumb">
            <div class="item-info">
                <span class="item-name">${escapeHtml(name)}</span>
                <span class="item-math">${quantity} x S/. ${price.toFixed(2)}</span>
            </div>
            <span class="item-total">S/. ${itemTotal}</span>
        `;
        detailItemsList.appendChild(itemEl);
    });
}

function handleOrderCardClick(orden) {
    displayOrderDetails(orden);
}

async function updateOrderStatus() {
    if (!currentOrderData) {
        showMsg('Error: No hay orden seleccionada.', true);
        return;
    }

    const newStatus = detailStatusSelect.value;
    const orderId = currentOrderData.id;

    if (!newStatus || !orderId) {
        showMsg('Error: Faltan datos para actualizar.', true);
        return;
    }

    try {
        await updateDoc(doc(db, COLL_ORDEN, orderId), {
            estado: newStatus
        });
        
        showMsg(`Estado de la orden ${orderId.substring(0, 8)}... actualizado a: ${newStatus}`);
        loadOrders();
        modalDetail.style.display = 'none';

    } catch (err) {
        console.error("Error al actualizar el estado:", err);
        showMsg("Error al guardar el estado de la orden.", true);
    }
}

if (detailSaveBtn) {
    detailSaveBtn.onclick = updateOrderStatus;
}

if (detailCloseBtn) {
    detailCloseBtn.onclick = () => modalDetail.style.display = 'none';
}

if (modalDetail) {
    modalDetail.onclick = e => {
        if (e.target === modalDetail) {
            modalDetail.style.display = 'none';
        }
    };
}

function changeSection(sectionId) {
    productosPanel.classList.add('hidden');
    ordenesPanel.classList.add('hidden');
    usuariosPanel.classList.add('hidden');

    const targetPanel = document.getElementById(`${sectionId}Panel`);
    if (targetPanel) targetPanel.classList.remove('hidden');

    navItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeItem) activeItem.classList.add('active');
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        changeSection(section);
    });
});

if (orderSearchInput) {
    orderSearchInput.addEventListener("input", e => loadOrders(e.target.value));
}

function escapeHtml(t) {
    return String(t || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}