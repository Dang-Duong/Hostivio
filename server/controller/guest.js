const express = require("express");
const router = express.Router();

const CreateAbl = require("../abl/guest/createAbl");
const ListAbl = require("../abl/guest/listAbl");
const GetAbl = require("../abl/guest/getAbl");
const UpdateAbl = require("../abl/guest/updateAbl");
const DeleteAbl = require("../abl/guest/deleteAbl");
const ProcessAbl = require("../abl/guest/processAbl");

router.post("/create", CreateAbl);
router.get("/list", ListAbl);
router.get("/get", GetAbl);
router.post("/update", UpdateAbl);
router.post("/delete", DeleteAbl);
router.post("/process", ProcessAbl);

module.exports = router;
