const API = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://cooking-game-backend-hyq6.onrender.com";

let productos = [];
let carrito = [];

fetch(`${API}/productos`)
.then(res=>res.json())
.then(data=>{
  productos = data;
  mostrar(productos);
});

function mostrar(lista){
  const cont = document.getElementById("productos");
  cont.innerHTML = "";

  lista.forEach(p=>{
    cont.innerHTML += `
      <div class="producto">
        <img src="${p.img}">
        <h3>${p.nombre}</h3>
        <p>$${p.precio}</p>
        <button onclick='agregar(${JSON.stringify(p)})'>Agregar</button>
      </div>
    `;
  });
}

function filtrar(cat){
  mostrar(productos.filter(p=>p.categoria===cat));
}

// 🧠 carrito inteligente
function agregar(prod){
  const existe = carrito.find(p=>p._id === prod._id);

  if(existe){
    existe.cantidad++;
  } else {
    carrito.push({...prod, cantidad:1});
  }

  renderCarrito();
}

function renderCarrito(){
  const cont = document.getElementById("carritoLista");
  const totalEl = document.getElementById("total");

  cont.innerHTML = "";
  let total = 0;

  carrito.forEach(p=>{
    total += p.precio * p.cantidad;

    cont.innerHTML += `
      <p>
        ${p.nombre} x${p.cantidad}
        <button onclick="eliminar('${p._id}')">❌</button>
      </p>
    `;
  });

  totalEl.innerText = "Total: $" + total;
}

function eliminar(id){
  carrito = carrito.filter(p=>p._id !== id);
  renderCarrito();
}

function cancelar(){
  carrito = [];
  renderCarrito();
}

async function pagar(){
  const res = await fetch(`${API}/crear-pago`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({items:carrito})
  });

  const data = await res.json();

  window.location = `https://checkout.stripe.com/pay/${data.id}`;
}