// ==UserScript==
// @name        Arthoria: Autokampfeinstellungen
// @namespace   Voltan
// @description Personalisierung der Autokampfeinstellungen
// @include     https://arthoria.de/*
// @run-at      document-end
// @version     1.7
// @grant       none

// ==/UserScript==

var spellhelperData = {};
var spellhelperVersion = 1.7;

window.addEventListener ("load", loadSpellhelper, false);

function loadSpellhelper(){
  if(charID > 0){
    if(typeof(Storage) !== "undefined"){
      spellhelperScriptVersioncontrol();
      var toggleSpellhelperDialogueButton = createButton("toggleSpellhelperDialogueButton", "");
      toggleSpellhelperDialogueButtonImage = document.createElement("img");
      $(toggleSpellhelperDialogueButtonImage).attr({
        "id": "toggleSpellhelperDialogueButtonImage",
        "title": "Kampf-Voreinstellungen",
        "alt": "Kampf-Voreinstellungen"
      });
      if(!localStorage.getItem(charID+"_spellhelper")){
        $(toggleSpellhelperDialogueButtonImage).attr("src", getSpellhelperIcon("bad"));
      }else{
        $(toggleSpellhelperDialogueButtonImage).attr("src", getSpellhelperIcon("good"));
        if(typeof battleid !== 'undefined'){
          if($("#auto_l").length > 0){
            chooseSpell();
          }
        }
      }
      $(toggleSpellhelperDialogueButton).append(toggleSpellhelperDialogueButtonImage);
      $(toggleSpellhelperDialogueButton).click(toggleSpellhelperDialogue);
      $("#chaticons").prepend(toggleSpellhelperDialogueButton);
    }
  }
}

