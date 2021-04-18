const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const ObjectID = require("mongodb").ObjectId;
const port = process.env.PORT || 3002;

const MongoClient = require("mongodb").MongoClient;
const { ObjectId } = require("bson");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dzoti.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("Hello from database!");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const serviceCollection = client.db("isp").collection("services");
  const orderCollection = client.db("isp").collection("orders");
  const adminCollection = client.db("isp").collection("admins");
  const reviewCollection = client.db("isp").collection("reviews");

  // Add services to database
  app.post("/addService", (req, res) => {
    const file = req.files.image;
    const name = req.body.name;
    const price = req.body.price;
    const desc = req.body.desc;
    const filePath = `${__dirname}/reviews/${file.name}`;
    const newImage = file.data;
    const convertImg = newImage.toString("base64");

    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(convertImg, "base64"),
    };

    serviceCollection
    .insertOne({ name, price, desc, image })
    .then((result) => {
      res.send(result.insertedCount > 0);
    });

    // console.log(file);






    // file.mv(filePath, (err) => {
    //   if (err) {
    //     console.log(err);
    //     res.status(500).send({ msg: "Failed to upload image" });
    //   }
    //   const newImage = fs.readFileSync(filePath);
    //   const convertImg = newImage.toString("base64");

    //   const image = {
    //     contentType: req.files.image.mimetype,
    //     size: req.files.image.size,
    //     img: Buffer.from(convertImg, "base64"),
    //   };
    //   serviceCollection
    //     .insertOne({ name, price, desc, image })
    //     .then((result) => {
    //       fs.remove(filePath, (error) => {
    //         if (error) console.log(error);
    //         res.send(result.insertedCount > 0);
    //       });
    //     });
    // });

  });

  // Add review
  app.post("/addReview", (req, res) => {
    const file = req.files.image;
    const name = req.body.name;
    const designation = req.body.designation;
    const desc = req.body.desc;
    const filePath = `${__dirname}/reviews/${file.name}`;
    const newImage = file.data;
    const convertImg = newImage.toString("base64");

    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(convertImg, "base64"),
    };

    reviewCollection
    .insertOne({ name, designation, desc, image })
    .then((result) => {
      res.send(result.insertedCount > 0);
    });
    


    // console.log(file);
    // file.mv(filePath, (err) => {
    //   if (err) {
    //     console.log(err);
    //     res.status(500).send({ msg: "Failed to upload image" });
    //   }
    //   const newImage = fs.readFileSync(filePath);
    //   const convertImg = newImage.toString("base64");

    //   const image = {
    //     contentType: req.files.image.mimetype,
    //     size: req.files.image.size,
    //     img: Buffer.from(convertImg, "base64"),
    //   };

    //   reviewCollection
    //     .insertOne({ name, designation, desc, image })
    //     .then((result) => {
    //       fs.remove(filePath, (error) => {
    //         if (error) console.log(error);
    //         res.send(result.insertedCount > 0);
    //         console.log("Review added");
    //       });
    //     });
        
    // });
  });


  //   Send services data to ui
  app.get("/services", (req, res) => {
    serviceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

   // Delete books method
   app.delete('/service/:id',(req,res)=>{
    const id =ObjectID((req.params.id));
    serviceCollection.findOneAndDelete({_id:id})
    .then(documents=> {
      res.send(!!documents.value);
      console.log("Service deleted successfully");
    })
  })

  //   Send reviews data to ui
  app.get("/reviews", (req, res) => {
    reviewCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
// Send single data to ui
  app.get("/serviceBook/:id", (req, res) => {
    serviceCollection
      .find({ _id: ObjectID(req.params.id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });

  app.post("/bookOrder", (req, res) => {
    const data = req.body;
    console.log(data);
    orderCollection.insertOne({ data }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // Service list user
  app.get("/serviceList", (req, res) => {
    const email = req.query.email;
    console.log(email);
    orderCollection.find({ "data.email": email }).toArray((err, documents) => {
      console.log(err);
      res.send(documents);
    });
  });

  // Admin order list

  app.post("/orderList", (req, res) => {
    const email = req.body.email;
    console.log(email);
    adminCollection.find({ admin: email }).toArray((err, admins) => {
    //   res.send(admins);

      if (admins.length > 0) {
        orderCollection.find().toArray((error, docs) => {
          res.send(docs);
        });
      }else{
        orderCollection.find({ "data.email": email}).toArray((error, docs) => {
            res.send(docs);
          });
      }
      // orderCollection.find()
      // .toArray((error,docs)=>{
      //     res.send(docs)
      // })
    });
  });

  //   Is Admin
  app.post("/isAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.find({ admin: email }).toArray((err, admins) => {
      res.send(admins.length > 0);
    });
  });

  // Update data in mongo db
 app.patch('/update/:id',(req,res)=>{

  console.log(req.body);

  orderCollection.updateOne({_id:ObjectID(req.body.id)},
      {
          $set: {"data.status":req.body.status}
      }
  )
  .then(result=>{
      res.send(result);
  })

})

  // Add admin

  app.post("/addAdmin", (req, res) => {
    const admin = req.body.name;
    console.log(admin);
    adminCollection.insertOne({ admin }).then((result) => {
      res.send(result.insertedCount > 0);
      console.log("admin added");
    });
  });

  //   console.log("error db", err);
  console.log("Database connected successfully");
  // perform actions on the collection object
  //   client.close();
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
