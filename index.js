// SETUP
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const MongoUtil = require("./MongoUtil");
const axios = require("axios");

// create the app
const app = express();

// enable JSON data processing
app.use(express.json());

// enable CORS
app.use(cors());

const portNum = process.env.PORT || 3001;

// for forms to work
app.use(
  express.urlencoded({
    extended: false,
  })
);
// SETUP END

const COLLECTION_SWORD_INFO = "sword_info";
const COLLECTION_FIGHTING_STYLE = "fighting_style";
const COLLECTION_TAGS = "tags";

// ROUTES
async function main() {
  await MongoUtil.connect(process.env.MONGO_URI, "all_about_swords");

  app.get("/", async (req, res) => {
    res.send("All-About-Swords Api get successful");
  });

  app.post("/swords", async (req, res) => {
    try {
      let {
        name,
        origin,
        description,
        blade,
        image_url,
        time_period_created,
        fighting_style,
      } = req.body;

      if (fighting_style) {
        if (Array.isArray(fighting_style)) {
          fighting_style = fighting_style;
        } else {
          fighting_style = [fighting_style];
        }
      }

      const db = MongoUtil.getDB();

      if (name.length <= 2 || !name.match(/^[a-zA-Z]+$/)) {
        throw "Please enter a valid name";
      }

      if (origin && !origin.match(/^[a-zA-Z]+$/)) {
        throw "Please enter a valid country of origin";
      }

      if (description.length <= 50) {
        throw "Please enter a valid description";
      }

      if (
        image_url &&
        !image_url.includes("https://") &&
        !image_url.includes("http://")
      ) {
        throw "Please enter a valid image url";
      }

      if (blade) {
        if (req.body.blade.metal) {
          if (!req.body.blade.metal.match(/^[A-Za-z.\s-]+$/)) {
            throw "Please enter a valid metal";
          }
        }

        if (req.body.blade.length.match(/^\d+$/)) {
          req.body.blade.length = Number(req.body.blade.length);
        } else if (!req.body.blade.length.match(/^\d+$/)) {
          throw "Please enter integers only";
        }
      } else {
        throw "Please enter blade info";
      }

      if (
        time_period_created &&
        !time_period_created.includes("AD") &&
        !time_period_created.includes("BC")
      ) {
        throw "Please end time period with AD or BC";
      }

      if (fighting_style && fighting_style.length < 1) {
        throw "Please provide a fighting style";
      }

      let tags = req.body.tags || [];
      // tags = ["id1", "id2", "id3"];
      let tagVerification = await Promise.all(
        tags.map(async (t) => {
          let foundTag = await db
            .collection(COLLECTION_TAGS)
            .find({
              _id: ObjectId(t),
            })
            .toArray();
          if (foundTag && foundTag.length > 0) return foundTag[0];
        })
      );

      if (tags.length === tagVerification.length) {
        await db.collection(COLLECTION_SWORD_INFO).insertOne({
          name,
          origin,
          description,
          blade,
          image_url,
          time_period_created,
          tags: tagVerification,
          fighting_style,
        });
        res.status(200);
        res.json({
          message: "record has been added successfully",
        });
      } else {
        res.status(406);
        throw "Tags is invalid";
      }
    } catch (e) {
      res.status(500);
      res.json({
        message: e,
      });
      console.log(e);
    }
  });

  app.get("/swords", async (req, res) => {
    try {
      let criteria = {};

      if (req.query.name) {
        criteria["name"] = {
          $regex: req.query.name,
          $options: "i",
        };
      } else if (req.query.name === "") {
        throw "Please enter a name";
      }

      if (req.query.lengthGreaterThan && req.query.lengthLesserThan) {
        if (!req.query.lengthLesserThan.match(/^\d+$/)) {
          throw "Please enter integers only.";
        }
        if (!req.query.lengthGreaterThan.match(/^\d+$/)) {
          throw "Please enter integers only";
        }
        if (req.query.lengthGreaterThan || req.query.lengthLesserThan) {
          criteria["blade.length"] = {
            $gte: Number(req.query.lengthGreaterThan),
            $lte: Number(req.query.lengthLesserThan),
          };
        }
      }

      if (req.query.tags) {
        criteria["tags"] = {
          $elemMatch: {
            name: {
              $in: req.query.tags.split(","),
            },
          },
        };
      }

      const db = MongoUtil.getDB();

      let sword_info = await db
        .collection(COLLECTION_SWORD_INFO)
        .find(criteria)
        .toArray();
      res.json({
        sword_info: sword_info,
      });
    } catch (e) {
      res.status(500);
      res.json({
        message: e,
      });
    }
  });

  app.put("/swords/:id", async (req, res) => {
    let {
      name,
      origin,
      description,
      image_url,
      blade,
      time_period_created,
      fighting_style,
    } = req.body;

    fighting_style = fighting_style.split(",");
    fighting_style = fighting_style.map(function (each_style) {
      return each_style.trim();
    });

    const db = MongoUtil.getDB();
    let tags = req.body.tags || [];
    let tagVerification = await Promise.all(
      tags.map(async (t) => {
        let foundTag = await db
          .collection(COLLECTION_TAGS)
          .find({
            _id: {
              $in: [ObjectId(t)],
            },
          })
          .toArray();
        if (foundTag && foundTag.length > 0) return foundTag[0];
      })
    );

    if (tags.length === tagVerification.length) {
      await db.collection(COLLECTION_SWORD_INFO).updateOne(
        {
          _id: ObjectId(req.params.id),
        },
        {
          $set: {
            name: name,
            origin: origin,
            description: description,
            image_url: image_url,
            tags: tagVerification,
            blade: blade,
            fighting_style: fighting_style,
            time_period_created: time_period_created,
          },
        }
      );
      res.status(200);
      res.json({
        message: "record has been edited successfully",
      });
    } else {
      res.status(406);
      res.json({
        message: "tags is invalid",
      });
    }
  });

  app.delete("/swords/:id", async (req, res) => {
    const db = MongoUtil.getDB();
    await db.collection(COLLECTION_SWORD_INFO).deleteOne({
      _id: ObjectId(req.params.id),
    });
    res.status(200);
    res.json({
      message: "The document has been deleted",
    });
  });

  app.get("/swords/tags", async (req, res) => {
    const db = MongoUtil.getDB();
    let tags = await db.collection(COLLECTION_TAGS).find().toArray();
    res.json({
      tags: tags,
    });
  });
}

main();

// BEGIN SERVER (aka LISTEN)
app.listen(portNum, function () {
  console.log("server begins");
});
