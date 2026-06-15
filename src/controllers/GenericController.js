const db = require('../config/db');

class GenericController {
  constructor(tableName, primaryKey) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  async getAll(req, res) {
    try {
      const { rows } = await db.query(`SELECT * FROM ${this.tableName} ORDER BY ${this.primaryKey} DESC`);
      res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`, [id]);
      if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' });
      res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async create(req, res) {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const { rows } = await db.query(query, values);
      
      res.status(201).json({ status: 'success', data: rows[0] });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = $${keys.length + 1} RETURNING *`;
      
      const { rows } = await db.query(query, [...values, id]);
      if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' });
      
      res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { rowCount } = await db.query(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`, [id]);
      
      if (rowCount === 0) return res.status(404).json({ status: 'error', message: 'Not found' });
      
      res.status(200).json({ status: 'success', message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}

module.exports = GenericController;
