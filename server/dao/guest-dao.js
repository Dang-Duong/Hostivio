const fs = require("fs");
const path = require("path");

const guestFolderPath = path.join(__dirname, "storage", "guestList");

// Method to read a guest from a file
function get(guestId) {
  try {
    const filePath = path.join(guestFolderPath, `${guestId}.json`);
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw { code: "failedToReadGuest", message: error.message };
  }
}

// Method to write a guest to a file
function create(guest) {
  try {
    // Use passport as ID instead of generating a random one
    guest.id = guest.passport;
    guest.processed = false;
    const filePath = path.join(guestFolderPath, `${guest.id}.json`);
    const fileData = JSON.stringify(guest);
    fs.writeFileSync(filePath, fileData, "utf8");
    return guest;
  } catch (error) {
    throw { code: "failedToCreateGuest", message: error.message };
  }
}

// Method to update a guest in a file
function update(guest) {
  try {
    const filePath = path.join(guestFolderPath, `${guest.id}.json`);
    const fileData = JSON.stringify(guest);
    fs.writeFileSync(filePath, fileData, "utf8");
    return guest;
  } catch (error) {
    throw { code: "failedToUpdateGuest", message: error.message };
  }
}

// Method to list all guests
function list(filter = {}) {
  try {
    const files = fs.readdirSync(guestFolderPath);
    const filePromises = files
      .filter((filename) => filename.endsWith(".json"))
      .map((filename) => {
        return new Promise((resolve, reject) => {
          const filePath = path.join(guestFolderPath, filename);
          fs.readFile(filePath, "utf8", (err, data) => {
            if (err) reject(err);
            else {
              const guest = JSON.parse(data);
              resolve(guest);
            }
          });
        });
      });

    return Promise.all(filePromises).then((guests) => {
      // Apply filters if provided
      let filteredGuests = [...guests];

      if (filter.processed !== undefined) {
        filteredGuests = filteredGuests.filter(
          (g) => g.processed === filter.processed
        );
      }

      return filteredGuests;
    });
  } catch (error) {
    throw { code: "failedToListGuests", message: error.message };
  }
}

// Method to delete a guest
function remove(guestId) {
  try {
    const filePath = path.join(guestFolderPath, `${guestId}.json`);
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error) {
    if (error.code === "ENOENT")
      return { success: false, code: "guestDoesNotExist" };
    throw { code: "failedToDeleteGuest", message: error.message };
  }
}

module.exports = {
  get,
  create,
  update,
  list,
  remove,
};
