let globalJson; // Variável global para armazenar os dados da planilha

document
  .getElementById("generateButton")
  .addEventListener("click", generateDataDisplay, false);

const spreadsheetUrl =
  "https://linnus.github.io/etiquetador/mktplace_geral_231207.xlsx";
loadSpreadsheetFromLink(spreadsheetUrl);
// Função para carregar dados da planilha de um link
function loadSpreadsheetFromLink(url) {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.arrayBuffer();
    })
    .then((data) => {
      const workbook = XLSX.read(new Uint8Array(data), {
        type: "array",
      });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      globalJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Processa os dados da planilha
      let skus = globalJson
        .slice(1) // Ignora o cabeçalho
        .map((row) => `${row[0]} - ${row[1]}`); // Ajuste o índice de acordo com a estrutura da sua planilha

      skus = Array.from(new Set(skus)); // Remove SKUs duplicados
      skus.sort(); // Ordena as SKUs em ordem alfabética

      // Exibe o dropdown de SKUs após carregar os dados
      document.getElementById("skusDropdown").style.display = "inline-block";
      fillDropdown(
        ["Selecione um SKU", "Gerar Todos", ...skus],
        "skusDropdown"
      );
    })
    .catch((error) => {
      console.error("Error loading the spreadsheet:", error);
    });
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

// Atualizar o event listener para o dropdown de SKUs
document.getElementById("skusDropdown").addEventListener("change", function () {
  const selectedOptions =
    document.getElementById("skusDropdown").selectedOptions;
  const selectedSkus = Array.from(selectedOptions).map(
    (option) => option.value
  );

  if (selectedSkus.length > 0 && !selectedSkus.includes("Selecione um SKU")) {
    document.getElementById("generateButton").style.display = "inline-block";
  } else {
    document.getElementById("generateButton").style.display = "none";
  }
});
function generateDataDisplay() {
  const selectedOptions =
    document.getElementById("skusDropdown").selectedOptions;
  const selectedSkus = Array.from(selectedOptions).map(
    (option) => option.value
  );
  const dataContainer = document.getElementById("dataContainer");

  dataContainer.innerHTML = ""; // Limpa o container antes de adicionar novos dados

  // Se apenas a opção de prompt estiver selecionada, não faz nada
  if (selectedSkus.length === 1 && selectedSkus[0] === "Selecione um SKU") {
    return;
  }

  let rowsToDisplay;

  if (selectedSkus.includes("Gerar Todos")) {
    // Usa todos os dados, exceto o cabeçalho
    rowsToDisplay = globalJson.slice(1);
  } else {
    // Filtra as linhas que correspondem a qualquer uma das SKUs selecionadas
    rowsToDisplay = globalJson
      .slice(1)
      .filter((row) => selectedSkus.includes(`${row[0]} - ${row[1]}`));
  }

  let printPageDiv; // Variável para manter o contêiner da página de impressão atual

  rowsToDisplay.forEach((row, index) => {
    // Certifique-se de incluir o parâmetro 'index' aqui
    // Cria uma nova "página" para cada par de .labelA6
    if (index % 2 === 0) {
      printPageDiv = document.createElement("div");
      printPageDiv.className = "print-page";
      dataContainer.appendChild(printPageDiv);
    }
    const rowDiv = document.createElement("div");
    rowDiv.className = "labelA6"; // Aplica a classe labelA6 à div de linha

    // Mapeamento das classes de acordo com a ordem B, A, D, N, C, E, G, K
    const columnClasses = [
      "prod",
      "skuID",
      "preco_full",
      "brand",
      "material",
      "origem",
      "cores",
      "qrcode",
    ];

    // A ordem dos índices representa a ordem desejada: B, A, D, N, C, E, G, K
    const columnIndexOrder = [1, 0, 3, 13, 2, 4, 6, 10];
    const columnValues = columnIndexOrder.map((index) => row[index] || ""); // Pega os valores das colunas na ordem desejada

    columnIndexOrder.forEach((index, order) => {
      const cellDiv = document.createElement("div");
      cellDiv.className = `column ${columnClasses[order]}`;

      let cellValue;
      // Se for a coluna D (preco_full), formate o número com milhares e decimais
      if (columnClasses[order] === "preco_full") {
        // Tenta converter o valor para float
        const numericValue = parseFloat(columnValues[order]);
        if (!isNaN(numericValue)) {
          // Formata o número com a localização brasileira para milhares e decimais
          let formattedValue = numericValue.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          // Separa os decimais e coloca-os dentro de um <span>
          formattedValue = formattedValue.replace(
            /,(\d{2})$/,
            "<span>,$1</span>"
          );
          cellValue = formattedValue; // Atribui o valor formatado para ser usado abaixo
        } else {
          cellValue = ""; // Se não for um número, deixa em branco
        }
      } else if (columnClasses[order] === "qrcode") {
        // Lógica para a coluna QR Code (mantenha a mesma lógica já fornecida)
        const canvas = document.createElement("canvas");
        QRCode.toCanvas(canvas, columnValues[order], function (error) {
          if (error) console.error(error);
          console.log("QR Code gerado!");
        });
        cellDiv.appendChild(canvas);
      } else {
        // Para as outras colunas, usa o valor como está
        cellValue = columnValues[order];
      }

      // Se não for a coluna do QR Code, define o valor formatado ou original no HTML da célula
      if (columnClasses[order] !== "qrcode") {
        cellDiv.innerHTML = cellValue;
      }

      rowDiv.appendChild(cellDiv); // Adiciona a célula ao div da linha
    });

    // No final da função, exibe o botão 'Imprimir'
    document.getElementById("printButton").style.display = "inline-block";

    // Adiciona a rowDiv completa ao dataContainer
    dataContainer.appendChild(rowDiv);
    printPageDiv.appendChild(rowDiv); // Adiciona a rowDiv ao contêiner da página de impressão
  });
}
