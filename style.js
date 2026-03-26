body {
  margin: 0;
  font-family: Arial;
  background: #f3f3f3;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  background: #131921;
  color: white;
  padding: 15px;
}

.navbar input {
  width: 40%;
  padding: 8px;
}

/* Categories */
.categories {
  background: #232f3e;
  padding: 10px;
  text-align: center;
}

.categories button {
  margin: 5px;
  padding: 8px 15px;
  border: none;
  cursor: pointer;
}

/* Products */
.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  padding: 20px;
  gap: 20px;
}

/* Card */
.card {
  background: white;
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  transition: 0.3s;
}

.card:hover {
  transform: scale(1.05);
}

.card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.card button {
  background: orange;
  border: none;
  padding: 10px;
  cursor: pointer;
}