const express  = require("express")
const path     = require("path")
const db       = require("../database/db")
const session  = require("express-session")
const bcrypt   = require("bcrypt")
const app      = express()

app.use(express.json())
app.use(session({
  secret: 'escola_bjc_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000, httpOnly: true }
}))
app.use(express.static(path.join(__dirname, "public")))

app.get("/", (req, res) => res.redirect("/login.html"))

// ── MIDDLEWARES ───────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Não autenticado' })
  next()
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user)          return res.status(401).json({ error: 'Não autenticado' })
    if (!roles.includes(req.session.user.cargo)) return res.status(403).json({ error: 'Sem permissão' })
    next()
  }
}

// ── AUTH ──────────────────────────────────────────────────────

app.post("/api/login", (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Preenche todos os campos' })
  db.get("SELECT * FROM utilizadores WHERE username = ?", [username], async (err, user) => {
    if (err)   return res.status(500).json({ error: 'Erro na base de dados' })
    if (!user) return res.status(401).json({ error: 'Utilizador não encontrado' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Password incorreta' })
    req.session.user = { id: user.id, username: user.username, nome: user.nome, cargo: user.cargo }
    res.json({ ok: true })
  })
})

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }))
})

app.get("/api/me", requireAuth, (req, res) => res.json(req.session.user))

app.post("/api/register", async (req, res) => {
  const { username, password, nome, cargo } = req.body
  if (!username || !password || !nome || !cargo) return res.status(400).json({ error: 'Preenche todos os campos' })
  if (!['aluno','professor','diretor'].includes(cargo)) return res.status(400).json({ error: 'Cargo inválido' })
  if (cargo === 'diretor' && (!req.session.user || req.session.user.cargo !== 'diretor'))
    return res.status(403).json({ error: 'Só o diretor pode criar contas de diretor' })
  if (password.length < 4) return res.status(400).json({ error: 'Password: mínimo 4 caracteres' })

  db.get("SELECT id FROM utilizadores WHERE username = ?", [username], async (err, row) => {
    if (err)  return res.status(500).json({ error: 'Erro na base de dados' })
    if (row)  return res.status(409).json({ error: 'Nome de utilizador já existe' })
    const hash = await bcrypt.hash(password, 10)
    db.run("INSERT INTO utilizadores(username,password,nome,cargo) VALUES(?,?,?,?)",
      [username, hash, nome, cargo],
      function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao criar conta' })

        // Se for professor, adiciona automaticamente à tabela de professores
        if (cargo === 'professor') {
          db.get("SELECT id FROM professores WHERE nome = ?", [nome], (err2, existing) => {
            if (!existing) {
              db.run("INSERT INTO professores(nome) VALUES(?)", [nome])
            }
          })
        }

        res.json({ ok: true })
      }
    )
  })
})

app.get("/api/utilizadores", requireRole('diretor'), (req, res) => {
  db.all("SELECT id,username,nome,cargo FROM utilizadores", (err, rows) => res.json(rows || []))
})

app.delete("/api/utilizadores/:id", requireRole('diretor'), (req, res) => {
  const id = parseInt(req.params.id)
  if (id === req.session.user.id) return res.status(400).json({ error: 'Não podes apagar a tua conta' })
  db.run("DELETE FROM utilizadores WHERE id=?", [id], err => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ ok: true })
  })
})

// ── DISPONIBILIDADE ───────────────────────────────────────────

// Professor guarda a sua disponibilidade
app.post("/api/disponibilidade", requireRole('professor'), (req, res) => {
  const userId = req.session.user.id
  const { slots } = req.body

  db.run("DELETE FROM disponibilidades WHERE user_id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!slots || slots.length === 0) return res.json({ ok: true })

    const stmt = db.prepare("INSERT OR REPLACE INTO disponibilidades(user_id,dia,hora,estado) VALUES(?,?,?,?)")
    slots.forEach(s => stmt.run(userId, s.dia, s.hora, s.estado))
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ ok: true })
    })
  })
})

// Professor carrega a sua disponibilidade
app.get("/api/disponibilidade/me", requireAuth, (req, res) => {
  db.all("SELECT * FROM disponibilidades WHERE user_id = ?", [req.session.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows || [])
  })
})

// Diretor vê disponibilidade de um professor pelo userId
app.get("/api/disponibilidade/:userId", requireRole('diretor'), (req, res) => {
  db.all("SELECT * FROM disponibilidades WHERE user_id = ?", [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows || [])
  })
})

// Diretor procura disponibilidade pelo nome do professor (para usar nos horários)
app.get("/api/disponibilidade-nome/:nome", requireRole('diretor'), (req, res) => {
  db.get("SELECT id FROM utilizadores WHERE nome = ? AND cargo = 'professor'", [req.params.nome], (err, user) => {
    if (err || !user) return res.json([]) // sem conta = sem restrições
    db.all("SELECT * FROM disponibilidades WHERE user_id = ?", [user.id], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message })
      res.json(rows || [])
    })
  })
})

