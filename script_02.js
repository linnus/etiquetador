function handleFileUploadScript02(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: "binary" });

    // Encontrar a aba que contém a palavra "estoque" no nome
    let sheetName;
    for (let name of workbook.SheetNames) {
      if (name.toLowerCase().includes("estoque")) {
        sheetName = name;
        break;
      }
    }

    if (!sheetName) {
      alert("Nenhuma aba com a palavra 'estoque' foi encontrada.");
      return;
    }

    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    createDivsFromDataScript02(json);
  };
  reader.readAsBinaryString(file);
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

function createDivsFromDataScript02(data) {
  const onlyElectro = document.getElementById("onlyElectro").checked;
  const conteudoDiv = document.getElementById("conteudo");
  conteudoDiv.innerHTML = "";
  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    if (onlyElectro && !row.includes("ELETRO")) {
      continue; // Pula para a próxima iteração se "apenas eletro" estiver marcado e a linha não contém "eletro"
    }
    let div = document.createElement("div");
    div.className = onlyElectro ? "labelA9" : "labelA6";

    const categoriaClass = getCategoriaClass(row[0]);

    div.innerHTML = `
    <div class="sku">${row[3]}</div>
          <div class="produto">${row[2]}</div>
          <div class="categoria ${categoriaClass}"></div>
          <div class="loja">${row[4]}</div><div class="valor">
          ${
            row[11] !== row[12]
              ? `<div class="preco_full">${parseFloat(row[11]).toFixed(
                  2
                )}</div>`
              : ""
          }
          <div class="desconto">${parseFloat(row[12]).toFixed(2)}</div>
          ${
            row[12] > 120
              ? `<div class="vezes">em até ${Math.min(
                  Math.floor(row[12] / 60),
                  7
                )}x sem juros com <span>Meu Cartão</span></div>`
              : ""
          }</div>
          ${
            row[12] > 299
              ? `<div class="cshbck">até 20% de cashback <br><span>site | loja | whats | app</span></div>`
              : `<div class="dezoff">10% off na primeira compra <br><span>com Meu Cartão</span></div>`
          }
      `;

    const selectedStore = document.getElementById("storeChoice").value;
    if (div.querySelector(".loja").textContent !== selectedStore) {
      div.style.display = "none";
    }
    conteudoDiv.appendChild(div);
  }
}
