let disciplinas=JSON.parse(localStorage.getItem("disciplinas")) || []

function criarDisciplina(){

    let nome=prompt("Nome da disciplina (ex: MAT)")
    if(!nome) return

    let cor=prompt("Cor da disciplina (ex: #ff0000)")
    if(!cor) return

    let texto=prompt("Cor do texto (#000 ou #fff)")
    if(!texto) return

    disciplinas.push({
        nome:nome,
        bg:cor,
        color:texto
    })

    localStorage.setItem("disciplinas",JSON.stringify(disciplinas))

    atualizarDisciplinas()
}

function atualizarDisciplinas(){

    let select=document.getElementById("disciplina")

    if(!select) return

    select.innerHTML=""

    disciplinas.forEach(d=>{
        select.innerHTML+=`<option>${d.nome}</option>`
    })
}

function corDisciplina(nome){
    return coresDisciplinas[nome] || "#ffffffff"
}

function calcularFim(inicio){
    let partes=inicio.split(":")
    let h=parseInt(partes[0])
    let m=parseInt(partes[1])

    m+=50

    if(m>=60){
        h++
        m-=60
    }

    return String( ).padStart(" ")+" "+String( ).padStart(" ")
}

async function carregarSelects(){
    let turmas=await fetch("/turmas").then(r=>r.json())
    let professores=await fetch("/professores").then(r=>r.json())
    let turmaSelect=document.getElementById("turma")
    let profSelect=document.getElementById("professor")
    turmaSelect.innerHTML=""
    profSelect.innerHTML=""
    turmas.forEach(t=>turmaSelect.innerHTML+=`<option>${t.nome}</option>`)
    professores.forEach(p=>profSelect.innerHTML+=`<option>${p.nome}</option>`)
}

async function carregarHorarios(){
    let dados=await fetch("/horarios").then(r=>r.json())
    let tabela=document.getElementById("tabela")

    let horas=["08:30 - 9:20","09:30 - 10:20","10:45 - 11:35","11:45 - 12:30","13:00 - 13:50","14:00 - 14:50","15:00 - 15:50","16:10 - 17:00","17:10 - 18:00"]
    let dias=["Segunda","Terca","Quarta","Quinta","Sexta"]

    tabela.innerHTML=""

    horas.forEach(h=>{
        let linha="<tr><td>"+h+"</td>"

        dias.forEach(d=>{

            let aula=dados.find(x=>x.hora==h && x.dia==d)

            if(aula){

    let fim=calcularFim(aula.hora)
    let estilo=estiloDisciplina(aula.disciplina)

    linha+=`
    <td>
    <div class="aula-card" style="background:${estilo.bg}; color:${estilo.color}">
    <b>${aula.disciplina}</b><br>
    ${aula.professor}<br>
    ${aula.hora} - ${fim}<br>
    <button onclick="editarAula('${aula.id}')">✏️</button>
    <button onclick="removerAula('${aula.id}')">🗑️</button>
    </div>
    </td>
    `
}
            else{

                if(h=="13:00 - 13:50" && d!="Sexta"){
                    linha+=`<td style="background:#eee">🍽️ Almoço</td>`
                }else{
                    linha+="<td></td>"
                }

            }

        })

        linha+="</tr>"
        tabela.innerHTML+=linha
    })
}

async function removerAula(id){

    if(!confirm("Remover esta aula?")) return

    await fetch("/horarios/"+id,{
        method:"DELETE"
    })

    carregarHorarios()
}

let aulaEditando=null

async function editarAula(id){

    aulaEditando=id

    await carregarEditorSelects()
    carregarDisciplinas()

    let dados=await fetch("/horarios").then(r=>r.json())
    let aula=dados.find(a=>a.id==id)

    if(!aula) return

    document.getElementById("editarBox").style.display="block"

    document.getElementById("editTurma").value=aula.turma
    document.getElementById("editProfessor").value=aula.professor
    document.getElementById("editDia").value=aula.dia
    document.getElementById("editHora").value=aula.hora
    document.getElementById("editDisciplina").value=aula.disciplina
}

