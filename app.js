const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");
const cors = require("cors");
const fs = require('fs')

const productsRoutes = require("./routes/products-routes");
const usersRoutes = require("./routes/users-routes");
const cartsRoutes = require("./routes/carts-routes");
const ordersRoutes = require("./routes/orders-routes");

dns.setServers(["1.1.1.1", "8.8.8.8"]);
const app = express();
 

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://nutrichocobite.in",
    "https://www.nutrichocobite.in",
    "https://nutrichocobite.neenusha369.workers.dev"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());
// app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads/images", express.static(path.join("uploads", "images")));
// app.use(
//   '/uploads/images',
//   express.static(
//     path.join(__dirname, 'uploads', 'images')
//   )
// );

app.use(express.static(path.join("public")));

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization",
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

//   next();
// });

app.use((error, req, res, next) => {
    if(req.file){
      fs.unlink(req.file.path, err => {
        console.log(err)
      })
    }
    if(res.headerSent){
        return next(error)
    }
    res.status(error.status || 505)
    res.json({message : error.message || "An unknown error occured!"})
})

app.use("/api/products/", productsRoutes);
app.use("/api/users/", usersRoutes);
app.use("/api/cart/", cartsRoutes);
app.use("/api/order/", ordersRoutes);

mongoose
  .connect(
    `mongodb+srv://nutriChocoDB:tpwAP3lMDNGFXpUqnj@cluster0.oewi9uh.mongodb.net/Ecommerce?retryWrites=true&w=majority`,
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("Connected to database!");
  })
  .catch((err) => {
    console.log(err);
  });
