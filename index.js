const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT || 8000
const cors=require("cors")
require("dotenv").config();
app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello World!')
})



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
      app.get("/ideas",async(req,res)=>{
  
        const result=await idea_vaultCollection.find().toArray()
       const  dd= await  res.send(result)
        console.log(dd)
      })
      
      app.post("/regis",async (req,res)=>{
        const user=req.body

        const result=await registerCollection.insertOne(user)
        res.send(result)
      })
         
     app.post("/Addideas", async(req,res)=>{
        ideas=req.body

      const result=await idea_vaultCollection.insertOne(ideas)
      res.json(result)
     } )
     

     app.get("/ideas/:id",async (req,res)=>{
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
