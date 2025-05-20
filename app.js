const express = require('express');

const app = express();
const port = process.env.PORT || 3030;


app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.use((req, res) => {
    res.status(404).send('Page not found - 404');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});