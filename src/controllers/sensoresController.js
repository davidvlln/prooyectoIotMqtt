const db = require("../config/db");

exports.listarSensores = async (req, res) => {
  try {
    const { nodo, limite = 100 } = req.query;
    let query = "SELECT * FROM sensores";
    let params = [];

    if (nodo) {
      query += " WHERE id_nodo = $1 ORDER BY id_sensor DESC LIMIT $2";
      params = [nodo, parseInt(limite)];
    } else {
      query += " ORDER BY id_sensor DESC LIMIT $1";
      params = [parseInt(limite)];
    }

    const { rows } = await db.query(query, params);
    res.status(200).json({ status: "success", data: rows });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.ultimasLecturas = async (req, res) => {
  try {
    // Obtenemos la lectura más reciente para cada sensor físico
    const query = `
      SELECT DISTINCT ON (l.id_sensor)
        l.id_lectura, l.valor, l.fecha_hora,
        s.id_sensor, s.id_nodo,
        ts.nombre as tipo_sensor, ts.unidad_medida,
        n.nombre_nodo
      FROM lecturas l
      JOIN sensores s ON l.id_sensor = s.id_sensor
      JOIN tipos_sensores ts ON s.id_tipo_sensor = ts.id_tipo_sensor
      JOIN nodos n ON s.id_nodo = n.id_nodo
      ORDER BY l.id_sensor, l.fecha_hora DESC;
    `;
    const { rows } = await db.query(query);

    // Agrupamos por nodo para que el cliente lo reciba más estructurado
    const nodosData = {};
    for (const row of rows) {
      if (!nodosData[row.id_nodo]) {
        nodosData[row.id_nodo] = {
          id_nodo: row.id_nodo,
          nombre_nodo: row.nombre_nodo,
          ultima_actualizacion: row.fecha_hora,
          lecturas: []
        };
      }
      nodosData[row.id_nodo].lecturas.push({
        id_sensor: row.id_sensor,
        tipo: row.tipo_sensor,
        valor: row.valor,
        unidad: row.unidad_medida,
        fecha_hora: row.fecha_hora
      });
      // Mantenemos la fecha más reciente como la última actualización del nodo
      if (new Date(row.fecha_hora) > new Date(nodosData[row.id_nodo].ultima_actualizacion)) {
        nodosData[row.id_nodo].ultima_actualizacion = row.fecha_hora;
      }
    }

    res.status(200).json({ status: "success", data: Object.values(nodosData) });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.obtenerHistorico = async (req, res) => {
  try {
    const limit = parseInt(req.query.limite) || 500;
    
    const query = `
      SELECT 
        l.id_lectura, l.valor, l.fecha_hora,
        s.id_sensor, s.id_nodo,
        ts.nombre as tipo_sensor, ts.unidad_medida,
        n.nombre_nodo
      FROM lecturas l
      JOIN sensores s ON l.id_sensor = s.id_sensor
      JOIN tipos_sensores ts ON s.id_tipo_sensor = ts.id_tipo_sensor
      JOIN nodos n ON s.id_nodo = n.id_nodo
      ORDER BY l.fecha_hora DESC
      LIMIT $1;
    `;
    const { rows } = await db.query(query, [limit]);

    res.status(200).json({ status: "success", data: rows });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.listarNodos = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT DISTINCT id_nodo as node_id FROM sensores");
    const nodosUnicos = rows.map((n) => n.node_id);
    res.status(200).json({ status: "success", data: nodosUnicos });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.crearSensor = async (req, res) => {
  try {
    const payload = req.body;

    console.log("\n--- [NUEVA PETICIÓN HTTP POST DETECTADA] ---");
    console.log(
      "Cuerpo recibido en bruto (req.body):",
      JSON.stringify(payload, null, 2),
    );
    console.log("--------------------------------------------");

    const nodeId = payload && payload.id ? payload.id : "Desconocido";
    const temperatura =
      payload && payload.temp ? parseFloat(payload.temp) : 0.0;
    const humedadAire = payload && payload.hum ? parseInt(payload.hum) : 0;
    const humedadSuelo = payload && payload.soil ? parseInt(payload.soil) : 0;

    console.log("=================================================");
    console.log("   DATOS PROCESADOS (HIVEQ -> NODE-RED -> API)   ");
    console.log("=================================================");
    console.log(` ID del Nodo    : ${nodeId}`);
    console.log(
      ` Temperatura    : ${typeof temperatura === "number" && !isNaN(temperatura) ? temperatura.toFixed(1) : "0.0"} °C`,
    );
    console.log(` Humedad Aire   : ${humedadAire} %`);
    console.log(` Humedad Suelo  : ${humedadSuelo} %`);
    console.log("=================================================");

    const { rows: nodo } = await db.query(
      "SELECT * FROM nodos WHERE nombre_nodo = $1 LIMIT 1",
      [nodeId]
    );

    if (!nodo || nodo.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Nodo no encontrado. Debe registrarlo primero.",
      });
    }

    const idNodo = nodo[0].id_nodo;
    console.log("ID del Nodo:", idNodo);

    const { rows: sensoresNodo } = await db.query(`
      SELECT s.id_sensor, t.nombre as tipo_nombre
      FROM sensores s
      JOIN tipos_sensores t ON s.id_tipo_sensor = t.id_tipo_sensor
      WHERE s.id_nodo = $1
    `, [idNodo]);

    if (!sensoresNodo || sensoresNodo.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "El nodo no tiene sensores registrados.",
      });
    }

    const lecturasAInsertar = [];

    for (const sensor of sensoresNodo) {
      const nombreTipo = (sensor.tipo_nombre || "").toLowerCase();

      if (nombreTipo.includes("temp")) {
        lecturasAInsertar.push({ id_sensor: sensor.id_sensor, valor: temperatura });
      } else if (nombreTipo.includes("suelo") || nombreTipo.includes("tierra")) {
        lecturasAInsertar.push({ id_sensor: sensor.id_sensor, valor: humedadSuelo });
      } else if (nombreTipo.includes("humed") || nombreTipo.includes("aire")) {
        lecturasAInsertar.push({ id_sensor: sensor.id_sensor, valor: humedadAire });
      }
    }

    if (lecturasAInsertar.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No se pudieron mapear las lecturas a los sensores del nodo.",
      });
    }

    const values = [];
    const placeholders = lecturasAInsertar.map((lectura, i) => {
      values.push(lectura.id_sensor, lectura.valor);
      return `($${i * 2 + 1}, $${i * 2 + 2})`;
    }).join(", ");

    const insertQuery = `INSERT INTO lecturas (id_sensor, valor) VALUES ${placeholders} RETURNING *`;
    const { rows: lecturasInsertadas } = await db.query(insertQuery, values);

    console.log("Lecturas guardadas correctamente:", lecturasInsertadas);

    const io = req.app.get("io");
    if (io) {
      io.emit("new-lectura", lecturasInsertadas);
      io.to(`node:${nodeId}`).emit("new-lectura", lecturasInsertadas);
    }

    res.status(200).json({
      status: "success",
      data: "Telemetry_OK",
      lecturas: lecturasInsertadas,
    });
  } catch (error) {
    console.error("Error de procesamiento HTTP:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};
