var cs_C3D_Editor;
var cs_C3D_Optimizado_Editor;
var cs_consoleEditor;

function initStaticEditors(){
  cs_consoleEditor = CodeMirror.fromTextArea(document.getElementById('console_Editor'), {
    lineNumbers : true,
    mode:  "javascript",
    theme: "material-darker",
  });
  cs_consoleEditor.refresh();

  cs_C3D_Editor = CodeMirror.fromTextArea(document.getElementById('C3D_Editor'), {
    lineNumbers : true,
    mode:  "javascript",
    theme: "material-darker",
  });
  cs_C3D_Editor.refresh();

  cs_C3D_Optimizado_Editor = CodeMirror.fromTextArea(document.getElementById('C3D_Optimizado_Editor'), {
    lineNumbers : true,
    mode:  "javascript",
    theme: "material-darker",
  });
  cs_C3D_Optimizado_Editor.refresh();
}

function initSymbolTable(){
  $('#table_SymbolTable').DataTable({
    info: false,
    paging: false,
    searching: false,
    scrollY: '30vh',
    fixedHeader: {
      header: true,
      footer: false
    },
    order: [],
    columns: [
      {data: 'id'},
      {data: 'type'},
      {data: 'jType'},
      {data: 'scope'},
      {data: 'size'},
      {data: 'pos'}
    ]

  });
}

function initErrorTable(){
  $('#table_ErrorTable').DataTable({
    info: false,
    paging: false,
    searching: false,
    scrollY: '30vh',
    fixedHeader: {
      header: true,
      footer: false
    },
    order: [],
    columns: [
      {data: 'type'},
      {data: 'detail'},
      {data: 'line'},
      {data: 'column'}
    ]

  });
}

function initOptimizationTable(){
  $('#table_OptimizationTable').DataTable({
    info: false,
    paging: false,
    searching: false,
    scrollY: '30vh',
    fixedHeader: {
      header: true,
      footer: false
    },
    order: [],
    columns: [
      {data: 'original'},
      {data: 'optimized'},
      {data: 'rule'},
      {data: 'line'}
    ]

  });
}

function initHeapAndStack(){
  var options = {
    info: false,
    paging: false,
    searching: false,
    scrollY: '30vh',
    fixedHeader: {
      header: true,
      footer: false
    },
    order: [],
    columns: [
      {data: 'pos'},
      {data: 'val'},
      {data: 'ascii'}
    ]
  }

  $("#heap").DataTable(options);
  $("#stack").DataTable(options);
}

$( function() {
  initStaticEditors();
  initEditorTabs();
  initSymbolTable();
  initErrorTable();
  initOptimizationTable();
  initHeapAndStack();

  $('#myTab').on('shown.bs.tab', (e) => {
    switch(e.target.id){
      case "symbol-table-tab":
        $('#table_SymbolTable').DataTable().draw();
        break;
      case "error-report-tab":
        $('#table_ErrorTable').DataTable().draw();
        break;
      case "optimization-report-tab":
        $('#table_OptimizationTable').DataTable().draw();
        break;
      case "console-tab":
        cs_consoleEditor.refresh();
        break;
    }
  })
} );

function initEditorTabs(){

  $("#jEditor_FileJ_1").data('CodeMirrorInstance',
    CodeMirror.fromTextArea(document.getElementById("jEditor_FileJ_1"), {
      lineNumbers : true,
      mode:  "javascript",
      theme: "material-darker",
    })
  );

  var tabTemplate = "<li><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close' role='presentation'>x</span></li>";
  var tabCounter = 2;

  var tabs = $( "#tabs" ).tabs();

  // Actual addTab function: adds new tab using the input from the form above
  $('#newFileMenu').click(function() {
    var label = "FileJ_" + tabCounter;
    var id = "FileJ_" + tabCounter;
    var li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );

    tabs.find( ".ui-tabs-nav" ).append( li );

    tabs.append(`
      <div id="${id}" style="height:90%">
      <textarea style="width: 100%; height:100%" id="jEditor_${id}"></textarea>
      </div> 
    `)

    tabs.tabs( "refresh" );
    tabs.tabs( "option", "active", tabs.find(".ui-tabs-nav > li").length - 1);
    tabCounter++;

    var jEditor = CodeMirror.fromTextArea(document.getElementById("jEditor_" + id), {
      lineNumbers : true,
      mode:  "javascript",
      theme: "material-darker",
    });

    $("#jEditor_" + id).data('CodeMirrorInstance', jEditor);
    jEditor.refresh();
  });

  $('#fileInput').change(function() {
    var file = document.getElementById('fileInput').files[0];
    if (file) {
        var fileReader = new FileReader();
        fileReader.onload = function (fileLoadedEvent) {
            var textFromFileLoaded = fileLoadedEvent.target.result;

            $('#newFileMenu').click();
            var editorId = "jEditor_" + tabs.find(".ui-tabs-nav > li:last-child").attr('aria-controls');

            var editor = $("#" + editorId).data('CodeMirrorInstance');
            editor.setValue(textFromFileLoaded);
        };
        fileReader.readAsText(file, "UTF-8");
    } else {
      alert("No se pudo abrir el archivo")
    }
  });

  // Close icon: removing the tab on click
  tabs.on( "click", "span.ui-icon-close", function() {
    var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
    $( "#" + panelId ).remove();
    tabs.tabs( "refresh" );
  });
}

