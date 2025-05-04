const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const ajv = new Ajv();
addFormats(ajv);

const guestDao = require("../../dao/guest-dao.js");

const schema = {
  type: "object",
  properties: {
    firstName: { type: "string", maxLength: 100 },
    lastName: { type: "string", maxLength: 100 },
    nationality: { type: "string" },
    passport: { type: "string", maxLength: 50 },
    dateOfBirth: { type: "string", format: "date" },
    email: { type: "string", format: "email", maxLength: 100 },
    domicileAbroad: { type: "string", maxLength: 250 },
    visum: { type: "string", maxLength: 50 },
    signature: { type: "string" },
  },
  required: [
    "firstName",
    "lastName",
    "nationality",
    "passport",
    "dateOfBirth",
    "email",
    "signature",
  ],
  additionalProperties: false,
};

async function CreateAbl(req, res) {
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

    // Check if guest with the same passport already exists
    const existingGuest = guestDao.get(guest.passport);
    if (existingGuest) {
      res.status(400).json({
        code: "guestAlreadyExists",
        message: `Guest with passport ${guest.passport} already exists`,
      });
      return;
    }

    // create guest
    const createdGuest = guestDao.create(guest);

    // Return created guest
    res.status(201).json(createdGuest);
  } catch (e) {
    res.status(500).json({
      code: "createGuestError",
      message: e.message,
    });
  }
}

module.exports = CreateAbl;
