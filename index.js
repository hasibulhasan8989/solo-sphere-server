const express = require('express')
const app = express()
const cors =require('cors')
require('dotenv').config()
const port = process.env.node || 9000


app.use(express.json())
app.use(cors())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zsgh3ij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    const jobsCollection=client.db('soloSphere').collection('jobs')
    const bitCollection=client.db('soloSphere').collection('bits')


    app.get('/jobs',async (req,res)=>{
        const result= await jobsCollection.find().toArray()
        res.send(result)
       
    })

    app.get('/job/:id',async (req,res)=>{
        const id=req.params.id
        const query={_id : new ObjectId(id)}
        const result= await jobsCollection.findOne(query)
        res.send(result)
       
    })

     app.delete('/job/:id',async (req,res)=>{
        const id=req.params.id
        const query={_id : new ObjectId(id)}
        const result= await jobsCollection.deleteOne(query)
        res.send(result)
       
    })

    app.put('/job/:id',async(req,res)=>{
      const id=req.params.id;
      const job=req.body
      const query={_id: new ObjectId(id)}

      const updateDoc={ $set:{
         ...job
      }}

      const options={upsert : true}
      const result=await jobsCollection.updateOne(query,updateDoc,options)
      res.send(result)



    })

    app.post('/bits',async (req,res)=>{
        const bit=req.body
        const result= await bitCollection.insertOne(bit)
        res.send(result)
    })

    app.post('/job',async(req,res)=>{
        const job=req.body;
        const result=await jobsCollection.insertOne(job)
        res.send(result)
    })

    app.get('/my-posted-jobs/:email',async(req,res)=>{
        
      const email=req.params.email;
      const query={"buyer.email":email}
      const result=await jobsCollection.find(query).toArray();
      res.send(result)



    })
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})