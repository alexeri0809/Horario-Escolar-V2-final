

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

    return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")
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

    let horas=["08:30","09:30","10:45","11:45","12:00","13:00","14:00","15:00","16:10","17:10"]
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

                if(h=="13:00" && d!="Sexta"){
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

async function editarAula(id){

    let novaDisciplina=prompt("Nova disciplina")

    if(!novaDisciplina) return

    await fetch("/horarios/"+id,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({disciplina:novaDisciplina})
    })

    carregarHorarios()
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

    if(hora=="13:00" && dia!="Sexta"){
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

const disciplinasStyle={
    "MAT":{bg:"#aa3a1ef6",color:"#fff"},
    "PORT":{bg:"#c22d2dff",color:"#fff"},
    "ING":{bg:"#2427d4ff",color:"#fff"},
    "PSI":{bg:"#ff9900ff",color:"#000"},
    "FQ":{bg:"#6b6b6bff",color:"#fff"},
    "EF":{bg:"#3bc6f0ff",color:"#000"},
    "SO":{bg:"#62ac5bff",color:"#fff"},
    "AC":{bg:"#430c70ff",color:"#fff"},
    "RC":{bg:"#cfe4a7ff",color:"#000"},
    "FRA":{bg:"#337c16ff",color:"#fff"},
    "AI":{bg:"#dfe221ff",color:"#000"}
}

function estiloDisciplina(nome){
    return disciplinasStyle[nome] || {bg:"#dfe6e9",color:"#000"}
}

carregarSelects()
carregarHorarios()
