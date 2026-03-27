import React, { useState } from "react";
import axios from "axios";

function App() {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    image: "",
    description: ""
  });

  const handleSubmit = async () => {
    await axios.post("http://localhost:5000/api/products", product);
    alert("Product Added!");
  };

  return (
    <div>
      <h1>Admin Panel</h1>

      <input placeholder="Name"
        onChange={e => setProduct({...product, name: e.target.value})} />

      <input placeholder="Price"
        onChange={e => setProduct({...product, price: e.target.value})} />

      <input placeholder="Image URL"
        onChange={e => setProduct({...product, image: e.target.value})} />

      <button onClick={handleSubmit}>Add Product</button>
    </div>
  );
}

export default App;