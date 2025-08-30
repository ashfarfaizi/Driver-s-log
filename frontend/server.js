const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Use Railway's port or fallback to 3000 locally
const PORT = process.env.PORT || 3000;

// Enable CORS (fixes "Invalid Host")
app.use(cors());
app.set("trust proxy", 1);

// Serve static files from React build folder
app.use(express.static(path.join(__dirname, "build")));

// Serve React index.html for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