function toggleSpellhelperDialogue(){
  if(localStorage.getItem(charID+"_spellhelper")){
    spellhelperData = loadSpellhelperData();
  }
  if($("#spellhelperDialogue").length == 0){
    createSpellhelperDialogue();
  }
  $("#spellhelperDialogue").toggle("slow", function(){})
}
function createSpellhelperDialogue(){
  var spellhelperDialogue = document.createElement("div");
  $("div.pad5LR").append(spellhelperDialogue);
  $(spellhelperDialogue).attr({
    "id": "spellhelperDialogue",
    "class": "hintwin"
  });
  $(spellhelperDialogue).css({
    "width": "720px",
    "overflow": "auto",
    "display": "none"
  });
  $(spellhelperDialogue).append("<h4>Script für den vorbereiteten Autokampf</h4>");
  $(spellhelperDialogue).append("Optionen für das gewünschte Monster ändern und &#132;Speichern&#147; drücken.<br>");
  $(spellhelperDialogue).append("Einstellungspriorisierung: Monster &#8827; Allgemein &#8827; Arthoria-Einstellungen<br>");
  $(spellhelperDialogue).append("<b>Achtung:</b> Für das Tool ist nur das erste, nicht (vernichtet)e Monster auf Gegnerseite relevant! In der Arena werden monsterspezifische Einstellungen ignoriert.<br>");
  $(spellhelperDialogue).append("<br><hr>");

  var spellhelperTable = document.createElement("table");
  $(spellhelperTable).css({
    "table-layout": "fixed",
    "width":"100%"
  });
  $(spellhelperDialogue).append(spellhelperTable);
  var spellhelperTr = document.createElement("tr");
  var spellhelperTdLeft = document.createElement("td");
  $(spellhelperTdLeft).attr("id", "spellhelperTdLeft");
  $(spellhelperTdLeft).css("width", "240px");
  var spellhelperTdRight = document.createElement("td");
  $(spellhelperTdRight).attr("id", "spellhelperTdRight");
  $(spellhelperTable).append(spellhelperTr);
  $(spellhelperTr).append(spellhelperTdLeft).append(spellhelperTdRight);

  var spellhelperDialogueFooter = document.createElement("div");
  $(spellhelperDialogueFooter).css("text-align", "center");
  var toggleSpellhelperDialogueFooterbutton = createButton("toggleSpellhelperDialogueFooterbutton", "Schließen");
  $(toggleSpellhelperDialogueFooterbutton).click(toggleSpellhelperDialogue);
  $(spellhelperDialogueFooter).append(toggleSpellhelperDialogueFooterbutton);
  $(spellhelperDialogue).append(spellhelperDialogueFooter);

  var spellhelperMonsterSelect = document.createElement("select");
  $(spellhelperMonsterSelect).attr({
    "id": "spellhelperMonsterSelect",
    "size": 15
  });
  $(spellhelperTdLeft).append(spellhelperMonsterSelect);
  var spellhelperMonsterGeneralOption = document.createElement("option");
  $(spellhelperMonsterGeneralOption).attr({
    value: "Allgemein",
    text: "Allgemeine Einstellungen"
  });
  $(spellhelperMonsterSelect).append(spellhelperMonsterGeneralOption);
  fillSpellhelperMonsterSelect(getAllMonsters(), 0);

  $(spellhelperMonsterSelect).change(function(){
    spellhelperData = loadSpellhelperData();
    if($(spellhelperTdRight).length !=0){
      $(spellhelperTdRight).empty();
    }

    var spellhelperSaveDiv = document.createElement("div");
    $(spellhelperSaveDiv).attr("id", "spellhelperSaveDiv");
    $(spellhelperSaveDiv).css("text-align", "center");

    var spellhelperSaveButton = createButton("spellhelperSaveButton", "Speichern");
    $(spellhelperSaveButton).click(function(){
      if(saveSpellhelperOptions()){
        $(spellhelperMessageSpan).html("Einstellungen erfolgreich gespeichert!");
      }else{
        $(spellhelperMessageSpan).html("Einstellungen konnten leider nicht gespeichert werden.");
      }
    });

    var spellhelperMessageSpan = document.createElement("span");
    $(spellhelperMessageSpan).attr("id", "spellhelperMessageSpan");
    $(spellhelperSaveDiv).append(spellhelperMessageSpan).append("<br>").append(spellhelperSaveButton);

    var spellhelperOptionsDiv = document.createElement("div");
    $(spellhelperOptionsDiv).attr("id", "spellhelperOptionsDiv");
    $(spellhelperOptionsDiv).css("text-align", "center");

    $(spellhelperTdRight).append(spellhelperOptionsDiv).append("<br>").append(spellhelperSaveDiv);


    var spellhelperSpellSelect = document.createElement("select");
    $(spellhelperSpellSelect).attr("id", "spellhelperSpellSelect");
    $(spellhelperSpellSelect).change(function(){
      $(spellhelperMessageSpan).empty();
    });
    var spellStandardOption = document.createElement("option");
    $(spellStandardOption).attr({
      value: 0,
      text: "Standardzauber"
    });
    $(spellhelperSpellSelect).append(spellStandardOption);
    $.each(getAllAttackspells(), function(key, value){
      var spellOption = document.createElement("option");
      $(spellOption).attr({
        value: value,
        text: key
      });
      $(spellhelperSpellSelect).append(spellOption);
    });

    var spellhelperTerminationSelect = document.createElement("select");
    $(spellhelperTerminationSelect).attr("id", "spellhelperTerminationSelect");
    $(spellhelperTerminationSelect).change(function(){
      $(spellhelperMessageSpan).empty();
    });
    var terminationStandardOption = document.createElement("option");
    $(terminationStandardOption).attr({
      value: 0,
      text: "Standardwert"
    });
    $(spellhelperTerminationSelect).append(terminationStandardOption);
    $.each(getAllFightterminations(), function(key, value){
      var terminationOption = document.createElement("option");
      $(terminationOption).attr({
        value: value,
        text: key
      });
      $(spellhelperTerminationSelect).append(terminationOption);
    });

    if(spellhelperData[$(spellhelperMonsterSelect).val()]){
      if(spellhelperData[$(spellhelperMonsterSelect).val()]["spell"]){
        $(spellhelperSpellSelect).val(spellhelperData[$(spellhelperMonsterSelect).val()]["spell"]);
      }
      if(spellhelperData[$(spellhelperMonsterSelect).val()]["termination"]){
        $(spellhelperTerminationSelect).val(spellhelperData[$(spellhelperMonsterSelect).val()]["termination"]);
      }
    }
    $(spellhelperOptionsDiv).append("<b>"+$(spellhelperMonsterSelect).val()+"</b>").append("<br><br>");
    $(spellhelperOptionsDiv).append(spellhelperSpellSelect).append("<span>\xa0\xa0</span>").append(spellhelperTerminationSelect).append("<br><br>");
    if($(spellhelperMonsterSelect).val() != "Allgemein"){
      $(spellhelperOptionsDiv).append(createIgnoreSpelliconTable());
    }
  });
}

