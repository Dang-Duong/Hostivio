const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const ajv = new Ajv();
addFormats(ajv);

const guestDao = require("../../dao/guest-dao.js");

const schema = {
  type: "object",
  properties: {
    month: { type: "string" },
    year: { type: "string" },
    processed: { type: "boolean" },
  },
  required: [],
  additionalProperties: false,
};

async function ListAbl(req, res) {
  try {
    const filter = req.query || {};

    // Convert processed from string to boolean if needed
    if (filter.processed !== undefined) {
      filter.processed = filter.processed === "true";
    }

    // validate input
    const valid = ajv.validate(schema, filter);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "DtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    try {
      // Get guests with pagination - now properly awaiting the Promise
      const guestList = await guestDao.list(filter);

      // Prepare response
      const pageInfo = {
        pageIndex: 0,
        pageSize: guestList.length,
        total: guestList.length,
      };

      // Return properly filled dtoOut
      res.json({
        itemList: guestList,
        pageInfo,
      });
    } catch (error) {
      res.status(500).json({
        code: "failedToListGuests",
        message: error.message,
      });
    }
  } catch (e) {
    res.status(500).json({
      code: "listGuestsError",
      message: e.message,
    });
  }
}

module.exports = ListAbl;
