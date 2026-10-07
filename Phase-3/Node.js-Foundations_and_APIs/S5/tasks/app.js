const express = require('express')
const booksRouter = require('./routes/books');

const app = express();


app.use(express.json());

function customLogger(req, res, next){
   console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next()
}

app.use(customLogger);

app.use('/', booksRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: err.message
    });
});

app.listen(3000, () => console.log('Server on port 3000'));