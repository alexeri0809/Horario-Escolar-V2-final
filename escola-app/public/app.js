const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/professores", require("./routes/professores"));
app.use("/turmas", require("./routes/turmas"));
app.use("/horarios", require("./routes/horarios"));

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});