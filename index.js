// SETUP
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const MongoUtil = require('./MongoUtil');
const axios = require('axios');

// create the app
const app = express();

// enable JSON data processing
app.use(express.json());

// enable CORS
app.use(cors());

const COLLECTION_NAME1="sword_info"
const COLLECTION_NAME2="fighting_style"

app.get('/', function(req,res){
    res.send("It's alive!")
})

// BEGIN SERVER (aka LISTEN)
app.listen(3000, function(){
    console.log("server begins");
})