const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT || 8000
const cors=require("cors");
const { createRemoteJWKSet, jwtVerify } = require('jose-node-cjs-runtime');
require("dotenv").config();
app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello World!')
})
const JWKS = createRemoteJWKSet(
      new URL('http://localhost:3000/api/auth/jwks')
)
const verifyToken= async(req,res,next)=>{
  const authHeaders=req?.headers.authorization
   if(!authHeaders){
    return res.status(401).json({message:"Unauthorization"})
  }
 
  const token=authHeaders.split(" ")[1]
  if(!token){
    return res.status(401).json({message:"Unauthorization"})
  }

    const { payload } = await jwtVerify(token, JWKS)
      try {
    
        req.payload=payload
        next()
        
      } catch (error) {
        return res.status(403).json({message:"Forbidden"})
      }
 }

const uri =process.env.MONGODB_URL;


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
    // await client.db("admin").command({ ping: 1 });
     const db=client.db("idea_vault")
     const idea_vaultCollection=db.collection("idea_vault_collection")
     const registerCollection=db.collection("register")
     const limi_ideasColl=db.collection("limit_ideas")
     const userColl=db.collection("user")
      app.get("/ideas",async(req,res)=>{
  
        const result=await idea_vaultCollection.find().toArray()
       const  dd= await  res.send(result)
        console.log(dd)
      })

      app.get("/featured",async (req,res)=>{
        const result=await idea_vaultCollection.find().limit(6).toArray()
       const home= await res.send(result)
       console.log("home",home)
      })
      
      app.post("/regis",async (req,res)=>{
        const user=req.body

        const result=await registerCollection.insertOne(user)
        res.send(result)
      })
         
     app.post("/Addideas", verifyToken, async(req,res)=>{
        ideas=req.body
        ideas.email=req.payload.email
      const result=await idea_vaultCollection.insertOne(ideas)
      res.json(result)
     } )
     

     app.get("/myidea/", verifyToken, async(req,res)=>{
      console.log(req.payload)
      const email=req.payload.email
      const result=await idea_vaultCollection.find({email}).toArray()
      res.send(result)
     })

     app.get("/ideas/:id",verifyToken, async (req,res)=>{

      const {id}=req.params
      const query={_id : new ObjectId(id)}
      const result=await idea_vaultCollection.findOne(query)
        await res.send(result)
     })

    app.patch("/edit/:id",async(req,res)=>{
      const {id}=req.params
      const update=req.body
      const result=await idea_vaultCollection.updateOne({_id:new ObjectId(id)},{
        $set:update
      })
        await res.send(result)

     
    })
app.get("/ideas", async (req, res) => {
  console.log("Backend received search query:", req.query.search);
  const search = req.query.search; 

  let query = {};
  // নিশ্চিত করুন সার্চ ভ্যালু খালি বা 'undefined' স্ট্রিং নয়
  if (search && search !== "" && search !== "undefined") {
    query = { ideaTitle: { $regex: search, $options: "i" } };
  }

  const result = await idea_vaultCollection.find(query).toArray();
  res.send(result);
});

   app.delete("/delete/:id",async(req,res)=>{
    const {id}=req.params
    const result=await idea_vaultCollection.deleteOne({_id:new ObjectId(id)})
    await res.send(result)
   })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


