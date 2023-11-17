function handleFileUploadScript01(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: "binary" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    createDivsFromData(json);
  };
  reader.readAsBinaryString(file); // Correção aqui
}

function getCategoriaClass(value) {
  const mappings = {
    cama: "camaba",
    organizar: "organizar",
    cozinhar: "cozinhar",
    servir: "mesaposta",
    comer: "mesaposta",
    beber: "bar",
    eletro: "eletro",
    decorar: "decorar",
    pet: "pet",
  };

  for (let keyword in mappings) {
    if (value.toLowerCase().includes(keyword)) {
      return mappings[keyword];
    }
  }
  return "";
}

function createDivsFromData(data) {
  const conteudoDiv = document.getElementById("conteudo");
  conteudoDiv.innerHTML = "";

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let div = document.createElement("div");
    div.className = "labelA6";

    const categoriaClass = getCategoriaClass(row[1]);

    div.innerHTML = `

            <div class="sku">${row[0]}</div>
            <div class="produto">${row[2]}</div>
            <div class="categoria ${categoriaClass}"></div>
            <div class="valor">
            ${
              row[3] !== row[4]
                ? `<div class="preco_full">${parseFloat(row[3]).toFixed(
                    2
                  )}</div>`
                : ""
            }
            <div class="desconto">${parseFloat(row[4]).toFixed(2)}</div></div>
            ${
              row[4] > 120
                ? `<div class="vezes">em até ${Math.min(
                    Math.floor(row[4] / 60),
                    7
                  )}x sem juros com <span>Meu Cartão</span></div>`
                : ""
            }
            ${
              row[4] > 299
                ? `<div class="cshbck">até 20% de cashback <br><span>site | loja | whats | app</span></div>`
                : `<div class="dezoff">10% off na primeira compra <br><span>com Meu Cartão</span></div>`
            } 
        `;
    conteudoDiv.appendChild(div);
  }
}