async function guardarEdicao(){

    let turma=document.getElementById("editTurma").value
    let professor=document.getElementById("editProfessor").value
    let dia=document.getElementById("editDia").value
    let hora=document.getElementById("editHora").value
    let disciplina=document.getElementById("editDisciplina").value

    if(!turma || !professor || !disciplina) return

    await fetch("/horarios/"+aulaEditando,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({turma,professor,disciplina,dia,hora})
    })

    fecharEditor()
    carregarHorarios()
}

function fecharEditor(){
    document.getElementById("editarBox").style.display="none"
}

async function addHorario(){

    let turma=document.getElementById("turma").value
    let professor=document.getElementById("professor").value
    let dia=document.getElementById("dia").value
    let hora=document.getElementById("hora").value
    let disciplina=document.getElementById("disciplina").value

    if(!turma || !professor || !hora || !disciplina){
        alert("Preencha todos os campos")
        return
    }

    if(hora=="13:00 - 13:50" && dia!="Sexta"){
        alert("⛔ Hora de almoço! Não é possível adicionar aulas às 13:00 de Segunda a Quinta.")
        return
    }

    await fetch("/horarios",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({turma,dia,hora,disciplina,professor})
    })

    carregarHorarios()
}

async function carregarDisciplinas(){

    disciplinas = await fetch("/disciplinas").then(r=>r.json())

    let select=document.getElementById("disciplina")
    let selectEdit=document.getElementById("editDisciplina")
    let nomesUsados = []

disciplinas.forEach(d=>{

    if(nomesUsados.includes(d.nome)) return
    nomesUsados.push(d.nome)

    if(select)
        select.innerHTML+=`<option>${d.nome}</option>`

    if(selectEdit)
        selectEdit.innerHTML+=`<option>${d.nome}</option>`

})

    if(select) select.innerHTML=""
    if(selectEdit) selectEdit.innerHTML=""

    disciplinas.forEach(d=>{

        if(select)
            select.innerHTML+=`<option>${d.nome}</option>`

        if(selectEdit)
            selectEdit.innerHTML+=`<option>${d.nome}</option>`

    })
}

function estiloDisciplina(nome){

    let d=disciplinas.find(x=>x.nome==nome)

    if(d) return {bg:d.cor,color:d.texto}

    return {bg:"#dfe6e9",color:"#000"}
}

async function carregarEditorSelects(){

    let turmas=await fetch("/turmas").then(r=>r.json())
    let professores=await fetch("/professores").then(r=>r.json())

    let turmaSelect=document.getElementById("editTurma")
    let profSelect=document.getElementById("editProfessor")

    turmaSelect.innerHTML=""
    profSelect.innerHTML=""

    turmas.forEach(t=>{
        turmaSelect.innerHTML+=`<option>${t.nome}</option>`
    })

    professores.forEach(p=>{
        profSelect.innerHTML+=`<option>${p.nome}</option>`
    })
}

async function novaDisciplina(){

    let nome=prompt("Nome da disciplina")
    if(!nome) return

    let cor=prompt("Cor da disciplina (#ff0000)")
    if(!cor) return

    let texto=prompt("Cor do texto (#000000 ou #ffffff)")
    if(!texto) return

    await fetch("/disciplinas",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({nome,cor,texto})
    })

    carregarDisciplinas()
}

function abrirDisciplina(){
    document.getElementById("novaDisciplinaBox").style.display="block"
}

function fecharDisciplina(){
    document.getElementById("novaDisciplinaBox").style.display="none"
}

async function guardarDisciplina(){

    let nome=document.getElementById("discNome").value
    let cor=document.getElementById("discCor").value
    let texto=document.getElementById("discTexto").value

    if(!nome) return

    await fetch("/disciplinas",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({nome,cor,texto})
    })

    fecharDisciplina()
    carregarDisciplinas()

}

carregarSelects()
carregarHorarios()
atualizarDisciplinas()
carregarDisciplinas()

