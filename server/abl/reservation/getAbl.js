const Ajv = require("ajv");
const ajv = new Ajv();
const fs = require("fs");
const path = require("path");

const reservationDao = require("../../dao/reservation-dao.js");
const guestDao = require("../../dao/guest-dao.js");

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

    // First try to get the reservation using the DAO
    const reservation = reservationDao.get(params.id);

    // If not found, try direct file access
    if (!reservation) {
      const reservationDir = path.join(
        __dirname,
        "../../dao/storage/reservationList"
      );
      const reservationFile = path.join(reservationDir, `${params.id}.json`);

      if (fs.existsSync(reservationFile)) {
        try {
          const reservationData = fs.readFileSync(reservationFile, "utf8");
          const parsedReservation = JSON.parse(reservationData);

          // Try to get guest details
          let guest = null;
          if (parsedReservation.guestId) {
            guest = guestDao.get(parsedReservation.guestId);

            if (!guest) {
              // Try direct file access for guest
              const guestDir = path.join(
                __dirname,
                "../../dao/storage/guestList"
              );
              const guestFile = path.join(
                guestDir,
                `${parsedReservation.guestId}.json`
              );

              if (fs.existsSync(guestFile)) {
                const guestData = fs.readFileSync(guestFile, "utf8");
                guest = JSON.parse(guestData);
              }
            }
          }

          // Return with guest details if found
          res.json({
            ...parsedReservation,
            guest: guest
              ? {
                  id: guest.id,
                  firstName: guest.firstName,
                  lastName: guest.lastName,
                  nationality: guest.nationality,
                  processed: guest.processed,
                }
              : null,
          });
          return;
        } catch (error) {
          console.error("Error reading reservation file:", error);
        }
      }

      // Reservation not found
      res.status(404).json({
        code: "reservationDoesNotExist",
        message: `Reservation with id ${params.id} does not exist`,
      });
      return;
    }

    // Get guest details
    const guest = guestDao.get(reservation.guestId);

    // Return properly filled dtoOut with guest details
    res.json({
      ...reservation,
      guest: guest
        ? {
            id: guest.id,
            firstName: guest.firstName,
            lastName: guest.lastName,
            nationality: guest.nationality,
            processed: guest.processed,
          }
        : null,
    });
  } catch (e) {
    console.error("Error in reservation/get:", e);
    res.status(500).json({ code: "getReservationError", message: e.message });
  }
}

module.exports = GetAbl;