function createIgnoreSpelliconTable(){
  var table = document.createElement("table");
  var tr = document.createElement("tr");
  $(table).append(tr);
  var tdleft = document.createElement("td");
  var tdright = document.createElement("td");
  $(tr).append(tdleft).append(tdright);

  var ignoreSpellSelect = document.createElement("select");
  $(ignoreSpellSelect).attr("id", "spellhelperIgnoreSpelliconSelect")
  $.each(getAllSpells(), function(key, value){
    var ignoreSpellOption = document.createElement("option");
    $(ignoreSpellOption).attr({
      value: value,
      text: key
    });
    $(ignoreSpellSelect).append(ignoreSpellOption);
  });
  var addbutton = createButton("spellhelperIgnorespelliconAddButton", "ignorieren")
  $(addbutton).click(function(){
    if( $(list+" li#"+$(ignoreSpellSelect).val()) ){
      var newlistitem = document.createElement("li");
      $(newlistitem).attr("id", $(ignoreSpellSelect).val());
      $(newlistitem).html($(ignoreSpellSelect).children(":selected").html());
      $(list).append(newlistitem);
    }
    if($(list).children().length !=0){
      $(resetbutton).css("display", "inline");
    }else{
      $(resetbutton).css("display", "none");
    }
  });

  var resetbutton = createButton("spellhelperIgnoreSpelliconResetButton", "Zurücksetzen");
  $(resetbutton).css("display", "none");
  $(resetbutton).click(function(){
    $(list).empty();
    $(resetbutton).css("display", "none");
  });
  var list = document.createElement("ul");
  $(list).attr("id", "spellhelperIgnoreSpelliconList");
  if(spellhelperData[$("#spellhelperMonsterSelect").val()]){
    if(spellhelperData[$("#spellhelperMonsterSelect").val()]["ignoreSpellicons"]){
      $.each(spellhelperData[$("#spellhelperMonsterSelect").val()]["ignoreSpellicons"], function(index, value){
        var listitem = document.createElement("li");
        $(listitem).attr("id", value);
        $(listitem).html( $(ignoreSpellSelect).children(' option[value="'+value+'"]').html() );
        $(list).append(listitem);
      });
      $(resetbutton).css("display", "inline");
    }
  }

  $(tdleft).append(ignoreSpellSelect).append("\xa0").append(addbutton);
  $(tdright).append(list).append("<br>").append(resetbutton);

  return table;
}

function saveSpellhelperOptions(){
  try{
    spellhelperData = loadSpellhelperData();
    if($("#spellhelperSpellSelect").val() != 0 || $("#spellhelperTerminationSelect").val() != 0 || $("#spellhelperIgnoreSpelliconList").children().length != 0){

      if(!spellhelperData[$("#spellhelperMonsterSelect").val()]){
        spellhelperData[$("#spellhelperMonsterSelect").val()] = {};
      }

      if($("#spellhelperSpellSelect").val() != 0){
        spellhelperData[$("#spellhelperMonsterSelect").val()]["spell"] = $("#spellhelperSpellSelect").val();
      }else{
        delete spellhelperData[$("#spellhelperMonsterSelect").val()]["spell"];
      }

      if($("#spellhelperTerminationSelect").val() != 0){
        spellhelperData[$("#spellhelperMonsterSelect").val()]["termination"] = $("#spellhelperTerminationSelect").val();
      }else{
        delete spellhelperData[$("#spellhelperMonsterSelect").val()]["termination"];
      }

      if($("#spellhelperIgnoreSpelliconList").children().length != 0){
        var spellignorearray = [];
        $("#spellhelperIgnoreSpelliconList").children().each(function(){
          spellignorearray.push($(this).attr("id"));
        });
        spellignorearray.sort();
        spellhelperData[$("#spellhelperMonsterSelect").val()]["ignoreSpellicons"] = spellignorearray;
      }else{
        delete spellhelperData[$("#spellhelperMonsterSelect").val()]["ignoreSpellicons"];
      }

    }else{
      if(spellhelperData[$("#spellhelperMonsterSelect").val()]){
        delete spellhelperData[$("#spellhelperMonsterSelect").val()];
      }
    }
    saveSpellhelperData(spellhelperData);
    if($("#toggleSpellhelperDialogueButtonImage").attr("src") == getSpellhelperIcon("bad")){
      $("#toggleSpellhelperDialogueButtonImage").attr("src", getSpellhelperIcon("good"));
    }
    return true;
  }catch(error){
    return false;
  }
}

