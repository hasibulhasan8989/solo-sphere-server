const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.node || 9000;

app.use(express.json());
app.use(cors({ origin: ["*", "http://localhost:5173"], credentials: true }));
app.use(cookieParser());

//jwt verify

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ massage: "Unauthorized Access" });
  }
  if (token) {
    jwt.verify(token, process.env.Access_Token_Secret, (err, decoded) => {
      if (err) {
        res.status(401).send({ massage: "Unauthorized Access" });
        console.log(err);
      }

      if (decoded) {
        req.tokenUser = decoded.user;
        next();
      }
    });
  }
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zsgh3ij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const jobsCollection = client.db("soloSphere").collection("jobs");
    const bitCollection = client.db("soloSphere").collection("bits");

    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/job/:id", async (req, res) => {
      const id = req.params.id;
      const job = req.body;
      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          ...job,
        },
      };

      const options = { upsert: true };
      const result = await jobsCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.post("/bits", async (req, res) => {
      const bit = req.body;
      const result = await bitCollection.insertOne(bit);
      res.send(result);
    });

    app.post("/job", async (req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    });

    app.get("/my-posted-jobs/:email", verifyToken, async (req, res) => {
      const tokenUserEmail = req.tokenUser;
      const email = req.params.email;
      if (tokenUserEmail !== email) {
        return res.status(403).send({ massage: "Forbidden Access" });
      }

      const query = { "buyer.email": email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    //get my Bits collection by email

    app.get("/my-bids/:email", async (req, res) => {
      const email = req.params.email;
      const query = { bitEmail: email };
      const result = await bitCollection.find(query).toArray();
      res.send(result);
    });

    //get all my post bits

    app.get(`/bit-request/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { buyerEmail: email };
      const result = await bitCollection.find(query).toArray();
      res.send(result);
    });

    //update bit status

    app.patch(`/bits/:id`, async (req, res) => {
      const status = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: status,
      };

      const result = await bitCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //generate jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.Access_Token_Secret, {
        expiresIn: "30d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    //remove jwt token

    app.get(`/jwt/logout`, async (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
