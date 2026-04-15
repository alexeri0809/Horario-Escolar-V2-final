const sqlite3 = require("sqlite3").verbose()

const db = new sqlite3.Database("escola.db")

db.serialize(()=>{

db.run(`
CREATE TABLE IF NOT EXISTS professores(
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT
)
`)

db.run(`
CREATE TABLE IF NOT EXISTS turmas(
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT
)
`)

db.run(`
CREATE TABLE IF NOT EXISTS horarios(
id INTEGER PRIMARY KEY AUTOINCREMENT,
turma TEXT,
professor TEXT,
disciplina TEXT,
dia TEXT,
hora TEXT
)
`)

})

module.exports = db