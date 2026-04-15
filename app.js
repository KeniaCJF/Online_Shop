const API = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://cooking-game-backend-hyq6.onrender.com";

let productos = [];
let carrito = [];

// --- 📢 GESTIÓN DE MENSAJES AL CARGAR ---
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');

  if (status === 'success') {
    alert("✅ ¡Pago realizado con éxito! Tu pedido está en camino.");
    // Limpiamos la URL para que el mensaje no salga otra vez si recargan
    window.history.replaceState({}, document.title, window.location.pathname);
    carrito = []; // Limpia el carrito localmente
    renderCarrito();
  }

  if (status === 'cancel') {
    alert("❌ El pago fue cancelado. ¿Olvidaste algo en el carrito?");
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// --- LÓGICA DE PRODUCTOS ---
fetch(`${API}/productos`)
  .then(res => res.json())
  .then(data => {
    productos = data;
    mostrar(productos);
  })
  .catch(err => console.error("Error cargando productos:", err));

function mostrar(lista) {
  const cont = document.getElementById("productos");
  if (!cont) return;
  cont.innerHTML = "";

  lista.forEach(p => {
    cont.innerHTML += `
      <div class="producto">
        <img src="${p.img}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>$${p.precio}</p>
        <button onclick='agregar(${JSON.stringify(p)})'>Agregar</button>
      </div>
    `;
  });
}

function filtrar(cat) {
  if (cat === 'todos' || !cat) {
    mostrar(productos);
  } else {
    mostrar(productos.filter(p => p.categoria === cat));
  }
}

// --- CARRITO ---
function agregar(prod) {
  const existe = carrito.find(p => p._id === prod._id);
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...prod, cantidad: 1 });
  }
  renderCarrito();
}

function renderCarrito() {
  const cont = document.getElementById("carritoLista");
  const totalEl = document.getElementById("total");
  if (!cont || !totalEl) return;

  cont.innerHTML = "";
  let total = 0;

  carrito.forEach(p => {
    total += p.precio * p.cantidad;
    cont.innerHTML += `
      <p>
        ${p.nombre} x${p.cantidad} - $${p.precio * p.cantidad}
        <button onclick="eliminar('${p._id}')">❌</button>
      </p>
    `;
  });

  totalEl.innerText = "Total: $" + total;
}

function eliminar(id) {
  carrito = carrito.filter(p => p._id !== id);
  renderCarrito();
}

function cancelar() {
  carrito = [];
  renderCarrito();
}

// --- 💳 PROCESAR PAGO ---
async function pagar() {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  // Verificar si Stripe está cargado en el HTML
  if (typeof Stripe === 'undefined') {
    alert("Error: Stripe no está cargado. Revisa tu conexión o el script en el HTML.");
    return;
  }

  try {
    const res = await fetch(`${API}/crear-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: carrito })
    });

    const data = await res.json();

    if (!data.id) {
      throw new Error(data.error || "No se pudo generar la sesión de pago.");
    }

    // USA SIEMPRE pk_test para pruebas. Cambia a pk_live solo cuando el sitio sea real.
    const stripe = Stripe("pk_live_51T6fAFHdpiRTkLl5sNs0EjjOAAhFBQSNxFmGLQvYIbwaS8LgzWSa6XSFy5taKGOuZjpt0qgbCu7Q7VoaDd2fidAp00JWiiGPaw");

    const result = await stripe.redirectToCheckout({
      sessionId: data.id
    });

    if (result.error) {
      alert("Error de Stripe: " + result.error.message);
    }

  } catch (error) {
    console.error("Error en proceso de pago:", error);
    alert("Hubo un problema al conectar con el servidor de pagos.");
  }
}