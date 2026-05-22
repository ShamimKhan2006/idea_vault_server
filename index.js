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
    return res.state(401).json({message:"Unauthorization"})
  }
 
  const token=authHeaders.split(" ")[1]
  if(!token){
    return res.state(401).json({message:"Unauthorization"})
  }

    const { payload } = await jwtVerify(token, JWKS)
      try {
        console.log("payload", payload)
        next()
        
      } catch (error) {
        return res.state(403).json({message:"Forbidden"})
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

      const result=await idea_vaultCollection.insertOne(ideas)
      res.json(result)
     } )
     

     app.get("/ideas/:id",verifyToken, async (req,res)=>{

      const {id}=req.params
      const query={_id : new ObjectId(id)}
      const result=await idea_vaultCollection.findOne(query)
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


