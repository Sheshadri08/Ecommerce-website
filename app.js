fetch("http://localhost:5000/api/products")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("products");

    data.forEach(product => {
      container.innerHTML += `
        <div class="card">
          <img src="${product.image}" />
          <h3>${product.name}</h3>
          <p>₹${product.price}</p>
          <button onclick="addToCart('${product.name}')">Add to Cart</button>
        </div>
      `;
    });
  });

function addToCart(name) {
  alert(name + " added to cart 🛒");
}
