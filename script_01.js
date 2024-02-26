let globalJson; // Variável global para armazenar os dados da planilha

document
  .getElementById("fileInput")
  .addEventListener("change", handleFileSelect, false);
document
  .getElementById("categoryDropdown")
  .addEventListener("change", handleCategoryChange, false);
document
  .getElementById("generateButton")
  .addEventListener("click", generateDataDisplay, false);

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = e.target.result;
    const workbook = XLSX.read(data, {
      type: "binary",
    });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    globalJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const categories = globalJson
      .map((row) => row[1])
      .filter((value, index) => index > 0);
    const uniqueCategories = Array.from(new Set(categories));
    // Exibe o dropdown de categorias após carregar os dados
    document.getElementById("categoryDropdown").style.display = "inline-block";
    // Adiciona as opções "Selecione uma categoria" e "Todas as Categorias" no início
    fillDropdown(
      ["Selecione uma categoria", "Todas as Categorias", ...uniqueCategories],
      "categoryDropdown"
    );
  };

  reader.readAsBinaryString(file);
}

function fillDropdown(options, dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  dropdown.innerHTML = "";

  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.textContent = option;
    optionElement.value = option;
    dropdown.appendChild(optionElement);
  });

  // Define a primeira opção como desabilitada e selecionada
  dropdown.firstChild.disabled = true;
  dropdown.firstChild.selected = true;
}

function handleCategoryChange(event) {
  const selectedCategory = event.target.value;
  let skus;
  // Exibe o dropdown de SKUs apenas se uma categoria válida for selecionada
  if (selectedCategory !== "Selecione uma categoria") {
    document.getElementById("skusDropdown").style.display = "inline-block";
  } else {
    // Oculta o dropdown de SKUs se "Selecione uma categoria" for selecionado
    document.getElementById("skusDropdown").style.display = "none";
  }
  if (selectedCategory === "Todas as Categorias") {
    skus = globalJson
      .slice(1) // Ignora o cabeçalho
      .map((row) => `${row[0]} - ${row[2]}`);
  } else {
    skus = globalJson
      .filter((row) => row[1] === selectedCategory)
      .map((row) => `${row[0]} - ${row[2]}`);
  }

  // Ordena as SKUs em ordem alfabética
  skus.sort();

  // Adiciona as opções "Selecione um SKU" e "Gerar Todos" no início da lista
  fillDropdown(["Selecione um SKU", "Gerar Todos", ...skus], "skusDropdown");
}

// Oculta o botão gerar
document
  .getElementById("skusDropdown")
  .addEventListener("change", function (event) {
    const selectedSku = event.target.value;
    // Verifica se o SKU selecionado é válido e não é o prompt de seleção
    if (selectedSku !== "" && selectedSku !== "Selecione um SKU") {
      document.getElementById("generateButton").style.display = "inline-block"; // Exibe o botão
    } else {
      document.getElementById("generateButton").style.display = "none"; // Mantém o botão oculto
    }
  });

