// ==UserScript==
// @name          Arthoria: Phasendrache
// @namespace     Voltan
// @description   Hilfslinks und -einstellungen beim Phasendrachen
// @include       https://arthoria.de/*?p=battle*
// @run-at        document-end
// @grant         none
// @version       1.2

// ==/UserScript==
window.addEventListener ("load", startPhasedragonScript, false);

function startPhasedragonScript(){
  var monstername = "";
  $("div#cg1").children().each(function(){
    if($(this).first().children().first().html().trim().indexOf("(vernichtet)") == -1){
      monstername = $(this).first().children().first().html().trim();
      return false;
    }
  });
  if(monstername.indexOf("Phasendrache")>-1){
    $("input[name='crysskill'][value='3']").attr("checked", "checked");

    $("#rc").next().after("<br><br>")
    .after(createPhasedragonAnchor("Flucht", 1)).after(" &#8212; ")
    .after(createPhasedragonAnchor("Störung", 2)).after(" &#8212; ")
    .after(createPhasedragonAnchor("Heilung", 3)).after("<br>");
  }
}

function createPhasedragonAnchor(name, number){
  var anchor = document.createElement("a");
  $(anchor).text(name);
  $(anchor).attr("href", "javascript:request(\'bs="+number+"\');");

  return anchor;
}
