const Ajv = require("ajv");
const ajv = new Ajv();

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

async function DeleteAbl(req, res) {
  try {
    const params = req.body;

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

    // check if guest exists
    const guest = guestDao.get(params.id);
    if (!guest) {
      res.status(404).json({
        code: "guestDoesNotExist",
        message: `Guest with id ${params.id} does not exist`,
      });
      return;
    }

    // check if guest has reservations
    const reservations = reservationDao.listByGuestId(params.id);
    if (reservations.length > 0) {
      res.status(400).json({
        code: "guestHasReservations",
        message: "Cannot delete guest with existing reservations",
        reservationCount: reservations.length,
      });
      return;
    }

    // delete guest
    guestDao.remove(params.id);

    // return success
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;
