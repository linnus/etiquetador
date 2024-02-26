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
// Adiciona um listener para o novo dropdown de lojas
document
  .getElementById("lojasDropdown")
  .addEventListener("change", handleLojasChange, false);

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = e.target.result;
    const workbook = XLSX.read(data, {
      type: "binary",
    });

    // Pega o nome da segunda aba/sheet
    const secondSheetName = workbook.SheetNames[1];
    // Obtém a segunda aba/sheet
    const worksheet = workbook.Sheets[secondSheetName];
    globalJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Assume que a coluna F é a sexta coluna, com índice 5
    const lojas = globalJson
      .map((row) => row[5])
      .filter((value, index) => index > 0 && value); // Filtra valores não vazios
    const uniqueLojas = Array.from(new Set(lojas));

    // Exibe o dropdown de lojas após carregar os dados
    document.getElementById("lojasDropdown").style.display = "block";
    fillDropdown(["Selecione a loja", ...uniqueLojas], "lojasDropdown");

    // Considerando que o dropdown de categorias deve começar oculto
    // e será exibido somente após a seleção de uma loja
    document.getElementById("categoryDropdown").style.display = "none";
    fillDropdown(["Selecione uma categoria"], "categoryDropdown"); // Inicializa com a opção de prompt

    // O dropdown de SKUs também deve começar oculto e será exibido somente
    // após a seleção de uma categoria, o que será tratado na função handleCategoryChange
    document.getElementById("skusDropdown").style.display = "none";
    fillDropdown(["Selecione um SKU"], "skusDropdown"); // Inicializa com a opção de prompt
  };

  reader.readAsBinaryString(file);
}

function handleLojasChange(event) {
  const selectedLoja = event.target.value;
  let categories;
  let skus;

  // Filtra as categorias com base na loja selecionada
  categories = globalJson
    .filter((row) => row[5] === selectedLoja)
    .map((row) => row[0]);

  const uniqueCategories = Array.from(new Set(categories));

  // Limpa e oculta o dropdown de SKUs quando uma nova loja é selecionada
  document.getElementById("skusDropdown").style.display = "none";
  fillDropdown([], "skusDropdown");

  // Atualiza e exibe o dropdown de categorias com as categorias filtradas
  document.getElementById("categoryDropdown").style.display = "inline-block";
  fillDropdown(
    ["Selecione uma categoria", "Todas as Categorias", ...uniqueCategories],
    "categoryDropdown"
  );
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

  if (dropdown.firstChild) {
    // Define a primeira opção como desabilitada e selecionada
    dropdown.firstChild.disabled = true;
    dropdown.firstChild.selected = true;
  }
}

function handleCategoryChange(event) {
  const selectedCategory = event.target.value;
  const selectedLoja = document.getElementById("lojasDropdown").value;
  let skus;

  // Filtra as categorias e SKUs com base na loja e na categoria selecionadas
  const filteredData = globalJson.filter((row) => {
    const matchesLoja =
      selectedLoja === "Selecione uma loja" || row[5] === selectedLoja;
    return (
      matchesLoja &&
      (selectedCategory === "Todas as Categorias" ||
        row[0] === selectedCategory)
    );
  });

  // Extrai os SKUs das linhas filtradas
  skus = filteredData.map((row) => `${row[3]} - ${row[2]}`);
  // Ordena as SKUs em ordem alfabética
  skus.sort();

  // Verifica se a categoria selecionada é válida e não é o prompt de seleção
  if (selectedCategory !== "Selecione uma categoria") {
    document.getElementById("skusDropdown").style.display = "inline-block";
    // Adiciona as opções "Selecione um SKU" e "Gerar Todos" no início da lista
    fillDropdown(["Selecione um SKU", "Gerar Todos", ...skus], "skusDropdown");
  } else {
    // Oculta o dropdown de SKUs se "Selecione uma categoria" for selecionado
    document.getElementById("skusDropdown").style.display = "none";
    fillDropdown(["Selecione um SKU"], "skusDropdown"); // Reseta com a opção de prompt
  }
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
  const selectedCategory = document.getElementById("categoryDropdown").value;
  const selectedLoja = document.getElementById("lojasDropdown").value;
  const dataContainer = document.getElementById("dataContainer");

  dataContainer.innerHTML = ""; // Limpa o container antes de adicionar novos dados

  // Não faz nada se a opção de prompt estiver selecionada
  if (selectedSku === "Selecione um SKU" || selectedSku === "") {
    return;
  }

  let rowsToDisplay;

  // Filtra os dados com base na loja, na categoria e no SKU selecionados
  rowsToDisplay = globalJson.filter((row) => {
    const matchesLoja =
      selectedLoja === "Selecione uma loja" || row[5] === selectedLoja;
    const matchesCategory =
      selectedCategory === "Todas as Categorias" || row[0] === selectedCategory;
    const matchesSku =
      selectedSku === "Gerar Todos" || `${row[3]} - ${row[2]}` === selectedSku;
    return matchesLoja && matchesCategory && matchesSku;
  });

  rowsToDisplay.forEach((row) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "labelA6"; // Aplica a classe labelA6 à div de linha

    const valorDiv = document.createElement("div");
    valorDiv.className = "valor"; // Cria a div .valor

    // Mapeamento das classes de acordo com a ordem C, B, D, E, A
    const columnClasses = ["prod", "cat", "preco_full", "preco", "skuID"];

    // A ordem dos índices representa a ordem desejada: C, B, D, E, A
    const columnIndexOrder = [2, 0, 11, 12, 3];
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
  });
}
