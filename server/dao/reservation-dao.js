const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const reservationFolderPath = path.join(
  __dirname,
  "storage",
  "reservationList"
);

// Method to read a reservation from a file
function get(reservationId) {
  try {
    const filePath = path.join(reservationFolderPath, `${reservationId}.json`);
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw { code: "failedToReadReservation", message: error.message };
  }
}

// Method to write a reservation to a file
function create(reservation) {
  try {
    reservation.id = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(reservationFolderPath, `${reservation.id}.json`);
    const fileData = JSON.stringify(reservation);
    fs.writeFileSync(filePath, fileData, "utf8");
    return reservation;
  } catch (error) {
    throw { code: "failedToCreateReservation", message: error.message };
  }
}

// Method to update reservation in a file
function update(reservation) {
  try {
    const currentReservation = get(reservation.id);
    if (!currentReservation) return null;
    const newReservation = { ...currentReservation, ...reservation };
    const filePath = path.join(reservationFolderPath, `${reservation.id}.json`);
    const fileData = JSON.stringify(newReservation);
    fs.writeFileSync(filePath, fileData, "utf8");
    return newReservation;
  } catch (error) {
    throw { code: "failedToUpdateReservation", message: error.message };
  }
}

// Method to remove a reservation from a file
function remove(reservationId) {
  try {
    const filePath = path.join(reservationFolderPath, `${reservationId}.json`);
    fs.unlinkSync(filePath);
    return {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw { code: "failedToRemoveReservation", message: error.message };
  }
}

// Method to list reservations in a folder with optional date range filtering
function list(filter = {}) {
  try {
    if (!fs.existsSync(reservationFolderPath)) {
      fs.mkdirSync(reservationFolderPath, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(reservationFolderPath);
    let reservationList = files.map((file) => {
      const fileData = fs.readFileSync(
        path.join(reservationFolderPath, file),
        "utf8"
      );
      return JSON.parse(fileData);
    });

    // Apply date range filters if specified
    if (filter.startDate || filter.endDate) {
      reservationList = reservationList.filter((item) => {
        const arrivalDate = new Date(item.arrivalDate);
        const departureDate = new Date(item.departureDate);

        return (
          (!filter.startDate || arrivalDate >= new Date(filter.startDate)) &&
          (!filter.endDate || departureDate <= new Date(filter.endDate))
        );
      });
    }

    // Apply accommodation filter if specified
    if (filter.accommodation) {
      reservationList = reservationList.filter(
        (item) => item.accommodation === filter.accommodation
      );
    }

    // Sort by arrival date
    reservationList.sort(
      (a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate)
    );

    return reservationList;
  } catch (error) {
    throw { code: "failedToListReservations", message: error.message };
  }
}

// Method to list reservations by guestId
function listByGuestId(guestId) {
  try {
    const reservationList = list();
    return reservationList.filter((item) => item.guestId === guestId);
  } catch (error) {
    throw { code: "failedToListReservationsByGuestId", message: error.message };
  }
}

module.exports = {
  get,
  create,
  update,
  remove,
  list,
  listByGuestId,
};
