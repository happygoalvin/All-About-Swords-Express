// SETUP
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const MongoUtil = require('./MongoUtil');
const axios = require('axios');
const e = require('express');

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
// SETUP END

const COLLECTION_SWORD_INFO="sword_info"
const COLLECTION_FIGHTING_STYLE="fighting_style"
const COLLECTION_TAGS = "tags"

// ROUTES
async function main(){
    await MongoUtil.connect(process.env.MONGO_URI, "all_about_swords")

    app.post('/swords', async (req,res) => {
    
        try {
            let {name, origin, description, image_url, blade, time_period_created} = req.body
            // console.log(blade.metal)
            // tags = tags.split(",");
            // tags = tags.map(function(each_tags){
            //     return each_tags.trim()
            // })

            // fighting_style = fighting_style.split(',');
            // fighting_style = fighting_style.map(function(each_style) {
            //     return each_style.trim()
            // })

            const db = MongoUtil.getDB()

            let tags = req.body.tags || [];
            let tagVerification = await Promise.all(tags.map(async (t) => {
                let foundTag = await db.collection(COLLECTION_TAGS).find({
                    "_id": {
                        $in: [ObjectId(t)]
                    }
                }).toArray();
                if (foundTag && foundTag.length > 0) return foundTag[0]; 
            }));

            if (tags.length === tagVerification.length) {
                await db.collection(COLLECTION_SWORD_INFO).insertOne({
                    name,
                    origin,
                    description,
                    blade,
                    image_url,
                    time_period_created, 
                    tagVerification,
                    // fighting_style
                })
                res.status(200);
                res.json({
                    message: "record has been added successfully"
                })
            } else {
                res.status(406);
                res.json({
                    message:"tags is invalid"
                })
            }
        } catch (e) {
            res.status(500)
            res.json({
                message: "Internal server error. Please contact administrator"
            })
            console.log(e)
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

    app.put('/swords/:id', async (req,res) => {
        
        try {
        let {name, origin, description, image_url, blade, time_period_created} = req.body

        const db = MongoUtil.getDB();

        let tags = req.body.tags || [];
        let tagVerification = await Promise.all(tags.map(async (t) => {
            let foundTag = await db.collection(COLLECTION_TAGS).find({
                "_id": {
                    $in: [ObjectId(t)]
                }
            }).toArray();
            if (foundTag && foundTag.length > 0) return foundTag[0]; 
        }));

        if (tags.length === tagVerification.length) {
            await db.collection(COLLECTION_SWORD_INFO).updateOne({
                '_id': ObjectId(req.params.id)
            },{
                '$set':{
                    'name': name,
                    'origin': origin,
                    'description': description,
                    'image_url': image_url,
                    'blade': blade,
                    'time_period_created': time_period_created
                }
            })
            res.status(200);
            res.json({
                message: "record has been edited successfully"
            })
        } else {
            res.status(406);
            res.json({
                message:"tags is invalid"
            })
        } 
    } catch (e) {
        res.status(500)
            res.json({
                message: "Internal server error. Please contact administrator"
            })
            console.log(e)
        }
    })
    
    const db = MongoUtil.getDB();
    let sword_info = await db.collection(COLLECTION_SWORD_INFO).find(criteria).toArray();
    res.json({
        'sword_info':sword_info
    })
})

    app.get('/tags', async (req,res) => {
        const db = MongoUtil.getDB();
        let tags = await db.collection(COLLECTION_TAGS).find().toArray();
        res.json({
            tags:tags
        })
    })
}

main();

// BEGIN SERVER (aka LISTEN)
app.listen(3000, function(){
    console.log("server begins");
})