const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'overons.db');

// ==================== WRAPPER (better-sqlite3 compatible API) ====================

class Statement {
  constructor(sqlDb, sql) { this.sqlDb = sqlDb; this.sql = sql; }
  run(...params) { this.sqlDb.run(this.sql, params); return { changes: this.sqlDb.getRowsModified() }; }
  get(...params) {
    const stmt = this.sqlDb.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    let r = undefined;
    if (stmt.step()) r = stmt.getAsObject();
    stmt.free();
    return r;
  }
  all(...params) {
    const stmt = this.sqlDb.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    const r = [];
    while (stmt.step()) r.push(stmt.getAsObject());
    stmt.free();
    return r;
  }
}

class Database {
  constructor(sqlDb) { this.sqlDb = sqlDb; }
  prepare(sql) { return new Statement(this.sqlDb, sql); }
  exec(sql) { this.sqlDb.exec(sql); }
  run(sql, params) { this.sqlDb.run(sql, params); return { changes: this.sqlDb.getRowsModified() }; }
}

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  let sqlDb;

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  sqlDb.run("PRAGMA foreign_keys = OFF");
  db = new Database(sqlDb);

  // Auto-save
  setInterval(() => { try { const data = sqlDb.export(); fs.writeFileSync(DB_PATH, Buffer.from(data)); } catch(e) {} }, 30000);
  process.on('SIGINT', () => { try { const data = sqlDb.export(); fs.writeFileSync(DB_PATH, Buffer.from(data)); } catch(e) {}; process.exit(); });
  process.on('SIGTERM', () => { try { const data = sqlDb.export(); fs.writeFileSync(DB_PATH, Buffer.from(data)); } catch(e) {}; process.exit(); });

  return db;
}

function getDb() { return db; }

module.exports = { initDatabase, getDb };
