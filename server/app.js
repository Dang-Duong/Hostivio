const express = require("express");
const app = express();
const cors = require("cors");
const port = 8888;

const guestController = require("./controller/guest");
const reservationController = require("./controller/reservation");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Accommodation Registration System!");
});

app.use("/guest", guestController);
app.use("/reservation", reservationController);

app.listen(port, () => {
  console.log(`Accommodation app listening on port ${port}`);
});
