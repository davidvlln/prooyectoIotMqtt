const express = require("express");
const router = express.Router();
const sensoresController = require("../controllers/sensoresController");

router.get("/sensores", sensoresController.listarSensores);
router.get("/sensores/ultimo", sensoresController.ultimasLecturas);
router.post("/sensores", sensoresController.crearSensor);

router.get("/nodos", sensoresController.listarNodos);

module.exports = router;
