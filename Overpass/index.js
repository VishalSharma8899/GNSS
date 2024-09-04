const express = require('express');
const app = express();
const locationRoutes = require('./Location');

app.use(express.json()); // To parse JSON bodies

// Use the router
app.use('/', locationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
