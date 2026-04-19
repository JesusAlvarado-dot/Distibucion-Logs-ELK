const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const dbConfig = {
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root123",
  database: process.env.DB_NAME || "mini_elk"
};

let pool;

async function startServer() {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await pool.query("SELECT 1");

    app.get("/health", async (req, res) => {
      res.json({
        ok: true,
        server: process.env.SERVER_NAME || "unknown"
      });
    });

    app.post("/logs", async (req, res) => {
      try {
        const { level, message, source } = req.body;

        if (!level || !message || !source) {
          return res.status(400).json({
            error: "level, message y source son obligatorios"
          });
        }

        const sql = `
          INSERT INTO logs (level, message, source)
          VALUES (?, ?, ?)
        `;

        const [result] = await pool.execute(sql, [level, message, source]);

        res.status(201).json({
          ok: true,
          insertedId: result.insertId,
          server: process.env.SERVER_NAME || "unknown"
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/logs", async (req, res) => {
      try {
        const { level, source } = req.query;

        let sql = "SELECT * FROM logs WHERE 1=1";
        const params = [];

        if (level) {
          sql += " AND level = ?";
          params.push(level);
        }

        if (source) {
          sql += " AND source = ?";
          params.push(source);
        }

        sql += " ORDER BY created_at DESC LIMIT 100";

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.listen(PORT, () => {
      console.log(`Servidor ${process.env.SERVER_NAME || "unknown"} corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();