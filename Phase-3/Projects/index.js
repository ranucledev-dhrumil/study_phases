// import * as fs from 'node:fs/promises';

// try {
//     const data = await fs.readFile("./filename.txt", "utf-8")
//     console.log(data)
// } catch (error) {
//     console.error("File Not Found")
// }

// try {
//     const data = "Hello World"
//     await fs.writeFile("./log.txt", data)
// } catch (error) {
//     console.error("Cannot write to file")
// }

// Http Server
// import http from 'http'

// const server = http.createServer((req, resp) => {
//     if(req.url= "/"){resp.end("welcome to node server")}
//     else{resp.end("Not Found")}
// })

// server.listen(3001, () => console.log("welcome to node server: console"))


import express from "express";
import cors from 'cors'
import "dotenv/config";

const router = express.Router()
const app = express();

// const users = [
//     { id: 1, name: "Mark", age: 21 },
//     { id: 2, name: "Steven", age: 23 },
//     { id: 3, name: "Jack", age: 25 },
// ];
const items = [
    { id: 1, name: "Table" },
    { id: 2, name: "Lamp" },
    { id: 3, name: "Fan" },
];

app.use(express.json())
app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
}))
function logRequest(req, resp, next) {
    console.log(`${req.method} method, URL: ${req.url}`)
    next()
}

// Users
router.get('/users', (req, resp) => {
    resp.json(users)
})
router.put("/users/:id", async (req, resp) => {
    const id = req.params.id
    const { name, age } = req.body

    const foundIndex = users.findIndex(u => u.id == id);
    if (foundIndex === -1) return resp.status(404).json({ message: 'User not found' });
    users[foundIndex].name = name;
    users[foundIndex].age = age;
    resp.json({ user: users[foundIndex] })
})
router.delete("/users/:id", async (req, resp) => {
    const id = Number(req.params.id)

    const foundIndex = users.findIndex(u => u.id == id);
    if (foundIndex === -1) {
        return resp.status(404).json({ message: "User not found" });
    }

    users.splice(foundIndex, 1);
    resp.json({
        message: "User deleted",
    });
})

// Items
router.get('/api/items', (req, resp) => {
    resp.json(items)
})

router.post('/api/items', (req, resp) => {
    items.push(req.body)
    resp.json(items)
})


import mongoose from "mongoose";
const MONGO_URI = process.env.MONGO_URI
mongoose.connect(MONGO_URI)
    .catch((err) => { console.error(err) })

const BugSchema = mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['open', 'closed'], default: "open" }
}, { timestamps: true }
);
const Bug = mongoose.model("Bug", BugSchema)

// Bugs
router.get('/api/bugs', validateJwt, async (req, resp) => {
    try {
        const bugs = await Bug.find()
        resp.json(bugs)
    }
    catch (err) { console.error(err) }
})

import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs";
const SECRET_KEY = process.env.SECRET_KEY
const users = [];

router.post("/register", async (req, resp) => {
    const token = jwt.sign(req.body, SECRET_KEY)
    const password = req.body.password;

    const hashedPass = await bcrypt.hash(password, 12);

    const user = {
        id: Date.now().toString(),
        email,
        password: hashedPass,
    };

    users.push(user);
    resp.status(201).json({
        message: "User registered successfully",
    });
})

router.get("/login", async (req, resp) => {
    try {
        const { email, password } = req.body;

        const user = users.find((user) => user.email === email);
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            SECRET_KEY
        );
        res.status(200).json({
            message: "Login successful",
            token,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error",
        });
    }

})

function validateJwt(req, resp, next) {
    const header = auth.header
}


app.use(logRequest)
app.use('/', router)
app.listen(3000, () => console.log("Server Running on 3000"))