// Lista professores com userId (para o diretor poder ver disponibilidade)
app.get("/api/professores-contas", requireRole('diretor'), (req, res) => {
  // Junta professores (tabela de horários) com utilizadores (conta)
  db.all("SELECT p.id, p.nome, u.id as userId FROM professores p LEFT JOIN utilizadores u ON u.nome = p.nome AND u.cargo = 'professor'", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows || [])
  })
})

// ── PROFESSORES ───────────────────────────────────────────────

app.get("/professores", requireAuth, (req, res) => {
  db.all("SELECT * FROM professores", (e, r) => res.json(r || []))
})
app.post("/professores", requireRole('diretor'), (req, res) => {
  db.run("INSERT INTO professores(nome) VALUES(?)", [req.body.nome])
  res.json({ ok: true })
})
app.delete("/professores/:id", requireRole('diretor'), (req, res) => {
  db.run("DELETE FROM professores WHERE id=?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ ok: true })
  })
})

// ── TURMAS ────────────────────────────────────────────────────

app.get("/turmas", requireAuth, (req, res) => {
  db.all("SELECT * FROM turmas", (e, r) => res.json(r || []))
})
app.post("/turmas", requireRole('diretor'), (req, res) => {
  db.run("INSERT INTO turmas(nome) VALUES(?)", [req.body.nome])
  res.json({ ok: true })
})
app.delete("/turmas/:id", requireRole('diretor'), (req, res) => {
  db.run("DELETE FROM turmas WHERE id=?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ ok: true })
  })
})

// ── DISCIPLINAS ───────────────────────────────────────────────

app.get("/disciplinas", requireAuth, (req, res) => {
  db.all("SELECT * FROM disciplinas", (e, r) => res.json(r || []))
})
app.post("/disciplinas", requireRole('diretor'), (req, res) => {
  const { nome, cor, texto } = req.body
  db.run("INSERT INTO disciplinas(nome,cor,texto) VALUES(?,?,?)", [nome, cor, texto], function(err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ ok: true })
  })
})

// ── HORÁRIOS ──────────────────────────────────────────────────

app.get("/horarios", requireAuth, (req, res) => {
  db.all("SELECT * FROM horarios", (e, r) => {
    if (e) return res.status(500).send(e)
    res.json(r)
  })
})

// Verificar disponibilidade antes de adicionar (helper async)
function verificarDisponibilidade(professor, dia, hora) {
  return new Promise(resolve => {
    db.get("SELECT id FROM utilizadores WHERE nome = ? AND cargo = 'professor'", [professor], (err, user) => {
      if (err || !user) return resolve({ ok: true }) // sem conta = sem restrições

      db.get("SELECT estado FROM disponibilidades WHERE user_id = ? AND dia = ? AND hora = ?",
        [user.id, dia, hora], (err2, slot) => {
          if (err2 || !slot) return resolve({ ok: true }) // sem disponibilidade definida = sem restrições

          if (slot.estado === 'unavail') {
            return resolve({ ok: false, error: `${professor} está marcado como indisponível neste horário` })
          }

          if (slot.estado === 'maybe') {
            // Verificar se já tem outra aula neste slot
            db.get("SELECT id FROM horarios WHERE professor = ? AND dia = ? AND hora = ?",
              [professor, dia, hora], (err3, existing) => {
                if (err3) return resolve({ ok: true })
                if (existing) {
                  return resolve({ ok: false, error: `${professor} já tem uma aula neste horário de disponibilidade "talvez"` })
                }
                resolve({ ok: true, aviso: `⚠️ ${professor} marcou este horário como "Talvez disponível"` })
              }
            )
          } else {
            resolve({ ok: true }) // avail
          }
        }
      )
    })
  })
}

// Só o diretor pode adicionar horários
app.post("/horarios", requireRole('diretor'), async (req, res) => {
  let { turma, professor, disciplina, dia, hora } = req.body

  // Validar disponibilidade do professor
  const check = await verificarDisponibilidade(professor, dia, hora)
  if (!check.ok) return res.status(409).json({ error: check.error })

  db.run(
    "INSERT INTO horarios(turma,professor,disciplina,dia,hora) VALUES(?,?,?,?,?)",
    [turma, professor, disciplina, dia, hora],
    err => {
      if (err) return res.status(500).send(err)
      res.send({ ok: true, aviso: check.aviso || null })
    }
  )
})

// Só o diretor pode editar horários
app.put("/horarios/:id", requireRole('diretor'), async (req, res) => {
  let { turma, professor, disciplina, dia, hora } = req.body

  const check = await verificarDisponibilidade(professor, dia, hora)
  if (!check.ok) return res.status(409).json({ error: check.error })

  db.run(
    "UPDATE horarios SET turma=?,professor=?,disciplina=?,dia=?,hora=? WHERE id=?",
    [turma, professor, disciplina, dia, hora, req.params.id],
    err => {
      if (err) return res.status(500).send(err)
      res.send({ ok: true, aviso: check.aviso || null })
    }
  )
})

// Só o diretor pode apagar horários
app.delete("/horarios/:id", requireRole('diretor'), (req, res) => {
  db.run("DELETE FROM horarios WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).send(err)
    res.send({ ok: true })
  })
})

app.listen(3000, () => console.log("Servidor em http://localhost:3000"))