function compile(){
  var focusedTab =  $( "#tabs" ).tabs( "option", "active" ) + 1;

  var editorId = "jEditor_" + $("#tabs").find(`.ui-tabs-nav > li:nth-child(${focusedTab})`).attr('aria-controls');  
  var editor = $("#" + editorId).data('CodeMirrorInstance');

  httpPost('/compile', {sourceCode: editor.getValue()}, (response) => {
    //AST
    var element = Viz(response.ast, "svg");
		var DOMURL = window.URL || window.webkitURL || window;
		var svgBlob = new Blob([element], {type: 'image/svg+xml;charset=utf-8'});
		var url = DOMURL.createObjectURL(svgBlob);	
    $('#AST').attr('href', url);
    
    //symbolTable
    $('#table_SymbolTable').DataTable().clear().rows.add(response.symbolTable).draw();

    //errorTable
    response.errorTable.forEach(e => {
      e.detail = e.detail.split("\n").join("<br>")
    })
    $('#table_ErrorTable').DataTable().clear().rows.add(response.errorTable).draw();

    //3D Code
    cs_C3D_Editor.setValue(response.C3D);

    //Show tabs
    if(response.errorTable.length == 0){
      $('#symbol-table-tab').tab('show')
    }
    else{
      alert("Errors found during compilation, see report")
      $('#error-report-tab').tab('show')
    }
  })
}

function optimize(){
  httpPost('/optimize', {C3D: cs_C3D_Editor.getValue()}, (response) => {
    if(response.errorMessage != null){
      alert(response.errorMessage);
      $('#optimization-table-tab').tab('show')
      return;
    }

    cs_C3D_Optimizado_Editor.setValue(response.C3D_Optimizado)

    response.report.forEach(entry => {
      entry.original = entry.original.split("\n").join("<br>");
      entry.optimized = entry.optimized.split("\n").join("<br>");
    })

    $('#table_OptimizationTable').DataTable().clear().rows.add(response.report).draw();
    $('#optimization-report-tab').tab('show')
  })
}

function execute(){

  try {
    var res = Analyzer.parse(cs_C3D_Editor.getValue());
    if (res != null && res != undefined) {
        let resNode = res.execute();
        if (resNode != null) {
          cs_consoleEditor.setValue(resNode.getSalida());

          $("#heap").DataTable().clear().rows.add(getTableAsArray(resNode.getHeapAsTable())).draw();
          $("#stack").DataTable().clear().rows.add(getTableAsArray(resNode.getStackAsTable())).draw();
        }else{
          cs_consoleEditor.setValue('Error no recuperable. Revise su archivo o coloque su duda en canvas');
        }
    }
  } catch (error) {
    cs_consoleEditor.setValue(error.message);
  } finally {
    $('#console-tab').tab('show')
  }
}

function getTableAsArray(htmlString){
  var table = document.createElement("table")
  table.innerHTML = htmlString;

  var result = [];
  var rows = table.rows;

  for(var i = 1; i < rows.length; i++){
    valAsNum = Number(rows[i].cells[1].textContent);
    var entry = {
      pos: rows[i].cells[0].textContent,
      val: rows[i].cells[1].textContent,
      ascii: valAsNum >= 32 && valAsNum <= 126 ? "'" + String.fromCharCode(valAsNum) + "'" : ""
    }

    result.push(entry);
  }

  return result;
}

function httpPost(url, obj, callback){
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-Type", "application/json");
  http.onreadystatechange = function(){
    if(http.readyState == 4){
      if(http.status == 200){
        callback(JSON.parse(http.responseText));
      }else{
        alert("Error en el servidor, ver consola")
      }
    }
  }
  http.send(JSON.stringify(obj));
}

function saveFile() {
  var focusedTab =  $( "#tabs" ).tabs( "option", "active" ) + 1;
  var editorId = "jEditor_" + $("#tabs").find(`.ui-tabs-nav > li:nth-child(${focusedTab})`).attr('aria-controls');  
  var editor = $("#" + editorId).data('CodeMirrorInstance');

  var textToWrite = editor.getValue();
  var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });

  var downloadLink = document.createElement("a");
  downloadLink.download = "file.j";
  downloadLink.innerHTML = "Descargar Archivo";
  if (window.webkitURL != null) {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
  }
  else {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
      downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
  }
  downloadLink.click();
}