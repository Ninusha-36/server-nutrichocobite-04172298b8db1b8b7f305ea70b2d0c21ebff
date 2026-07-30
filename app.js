const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");
const cors = require("cors");

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
    "https://www.nutrichocobite.in"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
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

app.use("/api/products/", productsRoutes);
app.use("/api/users/", usersRoutes);
app.use("/api/cart/", cartsRoutes);
app.use("/api/order/", ordersRoutes);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oewi9uh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("Connected to database!");
  })
  .catch((err) => {
    console.log(err);
  });
