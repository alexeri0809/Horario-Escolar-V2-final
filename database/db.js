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
CREATE TABLE IF NOT EXISTS disciplinas(
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT,
cor TEXT,
texto TEXT
)
`)

db.run(`INSERT OR IGNORE INTO disciplinas(nome,cor,texto) VALUES
('MAT','#aa3a1ef6','#ffffff'),
('PORT','#c22d2dff','#ffffff'),
('ING','#2427d4ff','#ffffff'),
('PSI','#ff9900ff','#000000'),
('FQ','#6b6b6bff','#ffffff'),
('EF','#3bc6f0ff','#000000')
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

db.run(`
CREATE TABLE IF NOT EXISTS disciplinas(
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT,
cor TEXT,
texto TEXT
)
`)

})

module.exports = db