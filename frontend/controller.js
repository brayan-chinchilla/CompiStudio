var console = CodeMirror.fromTextArea(document.getElementById('console_Editor'), {
  value: "function myScript(){return 100;}\n",
  lineNumbers : true,
  firstLineNumber: 1,
  mode:  "javascript",
  theme: "material-darker",
});

var jEditor2 = CodeMirror.fromTextArea(document.getElementById('c3D_Editor1'), {
  value: "function myScript(){return 100;}\n",
  lineNumbers : true,
  firstLineNumber: 1,
  mode:  "javascript",
  theme: "material-darker",
});

jEditor2.setValue(`function func1(a, b, c = 3){
let arr;
arr[2] = true || false;
for(var i = 0; i < 5; i++){
  global b = 5 * 2 + "instance";
}
}`);



$(document).ready(function() {
  $('#example').DataTable({
    info: false,
    paging: false,
    scrollY: '30vh',
    fixedHeader: {
      header: true,
      footer: false
  }
  });
} );


function openFile() {
  var file = document.getElementById('fileInput').files[0];
  if (file) {
      var fileReader = new FileReader();
      fileReader.onload = function (fileLoadedEvent) {
          var textFromFileLoaded = fileLoadedEvent.target.result;
          //let number = activeTab.split(' ');
          jEditor.setValue(textFromFileLoaded);
      };
      fileReader.readAsText(file, "UTF-8");
  } else {
  }
}

newFileS;

$( function() {
  var tabTitle = $( "#tab_title" ),
    tabContent = $( "#tab_content" ),
    tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>",
    tabCounter = 2;

  var tabs = $( "#tabs" ).tabs();

  // Actual addTab function: adds new tab using the input from the form above
  function newFile() {
    var label = tabTitle.val() || "Tab " + tabCounter,
      id = "tabs-" + tabCounter,
      li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) ),
      tabContentHtml = tabContent.val() || "Tab " + tabCounter + " content.";

    tabs.find( ".ui-tabs-nav" ).append( li );
    tabs.append( "<div id='" + id + "'><p>" + tabContentHtml + "</p></div>" );
    tabs.tabs( "refresh" );
    tabCounter++;
  };
  newFileS = newFile;

  // Close icon: removing the tab on click
  tabs.on( "click", "span.ui-icon-close", function() {
    var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
    $( "#" + panelId ).remove();
    tabs.tabs( "refresh" );
  });
} );