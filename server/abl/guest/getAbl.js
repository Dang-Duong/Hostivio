const Ajv = require("ajv");
const ajv = new Ajv();
const fs = require("fs");
const path = require("path");

const guestDao = require("../../dao/guest-dao.js");
const reservationDao = require("../../dao/reservation-dao.js");

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
  },
  required: ["id"],
  additionalProperties: false,
};

async function GetAbl(req, res) {
  try {
    const params = req.query;

    // validate input
    const valid = ajv.validate(schema, params);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "DtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // Get guest - first try with DAO
    const guest = guestDao.get(params.id);

    // If DAO doesn't find it, try direct file access
    if (!guest) {
      const guestDir = path.join(__dirname, "../../dao/storage/guestList");
      const guestFile = path.join(guestDir, `${params.id}.json`);

      if (fs.existsSync(guestFile)) {
        try {
          const guestData = fs.readFileSync(guestFile, "utf8");
          const parsedGuest = JSON.parse(guestData);

          // Get reservations for this guest
          const reservations = reservationDao.listByGuestId(params.id);

          // Return the guest with reservations
          res.json({
            ...parsedGuest,
            reservations,
          });
          return;
        } catch (error) {
          // If there's an error reading the file, continue to the not found response
          console.error("Error reading guest file:", error);
        }
      }

      // Guest not found
      res.status(404).json({
        code: "guestDoesNotExist",
        message: `Guest with id ${params.id} does not exist`,
      });
      return;
    }

    // Get reservations for this guest
    const reservations = reservationDao.listByGuestId(params.id);

    // Return properly filled dtoOut with reservations
    res.json({
      ...guest,
      reservations,
    });
  } catch (e) {
    console.error("Error in guest/get:", e);
    res.status(500).json({ code: "getGuestError", message: e.message });
  }
}

module.exports = GetAbl;