function generateDataDisplay() {
  const selectedSku = document.getElementById("skusDropdown").value;
  const dataContainer = document.getElementById("dataContainer");

  dataContainer.innerHTML = ""; // Limpa o container antes de adicionar novos dados

  if (selectedSku === "Selecione um SKU" || selectedSku === "") {
    return; // Não faz nada se a opção de prompt estiver selecionada
  }

  let rowsToDisplay;

  if (selectedSku === "Gerar Todos") {
    const selectedCategory = document.getElementById("categoryDropdown").value;
    rowsToDisplay = globalJson
      .slice(1) // Ignora o cabeçalho
      .filter(
        (row) =>
          selectedCategory === "Todas as Categorias" ||
          row[1] === selectedCategory
      );
  } else {
    rowsToDisplay = [
      globalJson.find((row) => `${row[0]} - ${row[2]}` === selectedSku),
    ].filter((row) => row); // Filtra linhas não definidas
  }

  let printPageDiv; // Variável para manter o contêiner da página de impressão atual

  rowsToDisplay.forEach((row, index) => {
    // Certifique-se de incluir o parâmetro 'index' aqui
    // Cria uma nova "página" para cada par de .labelA6
    if (index % 4 === 0) {
      printPageDiv = document.createElement("div");
      printPageDiv.className = "print-page";
      dataContainer.appendChild(printPageDiv);
    }
    const rowDiv = document.createElement("div");
    rowDiv.className = "labelA6"; // Aplica a classe labelA6 à div de linha

    const valorDiv = document.createElement("div");
    valorDiv.className = "valor"; // Cria a div .valor

    // Mapeamento das classes de acordo com a ordem C, B, D, E, A
    const columnClasses = ["prod", "cat", "preco_full", "preco", "skuID"];

    // A ordem dos índices representa a ordem desejada: C, B, D, E, A
    const columnIndexOrder = [2, 1, 3, 4, 0];
    const columnValues = columnIndexOrder.map((index) => row[index] || ""); // Pega os valores das colunas na ordem desejada

    // Verifica se os valores de D e E são iguais
    const displayPrecoFull = columnValues[2] !== columnValues[3];

    columnIndexOrder.forEach((index, order) => {
      const cellDiv = document.createElement("div");
      const cellValue = columnValues[order];
      let cellClass = `column ${columnClasses[order]}`;

      // Se a coluna for 'cat', adiciona o valor da célula como uma classe
      if (columnClasses[order] === "cat" && cellValue) {
        cellClass += ` ${cellValue.toLowerCase().replace(/\s+/g, "-")}`; // Converte espaços em hífens e tudo para minúsculas
      }

      cellDiv.className = cellClass;
      cellDiv.innerHTML = cellValue; // Usa innerHTML para permitir a inclusão do HTML no texto

      // Agrupa as divs .preco_full e .preco dentro da div .valor
      if (cellClass.includes("preco_full") && !displayPrecoFull) {
        return; // Não exibe a div .preco_full se D e E forem iguais
      } else if (
        cellClass.includes("preco_full") ||
        cellClass.includes("preco")
      ) {
        valorDiv.appendChild(cellDiv); // Adiciona a div .preco_full ou .preco na div .valor
      } else {
        rowDiv.appendChild(cellDiv); // Adiciona as outras divs diretamente na rowDiv
      }

      // Se estivermos na coluna 'preco', verifica se é necessário adicionar a div .parcel
      if (order === 3) {
        const valorPreco = parseFloat(cellValue);
        if (!isNaN(valorPreco) && valorPreco > 100) {
          const parcelas = Math.min(
            Math.max(Math.floor(valorPreco / 50), 2),
            7
          );
          const parcelDiv = document.createElement("div");
          parcelDiv.className = "column parcel";
          parcelDiv.innerHTML = `em até ${parcelas}x sem juros com Meu Cartão`;
          valorDiv.appendChild(parcelDiv); // Adiciona a div .parcel na div .valor
        }
      }
    });

    if (valorDiv.hasChildNodes()) {
      rowDiv.appendChild(valorDiv); // Adiciona a div .valor na rowDiv se ela tiver filhos
    }

    // Verifica o valor de E para adicionar .dezoff ou .cshbck
    const valorE = parseFloat(columnValues[3]);
    if (!isNaN(valorE)) {
      const newDiv = document.createElement("div");
      if (valorE < 299) {
        newDiv.className = "column dezoff";
        newDiv.innerHTML = `10% off na primeira compra <br><span>com Meu Cartão</span>`;
      } else {
        newDiv.className = "column cshbck";
        newDiv.innerHTML = `+ 20% de cashback <br><span>site | loja | whats | app</span>`;
      }
      rowDiv.appendChild(newDiv);
    }

    if (valorDiv.hasChildNodes()) {
      rowDiv.appendChild(valorDiv); // Adiciona a div .valor na rowDiv se ela tiver filhos
    }
    // No final da função, exibe o botão 'Imprimir'
    document.getElementById("printButton").style.display = "inline-block";

    // Adiciona a rowDiv completa ao dataContainer
    dataContainer.appendChild(rowDiv);
    printPageDiv.appendChild(rowDiv); // Adiciona a rowDiv ao contêiner da página de impressão
  });
}
