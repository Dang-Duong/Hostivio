const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const ajv = new Ajv();
addFormats(ajv);

const reservationDao = require("../../dao/reservation-dao.js");
const guestDao = require("../../dao/guest-dao.js");

const schema = {
  type: "object",
  properties: {
    accommodation: { type: "string", maxLength: 100 },
    arrivalDate: { type: "string", format: "date" },
    departureDate: { type: "string", format: "date" },
    purpose: { type: "string" },
    guestId: { type: "string" },
  },
  required: [
    "accommodation",
    "arrivalDate",
    "departureDate",
    "purpose",
    "guestId",
  ],
  additionalProperties: false,
};

async function CreateAbl(req, res) {
  try {
    let reservation = req.body;

    console.log("Received reservation request:", JSON.stringify(reservation));
    console.log("guestId value:", reservation.guestId);
    console.log("guestId type:", typeof reservation.guestId);
    console.log("guestId length:", reservation.guestId.length);
    console.log(
      "guestId char codes:",
      [...reservation.guestId].map((c) => c.charCodeAt(0))
    );

    // Try to clean the guestId in case it contains extra quotes or special characters
    if (reservation.guestId && typeof reservation.guestId === "string") {
      // Remove any quotes, underscores or extra characters
      const cleanedId = reservation.guestId.replace(/[^0-9]/g, "");
      console.log("Original guestId:", reservation.guestId);
      console.log("Cleaned guestId:", cleanedId);

      // Use the cleaned ID if it's different from the original
      if (cleanedId !== reservation.guestId) {
        reservation.guestId = cleanedId;
      }
    }

    // validate input
    const valid = ajv.validate(schema, reservation);
    if (!valid) {
      console.log("Validation error:", ajv.errors);
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "DtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // validate that arrivalDate is in the future
    const arrivalDate = new Date(reservation.arrivalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (arrivalDate < today) {
      res.status(400).json({
        code: "invalidArrivalDate",
        message: "Arrival date must be current day or a day in the future",
      });
      return;
    }

    // validate that departureDate is after arrivalDate
    const departureDate = new Date(reservation.departureDate);
    if (departureDate <= arrivalDate) {
      res.status(400).json({
        code: "invalidDepartureDate",
        message: "Departure date must be after arrival date",
      });
      return;
    }

    // Check if we have access to the storage directory
    const fs = require("fs");
    const path = require("path");
    const guestDir = path.join(__dirname, "../../dao/storage/guestList");
    console.log("Guest directory exists:", fs.existsSync(guestDir));
    console.log(
      "Files in guest directory:",
      fs.existsSync(guestDir) ? fs.readdirSync(guestDir) : "N/A"
    );

    // check if guest exists
    console.log("Looking for guest with ID:", reservation.guestId);
    const guest = guestDao.get(reservation.guestId);
    console.log("Guest search result:", guest);

    if (!guest) {
      // Try a direct file access as a fallback
      try {
        const guestFilePath = path.join(
          guestDir,
          `${reservation.guestId}.json`
        );
        console.log("Trying direct file access:", guestFilePath);
        console.log("File exists:", fs.existsSync(guestFilePath));

        if (fs.existsSync(guestFilePath)) {
          const guestData = fs.readFileSync(guestFilePath, "utf8");
          console.log(
            "Direct file read success, data:",
            guestData.substring(0, 50) + "..."
          );
        }
      } catch (err) {
        console.error("Direct file access error:", err);
      }

      res.status(400).json({
        code: "guestDoesNotExist",
        message: `Guest with id ${reservation.guestId} does not exist`,
      });
      return;
    }

    // store reservation to persistent storage
    reservation = reservationDao.create(reservation);

    // return properly filled dtoOut
    res.json(reservation);
  } catch (e) {
    console.error("Reservation creation error:", e);
    res
      .status(500)
      .json({ code: "createReservationError", message: e.message });
  }
}

module.exports = CreateAbl;