function fillSpellhelperMonsterSelect(monsterObject, depth){
//since ff&chromium doesn't support nested optgroups, this will only work, if the recursion-depth is <=1
  if(depth == 0){
    $.each(monsterObject, function(key, value){
      var optgroup = document.createElement("optgroup");
      $(optgroup).attr("label", key);
      $("#spellhelperMonsterSelect").append(optgroup);
      $("#spellhelperMonsterSelect").append(fillSpellhelperMonsterSelect(value,depth+1));
      /*nested optgroups will only work under Opera12 :/
      $(optgroup).append(fillSpellhelperMonsterSelect(value,depth+1));
      $("#spellhelperMonsterSelect").append(optgroup);
      */
    });
  }else{
    //for recursion-depth >1, this needs to be fixed.
    var optiongroups = document.createElement("optgroup");
    $.each(monsterObject, function(key, value){
      var optgroup = document.createElement("optgroup");
      $(optgroup).attr("label", "\xa0\xa0\xa0\xa0"+key);
      //$(optgroup).attr("label", key);
      if(Array.isArray(value)){
        $.each(value, function(arrayindex, subvalue){
          var option = document.createElement("option");
          $(option).attr({
            value: subvalue,
            text: "\xa0\xa0\xa0\xa0"+subvalue
            //text: subvalue
          });
          $(optgroup).append(option);
        });
      }else{
        $(optgroup).append(fillSpellhelperMonsterSelect(value,depth+1));
      }
      $(optiongroups).append(optgroup);
    });
    return $(optiongroups).children();
  }
}



function chooseSpell(){
  spellhelperData = loadSpellhelperData();
  var monstername = "";
  $("div#cg1").children().each(function(){
    if($(this).first().children().first().html().trim().indexOf("(vernichtet)") == -1){
      monstername = $(this).first().children().first().html().trim();
      return false;
    }
  });

  var charname = $("div#cg0").children().first().children().first().html().trim();
  if(spellhelperData["Allgemein"]){
    if(spellhelperData["Allgemein"]["termination"]){
      $("#auto_l").val(spellhelperData["Allgemein"]["termination"]);
    }
    if(spellhelperData["Allgemein"]["spell"]){
      $("#auto_as").val(spellhelperData["Allgemein"]["spell"]);
    }
  }

  if($("div#cg0:contains('Shasalaranajatawas')").length == 0){
    if (monstername.indexOf(charname)>-1){
      monstername = "(Spiegelbild) (Boss)";
    }
    if(spellhelperData[monstername]){
      if(spellhelperData[monstername]["termination"]){
        $("#auto_l").val(spellhelperData[monstername]["termination"]);
      }
      if(spellhelperData[monstername]["spell"] && $("#spellbook div.book div.lwindow a[id=s"+spellhelperData[monstername]['spell']+"]").length!=0){
        $("#auto_as").val(spellhelperData[monstername]["spell"]);
      }
      if(spellhelperData[monstername]["ignoreSpellicons"]){
        $.each(spellhelperData[monstername]["ignoreSpellicons"], function(index, value){
          //$("div#screen center").innerHTML().replace("s"+value+".gif&quot;></a> &nbsp; ", "s"+value+".gif&quot;></a>");
          $("div#screen center a[href*='s="+value+"']").remove();
          //$("div#screen center").html($("div#screen center").html().replace("</a> &nbsp; &nbps; ", "</a> &nbsp; "))
        });

      }
    }
  }
}

