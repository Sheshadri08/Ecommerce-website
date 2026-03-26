import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/products")
      .then(res => setProducts(res.data));
  }, []);

  return (
    <div>
      <h1>🛒 E-Commerce Store</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        {products.map(p => (
          <div key={p._id}>
            <img src={p.image} width="150" />
            <h3>{p.name}</h3>
            <p>₹{p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
let allProducts = [];

fetch("http://localhost:5000/api/products")
  .then(res => res.json())
  .then(data => {
    allProducts = data;
    displayProducts(data);
  });

function displayProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  products.forEach(product => {
    container.innerHTML += `
      <div class="card">
        <img src="${product.image}" />
        <h3>${product.name}</h3>
        <p>₹${product.price}</p>
        <button onclick="addToCart('${product.name}')">Add to Cart</button>
      </div>
    `;
  });
}

// SEARCH FUNCTION 🔍
document.getElementById("search").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(value)
  );
  displayProducts(filtered);
});

function addToCart(name) {
  alert(name + " added to cart 🛒");
}