document
  .getElementById("printButton")
  .addEventListener("click", printDataContainer);

function printDataContainer() {
  const dataContainer = document.getElementById("dataContainer").innerHTML;

  // Abre uma nova janela para impressão
  const printWindow = window.open("", "_blank", "height=600,width=800");

  // Escreve o documento HTML na nova janela, incluindo o arquivo CSS
  printWindow.document.write(`
      <html>
        <head>
          <title>Impressão</title>
          <link rel="stylesheet" href="./print_mktplace.css" type="text/css">
        </head>
        <body>
          ${dataContainer}
        </body>
      </html>
    `);

  printWindow.document.close(); // Fecha o fluxo de documento da nova janela
  printWindow.focus(); // Foca na nova janela

  // Aguarda o carregamento do conteúdo antes de imprimir
  printWindow.onload = function () {
    printWindow.print(); // Inicia o processo de impressão
    printWindow.close(); // Fecha a nova janela após a impressão
  };
}
