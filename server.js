const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://mkk:mkkmkkmkk@cluster0.iyfqmpc.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("connected to MongoDB!");

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

        // intercepts collection name and adds it to the request object
        app.param('collectionName', (req, res, next, collectionName) => {
            req.collection = db.collection(collectionName);
            return next();
        });

        // routes
        // get all documents in a collection in params
        app.get('/api/:collectionName', async (req, res) => {
            const collectionName = req.collection;
            const result = await collectionName.find({}).toArray();
            res.send(result);
        });

        // post route to save a new order
        app.post('/api/orders', async (req, res) => {
            const orderCollection = db.collection('orders')
            const result = await orderCollection.insertOne(req.body, { ordered: true })
            res.status(201).json(result)
        })



        // Start the server
        app.listen(5000, () => {
            console.log('Server started on port 5000');
        });

    } finally {
    }
}
run().catch(console.dir);
