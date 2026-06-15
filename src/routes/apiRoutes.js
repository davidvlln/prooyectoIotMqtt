const express = require('express');
const GenericController = require('../controllers/GenericController');
const db = require('../config/db');
const sensoresController = require('../controllers/sensoresController');

const router = express.Router();

const tables = [
  { name: 'usuarios', pk: 'id_usuario' },
  { name: 'zonas', pk: 'id_zona' },
  { name: 'tipos_sensores', pk: 'id_tipo_sensor' },
  { name: 'tipos_alertas', pk: 'id_tipo_alerta' },
  { name: 'nodos', pk: 'id_nodo' },
  { name: 'sensores', pk: 'id_sensor' },
  { name: 'parametros_zonas', pk: 'id_parametros_zonas' },
  { name: 'alertas', pk: 'id_alerta' },
  { name: 'riegos', pk: 'id_riego' },
];

tables.forEach(({ name, pk }) => {
  const controller = new GenericController(name, pk);
  
  router.get(`/${name}`, controller.getAll.bind(controller));
  router.get(`/${name}/:id`, controller.getById.bind(controller));
  
  // Condición especial para POST /sensores (Multiplexor)
  if (name === 'sensores') {
    router.post(`/${name}`, (req, res) => {
      // Si el payload viene de Node-RED (tiene 'temp', 'hum' o 'id' tipo string)
      if (req.body.temp !== undefined || req.body.hum !== undefined || typeof req.body.id === 'string') {
        return sensoresController.crearSensor(req, res);
      }
      // Si viene del Dashboard Web (CRUD normal)
      return controller.create(req, res);
    });
  } else {
    router.post(`/${name}`, controller.create.bind(controller));
  }
  
  router.put(`/${name}/:id`, controller.update.bind(controller));
  router.delete(`/${name}/:id`, controller.delete.bind(controller));
});

// Lecturas is special, we might want to emit websockets on creation
const lecturasController = new GenericController('lecturas', 'id_lectura');
router.get('/lecturas', lecturasController.getAll.bind(lecturasController));
router.get('/lecturas/:id', lecturasController.getById.bind(lecturasController));

router.post('/lecturas', async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `INSERT INTO lecturas (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await db.query(query, values);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('new-lectura', rows[0]);
    }
    
    res.status(201).json({ status: 'success', data: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.put('/lecturas/:id', lecturasController.update.bind(lecturasController));
router.delete('/lecturas/:id', lecturasController.delete.bind(lecturasController));

// Endpoint especial para recibir telemetría de Node-RED/MQTT
router.post('/telemetria', (req, res) => {
  return sensoresController.crearSensor(req, res);
});

// Endpoint para el Dashboard (lecturas en tiempo real)
router.get('/dashboard/ultimas-lecturas', sensoresController.ultimasLecturas);

// Endpoint para el Histórico de Lecturas
router.get('/dashboard/historico', sensoresController.obtenerHistorico);

module.exports = router;
