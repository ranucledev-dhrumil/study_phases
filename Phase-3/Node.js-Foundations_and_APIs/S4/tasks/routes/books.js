const router = require('express').Router();

let books = [
    { id: 1, title: "1984", author: "Orwell" },
    { id: 2, title: "Dune", author: "Herbert" }
];

function requireApiKey(req, res, next) {
    if (req.headers['x-api-key'] !== 'secret123') {
        return res.status(401).json({ error: 'missing api key' });
    }
    next();
}

// GET /books → list all
router.get('/books', (req, res) => {
    res.json(books)
})

// GET /books/:id → get one, 404 if not found
router.get('/books/:id', (req, res) => {
    const id = Number(req.params.id)
    const book = books.find(book => book.id === id);

    if (!book) { return res.status(404).json({ message: "Book not found" }); }

    res.json(book);
})

// POST /books → add a new book (generate an id), 400 if title or author missing
router.post('/books', (req, res) => {

    const { title, author } = req.body;

    if (!title || !author) {
        const error = new Error('Title and author are required');
        error.statusCode = 400;
        throw error;
    }
    const newBook = { id: books.length > 0 ? Math.max(...books.map(book => book.id)) + 1 : 1, title, author };

    books.push(newBook);

    res.status(201).json(newBook);
});

// PUT /books/:id → full update, 404 if not found
router.put('/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const bookIndex = books.findIndex(book => book.id === id);

    if (bookIndex === -1) {
        return res.status(404).json({ message: "Book not found" });
    }

    const { title, author } = req.body;

    books[bookIndex] = { id, title, author };

    res.json(books[bookIndex]);
})

// DELETE /books/:id → remove, 404 if not found
router.delete('/books/:id', requireApiKey, (req, res) => {
    const id = Number(req.params.id);
    const bookIndex = books.findIndex(book => book.id === id);

    if (bookIndex === -1) {
        return res.status(404).json({ message: "Book not found" });
    }

    const deletedBook = books.splice(bookIndex, 1)[0];

    res.json(deletedBook);
})

module.exports = router;