let globalJson; // Variável global para armazenar os dados da planilha

const spreadsheetUrl =
  "https://linnus.github.io/etiquetador/estoque_240325.xlsx"; // Substitua com a URL da sua planilha

function loadSpreadsheetData() {
  fetch(spreadsheetUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.arrayBuffer();
    })
    .then((data) => {
      const workbook = XLSX.read(data, {
        type: "array",
      });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      globalJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Processa os dados como antes...
      // Por exemplo, se você quiser carregar categorias no dropdown:
      const categories = globalJson
        .map((row) => row[1])
        .filter((value, index) => index > 0);
      const uniqueCategories = Array.from(new Set(categories));

      // Exibe o dropdown de categorias após carregar os dados
      document.getElementById("categoryDropdown").style.display = "block";

      // Adiciona as opções "Selecione uma categoria" e "Todas as Categorias" no início
      fillDropdown(
        ["Selecione uma categoria", "Todas as Categorias", ...uniqueCategories],
        "categoryDropdown"
      );
    })
    .catch((error) => {
      console.error("Failed to load the spreadsheet data:", error);
    });
}

// Chama a função quando a página é carregada
loadSpreadsheetData();

document
  .getElementById("categoryDropdown")
  .addEventListener("change", handleCategoryChange, false);

document
  .getElementById("generateButton")
  .addEventListener("click", generateDataDisplay, false);

function formatPreco(value) {
  // Converte o valor para número e formata com duas casas decimais
  return Number(value).toFixed(2);
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

  // Se for o dropdown de SKUs, não define a primeira opção como desabilitada
  if (dropdownId !== "skusDropdown") {
    dropdown.firstChild.disabled = true;
    dropdown.firstChild.selected = true;
  }
}

function handleCategoryChange(event) {
  const selectedCategory = event.target.value;
  let skus;
  if (selectedCategory !== "Selecione uma categoria") {
    document.getElementById("skusDropdown").style.display = "block";
    document.getElementById("skusDropdownLabel").style.display = "block";
  } else {
    document.getElementById("skusDropdown").style.display = "none";
    document.getElementById("skusDropdownLabel").style.display = "none";
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

  skus.sort();

  // Adiciona a opção "Gerar Todos" no início da lista de SKUs
  fillDropdown(["Gerar Todos", ...skus], "skusDropdown");
}

// Oculta o botão gerar
document.getElementById("skusDropdown").addEventListener("change", function () {
  const selectedSkus = document.getElementById("skusDropdown").selectedOptions;
  if (selectedSkus.length > 0) {
    document.getElementById("generateButton").style.display = "inline-block"; // Exibe o botão
  } else {
    document.getElementById("generateButton").style.display = "none"; // Mantém o botão oculto
  }
});
function generateDataDisplay() {
  const selectedSkus = Array.from(
    document.getElementById("skusDropdown").selectedOptions
  ).map((option) => option.value);

  const selectedCategory = document.getElementById("categoryDropdown").value;
  const dataContainer = document.getElementById("dataContainer");
  dataContainer.innerHTML = ""; // Limpa o container antes de adicionar novos dados

  if (
    selectedSkus.length === 0 ||
    selectedCategory === "Selecione uma categoria"
  ) {
    return; // Não faz nada se nenhuma SKU for selecionada ou se a categoria não for selecionada
  }

  let rowsToDisplay;
  if (selectedSkus.includes("Gerar Todos")) {
    // Filtra as linhas baseadas na categoria selecionada se "Gerar Todos" estiver selecionado
    // e ignora a categoria "Eletro"
    rowsToDisplay = globalJson
      .slice(1) // Ignora o cabeçalho
      .filter(
        (row) =>
          (selectedCategory === "Todas as Categorias" && row[1] !== "Eletro") ||
          row[1] === selectedCategory
      );
  } else {
    // Filtra as linhas que correspondem às SKUs selecionadas
    rowsToDisplay = globalJson
      .slice(1)
      .filter(
        (row) =>
          selectedSkus.includes(`${row[0]} - ${row[2]}`) &&
          (selectedCategory === "Todas as Categorias" ||
            row[1] === selectedCategory)
      );
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
      let cellValue = columnValues[order];
      let cellClass = `column ${columnClasses[order]}`;

      // Formatar valores de preço com duas casas decimais
      if (
        columnClasses[order] === "preco_full" ||
        columnClasses[order] === "preco"
      ) {
        cellValue = formatPreco(cellValue); // Atualiza o cellValue com o valor formatado
      }

      const cellDiv = document.createElement("div");

      // Se a coluna for 'cat', adiciona o valor da célula como uma classe
      if (columnClasses[order] === "cat" && cellValue) {
        cellClass += ` ${cellValue.toLowerCase().replace(/\s+/g, "-")}`; // Converte espaços em hífens e tudo para minúsculas
      }

      cellDiv.className = cellClass;
      cellDiv.innerHTML = cellValue;

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

    const hasEletroClass =
      Array.from(rowDiv.getElementsByClassName("eletro")).length > 0;
    if (hasEletroClass) {
      rowDiv.className = "labelA9";
      printPageDiv.className = "print-pageA9"; // Altera a classe para labelA9 se houver um filho com a classe .eletro
    }
    // No final da função, exibe o botão 'Imprimir'
    document.getElementById("printButton").style.display = "inline-block";

    // Adiciona a rowDiv completa ao dataContainer
    dataContainer.appendChild(rowDiv);
    printPageDiv.appendChild(rowDiv); // Adiciona a rowDiv ao contêiner da página de impressão
  });
}
