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