//===============================================
function createButton(id, text){
  var newButton = document.createElement("a");
  $(newButton).attr("id", id);
  $(newButton).text(text);
  $(newButton).css("cursor", "pointer");

  return newButton;
}

function saveSpellhelperData(spellhelperData){
  localStorage.setItem(charID+"_spellhelper", JSON.stringify(spellhelperData));
}

function loadSpellhelperData(){
  if(localStorage.getItem(charID+"_spellhelper")){
    return JSON.parse(localStorage.getItem(charID+"_spellhelper"));
  }else{
    return {};
  }
}

function spellhelperScriptVersioncontrol(){
  if(!localStorage.getItem("spellhelper_nextScriptupdate")){
    localStorage.setItem("spellhelper_nextScriptupdate", 0);
  }
  if(!localStorage.getItem("spellhelper_availableUpdate")){
    localStorage.setItem("spellhelper_availableUpdate", "no");
  }
  var nextScriptupdate = parseInt(localStorage.getItem("spellhelper_nextScriptupdate"));
  if(localStorage.getItem("spellhelper_availableUpdate") != "no" && nextScriptupdate <= Date.now()){
    var spellhelperRemoteversion = parseFloat(localStorage.getItem("spellhelper_availableUpdate").replace(/v/g, ""));
    if(spellhelperVersion < spellhelperRemoteversion){
      createSpellhelperScriptnotification(spellhelperVersion, spellhelperRemoteversion);
    }else{
      localStorage.setItem("spellhelper_availableUpdate", "no");
    }
  }else{
    if(nextScriptupdate <= Date.now()){
      var spellhelperRemoteversion = null;
      var spellhelperRemoteversionURL = "https://raw.githubusercontent.com/DerVoltan/Arthoria-Scripts/master/versioncontrol.json?t="+Date.now();
      var xhr = new XMLHttpRequest();
      if("withCredentials" in xhr){
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open("GET", spellhelperRemoteversionURL, true);
      }else if(typeof XDomainRequest != "undefined"){
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open("GET", spellhelperRemoteversionURL);
      }else{
        xhr = null;
      }
      if (xhr != null){
        xhr.onload = function(){
          if(xhr.responseText){
            var response = JSON.parse(xhr.responseText);
            spellhelperRemoteversion = parseFloat(response.spellhelper);
            if(spellhelperRemoteversion != null){
              if(spellhelperVersion < spellhelperRemoteversion){
                createSpellhelperScriptnotification(spellhelperVersion, spellhelperRemoteversion);
                localStorage.setItem("spellhelper_availableUpdate", "v"+spellhelperRemoteversion);
              }else{
                localStorage.setItem("spellhelper_nextScriptupdate", Date.now()+(86400000*2));
              }
            }else{
              localStorage.setItem("spellhelper_nextScriptupdate", Date.now()+(86400000*2));
              localStorage.setItem("spellhelper_availableUpdate", "no");
            }
          }
        };

        xhr.onerror = function(){
          console.log("Fehler beim Verbinden zum Server für den Versionsabgleich.")
          localStorage.setItem("spellhelper_nextScriptupdate", Date.now()+(86400000));
        };
        xhr.send();
      }
    }
  }
}

