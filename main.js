document.getElementById("scriptChoice").addEventListener("change", function () {
  const scriptChoice = document.getElementById("scriptChoice").value;
  const storeDropdown = document.getElementById("storeChoice");
  if (scriptChoice === "script_02") {
    storeDropdown.style.display = "inline-block";
  } else {
    storeDropdown.style.display = "none";
  }
});

document.getElementById("uploadForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Evita o envio padrão do formulário

  const scriptChoice = document.getElementById("scriptChoice").value;
  const storeChoice = document.getElementById("storeChoice").value;
  const fileInput = document.getElementById("upload");

  if (fileInput.files.length === 0) {
    alert("Por favor, selecione uma planilha.");
    return;
  }

  if (scriptChoice === "script_02" && (!storeChoice || storeChoice === "")) {
    alert("Por favor, selecione uma loja.");
    return;
  }

  if (scriptChoice === "script_01") {
    handleFileUploadScript01(fileInput.files[0]);
  } else if (scriptChoice === "script_02") {
    handleFileUploadScript02(fileInput.files[0]);
  }
});

// Show the 'Imprimir' button after generating labels
document.getElementById("uploadForm").addEventListener("submit", function (e) {
  setTimeout(function () {
    document.getElementById("printButton").style.display = "block";
  }, 100); // Delay to ensure the labels are generated before showing the button
});

// Handle the click event for the 'Imprimir' button to print the content
document.getElementById("printButton").addEventListener("click", function () {
  window.print();
});
