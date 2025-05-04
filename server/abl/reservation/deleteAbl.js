const Ajv = require("ajv");
const ajv = new Ajv();

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

    // check if reservation exists
    const reservation = reservationDao.get(params.id);
    if (!reservation) {
      res.status(404).json({
        code: "reservationDoesNotExist",
        message: `Reservation with id ${params.id} does not exist`,
      });
      return;
    }

    // delete reservation
    reservationDao.remove(params.id);

    // return success
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;