function createSpellhelperScriptnotification(spellhelperVersion, spellhelperRemoteversion){
  var spellhelperNotificationSpan = document.createElement("span");
  $(spellhelperNotificationSpan).attr("id", "spellhelperNotificationSpan");
  var spellhelperUpdateButton = document.createElement("a");
  $(spellhelperUpdateButton).attr({
    "href": "https://raw.githubusercontent.com/DerVoltan/Arthoria-Scripts/master/autokampfeinstellungen/v_spellhelper.user.js",
    "target": "_blank"
  });
  $(spellhelperUpdateButton).html("Update!");

  var spellhelperRemindlaterButton = createButton("spellhelperRemindlaterButton", "Nicht jetzt!");
  $(spellhelperRemindlaterButton).click(function(){
    if(confirm("Du wirst in zwei Tagen wieder an das Update erinnert werden, wenn du es nicht durchführst. Bist du dir sicher?")){
      localStorage.setItem("spellhelper_nextScriptupdate", Date.now()+(86400000*2));
      $(spellhelperNotificationSpan).remove();
      if($("#vscriptNotificationbox").length == 0){
        $("#vscriptNotificationbox").remove();
      }
    }
  });

  if($("#vscriptNotificationbox").length == 0){
    var vscriptNotificationbox = document.createElement("div");
    $(vscriptNotificationbox).attr({
      "id": "vscriptNotificationbox",
      "class": "chatright"
    });
    $(vscriptNotificationbox).css({
      "text-align": "left",
      "right": "",
      "left": "2px",
      "width": "130px",
    });
    $("#pageframe").append(vscriptNotificationbox);
  }else{
    $(spellhelperNotificationSpan).append("<hr>")
  }

  $(spellhelperNotificationSpan).append("<b>Autokampfeinst.:</b><br>");
  $(spellhelperNotificationSpan).append("aktuell: v"+spellhelperVersion+"<br>");
  $(spellhelperNotificationSpan).append("neu: v"+spellhelperRemoteversion+"<br>");
  $(spellhelperNotificationSpan).append(spellhelperUpdateButton).append(" oder <br>");
  $(spellhelperNotificationSpan).append(spellhelperRemindlaterButton).append("<br>");
  $("#vscriptNotificationbox").append(spellhelperNotificationSpan);
}


function getAllFightterminations(){
  var terminations ={
    "bis zum Tod des Monsters": 4,
    "bis zum Ende": 1,
    "bis Lebenspunkte unter 20%": 6,
    "bis Lebenspunkte unter 50%": 7,
    "5 Runden": 2,
    "10 Runden": 3,
    "20 Runden": 5
  };
  return terminations;
}

function getAllAttackspells(){
  var spells = {
    "Magischer Pfeil": 1,
    "Feuerball": 2,
    "Giftwolke": 3,
    "Flutwelle": 156,
    "Blitzschlag": 6,
    "Lichtpfeil": 7,
    "Schattengeist": 8,
    "Steinhagel": 90,
    "Inferno": 10,
    "Chaoslanze": 24,
    "Prismastrahl": 25,
    "Eissturm": 34,
    "Giftschauer": 89,
    "Glutwelle": 44,
    "Hydrokugel": 45,
    "Granitstacheln": 46,
    "Schallstoß": 47,
    "Faust der Heraios": 66,
    "Feuer-Wasser-Chaos": 77,
    "Feuer-Wasser-Ordnung": 78,
    "Erde-Feuer-Chaos": 79,
    "Erde-Feuer-Ordnung": 80,
    "Erde-Luft-Chaos": 81,
    "Erde-Luft-Ordnung": 82,
    "Erde-Wasser-Chaos": 83,
    "Erde-Wasser-Ordnung": 84,
    "Feuer-Luft-Chaos": 85,
    "Feuer-Luft-Ordnung": 86,
    "Luft-Wasser-Chaos": 87,
    "Luft-Wasser-Ordnung": 88,
    "Toxinstrahl": 93,
    "Feuerkugel": 112,
    "Wasserkugel": 113,
    "Erdkugel": 114,
    "Luftkugel": 115,
    "Geisterklingen": 116,
    "Geysir": 143,
    "Lavastrom": 144,
    "Feuersturm": 145,
    "Schlammlawine": 146,
    "Steinwirbel": 147,
    "Hagelsturm": 148,
	"Feuerspeer": 163,
	"Wasserspeer": 164,
	"Erdspeer": 165,
	"Luftspeer": 166,
	"Feuerspeer (groß)": 167,
	"Wasserspeer (groß)": 168,
	"Erdspeer (groß)": 169,
	"Luftspeer (groß)": 170
  };
  return spells;
}

