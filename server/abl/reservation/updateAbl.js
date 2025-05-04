const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const ajv = new Ajv();
addFormats(ajv);

const reservationDao = require("../../dao/reservation-dao.js");
const guestDao = require("../../dao/guest-dao.js");

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    accommodation: { type: "string", maxLength: 100 },
    arrivalDate: { type: "string", format: "date" },
    departureDate: { type: "string", format: "date" },
    purpose: { type: "string" },
    guestId: { type: "string" },
  },
  required: ["id"],
  additionalProperties: false,
};

async function UpdateAbl(req, res) {
  try {
    let reservation = req.body;

    // validate input
    const valid = ajv.validate(schema, reservation);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "DtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // check if reservation exists
    const existingReservation = reservationDao.get(reservation.id);
    if (!existingReservation) {
      res.status(404).json({
        code: "reservationDoesNotExist",
        message: `Reservation with id ${reservation.id} does not exist`,
      });
      return;
    }

    // if dates are updated, validate them
    if (reservation.arrivalDate && reservation.departureDate) {
      const arrivalDate = new Date(reservation.arrivalDate);
      const departureDate = new Date(reservation.departureDate);

      if (departureDate <= arrivalDate) {
        res.status(400).json({
          code: "invalidDepartureDate",
          message: "Departure date must be after arrival date",
        });
        return;
      }
    } else if (reservation.arrivalDate && existingReservation.departureDate) {
      const arrivalDate = new Date(reservation.arrivalDate);
      const departureDate = new Date(existingReservation.departureDate);

      if (departureDate <= arrivalDate) {
        res.status(400).json({
          code: "invalidDepartureDate",
          message: "Departure date must be after arrival date",
        });
        return;
      }
    } else if (reservation.departureDate && existingReservation.arrivalDate) {
      const arrivalDate = new Date(existingReservation.arrivalDate);
      const departureDate = new Date(reservation.departureDate);

      if (departureDate <= arrivalDate) {
        res.status(400).json({
          code: "invalidDepartureDate",
          message: "Departure date must be after arrival date",
        });
        return;
      }
    }

    // if guestId is updated, check if guest exists
    if (
      reservation.guestId &&
      reservation.guestId !== existingReservation.guestId
    ) {
      const guest = guestDao.get(reservation.guestId);
      if (!guest) {
        res.status(400).json({
          code: "guestDoesNotExist",
          message: `Guest with id ${reservation.guestId} does not exist`,
        });
        return;
      }
    }

    // update reservation
    const updatedReservation = reservationDao.update(reservation);
    if (!updatedReservation) {
      res.status(500).json({
        code: "failedToUpdateReservation",
        message: "Failed to update reservation",
      });
      return;
    }

    // return properly filled dtoOut
    res.json(updatedReservation);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;
