const supabase = require("../config/supabase");

exports.listarSensores = async (req, res) => {
  try {
    const { nodo, limite = 100 } = req.query;
    let query = supabase
      .from("sensores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(parseInt(limite));

    if (nodo) {
      query = query.eq("node_id", nodo);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }

    res.status(200).json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.ultimasLecturas = async (req, res) => {
  try {
    const { data: nodos, error: errNodos } = await supabase
      .from("sensores")
      .select("node_id")
      .order("created_at", { ascending: false });

    if (errNodos) {
      return res
        .status(500)
        .json({ status: "error", message: errNodos.message });
    }

    const nodosUnicos = [...new Set(nodos.map((n) => n.node_id))];

    const ultimos = [];
    for (const nodeId of nodosUnicos) {
      const { data, error } = await supabase
        .from("sensores")
        .select("*")
        .eq("node_id", nodeId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data.length > 0) {
        ultimos.push(data[0]);
      }
    }

    res.status(200).json({ status: "success", data: ultimos });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.listarNodos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sensores")
      .select("node_id")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }

    const nodosUnicos = [...new Set(data.map((n) => n.node_id))];

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

    const { data: nodo } = await supabase
      .from("nodos")
      .select("*")
      .eq("nombre_nodo", nodeId)
      .limit(1);
    if (nodo.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Nodo no encontrado" });
    }

    const { data, error } = await supabase
      .from("sensores")
      .insert([
        {
          node_id: nodo[0].id_nodo,
          temperatura,
          humedad_aire: humedadAire,
          humedad_suelo: humedadSuelo,
        },
      ])
      .select();

    if (error) {
      console.error("Error al insertar en Supabase:", error.message);
      return res.status(500).json({ status: "error", message: error.message });
    }

    console.log("Datos guardados en Supabase:", data);

    const io = req.app.get("io");
    if (io) {
      io.emit("sensor-reading", data[0]);
      io.to(`node:${nodeId}`).emit("sensor-reading", data[0]);
    }

    res.status(200).json({ status: "success", data: "Telemetry_OK" });
  } catch (error) {
    console.error("Error de procesamiento HTTP:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};
