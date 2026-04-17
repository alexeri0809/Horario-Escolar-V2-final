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
app.get("/disciplinas",(req,res)=>{
    db.all("SELECT * FROM disciplinas",(e,r)=>res.json(r))
})

app.post("/disciplinas",(req,res)=>{

    const {nome,cor,texto}=req.body

    db.run(
        "INSERT INTO disciplinas(nome,cor,texto) VALUES(?,?,?)",
        [nome,cor,texto],
        function(err){
            if(err) return res.status(500).json({error:err.message})
            res.json({ok:true})
        }
    )
})

app.put("/horarios/:id",(req,res)=>{

    let id=req.params.id
    let {turma,professor,disciplina,dia,hora}=req.body

    db.run(
        "UPDATE horarios SET turma=?, professor=?, disciplina=?, dia=?, hora=? WHERE id=?",
        [turma,professor,disciplina,dia,hora,id],
        err=>{
            if(err) return res.status(500).send(err)
            res.send({ok:true})
        }
    )
})

app.delete("/horarios/:id",(req,res)=>{
    let id=req.params.id

    db.run("DELETE FROM horarios WHERE id=?",[id],err=>{
        if(err) return res.status(500).send(err)
        res.send({ok:true})
    })
})

// disciplinas
app.get("/disciplinas",(req,res)=>{
    db.all("SELECT * FROM disciplinas",(e,r)=>res.json(r))
})

app.post("/disciplinas",(req,res)=>{

    let {nome,cor,texto}=req.body

    db.run(
        "INSERT INTO disciplinas(nome,cor,texto) VALUES(?,?,?)",
        [nome,cor,texto],
        err=>{
            if(err) return res.status(500).send(err)
            res.send({ok:true})
        }
    )

})

// horários
app.get("/horarios",(req,res)=>{
    db.all("SELECT * FROM horarios",(e,r)=>{
        if(e) return res.status(500).send(e)
        res.json(r)
    })
})

app.post("/horarios",(req,res)=>{

    let {turma,professor,disciplina,dia,hora}=req.body

    db.run(
        "INSERT INTO horarios(turma,professor,disciplina,dia,hora) VALUES(?,?,?,?,?)",
        [turma,professor,disciplina,dia,hora],
        err=>{
            if(err) return res.status(500).send(err)
            res.send({ok:true})
        }
    )

})

app.listen(3000,()=>console.log("Servidor em http://localhost:3000"))