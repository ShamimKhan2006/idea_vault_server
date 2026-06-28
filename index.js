 const express = require("express");
const app = express();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-node-cjs-runtime");
require("dotenv").config();

const port = process.env.PORT || 8000;

 app.use(cors());

;
app.use(express.json());

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("Idea Vault API is running 🚀");
});

// ================= JWKS (IMPORTANT: CHANGE FOR PRODUCTION) =================
const JWKS = createRemoteJWKSet(new URL(`${process.env.JWKS_URL}/api/auth/jwks`));

// ================= AUTH MIDDLEWARE =================
const verifyToken = async (req, res, next) => {
  try {
    const authHeaders = req?.headers.authorization;

    if (!authHeaders) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeaders.split(" ")[1];
    console.log("token",token)

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { payload } = await jwtVerify(token, JWKS);

    req.payload = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

// ================= MONGO =================
const uri = process.env.MONGODB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ================= MAIN RUN =================
async function run() {
  try {
//     await client.connect();

    const db = client.db("idea_vault");

    const idea_vaultCollection = db.collection("idea_vault_collection");
    const registerCollection = db.collection("register");
    const commentsCollection = db.collection("comments");

    // ================= GET IDEAS (SEARCH INCLUDED) =================
    app.get("/ideas", async (req, res) => {
      const search = req.query.search;

      let query = {};

      if (search && search !== "" && search !== "undefined") {
        query = {
          ideaTitle: { $regex: search, $options: "i" },
        };
      }

      const result = await idea_vaultCollection.find(query).toArray();
      res.send(result);
    });

    // ================= FEATURED =================
    app.get("/featured", async (req, res) => {
      const result = await idea_vaultCollection.find().limit(6).toArray();
      res.send(result);
    });
   app.get("/featured", async (req, res) => {
  res.send("featured route working");
});


    // ================= REGISTER =================
    app.post("/regis", async (req, res) => {
      const user = req.body;
      const result = await registerCollection.insertOne(user);
      res.send(result);
    });

    // ================= ADD IDEA =================
    app.post("/addideas", verifyToken, async (req, res) => {
      const ideas = req.body;
      ideas.email = req.payload.email;

      const result = await idea_vaultCollection.insertOne(ideas);
      res.json(result);
    });

    // ================= MY IDEAS =================
    app.get("/myidea",  async (req, res) => {
      const email = req.query.email;

      const result = await idea_vaultCollection.find({ email }).toArray();
      res.send(result);
    });

    // ================= SINGLE IDEA =================
    app.get("/ideas/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      const result = await idea_vaultCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // ================= EDIT IDEA =================
    app.patch("/edit/:id", async (req, res) => {
      const { id } = req.params;
      const update = req.body;

      const result = await idea_vaultCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );

      res.send(result);
    });
    app.patch("/cmtedit/:id", async (req, res) => {
      const { id } = req.params;
      const update = req.body;

      const result = await commentsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );

      res.send(result);
    });
    
    // ================= DELETE IDEA =================
    app.delete("/delete/:id", async (req, res) => {
      const { id } = req.params;

      const result = await idea_vaultCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });
    app.delete("/comments/:id", async (req, res) => {
      const { id } = req.params;
          console.log("ID:",id);
      const result = await commentsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
  try {
    const query = req.body;
    console.log("Saving to DB:", query); 

    // নিশ্চিত করুন commentsCollection টি null বা undefined নয়
    if (!commentsCollection) {
        throw new Error("Database collection not initialized");
    }

    const result = await commentsCollection.insertOne(query);
    console.log("DB Result:", result);
    
    res.status(200).send(result);
  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    res.status(500).send({ error: error.message });
  }
});

app.get("/reviews/:Id",async (req ,res )=>{

  const {Id}=req.params
  const result=await commentsCollection.find({Id}).toArray()
  res.send(result)
})
  } 
  catch (err) {
        res.status(500).json({ error: err.message });
      }
    

    
  } 
run().catch(console.dir);
// ================= LISTEN (DEPLOY FIX IMPORTANT) =================
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});