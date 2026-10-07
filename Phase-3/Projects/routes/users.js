import express from 'express';

const router = express.Router()

let users = [
    { id: 1, name: "Mark" },
    { id: 2, name: "Jack" }
];

router.get('/users', (req, res) => {
    console.log("Request reached")
    res.json(users)
})

export default router