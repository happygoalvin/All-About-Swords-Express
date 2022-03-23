// SETUP
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const MongoUtil = require('./MongoUtil');
const axios = require('axios');
const req = require('express/lib/request');
const { Db } = require('mongodb');

// create the app
const app = express();

// enable JSON data processing
app.use(express.json());

// enable CORS
app.use(cors());

// for forms to work
app.use(express.urlencoded({
    extended:false
}));

const COLLECTION_SWORD_INFO="sword_info"
const COLLECTION_FIGHTING_STYLE="fighting_style"

// ROUTES
async function main(){
    await MongoUtil.connect(process.env.MONGO_URI, "all_about_swords")

    app.post('/swords', async (req,res) => {
        
        try {
            let {name, origin, description, image_url, time_period_created, tags, fighting_style} = req.body

        } catch (e) {

        }
    } 
)

    app.get('/swords', async (req,res) => {
    let criteria = {};

    if (req.query.name) {
        criteria['name'] = {
            '$regex': req.query.name,
            '$options':'i'
        }
    }
    
    const db = MongoUtil.getDB();
    let sword_info = await db.collection(COLLECTION_SWORD_INFO).find(criteria).toArray();
    res.json({
        'sword_info':sword_info
    })
    
})

}

main();

// BEGIN SERVER (aka LISTEN)
app.listen(3000, function(){
    console.log("server begins");
})