const express = require('express');
const app = express();
const facultyRouter = require('./faculty-endpoint-fix');

app.use(express.json());
app.use('/api', facultyRouter);

const PORT = 5002;

app.listen(PORT, () => {
    console.log(`Test faculty server running on port ${PORT}`);
    console.log(`Test URL: http://localhost:${PORT}/api/faculty/teaching?year=3&section=13&branch=CSE`);
});
