const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const ajv = new Ajv();
addFormats(ajv);

const guestDao = require("../../dao/guest-dao.js");

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    firstName: { type: "string", maxLength: 100 },
    lastName: { type: "string", maxLength: 100 },
    nationality: { type: "string" },
    passport: { type: "string", maxLength: 50 },
    dateOfBirth: { type: "string", format: "date" },
    email: { type: "string", format: "email", maxLength: 100 },
    domicileAbroad: { type: "string", maxLength: 250 },
    visum: { type: "string", maxLength: 50 },
    signature: { type: "string" },
    processed: { type: "boolean" },
  },
  required: ["id"],
  additionalProperties: false,
};

async function UpdateAbl(req, res) {
  try {
    const guest = req.body;

    // validate input
    const valid = ajv.validate(schema, guest);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "DtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // check if guest exists
    const existingGuest = guestDao.get(guest.id);
    if (!existingGuest) {
      res.status(404).json({
        code: "guestDoesNotExist",
        message: `Guest with id ${guest.id} does not exist`,
      });
      return;
    }

    // Important: If passport is changed, we need to handle it specially
    if (guest.passport && guest.passport !== guest.id) {
      res.status(400).json({
        code: "cannotChangePassport",
        message: "Cannot change passport number as it's used as the ID",
      });
      return;
    }

    // Ensure passport and id remain the same
    guest.passport = guest.id;

    // Merge existing guest with updates
    const updatedGuest = { ...existingGuest, ...guest };

    // update guest
    const result = guestDao.update(updatedGuest);

    // return updated guest
    res.json(result);
  } catch (e) {
    res.status(500).json({
      code: "updateGuestError",
      message: e.message,
    });
  }
}

module.exports = UpdateAbl;
