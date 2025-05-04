const express = require("express");
const router = express.Router();

const CreateAbl = require("../abl/reservation/createAbl");
const ListAbl = require("../abl/reservation/listAbl");
const GetAbl = require("../abl/reservation/getAbl");
const UpdateAbl = require("../abl/reservation/updateAbl");
const DeleteAbl = require("../abl/reservation/deleteAbl");
const HomebookAbl = require("../abl/reservation/homebookAbl");

router.post("/create", CreateAbl);
router.get("/list", ListAbl);
router.get("/get", GetAbl);
router.post("/update", UpdateAbl);
router.post("/delete", DeleteAbl);
router.post("/homebook/generate", HomebookAbl);

module.exports = router;