function getAllSpells(){
  var spells = {
    "Magischer Pfeil": 1,
    "Feuerball": 2,
    "Giftwolke": 3,
    "Flutwelle": 156,
    "Blitzschlag": 6,
    "Lichtpfeil": 7,
    "Schattengeist": 8,
    "Hypnose": 11,
    "Fluch der Schmerzen": 12,
    "Fluch der Verteidigung": 15,
    "Regeneration": 16,
    "Steinhagel": 90,
    "Inferno": 10,
    "Chaoslanze": 24,
    "Prismastrahl": 25,
    "Vampirismus": 28,
    "Lichtbarriere": 29,
    "Kettenzauber": 30,
    "Schild des Curulum": 37,
    "Schild der Teraja": 38,
    "Eissturm": 34,
    "Flammenschild": 39,
    "Giftschauer": 89,
    "Engelsschwingen": 41,
    "Dämonenhörner": 42,
    "Glutwelle": 44,
    "Hydrokugel": 45,
    "Granitstacheln": 46,
    "Schallstoß": 47,
    "Stille": 54,
    "Blenden": 56,
    "Verdunkelung": 57,
    "Kampfunfähigkeit": 60,
    "Magieschild": 62,
    "Illusion: Gefahr": 69,
    "Todesstoß": 65,
    "Gnadenstoß": 67,
    "Faust der Heraios": 66,
    "Feuer-Wasser-Chaos": 77,
    "Feuer-Wasser-Ordnung": 78,
    "Erde-Feuer-Chaos": 79,
    "Erde-Feuer-Ordnung": 80,
    "Erde-Luft-Chaos": 81,
    "Erde-Luft-Ordnung": 82,
    "Erde-Wasser-Chaos": 83,
    "Erde-Wasser-Ordnung": 84,
    "Feuer-Luft-Chaos": 85,
    "Feuer-Luft-Ordnung": 86,
    "Luft-Wasser-Chaos": 87,
    "Luft-Wasser-Ordnung": 88,
    "Konfusion": 92,
    "Kristalle des Lichts": 96,
    "Kristalle der Dunkelheit": 97,
    "Toxinstrahl": 93,
    "leuchtende Schwingen": 131,
    "brennende Hörner": 132,
    "Feuerkugel": 112,
    "Wasserkugel": 113,
    "Erdkugel": 114,
    "Luftkugel": 115,
    "Geisterklingen": 116,
    "Lichtbestattung": 118,
    "Kadaverexplosion": 119,
    "Geysir": 143,
    "Lavastrom": 144,
    "Feuersturm": 145,
    "Schlammlawine": 146,
    "Steinwirbel": 147,
    "Hagelsturm": 148,
    "Zauberfächer": 157,
    "Toxinwelle": 142,
    "Metallschrapnell": 153,
    "Kristallschrapnell": 154,
	"Feuerspeer": 163,
	"Wasserspeer": 164,
	"Erdspeer": 165,
	"Luftspeer": 166,
	"Feuerspeer (groß)": 167,
	"Wasserspeer (groß)": 168,
	"Erdspeer (groß)": 169,
	"Luftspeer (groß)": 170,
	"Lichtumhang": 159,
	"Schattenumhang": 160,
	"Prismasturm": 162,
	"Chaossturm": 161 
  };
  return spells;
}

