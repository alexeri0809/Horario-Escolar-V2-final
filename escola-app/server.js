const express = require("express")
const db = require("../database/db")
const app = express()

app.use(express.json())
app.use(express.static("public"))

// professores
app.get("/professores",(req,res)=>{
    db.all("SELECT * FROM professores",(e,r)=>res.json(r))
})
app.post("/professores",(req,res)=>{
    db.run("INSERT INTO professores(nome) VALUES(?)",[req.body.nome])
    res.json({ok:true})
})
app.delete("/professores/:id",(req,res)=>{
    const id=req.params.id
    db.run("DELETE FROM professores WHERE id=?",[id],function(err){
        if(err) return res.status(500).json({error: err.message})
        res.json({ok:true})
    })
})

// turmas
app.get("/turmas",(req,res)=>{
    db.all("SELECT * FROM turmas",(e,r)=>res.json(r))
})
app.post("/turmas",(req,res)=>{
    db.run("INSERT INTO turmas(nome) VALUES(?)",[req.body.nome])
    res.json({ok:true})
})
app.delete("/turmas/:id",(req,res)=>{
    const id=req.params.id
    db.run("DELETE FROM turmas WHERE id=?",[id],function(err){
        if(err) return res.status(500).json({error: err.message})
        res.json({ok:true})
    })
})

// horários
app.get("/horarios",(req,res)=>{
    db.all("SELECT * FROM horarios",(e,r)=>res.json(r))
})
app.post("/horarios",(req,res)=>{
    const {turma,dia,hora,disciplina,professor}=req.body
    db.run(
        `INSERT INTO horarios(turma,dia,hora,disciplina,professor)
         VALUES(?,?,?,?,?)`,
        [turma,dia,hora,disciplina,professor]
    )
    res.json({ok:true})
})

app.listen(3000,()=>console.log("Servidor em http://localhost:3000"))