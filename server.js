const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

function sortLessons(lessons, sortCategory, sortOrder) {
    return lessons.sort((a, b) => {
        const sortingOrder = sortOrder === 'ascending' ? 1 : -1
        switch (sortCategory) {
            case "subject": return sortingOrder * a.subject.toLowerCase().localeCompare(b.subject.toLowerCase());
            case "location": return sortingOrder * a.location.toLowerCase().localeCompare(b.location.toLowerCase());
            case "price": return sortingOrder * (a.price > b.price ? 1 : -1)
            case "spaces": return sortingOrder * (a.spaces > b.spaces ? 1 : -1)
        }
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("connected to MongoDB!");

        //middleware for cors
        app.use(cors())
        //middleware for parsing json data
        app.use(express.json());

        //logger middleware
        app.use((req, res, next) => {
            console.log(res.statusCode, req.method, req.url);
            next();
        });

        //static file middleware to get images
        app.use((req, res, next) => {
            if (req.url.startsWith('/images')) {
                const imagePath = path.join(__dirname, req.url);
                if (fs.existsSync(imagePath)) {
                    res.sendFile(imagePath);
                } else {
                    next();
                }
            } else {
                next();
            }
        });

        db = client.db("cw-2");



        // routes
        // get all documents in a collection in params
        app.get('/api/lessons', async (req, res) => {
            const lessonCollection = db.collection('lessons');
            const { sortCategory, sortOrder } = req.query;
            let result = await lessonCollection.find({}).toArray();
            result = sortLessons(result, sortCategory, sortOrder)
            res.send(result);
        });

        // post route to save a new order
        app.post('/api/orders', async (req, res) => {
            const orderCollection = db.collection('orders')
            const result = await orderCollection.insertOne(req.body, { ordered: true })
            res.status(201).json(result)
        })

        //put route to edit the available spaces
        app.put('/api/lessons/:id', async (req, res) => {
            const lessonCollection = db.collection('lessons');
            const id = req.params.id;
            const result = await lessonCollection.updateOne({ _id: id }, { $set: { "spaces": req.body.spaces } });
            res.send(result);
        })

        //search route
        app.get('/api/lessons/search/:text', async (req, res) => {
            const lessonCollection = db.collection('lessons');
            const { sortCategory, sortOrder } = req.query;

            const sortOptions = {};
            if (sortCategory && sortOrder) {
                sortOptions[sortCategory] = sortOrder === 'ascending' ? 1 : -1;
            } else {
                sortOptions['subject'] = 1;
            }
            const text = req.params.text;
            const lessons = await lessonCollection.find({}).toArray();
            const searchItem = lessons.filter((lesson) =>
                lesson.subject.toLowerCase().includes(text.toLowerCase()) ||
                lesson.location.toLowerCase().includes(text.toLowerCase())
            )
            console.log(req.query)
            searchItem.sort((a, b) => {
                const sortingOrder = sortOrder === 'ascending' ? 1 : -1
                switch (sortCategory) {
                    case "subject": return sortingOrder * a.subject.toLowerCase().localeCompare(b.subject.toLowerCase());
                    case "location": return sortingOrder * a.location.toLowerCase().localeCompare(b.location.toLowerCase());
                    case "price": return sortingOrder * (a.price > b.price ? 1 : -1)
                    case "spaces": return sortingOrder * (a.spaces > b.spaces ? 1 : -1)
                }
            })
            res.send(searchItem);
        });


        // Start the server
        app.listen(port, () => {
            console.log('Server started on port 5000');
        });

    } finally {
    }
}
run().catch(console.dir); 