function getAllMonsters(){
  var monsters = {
    "feste Gebiete":{
      "Kammern der Elemente":[
        "Feuerelementar",
        "Erdelementar",
        "Wasserelementar",
        "Luftelementar",
        "Elementargeist (Boss)"
      ],
      "Dunkelwald":[
        "Nachtschreck",
        "Lichtschreck",
        "Fluxschreck (Boss)"
      ],
      "Der rote Fluss":[
        "Anglerkrabbe",
        "Scharant",
        "Königskrabbe (Boss)"
      ],
      "Tempel des Gh'menor":[
        "Fanatiker",
        "Priester des Gh'menor",
        "Egregor (Boss)"
      ],
      "Burg Vehgaldon":[
        "Nephilim",
        "Grigori",
        "Semjaza",
        "Sariel (Boss)"
      ],
      "Residenz Cor'madra":[
        "Sklave",
        "Strigoi",
        "Upir",
        "Gräfin Cor'madra (Boss)"
      ],
      "Der verseuchte Wald":[
        "verseuchter Wolf",
        "verseuchter Bär",
        "Basilisk (Boss)"
      ],
      "Schlangennest":[
        "Hydra (Kopf)"
      ],
      "Akademie der Unsterblichkeit":[
        "Leichnam",
        "Seelenlicht"
      ],
      "Die grollenden Klippen":[
        "Torak",
        "Murlmurl",
        "Palinu-Jäger",
        "Torakweibchen (Boss)"
      ],
      "Donnerfleck":[
        "Palinu-Wächter",
        "Palinu-Hammerschwinger",
        "Palinu-Zeremonienmeister",
        "Palinu-König (Boss)"
      ],
      "Trollschlucht":[
        "Höhlentroll",
        "Trollwache",
        "Kampftroll"
      ],
      "Pfad der Verdammnis":[
        "Ringgeist",
        "Hexenmeister (Boss)"
      ]
    },
    "variable Gebiete":{
      "Das Heckenlabyrinth":[
        "Waldschrat",
        "lebende Wurzel",
        "Gestrüppschamane",
        "Gestrüppspäher",
        "Baumgolem (Boss)"
      ],
      "Die magische Kuppel":[
        "Gestrüppwächter",
        "Wasserleiche",
        "Flammenzombie",
        "Harpyienkönigin"
      ],
      "Der Steinbruch":[
        "Granitbeißer",
        "Felsenraupe"
      ],
      "Pyramiden der Zeitalter":[
        "antiker Golem",
        "Riesenskorpion",
        "Wächter der Zeit"
      ],
      "Harpyien-Nest":[
        "Harpyie"
      ],
      "goldener Turm":[
        "Goldwächter (1)",
        "Goldwächter (2)",
        "Goldwächter (3)"
      ],
      "Die Bibliothek von Jedar":[
        "Omnikron"
      ],
      "Spiegelhalle":[
        "Wirbelwind",
        "Spiegelwächter",
        "(Spiegelbild) (Boss)"
      ],
      "Zibilja":[
        "Zibiljaner",
        "Zibiljanerin"
      ],
      "Wurmtunnel":[
        "Lindwurm",
        "Tatzelwurm"
      ],
      "Milenius Laboratorium":[
        "Versuchsgoblin",
        "Flammenghul",
        "Strudelgeist",
        "Laborork",
        "Phantom"
      ],
      "Sumpf von Gelan":[
        "Geisterschlange",
        "Geisterwolf",
        "Sumpfwurm",
        "Moorleiche",
        "zweiköpfiger Troll (Boss)"
      ],
      "Die verlassene Mine":[
        "Erdkoloss",
        "Höhlenechse",
        "Aaskriecher"
      ]
    },
    "Sondermonster":{
      "EP-gebend":[
        "Kanonengoblin",
        "Dryade",
        "Frostdural",
        "Lavakäfer",
        "Staubdämon",
		"Protoblob",
        "Regenbogenritter",
        "goldene Sphäre"
      ],
      "keine EP":[
        "Tonkrug",
        "Farbritter",
        "Phasengolem",
        "Phasengeist",
        "Phasenschleier",
        "Phasenschwingung",
        "Phasenblase"
      ]
    }
  };
  return monsters;
}

function getSpellhelperIcon(state){
  if(state == "good"){
    var icon = "data:image/gif;base64,R0lGODlhEAAQAKIAAJmZmf/MAMzMzGYzAMxmAAAAAAAAAAAAACH5BAAAAAAALAAAAAAQABAAQAM9GLrcE2QMQQElGL/MSRUaJA0R2UXQyV1b94FhNlhw16p2inP3+aGqV8zkEdB4KYnxktOMasiSjDgdWa+jBAA7";
  }else{
    var icon = "data:image/gif;base64,R0lGODlhEAAQAKIAAJmZmWYzAP9mAJkzAMzMzP8zAAAAAAAAACH5BAAAAAAALAAAAAAQABAAQANAKLrcIyUEQgEtGL/MSyUaJAUR2RXbyV3pSlhgmAWw2qrcjcv4h0KnT2xj8rwumZTkGMsBRxObqCg5Da7YrPaaAAA7";
  }
  return icon;
}

//===========
