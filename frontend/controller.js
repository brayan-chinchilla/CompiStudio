var cs_symbolTable;
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
  cs_symbolTable = $('#table_SymbolTable').DataTable({
    info: false,
    paging: false,
    scrollY: '30vh',
    fixedHeader: {
      header: true,
      footer: false
    }
  });
}

$( function() {
  initStaticEditors();
  initSymbolTable();
  initEditorTabs();
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
    cs_C3D_Editor.setValue(response.C3D);
  })
}

function optimize(){
  httpPost('/optimize', {C3D: cs_C3D_Editor.getValue()}, (response) => {
    cs_C3D_Optimizado_Editor.setValue(response.C3D_Optimizado)
  })
}

function execute(){
  httpPost('/execute', {C3D: cs_C3D_Editor.getValue()}, (response) => {
    cs_consoleEditor.setValue(response.console);
  })
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