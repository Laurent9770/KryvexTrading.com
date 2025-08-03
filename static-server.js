const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Static server running on port ${port}`);
  console.log(`Serving files from: ${path.join(__dirname, 'frontend/dist')}`);
}); 