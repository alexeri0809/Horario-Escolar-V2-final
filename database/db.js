const sqlite3 = require("sqlite3").verbose()
const bcrypt = require("bcrypt")

const db = new sqlite3.Database("escola.db")

db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS professores(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS disciplinas(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT, cor TEXT, texto TEXT
  )`)

  db.run(`INSERT OR IGNORE INTO disciplinas(nome,cor,texto) VALUES
    ('MAT','#aa3a1ef6','#ffffff'),
    ('PORT','#c22d2dff','#ffffff'),
    ('ING','#2427d4ff','#ffffff'),
    ('PSI','#ff9900ff','#000000'),
    ('FQ','#6b6b6bff','#ffffff'),
    ('EF','#3bc6f0ff','#000000')
  `)

  db.run(`CREATE TABLE IF NOT EXISTS turmas(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS horarios(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turma TEXT, professor TEXT, disciplina TEXT, dia TEXT, hora TEXT
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS utilizadores(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nome TEXT,
    cargo TEXT CHECK(cargo IN ('aluno','professor','diretor')) NOT NULL
  )`)

  // ── DISPONIBILIDADES ─────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS disponibilidades(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dia TEXT NOT NULL,
    hora TEXT NOT NULL,
    estado TEXT CHECK(estado IN ('avail','maybe','unavail')) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES utilizadores(id),
    UNIQUE(user_id, dia, hora)
  )`)

  // ── UTILIZADORES DEMO ─────────────────────────────────────────
  const demos = [
    { username: 'aluno',     nome: 'Aluno Demo',     cargo: 'aluno'     },
    { username: 'professor', nome: 'Professor Demo', cargo: 'professor' },
    { username: 'diretor',   nome: 'Diretor Demo',   cargo: 'diretor'   },
  ]

  demos.forEach(u => {
    db.get("SELECT id FROM utilizadores WHERE username = ?", [u.username], async (err, row) => {
      if (!row) {
        const hash = await bcrypt.hash('1234', 10)
        db.run(
          "INSERT INTO utilizadores(username,password,nome,cargo) VALUES(?,?,?,?)",
          [u.username, hash, u.nome, u.cargo],
          (err) => { if (!err) console.log(`✅ '${u.username}' criado (password: 1234)`) }
        )
      }
    })
  })
})

module.exports = db