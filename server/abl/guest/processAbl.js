const Ajv = require("ajv");
const ajv = new Ajv();

const guestDao = require("../../dao/guest-dao.js");

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
  },
  required: ["id"],
  additionalProperties: false,
};

async function ProcessAbl(req, res) {
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
      res.status(400).json({
        code: "guestDoesNotExist",
        message: `Guest with id ${params.id} does not exist`,
      });
      return;
    }

    // update guest processed flag
    const updatedGuest = guestDao.update({
      id: params.id,
      processed: true,
    });

    // return properly filled dtoOut
    res.json(updatedGuest);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = ProcessAbl;
