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
  required: ["startDate", "endDate", "accommodation"],
  additionalProperties: false,
};

async function HomebookAbl(req, res) {
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

    // validate date range
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    if (startDate > endDate) {
      res.status(400).json({
        code: "invalidDateRange",
        message: "Start date cannot be after end date",
      });
      return;
    }

    // get reservations for the specified date range and accommodation
    const reservations = reservationDao.list({
      startDate: params.startDate,
      endDate: params.endDate,
      accommodation: params.accommodation,
    });

    // no data found
    if (reservations.length === 0) {
      res.status(404).json({
        code: "noDataFound",
        message: "No guest data found for the selected period",
      });
      return;
    }

    // collect guest data for all reservations
    const guestDataMap = new Map();
    reservations.forEach((reservation) => {
      const guest = guestDao.get(reservation.guestId);
      if (guest) {
        // Create a combined guest+reservation object
        const guestData = {
          ...guest,
          arrivalDate: reservation.arrivalDate,
          departureDate: reservation.departureDate,
        };
        guestDataMap.set(guest.id, guestData);
      }
    });

    // Convert to array
    const guests = Array.from(guestDataMap.values());

    // Calculate statistics
    const totalPeople = guests.length;
    const eligible = totalPeople; // In this simplified model, all guests are eligible
    const ineligible = 0;
    const totalBookings = reservations.length;

    // Calculate number of nights for each guest
    let eligibleNights = 0;
    guests.forEach((guest) => {
      const arrival = new Date(guest.arrivalDate);
      const departure = new Date(guest.departureDate);
      const days = Math.round((departure - arrival) / (1000 * 60 * 60 * 24));
      eligibleNights += days;
    });

    const ineligibleNights = 0;
    const totalFees = eligibleNights * 50; // Assuming 50 per night fee

    // return properly filled dtoOut
    res.json({
      accommodation: params.accommodation,
      period: `${params.startDate} - ${params.endDate}`,
      guests,
      statistics: {
        totalPeople,
        eligible,
        ineligible,
        totalBookings,
        eligibleNights,
        ineligibleNights,
        totalPersonNights: eligibleNights + ineligibleNights,
        totalFees,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = HomebookAbl;
