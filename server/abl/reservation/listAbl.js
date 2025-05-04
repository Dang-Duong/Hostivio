const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const ajv = new Ajv();
addFormats(ajv);

const reservationDao = require("../../dao/reservation-dao.js");
const guestDao = require("../../dao/guest-dao.js");

const schema = {
  type: "object",
  properties: {
    startDate: { type: "string", format: "date" },
    endDate: { type: "string", format: "date" },
    accommodation: { type: "string" },
  },
  required: [],
  additionalProperties: false,
};

async function ListAbl(req, res) {
  try {
    const filter = req.query || {};

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

    // Get reservations
    const reservationList = reservationDao.list(filter);

    // Get guest details for each reservation
    const enhancedReservationList = reservationList.map((reservation) => {
      const guest = guestDao.get(reservation.guestId);
      if (guest) {
        return {
          ...reservation,
          guestInfo: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            nationality: guest.nationality,
            processed: guest.processed,
          },
        };
      }
      return reservation;
    });

    // Prepare pagination info
    const pageInfo = {
      pageIndex: 0,
      pageSize: enhancedReservationList.length,
      total: enhancedReservationList.length,
    };

    // return properly filled dtoOut
    res.json({
      itemList: enhancedReservationList,
      pageInfo,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = ListAbl;
