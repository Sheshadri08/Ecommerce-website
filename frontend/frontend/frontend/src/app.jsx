import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setProducts(res.data.products || []))
      .catch(() => setError("Unable to load products"));
  }, []);

  return (
    <div>
      <h1>NovaCart</h1>
      {error && <p>{error}</p>}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {products.map((product) => (
          <div key={product.id}>
            <img src={product.image} width="150" alt={product.name} />
            <h3>{product.name}</h3>
            <p>INR {product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
