// ==UserScript==
// @name          Arthoria: Statistiken
// @namespace     Voltan
// @description   Statistiken für Altar, Reittier, Kräuter und co.
// @include       http://arthoria.de/*
// @run-at        document-end
// @grant         none
// @version       1.1

// ==/UserScript==

var statisticsVersion = 1.1; //GM_info.script.version won't work with opera12
var data = {}; // exactly. data. because it contains data. seems legit.
var nbsp = "\xa0";
var nbspSpan = "<span>\xa0\xa0</span>";
var menuspacer = ' <img src="graphics/menuspacer.gif"> ';

window.addEventListener ("load", startStatistics, false);
/* if there are problems with the window.addeventlistener, use this instead - or both.
if (document.readyState == "complete") {
    start();
}
*/


function startStatistics(){
  if(charID > 0){
    if(typeof(Storage) !== "undefined") {
      statisticsScriptVersioncontrol();
      var toggleToolboxButton = createButton("toggleToolboxButton", "");
      toggleToolboxButtonImage = document.createElement("img");
      $(toggleToolboxButtonImage).attr({
        "id": "toggleToolboxButtonImage",
        "title": "Statistiken",
        "alt": "Statistiken"
      });
      if (!localStorage.getItem(charID) || !localStorage.getItem(charID+"_lastupdate")){
        $(toggleToolboxButtonImage).attr("src", iconBad);
      }else{
        $(toggleToolboxButtonImage).attr("src", iconGood);
        checkForInfoboxes();
        checkSiteForFlags();
        if(localStorage.getItem(charID+"_autoupdate") == "true"){
          checkSiteforAutoupdates();
        }
      }
      $(toggleToolboxButton).append(toggleToolboxButtonImage);
      $(toggleToolboxButton).click(function(){toggle("toolbox");});
      $("#chaticons").prepend(toggleToolboxButton);
    }
  }
}

function checkForInfoboxes(){
  var allInfoboxes = $("div.pad5LR").find(".infobox");
  if (allInfoboxes){
    data = loadData();
    statisticsInternalVersioncontrol();
    for (var i=0;i<allInfoboxes.length; i++){
      separateNewInput(allInfoboxes[i], false);
    }
  }
}
//manual is true, if call is from textbox.
function separateNewInput(box, manualInput){
  var url = window.location.href;
  var herbsLocation = false;
  var onHorse = false;
  var researching = false;
  var glyph = false;
  if(manualInput == false){
    var boxcontent = $(box).html().split("<br>");
  }else{
    var boxcontent = box.replace(/\n\r/g, "\n").replace(/\r\n/g, "\n").split("\n");
  }
  if((url.indexOf("q=quest")==-1 && url.indexOf("p=encounter")==-1 && url.indexOf("&en=")==-1 && url.indexOf("p=battle")==-1)|| manualInput){
    $.each(boxcontent, function(ind, line){
      if (line.indexOf("sammelt Kräuter im ")>-1){
        onHorse = false;
        researching = false;
        herbsLocation = line.substring( line.indexOf("Kräuter im ")+11, line.indexOf(".") );
        if(data["options"]["tracking"]["wilderness"]==true){
          wildernessDataInput(line);
        }
        return true;
      }
      if (herbsLocation){
        if (line.indexOf("hat in der Wildnis einen Lederbeutel gefunden")>-1){
          if(data["options"]["tracking"]["wilderness"]==true){
            wildernessDataInput(line);
          }
          return true;
        }
        if( line.indexOf(" konnte leider nichts finden")>-1 ||
            line.indexOf(" gefunden!")>-1 ){
          if(data["options"]["tracking"]["herbs"]==true){
            herbsDataInput(line, herbsLocation);
          }
          return true;
        }
        if( line.indexOf("Der zur Unterstützung beschworene Begleiter findet ")>-1 ){
          if(data["options"]["tracking"]["bird"]==true){
            birdDataInput(line);
          }
          return true;
        }
      }
      //#####################################################################
      if( line.indexOf("beendet das Gebet ")>-1 ){
        onHorse = false;
        researching = false;
        if(data["options"]["character"]["altarlvl"] > 0){
          if(data["options"]["tracking"]["altar"]==true){
            altarDataInput(line);
          }
        }
        return true;
      }

      //#####################################################################
      if(line.indexOf(" erntet ")>-1 ||
          line.indexOf(" ist mit der Gartenarbeit fertig")>-1 ||
          line.indexOf(" düngt den Garten und versucht ")>-1 ||
          line.indexOf(" verteilt die Samen im Garten")>-1){
        onHorse = false;
        researching = false;
        if(data["options"]["character"]["gardenlvl"] > 0){
          if(data["options"]["tracking"]["garden"]==true){
            gardenDataInput(line);
          }
        }
        return true;
      }

      //#####################################################################
      if(line.indexOf(" reitet durch die umliegenden Gebiete")>-1){
        onHorse = true;
        researching = false;
      }
      if(onHorse){
        if( (line.indexOf("Schattenross erhält ")>-1 ||
             line.indexOf("Einhorn erhält ")>-1 ||
             line.indexOf("Pferd erhält ")>-1 ) ||
             line.indexOf(" Erfahrungspunkt")>-1 ||
             line.indexOf(" regeneriert")>-1){
          if(data["options"]["character"]["drill"] > 0 && data["options"]["character"]["horselvl"] > 0 && data["options"]["character"]["stablelvl"] > 0){
            if(data["options"]["tracking"]["horse"]==true){
              horseDataInput(line);
            }
          }
          return true;
        }
        if(line.indexOf("Unterwegs passiert etwas interessantes")>-1){
          onHorse = false;
          if(data["options"]["character"]["drill"] > 0 && data["options"]["character"]["horselvl"] > 0 && data["options"]["character"]["stablelvl"] > 0){
            if(data["options"]["tracking"]["horse"]==true){
              horseDataInput(line);
            }
          }
          return true;
        }
      }

      //#####################################################################
      if(!onHorse && line.indexOf(" beendet das Gebet ") == -1 && ( (url.indexOf("p=market") == -1 && url.indexOf("p=auction") == -1 && url.indexOf("p=event") == -1 && url.indexOf("&usp=48") == -1) || manualInput) ){
        if(line.indexOf(" öffnet den Lederbeutel und erhält ")>-1){
          data["flags"]["leatherpouches"]["lastIrregular"] = true;
          return true;
        }else if(data["flags"]["leatherpouches"]["lastIrregular"] == true &&
          (line.indexOf("erhält einen leeren Lederbeutel")>-1 || line.indexOf("Der Lederbeutel ist ziemlich beschädigt")>-1) ){
          data["flags"]["leatherpouches"]["lastIrregular"] = false;
          return true;
        }else if((line.indexOf(" erhält ")>-1 && line.indexOf(" Gold")>-1 &&
                  line.indexOf(" verkauft werden") == -1 && line.indexOf("Lebenspunkte") == -1 && line.indexOf(" Erfahrung") == -1) ||
                  line.indexOf("Der Lederbeutel ist ziemlich beschädigt")>-1 ||
                  line.indexOf("erhält einen leeren Lederbeutel")>-1){
          if(data["options"]["tracking"]["leatherpouches"]==true){
            leatherpouchesDataInput(line);
          }
          return true;
        }
      }

      //#####################################################################
      if(line.indexOf("hat die Nachbearbeitung erfolgreich durchgeführt")>-1 &&
        (data["options"]["character"]["spotScrolls"] == true || data["options"]["character"]["magicalBrainwave"] == true) ){
        researching = true;
        onHorse = false;
        herbsLocation = false;
        if(data["options"]["tracking"]["research"]==true){
          researchDataInput(line);
        }
      }
      if(researching){
        if(line.indexOf(" erzeugt einen magischen Funken.")>-1 || line.indexOf(" findet ein")>-1){
          if(data["options"]["tracking"]["research"]==true){
            researchDataInput(line);
          }
          return true;
        }
      }

      //#####################################################################
      if(line.indexOf(" erhält Phasenkristall ")>-1 || line.indexOf("Fehlschlag, ein Phasenkristall ")>-1){
        if(data["options"]["tracking"]["phasecrystals"] == true && parseInt(data["flags"]["phasecrystals"]["energyshards"]) >= 0){
          phasecrystalsDataInput(line);
        }else if(data["options"]["tracking"]["phasecrystals"] == true && manualInput == true &&   parseInt(data["flags"]["phasecrystals"]["energyshards"])<0){
          alert("Keine Energiesplitterzahl gewählt. Der Vorgang wurde abgebrochen und es wurden keine Daten geändert.");
          return false;
        }
        return true;
      }

      //#####################################################################
      if( (url.indexOf("p=smith")>-1 && url.indexOf("&pi=1")>-1) &&
          ( line.indexOf("Hier ist deine neue Waffe!")>-1 || line.indexOf("Die magische Verstärkung ist leider fehlgeschlagen.")>-1) ){
        if(data["options"]["tracking"]["staffEnhancement"]==true){
          staffEnhancementDataInput(line);
        }
        return true;
      }

      //#####################################################################
      if(line.indexOf("überträgt das Zauberzeichen und erhält ein")>-1){
        glyph = true;
        return true;
      }
      if(glyph){
        if(line.indexOf("Zauberzeichen d")>-1){
          if(data["options"]["tracking"]["glyphboards"] == true &&
             (parseInt(data["flags"]["glyphboards"]["lastGlyphboard"]) >= 4435 &&
             parseInt(data["flags"]["glyphboards"]["lastGlyphboard"]) <= 4439)){
            glyphboardDataInput(line);
          }else if(data["options"]["tracking"]["glyphboards"] == true && manualInput == true &&
             parseInt(data["flags"]["glyphboards"]["lastGlyphboard"]) == 0){
               alert("Keine Zeichentafel gewählt. Der Vorgang wurde abgebrochen und es wurden keine Daten geändert.");
            return false;
          }
          return true;
        }
      }

      //#####################################################################
      if(line.indexOf("Stein der Geduld")>-1 && line.indexOf("spielt ein wenig mit dem Stein der Geduld herum")==-1){
        if(data["options"]["tracking"]["stoneOfPatience"]==true){
          stoneOfPatienceDataInput(line);
        }
        return true;
      }

      //#####################################################################
      if((manualInput || url.indexOf("&u=13")>-1) && line.indexOf(" verwandelt einen Klumpen Blei in ")>-1){
        if(data["options"]["tracking"]["plumbumclump"]==true){
          plumbumclumpDataInput(line);
        }
        return true;
      }
    });

    if(data){
      saveData(data);
    }
  }
}

function checkSiteForFlags(){
  var url = window.location.href;
  if(url.indexOf("p=inventory&s=2&use=")>-1){
    var itemid = parseInt(url.substring(url.indexOf("use=")+4, url.length));
    var isphasecrystal = false;
    for (var i = 9669; i < 9678; i++){
      if(itemid == i){
        isphasecrystal = true;
      }
    }
    if(isphasecrystal){
      data["flags"]["phasecrystals"]["energyshards"] = parseInt($('select[name="stab"]').val());
      $('select[name="stab"]').change(function(){
        data = loadData();
        data["flags"]["phasecrystals"]["energyshards"] = parseInt($('select[name="stab"]').val());
        saveData(data);
      });
    }

    for (var i = 4435; i< 4440; i++){
      if(itemid == i){
        data["flags"]["glyphboards"]["lastGlyphboard"] = i;
      }
    }

  }else if($('a[href^="index.php?p=smith&pi=1&c=2"]').length > 0 ){
    var linktext = $('a[href^="index.php?p=smith&pi=1&c=2"]').text();
    var staff = linktext.substring(0, linktext.indexOf(" magisch verst"));
    data["flags"]["staffEnhancement"]["lastStaff"] = staff;
  }

  saveData(data);
}

function checkSiteforAutoupdates(){
  var url = window.location.href;
  var olddata = data;
  if(url.indexOf("p=status")>-1){

    var charlvlline = $('div.pad5LR table tbody tr:contains("Stufe:")').html();
    charlvlline = $.trim(charlvlline).replace('<tr><td>', "").replace('</td><td align="right">', "");
    var charlvl = parseInt(charlvlline.substring(charlvlline.indexOf("Stufe: ")+7, charlvlline.indexOf("</td>")));
    if(isNumeric(charlvl)){
      data["options"]["character"]["charlvl"] = charlvl;
    }

    var basicSkills = $("div.pad5LR table tbody tr td:contains('allgemeine Fertigkeiten') table.stretch tbody").html().split("</tr>");
    $.each(basicSkills, function(ind, line){
      var nline = $.trim(line).replace('<tr><td>', "").replace('</td><td valign="top">', "").replace(/\r\n/, "").replace(/\n\r/,"").replace(/\n/,"").replace ("	","");
      if(nline.indexOf("Pflanzenkunde")>-1){
        var botany = parseInt(nline.substring(nline.indexOf(":")+1, nline.indexOf("</td>")));
        if(isNumeric(botany)){
          data["options"]["character"]["botany"] = botany;
        }

      }else if(nline.indexOf("Glück")>-1){
        if(nline.indexOf("(+1)")>-1){
          var luck = parseInt(nline.substring(nline.indexOf(":")+1, nline.indexOf(" (")));
          data["options"]["character"]["luckmonument"] = true;
        }else{
          var luck = parseInt(nline.substring(nline.indexOf(":")+1, nline.indexOf("</td>")));
          data["options"]["character"]["luckmonument"] = false;
        }
        if(isNumeric(luck)){
          data["options"]["character"]["luck"] = luck;
        }

      }else if(nline.indexOf("Abrichten")>-1){
        var drill = parseInt(nline.substring(nline.indexOf(":")+1, nline.indexOf("</td>")));
        if(isNumeric(drill)){
          data["options"]["character"]["drill"] = drill;
        }
      }
    });

    var specialSkills = $('div.pad5LR').html().split("<h3>Spezialfertigkeiten</h3>");
    specialSkills = specialSkills[1];
    var specialSkillObject = {
      "Gartenbau": "gardening",
      "Glaube": "faith",
      "Jagd": "hunt",
      "Spruchrollen erkennen": "spotScrolls",
      "Bibliothekar": "librarian",
      "magischer Geistesblitz": "magicalBrainwave",
      "Zeichenkunst": "glyphskill"
    };
    $.each(specialSkillObject, function(key, value){
      if(specialSkills.indexOf(key)>-1){
        data["options"]["character"][value] = true;
      }else{
        data["options"]["character"][value] = false;
      }
    });

  }else if(url.indexOf("p=mansion")>-1){
    var boxcontent = $("#mansiongarden").html().split("<br>");
    $.each(boxcontent, function(ind, line){
      if(line.indexOf("Du besitzt einen Kräutergarten Stufe ")>-1){
        var gardenlvl = parseInt(line.substring(line.indexOf("Stufe ")+6, line.indexOf(".")));
        if(isNumeric(gardenlvl)){
          data["options"]["character"]["gardenlvl"] = gardenlvl;
        }
      }
    });

    var boxcontent = $("#mansionaltar").html().split("<br>");
    $.each(boxcontent, function(ind, line){
      if(line.indexOf("Du besitzt einen Altar Stufe")>-1){
        var altarlvl = parseInt(line.substring(line.indexOf("Stufe ")+6, line.indexOf(".")));
        if(isNumeric(altarlvl)){
          data["options"]["character"]["altarlvl"] = altarlvl;
        }
      }
    });
    var boxcontent = $("#mansionstable").html().split("<br>");
    $.each(boxcontent, function(ind, line){
      if(line.indexOf("Deine Stallung ist auf Stufe")>-1){
        var stablelvl = parseInt(line.substring(line.indexOf("Stufe ")+6, line.indexOf("Stufe ")+7));
        if(isNumeric(stablelvl)){
          data["options"]["character"]["stablelvl"] = stablelvl;
        }
      }
    });

  }else if(url.indexOf("p=inventory")>-1){
    if($("div.pad5LR table tbody tr td:contains('Gartenharke')").length > 0){
      var boxcontent = $("div.pad5LR table tbody tr td:contains('Gartenharke')").html().split("<br>");
      var rakeActive = false;
      if(data["options"]["character"]["artifactRake"] == true){
        rakeActive = true;
      }
      $.each(boxcontent, function(ind, line){
        if(line.indexOf("Gartenharke (nicht aufgeladen)")>-1){
          data["options"]["character"]["artifactRake"] = false;
        }else if(line.indexOf("Gartenharke (aufgeladen)")>-1){
          data["options"]["character"]["artifactRake"] = true;
        }
      });
      if(rakeActive==false && data["options"]["character"]["artifactRake"] == true){
        if(data["flags"]["garden"]["harvestbonusFlag"] > -1){
          data["flags"]["garden"]["harvestbonusFlag"] += 2;
        }
      }else if(rakeActive==true && data["options"]["character"]["artifactRake"] == false){
        data["flags"]["garden"]["harvestbonusFlag"] -= 2;
      }
    }

  }else if(url.indexOf("p=stable")>-1){
    var boxcontent = $("div.pad5LR").html().split("<br>");
    $.each(boxcontent, function(ind, line){
      if((line.indexOf("Pferd")>-1 ||line.indexOf("Einhorn")>-1 ||line.indexOf("Schattenross")>-1) && line.indexOf("Erfahrungspunkte und ist damit Stufe ")>-1){
        var horselvl = parseInt(line.substring(line.indexOf("Stufe ")+6, line.indexOf(".")));
        if(isNumeric(horselvl)){
          data["options"]["character"]["horselvl"] = horselvl;
        }
      }
    });
  }

  data["options"]["character"]["lastupdate"] = Date.now();
  localStorage.setItem(charID+"_lastupdate", Date.now());
  saveData(data);
}


function statisticsScriptVersioncontrol(){
  if(!localStorage.getItem("statistics_nextScriptupdate")){
    localStorage.setItem("statistics_nextScriptupdate", 0);
  }
  if(!localStorage.getItem("statistics_availableUpdate")){
    localStorage.setItem("statistics_availableUpdate", "no");
  }
  var nextScriptupdate = parseInt(localStorage.getItem("statistics_nextScriptupdate"));
  if(localStorage.getItem("statistics_availableUpdate") != "no" && nextScriptupdate <= Date.now()){
    var statisticsRemoteversion = parseFloat(localStorage.getItem("statistics_availableUpdate").replace(/v/g, ""));
    if(statisticsVersion < statisticsRemoteversion){
      createStatisticsScriptnotification(statisticsVersion, statisticsRemoteversion);
    }else{
      localStorage.setItem("statistics_availableUpdate", "no");
    }
  }else{
    if(nextScriptupdate <= Date.now()){
      var statisticsRemoteversion = null;
      var statisticsRemoteversionURL = "http://voltan.bplaced.net/scriptupdates/statistics_version.txt?t="+Date.now();
      var xhr = new XMLHttpRequest();
      if("withCredentials" in xhr){
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open("GET", statisticsRemoteversionURL, true);
      }else if(typeof XDomainRequest != "undefined"){
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open("GET", statisticsRemoteversionURL);
      }else{
        xhr = null;
      }
      if (xhr != null){
        xhr.onload = function(){
          if(xhr.responseText){
            statisticsRemoteversion = parseFloat(xhr.responseText);
            if(statisticsRemoteversion != null){
              if(statisticsVersion < statisticsRemoteversion){
                createStatisticsScriptnotification(statisticsVersion, statisticsRemoteversion);
                localStorage.setItem("statistics_availableUpdate", "v"+statisticsRemoteversion);
              }else{
                localStorage.setItem("statistics_nextScriptupdate", Date.now()+(86400000));
              }
            }else{
              localStorage.setItem("statistics_nextScriptupdate", Date.now()+(86400000));
              localStorage.setItem("statistics_availableUpdate", "no");
            }
          }
        };

        xhr.onerror = function(){
          console.log("Fehler beim Verbinden zum Server für den Versionsabgleich.")
          localStorage.setItem("statistics_nextScriptupdate", Date.now()+(86400000/2));
        };
        xhr.send();
      }
    }
  }
}

function createStatisticsScriptnotification(statisticsVersion, statisticsRemoteversion){
  var statisticsNotificationSpan = document.createElement("span");
  $(statisticsNotificationSpan).attr("id", "statisticsNotificationSpan");
  var statisticsUpdateButton = document.createElement("a");
  $(statisticsUpdateButton).attr({
    "href": "http://voltan.bplaced.net/scriptupdates/v_statistics.user.js",
    "target": "_blank"
  });
  $(statisticsUpdateButton).html("Update!");

  var statisticsRemindlaterButton = createButton("statisticsRemindlaterButton", "Nicht jetzt!");
  $(statisticsRemindlaterButton).click(function(){
    if(confirm("Du wirst in zwei Tagen wieder an das Update erinnert werden, wenn du es nicht durchführst. Bist du dir sicher?")){
      localStorage.setItem("statistics_nextScriptupdate", Date.now()+(86400000*2));
      $(statisticsNotificationSpan).remove();
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
    $(statisticsNotificationSpan).append("<hr>")
  }

  $(statisticsNotificationSpan).append("<b>Statistik-Tool:</b><br>");
  $(statisticsNotificationSpan).append("aktuell: v"+statisticsVersion+"<br>");
  $(statisticsNotificationSpan).append("neu: v"+statisticsRemoteversion+"<br>");
  $(statisticsNotificationSpan).append(statisticsUpdateButton).append(" oder <br>");
  $(statisticsNotificationSpan).append(statisticsRemindlaterButton).append("<br>");
  $("#vscriptNotificationbox").append(statisticsNotificationSpan);
}


/*
_|    _|  _|_|_|_|  _|        _|_|_|    _|_|_|_|  _|_|_|
_|    _|  _|        _|        _|    _|  _|        _|    _|
_|_|_|_|  _|_|_|    _|        _|_|_|    _|_|_|    _|_|_|
_|    _|  _|        _|        _|        _|        _|    _|
_|    _|  _|_|_|_|  _|_|_|_|  _|        _|_|_|_|  _|    _|
*/
var iconGood = "data:image/gif;base64,R0lGODlhEAAQAJEAAGbMAP/MAGYzAMxmACH5BAAAAAAALAAAAAAQABAAQAI5jI8pMTLQonON0YExpEv6iXVXlkFVpAEbKn7eScZkJ9dtbZ6jFoYWnwHpTCBhq/gSCZbM5sQJdRYAADs=";
var iconBad = "data:image/gif;base64,R0lGODlhEAAQAKIAAGbMAP9mAJkzAGYzAP8zAAAAAAAAAAAAACH5BAAAAAAALAAAAAAQABAAQAM9GLrcEmQQEKuU5FXCO8XaZY0ZhHUoVW4T8G3hKIIQaqParce6up4eDm3jI4VUM5hJZjQNntCoRECtWq/UBAA7";

function getHelpText(section){
  var text = "";
  switch(section){
    case "intro":
      text = "Dieses Tool sammelt ganz automatisch Daten aus verschiedenen Bereichen des Spiels, deren Ergebnisse in den Infoboxen angezeigt werden. Achtung: Alle Daten werden im localStorage gesammelt und je nach Browser wird dieser beim Löschen der lokalen Daten (Cookies,...) auch verschwinden.";
    break;

    case "short":
      text = "Einstellungen &rarr; Charakter &rarr; Tätige Charaktereinstellungen.<br>Einstellungen &rarr; Überwachung &rarr; Wähle, was verfolgt werden soll.<br>Einstellungen &rarr; Preise &rarr;  Bestimme deine eigenen Preise (wird für Kräutersammelstatistik benötigt).<br>Einstellungen &rarr; Datenbank &rarr; Exportiere, importiere oder lösche deine Datenbank.<br>Statistik &rarr; Hier siehst du später deine Statistiken.<br>Nachtragen &rarr; Trage Ereignistexte manuell ein.";
    break;

    case "help":
      text = "Hier bist du gerade.";
    break;

    case "options":
      text = "Unter <b>&#132;Charakter&#147;</b> solltest du Einstellungen zu deinem Charakter (Fertigkeiten, Anwesenausbauten) tätigen. Falls du das nicht machen willst, reicht es, einen Haken bei &#132;Auto-Update&#147; zu setzen und dies zu speichern. Das Tool sammelt sich beim Betreten der Statusseite und des Anwesens (sowie des Inventars (für die Gartenharke) und der Stallung (für die Pferdestufe)) die benötigten Einstellungen zusammen und speichert diese.<br>Unter <b>&#132;Überwachung&#147;</b> kannst du auswählen, für welche Ereignisse das Tool Daten sammeln soll. Willst du etwas nicht mehr sammeln, kannst du einfach den Haken bei einem Bereich wieder heraus nehmen, speichern und sammelst keine Daten mehr dazu.<br>Unter <b>&#132;Preise&#147;</b> kannst du Preise für diverse Items festlegen, die beim Berechnen der Kräutersammelstatistik berücksichtigt werden.<br>Unter <b>&#132;Datenbank&#147;</b> kannst du deine Daten exportieren, importieren, additiv importieren oder komplett löschen. Für den Export einfach den Inhalt des Textfeldes kopieren und irgendwo abspeichern; für den Import eben jenen gespeicherten Code einfügen und den Importieren-Knopf drücken. Beachte, dass beim beim Importieren von Daten der aktuell vorhandene Datensatz überschrieben wird! Beim additiven Import werden die gesammelten Daten zu deinen bestehenden Daten hinzugefügt, wobei deine Einstellungen unangetastet bleiben. Wenn du ein Backup deiner Daten machen willst, exportiere deine Daten, speichere und importiere sie sofort wieder.";
    break;

    case "statistics":
      text = "Die Statistiken sind selbsterklärend, aber zu Beginn etwas unübersichtlich, u.a., da sie aus diversen Gründen nicht konsistent bezeichnet wurden.<br>Damit die Tabellen nicht zu breit werden, wurden einige Symbole als Abkürzung benutzt. Ein &sum; steht oft für eine Summe von Werten, ein &#10007; steht für einen Misserfolg, ein &#10003; für einen Erfolg, &#9650; für das höchste bzw. &#9660; für das niedrigste Ergebnis eines Ereignisses. An vielen Stellen wurde weiterhin ein für dieses Ereignis spezifisches Symbol verwendet, um die Gesamtzahl des Auftretens eines Ereignisses darzustellen.<br>Die Auswertungszeilen haben ein &#37; für die prozentualen Auftretenswahrscheinlichkeiten eines Ergebnisses, während &empty; für den Durchschnitt einer Zahl (bezogen auf die Auftretensanzahl) steht.<br>Genauere Informationen zu einzelnen Symbolen können in der Legende, die sich aufklappbar am unteren Ende der Statistik befindet, nachgesehen werden.";
    break;

    case "manualInput":
      text = "Solltest du einmal an einem Endgerät sein, auf der das Tool nicht funktionsfähig oder installiert ist, kannst du dir den Text des Ereignisses einfach abspeichern (z.B. in einer Datei, einer Notiz oder per PN an dich selbst geschickt). Wenn du wieder an deinem toolbestückten Endgerät sitzt, kannst du den Text einfach in das Textfeld einfügen und zu deiner Statistik hinzufügen lassen.<br>Achtung: Das Nachtragen beachtet nur die kompletten Textausgaben des Ereignisses, funktioniert allerdings bewusst nicht für das Verstärken von Stäben. Für Zeichentafeln und das aufwerten von Phasenkristallen sind vorher in den Listen die entsprechenden Einstellungen vorzunehmen, da ansonsten keine Daten gespeichert werden.";
    break;

    default:
  }
  return text;
}

function createButton(id, text){
  var newButton = document.createElement("a");
  $(newButton).attr("id", id);
  $(newButton).html(text);
  $(newButton).css("cursor", "pointer");

  return newButton;
}

function createInput(id, type, value, checked){
  var newInput = document.createElement("input");
  $(newInput).attr({
      id : id,
      type : type,
  });
  if(type == "checkbox"){
    $(newInput).attr("checked", checked);
  }else{
    $(newInput).attr({
      value : value,
      size : 2,
      required: "true",
    });
  }

  return newInput;
}

function firstLetterUpperCase(str){
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
}

function formatTimestamp(timestamp){
  if(timestamp == 0){
    return "nie";
  }else{
    var date = new Date(timestamp);
    return ""+date;
  }
}

function isNumeric(value){
  return !isNaN(parseInt(value)) && isFinite(value);
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function getNumberFromString(str){
    return str.replace(/[^d.,]+/,"");
}

function stripStuffFromStrings(str){
  var stripped = str.replace(/\u00c4/g, "Ae").replace(/\u00c4/g, "ae");
  stripped = stripped.replace(/\u00dc/g, "Ue").replace(/\u00e4/g, "ue");
  stripped = stripped.replace(/\u00d6/g, "Oe").replace(/\u00f6/g, "oe");
  stripped = stripped.replace(/\u00df/g, "ss"); //ß ^= sz
  stripped = stripped.replace(/[^A-Za-z0-9\-_]/g, '').replace(" ", "");
  stripped = stripped.toLowerCase();
  return stripped;
}

//######################################
//######################################
function getLuckAmount(){
  if(data["options"]["character"]["luckmonument"]){
    var luckAmount = "Glück "+data["options"]["character"]["luck"]+" (+1)";
  }else{
    var luckAmount = "Glück "+data["options"]["character"]["luck"];
  }
  return luckAmount;
}
function setHarvestbonusFlag(line){
    if(line.indexOf(" ist mit der Gartenarbeit fertig")>-1){
      data["flags"]["garden"]["harvestbonusFlag"] += 1;

    }else if(line.indexOf(" düngt den Garten und versucht ")>-1){
      data["flags"]["garden"]["harvestbonusFlag"] += 4;
      var target = line.substring(line.indexOf("Anbau der Pflanze ")+18, line.length);
      data["flags"]["garden"]["fertilizerTarget"] = target;

    }else if(line == "reset"){
      data["flags"]["garden"]["harvestbonusFlag"] = 0;
      if(data["options"]["character"]["artifactRake"] == true){
        data["flags"]["garden"]["harvestbonusFlag"] = 2;
      }
      data["flags"]["garden"]["fertilizerTarget"] = "";

    }else if(line == "ignore"){
      data["flags"]["garden"]["harvestbonusFlag"] = -1;
      data["flags"]["garden"]["fertilizerTarget"] = "";
    }
}

function getHarvestbonusflag(){
  switch(data["flags"]["garden"]["harvestbonusFlag"]){
    case 0:
      return "harvestbonusNone";
    break;
    case 1:
      return "harvestbonusGardening";
    break;
    case 2:
      return "harvestbonusRake";
    break;
    case 3:
      return "harvestbonusGardeningRake";
    break;
    case 4:
      return "harvestbonusFertilizer";
    break;
    case 5:
      return "harvestbonusGardeningFertilizer";
    break;
    default:
      return "harvestbonusNone";
  }
}

function getSortRuleArray(section){
  var sortRuleArray = [];
  switch(section){
    case "herbs":
      sortRuleArray = [
        "herbsHourCount",
        "herbsNothing"
      ];
      $.each(data["options"]["prices"], function(key){
        if(key != "isEndNode"){
          sortRuleArray.push(key);
        }
      });
    break;

    case "wilderness":
      sortRuleArray = ["herbsTripcount", "nichts gefunden", "Lederbeutel"];
    break;

    case "bird":
      sortRuleArray = [
        "birdCount",
        "birdNothing"
      ];
      $.each(data["options"]["prices"], function(key){
        if(key != "isEndNode"){
          sortRuleArray.push(key);
        }
      });
    break;

    case "garden":
      sortRuleArray = ["harvestCount"];
      herbs = ["Guljak", "Joruga", "Sorage", "Kurag", "Kurel", "Tairan", "Tolwar"];
      for(var i=0; i<herbs.length; i++){
        sortRuleArray.push("harvest"+herbs[i]+"Count");
        sortRuleArray.push("harvest"+herbs[i]+"Amount");
        sortRuleArray.push("harvest"+herbs[i]+"Highest");
        sortRuleArray.push("harvest"+herbs[i]+"Lowest");
      }
      sortRuleArray.push("fertilizerSuccessCount");
      sortRuleArray.push("fertilizerFailureCount");
      for(var i=0; i<herbs.length; i++){
        sortRuleArray.push("fertilizerSuccess"+herbs[i]);
        sortRuleArray.push("fertilizerFailure"+herbs[i]);

      }
    break;

    case "altar":
      sortRuleArray = [
        "prayCount",
        "prayNothing",
        "prayEPCount",
        "prayEPAmount",
        "prayEPHighest",
        "prayEPLowest",
        "prayGoldCount",
        "prayGoldAmount",
        "prayGoldHighest",
        "prayGoldLowest",
        "prayHarvestCount",
        "prayHealCount",
        "prayProtbuffCount",
        "prayActionpointsCount"
      ];
    break;

    case "horse":
      sortRuleArray = [
        "horseCount",
        "horseEPAmount",
        "horseEncounters",
        "horsePlayerEPAmount",
        "horsePlayerLPAmount"
      ];
    break;

    case "leatherpouches":
      sortRuleArray = [
        "leatherpouchesCount",
        "leatherpouchesDamaged",
        "leatherpouchesGoldAmount",
        "leatherpouchesGoldHighest",
        "leatherpouchesGoldLowest"
      ];
    break;

    case "research":
      sortRuleArray = [
        "researchCount",
        "researchSparks"
      ];
    break;
    case "phasecrystals":
      for(var i = 0; i <= 5; i++){
        sortRuleArray.push("phasecrystalAttemptES"+i);
        sortRuleArray.push("phasecrystalFailES"+i);
      }
    break;

    case "staffEnhancement":
      for(var i=1; i < 13; i++){
        sortRuleArray.push("staffEnhancementAttemptCountTo"+i);
        sortRuleArray.push("staffEnhancementSuccessCountTo"+i);
      }
    break;

    case "glyphboards":
      var attributearray = ["ohne", "anfällig", "rissig", "schwächend", "verflucht", "verwirrend", "kompliziert", "resistent", "haltbar", "stärkend", "schützend", "beruhigend", "vereinfacht"];
      var effectivearray=["normal", "effektiv"];
      for(var i=0; i<effectivearray.length; i++){
        for(var j=0; j<attributearray.length; j++){
          sortRuleArray.push(effectivearray[i]+"#"+attributearray[j]);
        }
      }
    break;

    case "stoneOfPatience":
      sortRuleArray = [
        "sopAttemptCount",
        "sopNothingCount",
        "sopThrowAwayCount",
        "sopEPCount",
        "sopEPAmount",
        "sopEPHighest",
        "sopEPLowest",
        "sopGloryCount",
        "sopGloryAmount",
        "sopGloryHighest",
        "sopGloryLowest",
        "sopCrystalglassCount",
        "sopGlassclumpCount",
        "sopPlumbumclumpCount"
      ];
    break;

    case "plumbumclump":
      sortRuleArray = [
        "plumbumclumpCount",
        "plumbumclumpGoldAmount",
        "plumbumclumpGoldHighest",
        "plumbumclumpGoldLowest"
      ];
    break;

    default:
      //nothing
  }
  return sortRuleArray;
}

/*

_|_|_|_|_|    _|_|      _|_|    _|        _|_|_|      _|_|    _|      _|
    _|      _|    _|  _|    _|  _|        _|    _|  _|    _|    _|  _|
    _|      _|    _|  _|    _|  _|        _|_|_|    _|    _|      _|
    _|      _|    _|  _|    _|  _|        _|    _|  _|    _|    _|  _|
    _|        _|_|      _|_|    _|_|_|_|  _|_|_|      _|_|    _|      _|

*/

function toggle(boxtype){
  if ($("#"+boxtype+"Div").length > 0 ){
    if(boxtype == "toolbox"){
      $("#toolboxDiv").toggle("slow");
    }else{
      $("#innerDiv").hide("slow", function(){
        $("#innerDiv").empty();
      });
    }
  }else{
    if(boxtype == "toolbox"){
      insertToolbox();
    }else{
      insertInnerDiv(boxtype);
    }
  }
}

function insertToolbox(){
  var toolbox = document.createElement("div");
  $(toolbox).attr("class", "infobox");
  $(toolbox).attr("id", "toolboxDiv");
  if(!localStorage.getItem(charID) || !localStorage.getItem(charID+"_lastupdate")){
    $(toolbox).append("<center>Es sind keine Daten vorhanden.<br>Falls du das Script zum ersten Mal benutzt, lies dir bitte die Hilfe durch und schaue dich in den einzelnen Menüpunkten etwas um.</center><br>");
  }
  $(toolbox).append(toolboxMenu());
  $(toolbox).append("<hr>");
  $(toolbox).css("display", "none");
  $(toolbox).insertBefore("div.pad5LR");
  $(toolbox).show("slow");
}

function toolboxMenu(){
  var toolboxMenuDiv = document.createElement('div');
  $(toolboxMenuDiv).attr('id', 'toolboxMenuDiv');
  $(toolboxMenuDiv).attr("align", "center");

  var helpButton = createButton("helpButton","Hilfe");
  $(helpButton).click(function(){toggle("help");});
  $(toolboxMenuDiv).append(helpButton);

  var optionsButton = createButton("optionsButton", "Einstellungen");
  $(optionsButton).click(function(){toggle("optionsMenu");});
  $(toolboxMenuDiv).append(menuspacer).append(optionsButton);

  var statisticsButton = createButton("statisticsButton", "Statistiken");
  $(statisticsButton).click(function(){toggle("statistics");});
  $(toolboxMenuDiv).append(menuspacer).append(statisticsButton);

  var manualInputButton = createButton("manualInputButton", "Nachtragen");
  $(manualInputButton).click(function(){toggle("manualInput");});
  $(toolboxMenuDiv).append(menuspacer).append(manualInputButton);

  return toolboxMenuDiv;
}

function insertInnerDiv(boxtype){
  if($("#innerDiv").length > 0){
    var innerDiv = $("#innerDiv");
    $(innerDiv).hide("slow", function(){
      $(innerDiv).empty();
      $(innerDiv).append(contentDiv(boxtype));
      $("#toolboxDiv").append(innerDiv);
      $(innerDiv).show("slow");
    });
  }else{
    var innerDiv = document.createElement("div");
    $(innerDiv).attr("class", "infobox");
    $(innerDiv).attr("id", "innerDiv");
    $(innerDiv).css("display", "none");
    $(innerDiv).append(contentDiv(boxtype));
    $("#toolboxDiv").append(innerDiv);
    $(innerDiv).show("slow");
  }
}


/*

  _|_|_|    _|_|    _|      _|  _|_|_|_|_|  _|_|_|_|  _|      _|  _|_|_|_|_|
_|        _|    _|  _|_|    _|      _|      _|        _|_|    _|      _|
_|        _|    _|  _|  _|  _|      _|      _|_|_|    _|  _|  _|      _|
_|        _|    _|  _|    _|_|      _|      _|        _|    _|_|      _|
  _|_|_|    _|_|    _|      _|      _|      _|_|_|_|  _|      _|      _|

*/

function contentDiv(boxtype){
  if (!localStorage.getItem(charID)){
    localStorage.setItem(charID, JSON.stringify(standardDatabase()));
  }
  data = loadData();
  var contentDiv = document.createElement("div");
  $(contentDiv).attr("id", boxtype+"Div");

  switch (boxtype){
    case "optionsMenu":
      $(contentDiv).append(optionsMenu());
    break;

    case "help":
      $(contentDiv).append(helpContent());
    break;

    case "statistics":
      $(contentDiv).append(statisticsContent());
    break;

    case "manualInput":
      $(contentDiv).append(manualInputContent());
    break;

    default:
      $(contentDiv).append(document.createTextNode("Fehler"));
  }

  return contentDiv;
}

function optionsMenu(){
  var optionsContent = document.createElement("div");
  var optionsMenuDiv = document.createElement("div");
  $(optionsMenuDiv).attr("id", "optionsMenuDiv");
  $(optionsMenuDiv).attr("align", "center");
  var optionsContentDiv = document.createElement("div");
  $(optionsContentDiv).attr("id", "optionsContentDiv");

  var optionsCharacterButton = createButton("optionsCharacterButton", "Charakter");
  $(optionsCharacterButton).click(function(){
    if($("#optionsContent").children().length!= 0){
      $("#optionsContentDiv").toggle("slow");
    }else{
      $("#optionsContentDiv").hide("slow", function(){
        if($("#optionsContentDiv").children().length != 0){
          $("#optionsContentDiv").empty();
        }
        $("#optionsContentDiv").append(getOptionsContent("character"));
        $("#optionsContentDiv").show("slow");
      });
    }
  });
  $(optionsMenuDiv).append(optionsCharacterButton);

  var optionsTrackingButton = createButton("optionsTrackingButton", "Überwachung");
  $(optionsTrackingButton).click(function(){
    if($("#trackingContent").children().length!= 0){
      $("#optionsContentDiv").toggle("slow");
    }else{
      $("#optionsContentDiv").hide("slow", function(){
        if($("#optionsContentDiv").children().length != 0){
          $("#optionsContentDiv").empty();
        }
        $("#optionsContentDiv").append(getOptionsContent("tracking"));
        $("#optionsContentDiv").show("slow");
      });
    }
  });
  $(optionsMenuDiv).append(menuspacer).append(optionsTrackingButton);

  var optionsPricesButton = createButton("optionsPricesButton", "Preise");
  $(optionsPricesButton).click(function(){
    if($("#pricesContent").children().length!= 0){
      $("#optionsContentDiv").toggle("slow");
    }else{
      $("#optionsContentDiv").hide("slow", function(){
        if($("#optionsContentDiv").children().length != 0){
          $("#optionsContentDiv").empty();
        }
        $("#optionsContentDiv").append(getOptionsContent("prices"));
        $("#optionsContentDiv").show("slow");
      });
    }
  });
  $(optionsMenuDiv).append(menuspacer).append(optionsPricesButton);

  var optionsAdministrationButton = createButton("optionsAdministrationButton", "Datenbank");
  $(optionsAdministrationButton).click(function(){
    if($("#administrationContent").children().length!= 0){
      $("#optionsContentDiv").toggle("slow");
    }else{
      $("#optionsContentDiv").hide("slow", function(){
        if($("#optionsContentDiv").children().length != 0){
          $("#optionsContentDiv").empty();
        }
        $("#optionsContentDiv").append(getOptionsContent("administration"));
        $("#optionsContentDiv").show("slow");
      });
    }
  });
  $(optionsMenuDiv).append(menuspacer).append(optionsAdministrationButton);

  $(optionsContent).append(optionsMenuDiv).append("<hr>");
  $(optionsContent).append(optionsContentDiv);

  return optionsContent;
}

function getOptionsContent(section){
  switch(section){
    case "character":
      var optionsContent = document.createElement("div");
      $(optionsContent).attr("id", "optionsContent");
      var optionsTable = document.createElement("table");
      $(optionsTable).css({
        "table-layout": "fixed",
        "width":"100%"
      });
      var oTrow = document.createElement("tr");
      var oTfirsttd = document.createElement("td");
      var oTsecondtd = document.createElement("td");
      var oTfirstTable = document.createElement("table");
      var oTsecondTable = document.createElement("table");

      $(optionsContent).append(optionsTable);
      $(optionsTable).append(oTrow);
      $(oTrow).append(oTfirsttd).append(oTsecondtd);
      $(oTfirsttd).append(oTfirstTable);
      $(oTsecondtd).append(oTsecondTable);

      $.each(data["options"]["character"], function(key, value){
        if($.inArray(key, ["isEndNode", "lastupdate", "scriptversion"]) == -1){
          var row = document.createElement("tr");
          var firsttd = document.createElement("td");
          var secondtd = document.createElement("td");
          $(row).append(firsttd);
          $(row).append(secondtd);
          if(value === false || value === true){
            var type = "checkbox";
            var checked;
            data["options"]["character"][key] === undefined ? checked = false : checked = data["options"]["character"][key];
            $(oTsecondTable).append(row);
          }else{
            var type = "number";
            var value;
            data["options"]["character"][key] === undefined ? value = 0 : value = data["options"]["character"][key];
            $(oTfirstTable).append(row);
          }
          var newInput = createInput("options"+firstLetterUpperCase(key)+"Input", type, value, checked);
          $(newInput).css("width", "10em");
          $(firsttd).append(getTranslation(key, "translation")+": ");
          $(secondtd).append(newInput);
        }
      });

      var saveOptionsButton = createButton("saveOptionsButton", "Charakterdaten speichern");
      $(saveOptionsButton).click(function(){
        saveOptions();
        $(lastupdateSpan).empty();
        $(lastupdateSpan).append(formatTimestamp(data["options"]["character"]["lastupdate"]));
      });
      $(optionsContent).append("<br>").append(saveOptionsButton);
      var lastupdateSpan = document.createElement("span");
      $(lastupdateSpan).attr("id", "lastupdateSpan");
      $(lastupdateSpan).append(formatTimestamp(data["options"]["character"]["lastupdate"]));
      $(optionsContent).append("<br>").append(getTranslation("lastupdate", "translation")+": ").append(lastupdateSpan);

      $(optionsContent).append("<br>").append(getTranslation("scriptversion", "translation")+": ").append(data["options"]["character"]["scriptversion"]).append("<br>");

      return optionsContent;
    break;

    case "tracking":
      var trackingContent = document.createElement("div");
      $(trackingContent).attr("id", "trackingContent");
      var trackingTable = document.createElement("table");
      $(trackingTable).css({
        "table-layout": "fixed",
        "width":"100%"
      });
      var tTrow = document.createElement("tr");
      var tTfirsttd = document.createElement("td");
      var tTsecondtd = document.createElement("td");
      var tTfirstTable = document.createElement("table");
      var tTsecondTable = document.createElement("table");
      $(trackingContent).append(trackingTable);
      $(trackingTable).append(tTrow);
      $(tTrow).append(tTfirsttd).append(tTsecondtd);
      $(tTfirsttd).append(tTfirstTable);
      $(tTsecondtd).append(tTsecondTable);

      var trackingCounter = -1;
      $.each(data["options"]["tracking"], function(key, value){
        trackingCounter++;
      });
      var rowCounter = (trackingCounter)/2;

      $.each(data["options"]["tracking"], function(key, value){
        if(key != "isEndNode"){
          var row = document.createElement("tr");
          var firsttd = document.createElement("td");
          var secondtd = document.createElement("td");
          $(row).append(firsttd);
          $(row).append(secondtd);
          if(value === false || value === true){
            var type = "checkbox";
            var checked;
            data["options"]["tracking"][key] === undefined ? checked = false : checked = data["options"]["tracking"][key];
            var newInput = createInput("tracking"+firstLetterUpperCase(key)+"Input", type, value, checked);
            $(newInput).css("width", "10em");
            $(firsttd).append(getTranslation(key, "translation")+": ");
            $(secondtd).append(newInput);
          }
          if(rowCounter < trackingCounter){
            $(tTfirstTable).append(row);
          }else{
            $(tTsecondTable).append(row);
          }
          trackingCounter--;
        }
      });
      var checkallTrackingboxesButton = createButton("checkallTrackingboxesButton", "Alles umschalten");
      $(checkallTrackingboxesButton).click(function(){
        $("#trackingContent input").each(function(){
          if($(this).attr("checked") ==  true){
            $(this).attr("checked", false);
          }else{
            $(this).attr("checked", true);
          }
        });
      });
      $(trackingContent).append(checkallTrackingboxesButton).append("<br>");

      var saveTrackingButton = createButton("saveTrackingButton", "Einstellungen speichern");
      $(saveTrackingButton).click(saveTracking);
      $(trackingContent).append("<br>").append(saveTrackingButton);

      return trackingContent;
    break;

    case "prices":
      var pricesContent = document.createElement("div");
      $(pricesContent).attr("id", "pricesContent");
      var pricesTable = document.createElement("table");
      $(pricesTable).css({
        "table-layout": "fixed",
        "width":"100%"
      });
      var pTrow = document.createElement("tr");
      var pTfirsttd = document.createElement("td");
      var pTsecondtd = document.createElement("td");
      var pTfirstTable = document.createElement("table");
      var pTsecondTable = document.createElement("table");
      $(pricesContent).append(pricesTable);
      $(pricesTable).append(pTrow);
      $(pTrow).append(pTfirsttd).append(pTsecondtd);
      $(pTfirsttd).append(pTfirstTable);
      $(pTsecondtd).append(pTsecondTable);

      var pricesCounter = -1;
      $.each(data["options"]["prices"], function(key, value){
        pricesCounter++;
      });
      var rowCounter = pricesCounter/2;
      $.each(data["options"]["prices"], function(key, value){
        if(key != "isEndNode"){
          var row = document.createElement("tr");
          var firsttd = document.createElement("td");
          var secondtd = document.createElement("td");
          $(row).append(firsttd);
          $(row).append(secondtd);

          var value;
          data["options"]["prices"][key] === undefined ? value = 0 : value = data["options"]["prices"][key];
          var newInput = createInput("prices"+firstLetterUpperCase(stripStuffFromStrings(key))+"Input", "number", value, false);
          $(newInput).css("width", "10em");

          $(firsttd).append(key+": ");
          $(secondtd).append(newInput).append(" Gold");
          if(rowCounter < pricesCounter){
            $(pTfirstTable).append(row);
          }else{
            $(pTsecondTable).append(row);
          }
          pricesCounter--;
        }
      });

      var savePricesButton = createButton("savePricesButton", "Preise speichern");
      $(savePricesButton).click(savePrices);
      $(pricesContent).append("<br>").append(savePricesButton);

      return pricesContent;
    break;

    case "administration":
      var administrationContent = document.createElement("div");
      $(administrationContent).attr("id", "administrationContent");

      var resetDatabaseCheckbox = createInput("resetDatabaseCheckbox", "checkbox", false, false);

      var exportDataButton = createButton("exportDataButton", "exportieren");
      var backupinput = document.createElement("input");
      $(backupinput).css("width", "30em");
      $(backupinput).attr("placeholder", "Hier Backup-Code einfügen");
      $(exportDataButton).click(function(){
        if(data["options"]["character"]["lastupdate"]!=0){
          data = loadData();
          if(data["flags"]["garden"]["fertilizerTarget"] != "" || parseInt(data["flags"]["garden"]["harvestbonusFlag"]) < 0){
            var confirmtext = "Es wurde entweder gedüngt oder Samen verwendet. Solltest du diese Daten irgendwo additiv importieren wollen, beachte bitte, dass dieser Status nicht übernommen wird und es somit zu falschen Ergebnissen führen kann. Es ist anzuraten, vorher zu ernten und erst dann zu exportieren. Möchtest du den Export trotzdem durchführen?";
            if($("#resetDatabaseCheckbox").attr("checked") == true){
              confirmtext += " Deine Statistikdaten werden  gelöscht!";
            }
            if(confirm(confirmtext)){
              $(backupinput).val(JSON.stringify(data));
              if($("#resetDatabaseCheckbox").attr("checked") == true){
                data["flags"]["garden"]["fertilizerTarget"] = "";
                data["flags"]["garden"]["harvestbonusFlag"] = -1;
                var newData = {};
                newData["options"] = data["options"];
                newData["flags"] = data["flags"];
                data = newData;
                saveData(data);
              }
            }else{
              $(backupinput).attr("placeholder", "Exportvorgang abgebrochen.");
              $(backupinput).val("");
            }
          }else{

            if($("#resetDatabaseCheckbox").attr("checked") == true){
              var confirmtext = "Möchtest du den Export wirklich durchführen?  Deine Statistikdaten werden  gelöscht!";
              if(confirm(confirmtext)){
                $(backupinput).val(JSON.stringify(data));
                var newData = {};
                newData["options"] = data["options"];
                newData["flags"] = data["flags"];
                data = newData;
                saveData(data);
              }else{
                $(backupinput).attr("placeholder", "Exportvorgang abgebrochen.");
                $(backupinput).val("");
              }
            }else{
              $(backupinput).val(JSON.stringify(data));
            }
          }
        }else{
          $(backupinput).attr("placeholder", "Keine Daten vorhanden.");
          $(backupinput).val("");
        }
      });
      var importDataButton = createButton("importDataButton", "importieren");
      $(importDataButton).click(function(){
        if($(backupinput).val() != ""){
          var doImportBool = true;
          if(localStorage.getItem(charID)){
            if(!confirm("Es scheinen Daten vorhanden zu sein, die beim Import gegebenenfalls überschrieben werden. Bist du dir sicher, dass du den Import durchführen willst?")){
              doImportBool = false;
            }
          }
          if(doImportBool == true){
            try{
              data = JSON.parse($(backupinput).val());
              saveData(data);
              $(backupinput).val("");
              $(backupinput).attr("placeholder", "Import erfolgreich!");
              localStorage.setItem(charID+"_lastupdate", Date.now());
              if(data["options"]["character"]["autoupdate"] == true){
                localStorage.setItem(charID+"_autoupdate", "true");
              }else{
                localStorage.setItem(charID+"_autoupdate", "false");
              }
              toggle("optionsMenu");
              $("#toggleToolboxButtonImage").attr("src", iconGood);
            }catch(error){
              console.log(error);
              $(backupinput).attr("placeholder", "Fehler!");
              $(backupinput).val("");
            }
          }
        }else{
          $(backupinput).attr("placeholder", "Da muss schon dein Backup hier rein...");
        }
      });
      var additiveImportButton = createButton("additiveImportButton", "additiv importieren");
      $(additiveImportButton).click(function(){
        if($(backupinput).val() != ""){
          try{
            var newData = JSON.parse($(backupinput).val());
            if(newData["flags"]["garden"]["fertilizerTarget"] != "" || parseInt(newData["flags"]["garden"]["harvestbonusFlag"]) < 0){
              if(confirm("Der zu importierende Datenbestand deutet darauf hin, dass gedüngt oder Samen verwendet wurde. Die nächste Gartenernte wird daher ignoriert. Möchtest du die Daten zu wirklich deinem Bestand hinzufügen?")){
                data = doAdditiveImport(data, newData);
                data["flags"]["garden"]["harvestbonusFlag"] = -1;
                data["flags"]["garden"]["fertilizerTarget"] = "";
                saveData(data);
                $(backupinput).attr("placeholder", "Additiver Import erfolgreich.");
                $(backupinput).val("");
              }else{
                $(backupinput).attr("placeholder", "Additiver Import abgebrochen.");
                $(backupinput).val("");
              }
            }else{
              if(confirm("Möchtest du diese Daten zu deinem derzeitigen Datenbestand hinzufügen?")){
                data = doAdditiveImport(data, newData);
                saveData(data);
                $(backupinput).attr("placeholder", "Additiver Import erfolgreich.");
                $(backupinput).val("");
              }else{
                $(backupinput).attr("placeholder", "Additiver Import abgebrochen.");
                $(backupinput).val("");
              }
            }
          }catch(error){
            console.log(error);
            $(backupinput).attr("placeholder", "Fehler!");
            $(backupinput).val("");
          }
        }
      });
      $(administrationContent).append("Daten ").append(exportDataButton).append(" / ").append(importDataButton).append(" / ").append(additiveImportButton).append("<br>").append(resetDatabaseCheckbox).append("Datenbank beim Export zurücksetzen?<br>").append(backupinput);

      var deleteDatabaseButton = createButton("deleteDatabaseButton", "Datenbank löschen");
      $(deleteDatabaseButton).click(removeDatabase);
      $(administrationContent).append("<br>").append("<br>").append(deleteDatabaseButton);

      return administrationContent;
    break;
    default://
  }
}

function helpContent(){
  var helpContent = document.createElement("div");
  $(helpContent).append(getHelpText("intro")).append("<br>");

  var sectionArray = ["short", "help", "options", "statistics", "manualInput"];
  var translationArray = ["Kurzübersicht", "Hilfe", "Einstellungen", "Statistiken", "Nachtragen"];

  $.each(sectionArray, function(index, name){
	  var helpDiv = document.createElement("div");
    $(helpDiv).attr("id", name+"HelpDiv");
    $(helpDiv).css("display", "none");
    $(helpDiv).append(getHelpText(name));

    var button = createButton(name+"HelpButton", translationArray[index]);
	  $(button).click(function(){
      $("#"+name+"HelpDiv").toggle("slow");
    });
    $(helpContent).append("<br>").append(button).append("<br>").append(helpDiv);
  });

  return helpContent;
}

function statisticsContent(){
  var statisticsContent = document.createElement("div");
  var statisticsMenuDiv = document.createElement("div");
  $(statisticsMenuDiv).attr("id", "statisticsMenuDiv");
  var statisticsContentDiv = document.createElement("div");
  $(statisticsContentDiv).attr("id", "statisticsContentDiv");
  var hasdata = false;
  $.each(data, function(key, value){
    if($.inArray(key, ["options", "flags"]) == -1){
      hasdata = true;
    }
  });
  if (!hasdata){
    $(statisticsMenuDiv).append("Es sind keine Statistiken vorhanden.");
  }else{
    data = loadData(); //if there was input in another tab
    data = sortData(data);
    saveData(data);
    var select0 = document.createElement("select");
    $(select0).attr("id", "select0");
    var nullOption = document.createElement("option");
    $(nullOption).attr({
      value: 0,
      text: "Bereich:",
      selected: "selected"
    });
    $(select0).append(nullOption);

    var optionarray = [];
    $.each(data, function(key, keyvalue){
      if ($.inArray(key, ["options", "flags"]) == -1){
        optionarray.push(getTranslation(key, "translation"));
      }
    });
    optionarray.sort();

    for(var o = 0; o< optionarray.length; o++){
      var selectOption = document.createElement("option");
      $(selectOption).attr({
        value: getTranslation(optionarray[o], "db"),
        text: optionarray[o],
      });
      $(select0).append(selectOption);
    }

    $(statisticsMenuDiv).append(select0).append(nbspSpan);
    $(select0).change(function(){
      if($(this).val() === "0"){
        if($("#statisticsContentDiv").children().length != 0){$("#statisticsContentDiv").empty();}
        $("#statisticsMenuDiv span").slice(1).remove();
        $("#statisticsMenuDiv select").slice(1).remove();
      }else{
        if($("#statisticsContentDiv").children().length != 0){$("#statisticsContentDiv").empty();}
        $("#statisticsMenuDiv span").slice(1).remove();
        $("#statisticsMenuDiv select").slice(1).remove();
        modifyStatisticSelect(data[$(this).val()], 1);
      }
    });
  }
  $(statisticsContent).append(statisticsMenuDiv).append("<hr>");
  $(statisticsContent).append(statisticsContentDiv);

  return statisticsContent;
}

function getStatisticsContent(somedata){
  var dataOverviewDiv = document.createElement("div");
  $(dataOverviewDiv).attr("id", "dataOverviewDiv");
  var sortRuleArray = getSortRuleArray($("#select0").val());
  var statisticsTable = document.createElement("table");
  $(statisticsTable).attr("id", "statisticsTable");
  var headerrow = document.createElement("tr");
  var somerow = document.createElement("tr");
  $(dataOverviewDiv).append(statisticsTable);
  $(statisticsTable).append(headerrow);
  $(statisticsTable).append(somerow);

  switch($("#select0").val()){
    case "herbs":
      var statrow = document.createElement("tr");
      var goldperhour = 0;
      for(var i=0; i<sortRuleArray.length; i++){
        if(somedata[sortRuleArray[i]]){
          var headertd = document.createElement("td");
          $(headertd).append(nbsp+"<b>"+getShortName(getTranslation(sortRuleArray[i], "translation"))+"</b>"+nbsp);
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[sortRuleArray[i]]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          if(sortRuleArray[i]== "herbsHourCount"){
            $(stattd).append("<b>1/h</b>");
          }else if(sortRuleArray[i]== "herbsNothing"){
            $(stattd).append("("+round((parseInt(somedata[sortRuleArray[i]]) / parseInt(somedata["herbsHourCount"]))*100, 2) +"%)");
          }else{
            goldperhour += parseInt(somedata[sortRuleArray[i]]) * parseInt(data["options"]["prices"][sortRuleArray[i]]);
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]]) / parseInt(somedata["herbsHourCount"])), 2));
          }
          $(statrow).append(stattd);
        }
      }
      $.each(somedata, function(key, value){
        if($.inArray(key, sortRuleArray) == -1 && key != "isEndNode"){
          var headertd = document.createElement("td");
          $(headertd).append("<b>"+getShortName(getTranslation(key, "translation"))+"</b>");
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[key]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          goldperhour += parseInt(value) * parseInt(data["options"]["prices"][key]);
          $(stattd).append(round((parseInt(somedata[sortRuleArray[i]]) / parseInt(somedata["herbsHourCount"])), 2));
          $(statrow).append(stattd);
        }
      });
      goldperhour = round((goldperhour / parseInt(somedata["herbsHourCount"])),2);
      $(statisticsTable).append(statrow);
      $(dataOverviewDiv).append("<br>").append("<b>Gold/h: "+goldperhour+"</b>").append("<br>");
    break;

    case "wilderness":
      for(var i=0; i<sortRuleArray.length; i++){
        if(somedata[sortRuleArray[i]]){
          var headertd = document.createElement("td");
          $(headertd).append(nbsp+"<b>"+getTranslation(sortRuleArray[i], "translation")+"</b>"+nbsp);
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[sortRuleArray[i]]);
          $(somerow).append(sometd);
        }
      }
    break;

    case "bird":
      var statrow = document.createElement("tr");
      for(var i=0; i<sortRuleArray.length; i++){
        if(somedata[sortRuleArray[i]]){
          var headertd = document.createElement("td");
          $(headertd).append(nbsp+"<b>"+getShortName(getTranslation(sortRuleArray[i], "translation"))+"</b>"+nbsp);
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[sortRuleArray[i]]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          if(sortRuleArray[i] == "birdCount"){
            $(stattd).append("<b>%:</b>");
          }else{
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["birdCount"]))*100, 2) +"%");
          }
          $(statrow).append(stattd);
        }
      }
      $.each(somedata, function(key, value){
        if($.inArray(key, sortRuleArray) == -1 && key != "isEndNode"){
          var headertd = document.createElement("td");
          $(headertd).append("<b>"+getShortName(getTranslation(key, "translation"))+"</b>");
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[key]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          $(stattd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["birdCount"]))*100, 2) +"%");
          $(statrow).append(stattd);
        }
      });
      $(statisticsTable).append(statrow);
    break;

    case "altar":
      var chancesrow = document.createElement("tr");
      var avgrow = document.createElement("tr");
      for(var i=0; i<sortRuleArray.length; i++){
        if(somedata[sortRuleArray[i]]){
          var headertd = document.createElement("td");
          $(headertd).append(nbsp+"<b>"+getShortName(getTranslation(sortRuleArray[i], "translation"))+"</b>"+nbsp);
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[sortRuleArray[i]]);
          $(somerow).append(sometd);

          var chancestd =  document.createElement("td");
          $(chancestd).css("text-align", "center");
          var avgtd =  document.createElement("td");
          $(avgtd).css("text-align", "center");

          if(sortRuleArray[i] == "prayCount"){
            $(chancestd).append("<b>%:</b>");
            $(avgtd).append("<b>&empty;:</b>");

          }else if(sortRuleArray[i] == "prayEPAmount"){
            $(chancestd).append("");
            $(avgtd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["prayEPCount"])), 2));

          }else if(sortRuleArray[i] == "prayGoldAmount"){
            $(chancestd).append("");
            $(avgtd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["prayGoldCount"])), 2));

          }else if($.inArray(sortRuleArray[i], ["prayEPHighest", "prayEPLowest", "prayGoldHighest", "prayGoldLowest"]) > -1){
            $(chancestd).append("");
            $(avgtd).append("");

          }else if($.inArray(sortRuleArray[i], ["prayNothing", "prayEPCount", "prayGoldCount", "prayHealCount", "prayHarvestCount", "prayActionpointsCount", "prayProtbuffCount"]) > -1){
            $(chancestd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["prayCount"]))*100, 2)+"%");
            $(avgtd).append("");
          }

          $(chancesrow).append(chancestd);
          $(avgrow).append(avgtd);
        }
      }
      $(statisticsTable).append(chancesrow);
      $(statisticsTable).append(avgrow);
    break;

    case "horse":
      //horse -> horselvl -> horseCount/-ep, encounters, horseplayerep/lp
      var statrow = document.createElement("tr");
      for(var i=0; i<sortRuleArray.length; i++){
        if(somedata[sortRuleArray[i]]){
          var headertd = document.createElement("td");
          $(headertd).append(nbsp+"<b>"+getTranslation(sortRuleArray[i], "translation")+"</b>"+nbsp);
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[sortRuleArray[i]]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          if(sortRuleArray[i] == "horseCount"){
            $(stattd).append("<b>&empty; &amp; %</b>");
          }else if(sortRuleArray[i] == "horseEPAmount"){
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["horseCount"])), 2));
          }else if(sortRuleArray[i] == "horseEncounters"){
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["horseCount"]))*100, 2)+"%");
          }else{
            $(stattd).append("");
          }

          $(statrow).append(stattd);
        }
      }
      $(statisticsTable).append(statrow);
    break;

    case "garden":
      var chancesrow = document.createElement("tr");
      var avgrow = document.createElement("tr");
      $(statisticsTable).append(chancesrow);
      $(statisticsTable).append(avgrow);
      var secondheaderrow = document.createElement("tr");
      var secondsomerow = document.createElement("tr");
      $(statisticsTable).append("<tr><td>"+nbsp+"</td></tr>");
      $(statisticsTable).append(secondheaderrow);
      $(statisticsTable).append(secondsomerow);
      $(secondheaderrow).append("<td>"+nbsp+"</td>");
      $(secondsomerow).append("<td>"+nbsp+"</td>");
      if(somedata["fertilizerSuccessCount"] || somedata["fertilizerFailureCount"]){
        var thirdheaderrow = document.createElement("tr");
        var thirdsomerow = document.createElement("tr");
        $(statisticsTable).append("<tr><td>"+nbsp+"</td></tr>");
        $(statisticsTable).append(thirdheaderrow);
        $(statisticsTable).append(thirdsomerow);
        $(thirdheaderrow).append("<td>"+nbsp+"</td>");
        $(thirdsomerow).append("<td>"+nbsp+"</td>");
      }

      for(var i=0; i<sortRuleArray.length; i++){
        if(somedata[sortRuleArray[i]]){
          var headertd = document.createElement("td");
          $(headertd).css("text-align", "center");
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          var herbsArray = ["Guljak", "Joruga", "Sorage", "Kurag", "Kurel", "Tairan", "Tolwar"];
          var actualHerb = "";
          var transHelper = sortRuleArray[i];
          for(var h = 0; h < herbsArray.length; h++){
            if(sortRuleArray[i].indexOf(herbsArray[h])>-1){
              actualHerb = herbsArray[h];
              transHelper = sortRuleArray[i].replace(actualHerb, "Herb");
            }
          }
          $(headertd).append("<b>"+getTranslation(transHelper, "translation")+actualHerb+"</b>");
          $(sometd).append(somedata[sortRuleArray[i]]);

          if(sortRuleArray[i].indexOf("harvest")>-1 && ( sortRuleArray[i].indexOf("Count")>-1 ||  sortRuleArray[i].indexOf("Amount")>-1)){
            var chancestd =  document.createElement("td");
            var avgtd = document.createElement("td");
            $(chancestd).css("text-align", "center");
            $(avgtd).css("text-align", "center");

            if(sortRuleArray[i] == "harvestCount"){
              $(chancestd).append("<b>%:</b>");
              $(avgtd).append("<b>&empty;:</b>");

            }else if(sortRuleArray[i].indexOf("Amount")>-1){
              $(chancestd).append("");
              var countername = sortRuleArray[i].substring(0, sortRuleArray[i].indexOf("Amount"));
              $(avgtd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata[countername+"Count"])), 2));

            }else if(sortRuleArray[i].indexOf("Count")>-1){
              $(chancestd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["harvestCount"]))*100, 2)+"%");
              $(avgtd).append("");
            }

            $(headerrow).append(headertd);
            $(somerow).append(sometd);
            $(chancesrow).append(chancestd);
            $(avgrow).append(avgtd);
          }else{
            if((sortRuleArray[i].indexOf("harvest")>-1 && (sortRuleArray[i].indexOf("Highest")>-1 || sortRuleArray[i].indexOf("Lowest")>-1) )){
              $(secondheaderrow).append(headertd);
              $(secondsomerow).append(sometd);
            }else if(sortRuleArray[i].indexOf("fertilizerSuccess")>-1 || sortRuleArray[i].indexOf("fertilizerFailure")>-1){
              $(thirdheaderrow).append(headertd);
              $(thirdsomerow).append(sometd);
            }
          }
        }
      }
    break;

    case "leatherpouches":
      var statrow = document.createElement("tr");
      for(var i=0; i<sortRuleArray.length; i++){
        if(somedata[sortRuleArray[i]]){
          var headertd = document.createElement("td");
          $(headertd).append(nbsp+"<b>"+getTranslation(sortRuleArray[i], "translation")+"</b>"+nbsp);
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[sortRuleArray[i]]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          if(sortRuleArray[i]== "leatherpouchesCount"){
            $(stattd).append("<b>&empty; &amp; %</b>");
          }else if(sortRuleArray[i]== "leatherpouchesDamaged"){
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]]) / parseInt(somedata["leatherpouchesCount"])*100), 2)+"%");
          }else if(sortRuleArray[i]== "leatherpouchesGoldAmount"){
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]]) / parseInt(somedata["leatherpouchesCount"])), 2));
          }else{
            $(stattd).append("");
          }
          $(statrow).append(stattd);
        }
      }
      $.each(somedata, function(key, value){
        if($.inArray(key, sortRuleArray) == -1 && key != "isEndNode"){
          var headertd = document.createElement("td");
          $(headertd).append("<b>"+getShortName(getTranslation(key, "translation"))+"</b>");
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[key]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          $(stattd).append("");
          $(statrow).append(stattd);
        }
      });
      $(statisticsTable).append(statrow);
    break;

    case "research":
      var statrow = document.createElement("tr");
      for(var i=0; i<sortRuleArray.length; i++){
        if(somedata[sortRuleArray[i]]){
          var headertd = document.createElement("td");
          $(headertd).append(nbsp+"<b>"+getTranslation(sortRuleArray[i], "translation")+"</b>"+nbsp);
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[sortRuleArray[i]]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          if(sortRuleArray[i]== "researchCount"){
            $(stattd).append("<b>%</b>");
          }else if(sortRuleArray[i]== "researchSparks"){
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]]) / parseInt(somedata["researchCount"])*100), 2)+"%");
          }else{
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]]) / parseInt(somedata["researchCount"])*100), 2)+"%");
          }
          $(statrow).append(stattd);
        }
      }
      $.each(somedata, function(key, value){
        if($.inArray(key, sortRuleArray) == -1 && key != "isEndNode"){
          var headertd = document.createElement("td");
          $(headertd).append(nbsp+"<b>"+getShortName(getTranslation(key, "translation"))+"</b>"+nbsp);
          $(headertd).css("text-align", "center");
          $(headerrow).append(headertd);
          var sometd =  document.createElement("td");
          $(sometd).css("text-align", "center");
          $(sometd).append(somedata[key]);
          $(somerow).append(sometd);

          var stattd =  document.createElement("td");
          $(stattd).css("text-align", "center");
          $(stattd).append(round((parseInt(somedata[key]) / parseInt(somedata["researchCount"])*100), 2)+"%");
          $(statrow).append(stattd);
        }
      });
      $(statisticsTable).append(statrow);
    break;

    case "phasecrystals":
      /*phasecrystalAttemptES##
      phasecrystalFailES##*/
      var statrow = document.createElement("tr");
      $(headerrow).append("<td></td>");
      $(somerow).append("<td><b></b></td>");
      $(statrow).append("<td><b>%:</b></td>");
      $(statisticsTable).append(statrow);
      for(var i=0; i<sortRuleArray.length; i++){
        var energyshards = sortRuleArray[i].substring(sortRuleArray[i].indexOf("ES")+2, sortRuleArray[i].length);
        var headertd = document.createElement("td");
        $(headertd).css("text-align", "center");
        $(headerrow).append(headertd);

        if(sortRuleArray[i].indexOf("phasecrystalAttemptES")>-1){
          $(headertd).append(nbsp+"<b>"+getTranslation("phasecrystalAttemptES", "translation")+energyshards+"</b>"+nbsp);
        }else{
          $(headertd).append(nbsp+"<b>"+getTranslation("phasecrystalFailES", "translation")+energyshards+"</b>"+nbsp);
        }


        var sometd =  document.createElement("td");
        $(sometd).css("text-align", "center");
        $(somerow).append(sometd);
        var stattd =  document.createElement("td");
        $(stattd).css("text-align", "center");
        $(statrow).append(stattd);

        if(somedata[sortRuleArray[i]]>=0){
          $(sometd).append(somedata[sortRuleArray[i]]);
          if(sortRuleArray[i].indexOf("phasecrystalFailES")>-1){
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]]) / parseInt(somedata["phasecrystalAttemptES"+energyshards]))*100, 2)+"%");
          }else{
            $(stattd).append("");
          }
        }else{
          $(sometd).append("");
          $(stattd).append("");
        }
      }
    break;

    case "staffEnhancement":
      var statrow = document.createElement("tr");
      $(statisticsTable).append(statrow);
      $(headerrow).append("<td></td>");
      $(somerow).append("<td><b></b></td>");
      $(statrow).append("<td><b>Erfolgs-%</b></td>");
      var secondtable = document.createElement("table");
      var secondheaderrow = document.createElement("tr");
      var secondsomerow = document.createElement("tr");
      var secondstatrow = document.createElement("tr");
      $(secondtable).append(secondheaderrow);
      $(secondtable).append(secondsomerow);
      $(secondtable).append(secondstatrow);
      $(secondheaderrow).append("<td></td>");
      $(secondsomerow).append("<td><b></b></td>");
      $(secondstatrow).append("<td><b>Erfolgs-%</b></td>");
      var hassecondtable = false;

      for(var i=0; i<sortRuleArray.length; i++){
        var headertd = document.createElement("td");
        $(headertd).css("text-align", "center");
        var targetedlvl = parseInt(sortRuleArray[i].substring(sortRuleArray[i].indexOf("To")+2, sortRuleArray[i].length));
        if(sortRuleArray[i].indexOf("AttemptCount")>-1){
          $(headertd).append(nbsp+"<b>"+getTranslation("staffEnhancementAttemptCountTo", "translation")+targetedlvl+"</b>"+nbsp);
        }else if(sortRuleArray[i].indexOf("SuccessCount")>-1){
          $(headertd).append(nbsp+"<b>"+getTranslation("staffEnhancementSuccessCountTo", "translation")+targetedlvl+"</b>"+nbsp);
        }


        var sometd =  document.createElement("td");
        $(sometd).css("text-align", "center");
        if(somedata[sortRuleArray[i]]>=0){
          $(sometd).append(somedata[sortRuleArray[i]]);
        }else{
          $(sometd).append("");
        }

        var stattd = document.createElement("td");
        $(stattd).css("text-align", "center");
        if(sortRuleArray[i].indexOf("AttemptCount")>-1){
          $(stattd).append("");
        }else if(sortRuleArray[i].indexOf("SuccessCount")>-1){
          if(somedata[sortRuleArray[i]]>=0){
            $(stattd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["staffEnhancementAttemptCountTo"+targetedlvl]))*100, 2)+"%");
          }else{
            $(stattd).append("");
          }

        }
        if(targetedlvl <= 6){
          $(headerrow).append(headertd);
          $(somerow).append(sometd);
          $(statrow).append(stattd);
        }else if(targetedlvl <= 12){
          $(secondheaderrow).append(headertd);
          $(secondsomerow).append(sometd);
          $(secondstatrow).append(stattd);
        }
      }
      $.each(somedata, function(key){
        var targetedlvl = parseInt(key.substring(key.indexOf("To")+2, key.length));
        if(targetedlvl >= 7 && targetedlvl <= 12){
          hassecondtable = true;
        }
      });
      if(hassecondtable == true){
        $(dataOverviewDiv).append("<br>").append(secondtable);
      }
    break;

    case "glyphboards":
      var statrow = document.createElement("tr");
      var secondsomerow = document.createElement("tr");
      var secondstatrow = document.createElement("tr");
      $(statisticsTable).append(statrow);
      $(statisticsTable).append(secondsomerow);
      $(statisticsTable).append(secondstatrow);
      $(headerrow).append("<td></td>");
      $(somerow).append("<td><b>normal</b></td>");
      $(statrow).append("<td><b>%</b></td>");
      $(secondsomerow).append("<td><b>effektiv</b></td>");
      $(secondstatrow).append("<td><b>%</b></td>");

      var secondtableheaderrow = document.createElement("tr");
      var secondtablesomerow = document.createElement("tr");
      var secondtablestatrow = document.createElement("tr");
      var secondtablesecondheaderrow = document.createElement("tr");
      var secondtablesecondsomerow = document.createElement("tr");
      var secondtablesecondstatrow = document.createElement("tr");
      $(statisticsTable).append("<tr><td>"+nbsp+"</td></tr>");
      $(statisticsTable).append(secondtableheaderrow);
      $(statisticsTable).append(secondtablesomerow);
      $(statisticsTable).append(secondtablestatrow);
      $(statisticsTable).append(secondtablesecondheaderrow);
      $(statisticsTable).append(secondtablesecondsomerow);
      $(statisticsTable).append(secondtablesecondstatrow);
      $(secondtableheaderrow).append("<td></td>");
      $(secondtablesomerow).append("<td><b>normal</b></td>");
      $(secondtablestatrow).append("<td><b>%</b></td>");
      $(secondtablesecondsomerow).append("<td><b>effektiv</b></td>");
      $(secondtablesecondstatrow).append("<td><b>%</b></td>");
      $(dataOverviewDiv).append(secondtable);

      function ispositive(attr){
        var attrarr = ["ohne", "resistent", "haltbar", "stärkend", "schützend", "beruhigend", "vereinfacht"];
        if($.inArray(attr, attrarr)>-1){
          return true;
        }else{
          return false;
        }
      }

      for(var i=0; i<sortRuleArray.length; i++){
        var headertd = document.createElement("td");
        $(headertd).css("text-align", "center");
        var sometd = document.createElement("td");
        $(sometd).css("text-align", "center");
        var stattd = document.createElement("td");
        $(stattd).css("text-align", "center");
        var effective = sortRuleArray[i].substring(0, sortRuleArray[i].indexOf("#"));
        var attribute = sortRuleArray[i].substring(sortRuleArray[i].indexOf("#")+1, sortRuleArray[i].length);

        if(somedata[sortRuleArray[i]]){
          $(sometd).append(somedata[sortRuleArray[i]]);
          $(stattd).append(round((parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["glyphboardCount"]))*100, 2)+"%");
        }else{
          $(sometd).append("");
          $(stattd).append("");
        }

        if(effective == "normal"){
          $(headertd).append(nbsp+"<b>"+attribute+"<b>"+nbsp);
          if(ispositive(attribute)){
            $(headerrow).append(headertd);
            $(statrow).append(stattd);
            $(somerow).append(sometd);
          }else{
            $(secondtableheaderrow).append(headertd);
            $(secondtablestatrow).append(stattd);
            $(secondtablesomerow).append(sometd);
          }
        }else if(effective == "effektiv"){
          if(ispositive(attribute)){
            $(secondstatrow).append(stattd);
            $(secondsomerow).append(sometd);
          }else{
            $(secondtablesecondstatrow).append(stattd);
            $(secondtablesecondsomerow).append(sometd);
          }

        }
      }
      $(dataOverviewDiv).append("<br>").append("<b>Zeichentafelbenutzungen gesamt: "+parseInt(somedata["glyphboardCount"])+"</b>").append("<br>");
    break;

    case "stoneOfPatience":
      var chancesrow = document.createElement("tr");
      var avgrow = document.createElement("tr");
      $(statisticsTable).append(chancesrow);
      $(statisticsTable).append(avgrow);

      for(var i=0; i<sortRuleArray.length; i++){
        var headertd = document.createElement("td");
        $(headertd).css("text-align", "center");
        var sometd = document.createElement("td");
        $(sometd).css("text-align", "center");
        var chancestd = document.createElement("td");
        $(chancestd).css("text-align", "center");
        var avgtd = document.createElement("td");
        $(avgtd).css("text-align", "center");
        $(headerrow).append(headertd);
        $(somerow).append(sometd);
        $(chancesrow).append(chancestd);
        $(avgrow).append(avgtd);

        if(somedata[sortRuleArray[i]]>=0){
          $(headertd).append(nbsp+"<b>"+getTranslation(sortRuleArray[i], "translation")+"</b>"+nbsp);
          $(sometd).append(somedata[sortRuleArray[i]]);
          if(sortRuleArray[i] == "sopAttemptCount"){
            $(chancestd).append(nbsp+"<b>%:</b>"+nbsp);
            $(avgtd).append(nbsp+"<b>&empty;:</b>"+nbsp);
          }else if(sortRuleArray[i].indexOf("Count")>-1 && sortRuleArray[i] != "sopAttemptCount"){
            $(chancestd).append(round(parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["sopAttemptCount"])*100, 2) +"%");
            $(avgtd).append("");
          }else if(sortRuleArray[i].indexOf("Amount")>-1){
            if(sortRuleArray[i].indexOf("Glory")>-1){
              var soptype = "Glory";
            }else if(sortRuleArray[i].indexOf("EP")>-1){
              var soptype = "EP";
            }
            $(chancestd).append("");
            $(avgtd).append(round(parseInt(somedata[sortRuleArray[i]])/parseInt(somedata["sop"+soptype+"Count"]), 2));
          }else{
            $(chancestd).append("");
            $(avgtd).append("");
          }
        }
      }
    break;

    case "plumbumclump":
      for(var i=0; i<sortRuleArray.length; i++){
        var headertd = document.createElement("td");
        $(headertd).append(nbsp+"<b>"+getTranslation(sortRuleArray[i], "translation")+"</b>"+nbsp);
        $(headertd).css("text-align", "center");
        $(headerrow).append(headertd);
        var sometd =  document.createElement("td");
        $(sometd).css("text-align", "center");
        $(sometd).append(somedata[sortRuleArray[i]]);
        $(somerow).append(sometd);
      }
      var goldperclump = round((parseInt(somedata["plumbumclumpGoldAmount"]) / parseInt(somedata["plumbumclumpCount"])),2);
      $(dataOverviewDiv).append("<br>").append("<b>Gold/Bleiklumpen: "+goldperclump+"</b>").append("<br>");
    break;

    default: //nothing
  }

  $(dataOverviewDiv).append("<br>").append(createKeyOverviewDiv())
  return dataOverviewDiv;
}

function createKeyOverviewDiv(){
  var keyOverviewDiv = document.createElement("div");
  //$(keyOverviewDiv).css("text-align", "center");
  var keyOverviewSpan = document.createElement("span");
  $(keyOverviewSpan).css("display", "none");
  $(keyOverviewSpan).append(getKeyOverview($("#select0").val()));
  var toggleKeyOverviewButton = createButton("toggleKeyOverviewButton", "&#8675;Legende")
  $(toggleKeyOverviewButton).click(function(){
    if($(keyOverviewSpan).css("display") == "none"){
      $(toggleKeyOverviewButton).html("&#8673;Legende") //will now open
    }else{
      $(toggleKeyOverviewButton).html("&#8675;Legende")
    }
    $(keyOverviewSpan).toggle("slow", function(){});
  });
  $(keyOverviewDiv).append(toggleKeyOverviewButton).append(keyOverviewSpan);

  return keyOverviewDiv;
}

function getKeyOverview(section){
  switch(section){
    case "herbs":
      var keyObject = {
        "h": "Anzahl der Stunden insgesamt",
        "h<sub>0<sub>": "Anzahl der Stunden ohne Erfolg",
        "[Pflanze]": "Anzahl der gesammelten [Pflanze]n insgesamt"
      }
    break;

    case "bird":
      var keyObject = {
        "nichts": "Einsätze ohne etwas gefunden zu haben",
        "[Item]": "Gesamtzahl des gefundenen Items"
      }
    break;

    case "wilderness":
      var keyObject = {
        "Kräuterausflüge": "Anzahl der Male (<u>nicht</u> Stunden), die du Kräutersammeln gegangen bist",
        "Lederbeutel": "Zahl der Lederbeutel, die du gefunden hast"
      }
    break;

    case "altar":
      var keyObject = {
        "&#9815;": "Anzahl der Gebete insgesamt",
        "&#9815;<sub>0</sub>": "Anzahl der Gebete ohne Erfolg",
        "&#9815;[EP/Gold]": "Anzahl der Gebeten mit [EP/Gold]-Ergebnis",
        "&sum;[EP/Gold]": "Summe der Werte aus Gebeten mit [EP/Gold]",
        "&#9650;[EP/Gold]": "Höchstes Ergebnis aus Gebeten mit [EP/Gold]",
        "&#9660;[EP/Gold]": "Niedrigstes Ergebnis aus Gebeten mit [EP/Gold]",
        "&#9815;Ernte": "Anzahl der Gebete mit bereitstehender Ernte",
        "&#9815;Heilung": "Anzahl der Gebete mit Vollheilung",
        "&#9815;AP": "Anzahl der Gebete mit Aktionspunkten",
        "&#9815;+3V": "Anzahl der Gebete mit Verteidigungsbonus"
      }
    break;

    case "horse":
      var keyObject = {
        "&#9816;": "Anzahl der Ausritte insgesamt",
        "&sum;&#9816;EP": "Anzahl der gesammelten Pferde-EP insgesamt",
        "ZEs": "Anzahl der aufgetretenen Zwischenereignisse nach Ausritten",
        "&sum;Spieler-EP": "Anzahl der gesammelten Spieler-EP insgesamt",
        "&sum;Spieler-LP": "anzahl der gesammelten Spieler-LP insgesamt"
      }
    break;

    case "garden":
      var keyObject = {
        "&#9880;": "Anzahl der Ernten insgesamt",
        "&#9880;[Pflanze]": "Anzahl der Ernten mit [Pflanze]",
        "&sum;[Pflanze]": "Summe der geernteten [Pflanze]n",
        "&#9650;[Pflanze]": "Höchste Anzahl bei Ernte mit [Pflanze]",
        "&#9660;[Pflanze]": "Niedrigste Anzahl bei Ernte mit [Pflanze]",
        "&#10003;&#9880;": "Dünger-Erfolg insgesamt",
        "&#10007;&#9880;": "Dünger-Fehlschläge insgesamt",
        "&#10003;[Pflanze]": "Dünger-Erfolge mit [Pflanze]",
        "&#10007;[Pflanze]": "Dünger-Fehlschlag mit [Pflanze]"
      }
    break;

    case "leatherpouches":
      var keyObject = {
        "Beutel": "Anzahl geöffneter Lederbeutel insgesamt",
        "beschädigt": "Anzahl der beim Öffnen beschädigten Lederbeutel",
        "&sum;Gold": "Summe des erhaltenes Goldes",
        "&#9650;Gold": "Höchste Goldsumme bei einer Öffnung",
        "&#9660;Gold": "Niedrigste Goldsumme bei einer Öffnung",
        "[Item]": "Anzahl eines erhaltenes [Item]s beim Öffnen"
      }
    break;

    case "research":
      var keyObject = {
        "Einheiten": "Anzahl absolvierter Nachbearbeitungsphasen insgesamt",
        "&#10024;": "Anzahl der erhaltenen magischen Funken insgesamt",
        "[Item]": "Anzahl eines erhaltenen [Item]s"
      }
    break;

    case "phasecrystals":
      var keyObject = {
        "&#9889;[Zahl]": "Aufwertungsversuche unter Verwendung von [Zahl] Energiesplittern",
        "&#10007;&#9889;[Zahl]": "Misserfolge bei Aufwertung mit [Zahl] verwendeten Energiesplittern"
      }
    break;

    case "staffEnhancement":
      var keyObject = {
        "&#9874;+[Zahl]": "Versuche, einen Stab auf +[Zahl] zu bringen",
        "&#10003;+[Zahl]": "Erfolge bei der Verstärkung auf +[Zahl]"
      }
    break;

    case "glyphboards":
      var keyObject = {
        "[Attribut]": "Anzahl der [normalen/effektiv] erstellten Zauberzeichen mit [Attribut]"
      }
    break;

    case "stoneOfPatience":
      var keyObject = {
        "&#9714;": "Anzahl der Versuche am Stein der Geduld insgesamt",
        "&#9714;<sub>0</sub>": "Anzahl der Versuche ohne Erfolg insgesamt (ohne Wegwerfen)",
        "&#9714;<sub>Wut</sub>": "Anzahl der weggeworfenen Steine der Geduld insgesamt",
        "&#9714;[EP/Ruhm]": "Anzahl der Erfolge mit dem Ergebnis [EP/Ruhm]",
        "&sum;[EP/Ruhm]": "Summe der Werte aus [EP/Ruhm]-Erfolgen",
        "&#9650;[EP/Ruhm]": "Höchster erlangter Wert von [EP/Ruhm]",
        "&#9660;[EP/Ruhm]": "Niedrigster erlangter Wert von [EP/Ruhm]",
        "&#9714;Kr.glas": "Anzahl an Umwandlungen in ein Kristallglas",
        "&#9714;Glaskl.": "Anzahl an Umwandlungen in einen Glasklumpen",
        "&#9714;Blei": "Anzahl an Umwandlungen in einen Bleiklumpen",
      }
    break;

    case "plumbumclump":
      var keyObject = {
        "Umwandlungen": "Anzahl der Umwandlungen von Bleiklumpen insgesamt",
        "&sum;Gold": "Summe des Goldes aus Umwandlungen",
        "&#9650;Gold": "Höchster Goldwert aus Umwandlung",
        "&#9660;Gold": "Niedrigster Goldwert aus Umwandlung"
      }
    break;

    default:
      var keyObject = "error";
  }

  var keySpan = document.createElement("span");
  if(keyObject != "error"){
    var keyTable = document.createElement("table");
    $(keyTable).css({
      "table-layout": "fixed",
      "width":"100%"
    });
    $.each(keyObject, function(key, description){
      var keyTr = document.createElement("tr");
      var keyTdLeft = document.createElement("td");
      $(keyTdLeft).css("width", "20%");
      $(keyTdLeft).append("<b>"+key+"</b>");
      var keyTdRight = document.createElement("td");
      $(keyTdRight).append(description);
      $(keyTable). append(keyTr);
      $(keyTr).append(keyTdLeft).append(keyTdRight);
    });
    $(keySpan).append(keyTable);
  }else{
    $(keySpan).append("<h2>Vier-Null-Vier</h2>Huch, sie ist weg. <br>Ich habe doch gesagt, sie soll nicht in den Dunkelwald gehen. Das hat sie nun davon.");
  }

  return keySpan;
}
function modifyStatisticSelect(somedata, depth){
  if(somedata["isEndNode"]==1){
    if($("#statisticsContentDiv").children().length != 0){
      $("#statisticsContentDiv").empty();
    }
    $("#statisticsContentDiv").append(getStatisticsContent(somedata));
  }else{
    if($("#select"+depth).length == 0){
      var select = document.createElement("select");
      $(select).attr("id", "select"+depth);
      var firstitem = true;
      $.each(somedata, function(key, value){
        var option = document.createElement("option");
        $(option).attr({
          value: key,
          text: getTranslation(key, "translation")
        });
        if(firstitem === true){
          $(option).attr("selected", "selected");
          firstitem = false;
        }
        $(select).append(option);
      });
      $("#statisticsMenuDiv").append(select).append(nbspSpan);
      $(select).change(function(){
        modifyStatisticSelect(somedata[$(this).val()], depth+1);
      });
      modifyStatisticSelect(somedata[$(select).val()], depth+1);
    }else{
      var hasitem = false;
      var oldselectvalue = $("#select"+depth).val();
      $.each(somedata, function(key, value){
        if(oldselectvalue == key){
          hasitem = true;
        }
      });
      $("#select"+depth).empty();
      if (!hasitem){
        var firstitem = false;
      }else{
        var firstitem = true;
      }
      $.each(somedata, function(key, value){
        var option = document.createElement("option");
        $(option).attr({
          value: key,
          text: getTranslation(key, "translation")
        });
        if(firstitem === true || (hasitem && oldselectvalue == key)){
          $(option).attr("selected", "selected");
          firstitem = false;
        }
        $("#select"+depth).append(option);
      });
      $("#select"+depth).unbind();
      $("#select"+depth).change(function(){
        modifyStatisticSelect(somedata[$(this).val()], depth+1);
      });
      modifyStatisticSelect(somedata[$("#select"+depth).val()], depth+1);
    }
  }
}

function manualInputContent(){
  var manualInputContent = document.createElement("div");
  if (!localStorage.getItem(charID) || !localStorage.getItem(charID+"_lastupdate")){
    $(manualInputContent).append("Es ist keine Datenbank vorhanden, in die Daten eingepflegt werden können.<br>Bitte passe erst deine accountspezifischen Scripteinstellungen an.");
  }else{
    var table = document.createElement("table");
    $(table).css("table-layout", "fixed");
    var tr = document.createElement("tr");
    var tdl = document.createElement("td");
    var tdr = document.createElement("td");
    $(manualInputContent).append(table);
    $(table).append(tr);
    $(tr).append(tdl).append(tdr);
    var textarea = document.createElement("textarea");
    $(textarea).attr({
      id: "manualInputTextarea",
      placeholder: "Du kannst hier in das Textfeld die gesamte(!) Textmeldung aus der Meldungsbox reinkopieren und damit die daraus gesammelten Daten in deine Sammlung einfügen. Bitte bedenke, dass du deine Statistiken durch bewusste Manipulation deiner Ergebnisse oder Mehrfacheintragung eines Ergebnisses verfälschst. Ausgenommen von einer manuellen Eintragung ist das Verstärken von Stäben."
    });
    $(textarea).css({
      width: 360,
      height: 300,
      resize: "vertical"
    });
    $(tdl).append(textarea);

    var changeFlagsDiv = document.createElement("div");
    $(changeFlagsDiv).attr("id", "changeFlagsDiv");
    $(changeFlagsDiv).css({
      "text-align": "center",
      "width": 360
    });
    $(tdr).append(changeFlagsDiv).append("<br><br>");

    var manualESSelect = document.createElement("select");
    $(manualESSelect).attr("id", "manualESSelect");
    var energyshardsNullOption = document.createElement("option");
    $(energyshardsNullOption).attr({
      value: -1,
      text: "Energiesplitter:",
      selected: "selected"
    });
    $(manualESSelect).append(energyshardsNullOption);
    data["flags"]["phasecrystals"]["energyshards"] = -1;
    $(manualESSelect).change(function(){
      data["flags"]["phasecrystals"]["energyshards"] = parseInt($("#manualESSelect").val());
      saveData(data);
    });
    for(var i=0; i<=5; i++){
      var energyshardsOption = document.createElement("option");
      $(energyshardsOption).attr({
        value: i,
        text: i
      });
      $(manualESSelect).append(energyshardsOption);
    }

    var manualGlyphboardSelect = document.createElement("select");
    $(manualGlyphboardSelect).attr("id", "manualGlyphboardSelect");
    var glyphboardsNullOption = document.createElement("option");
    $(glyphboardsNullOption).attr({
      value: 0,
      text: "Zeichentafel:",
      selected: "selected"
    });
    $(manualGlyphboardSelect).append(glyphboardsNullOption);
    data["flags"]["glyphboards"]["lastGlyphboard"] = 0;
    $(manualGlyphboardSelect).change(function(){
      data["flags"]["glyphboards"]["lastGlyphboard"] = parseInt($("#manualGlyphboardSelect").val());
      saveData(data);
    });
    for(var i=4435; i<=4439; i++){
      var glyphboardsOption = document.createElement("option");
      $(glyphboardsOption).attr({
        value: i,
        text: getGlyphboardType(i)
      });
      $(manualGlyphboardSelect).append(glyphboardsOption);
    }
    $(changeFlagsDiv).append("Einstellungen für<br>").append("Phasenkristalle: ").append(manualESSelect).append("<br>").append("Zauberzeichen: ").append(manualGlyphboardSelect);

    var messagediv = document.createElement("div");
    $(messagediv).attr("id", "messagediv");
    $(messagediv).css({
      "text-align": "center",
      "width": 360
    });
    $(messagediv).append("Erwarte Eingabe.");
    $(textarea).focus(function(){
      $(messagediv).empty();
      $(messagediv).append("Erwarte Eingabe.");
    });
    var linkdiv = document.createElement("div");
    $(linkdiv).css({
      "text-align": "center",
      "width": 360
    });
    $(tdr).append(messagediv).append("<br>").append("<br>").append(linkdiv);
    var savelink = createButton("savelink", "Daten einpflegen");
    $(linkdiv).append(savelink);

    $(savelink).click(function(){
      saveData(data);
      $("#messagediv").empty();
      if($("#manualInputTextarea").val()){
        try{
          separateNewInput($("#manualInputTextarea").val(), true);
          $("#messagediv").append("Ein Eintrageversuch wurde unternommen. Du kannst nun direkt neue Daten eintragen.");
          $("#manualInputTextarea").val("");
      }catch(error){
          $("#messagediv").append("Es ist ein Fehler aufgetreten. Bitte überprüfe die Eingabe und versuche es erneut.");
        }
      }else{
        $("#messagediv").append("Du solltest schon etwas eingeben, du Schlawiner ;)");
      }
    });
  }

  return manualInputContent;

}

/*
_|_|_|      _|_|    _|_|_|_|_|    _|_|    _|_|_|      _|_|      _|_|_|  _|_|_|_|
_|    _|  _|    _|      _|      _|    _|  _|    _|  _|    _|  _|        _|
_|    _|  _|_|_|_|      _|      _|_|_|_|  _|_|_|    _|_|_|_|    _|_|    _|_|_|
_|    _|  _|    _|      _|      _|    _|  _|    _|  _|    _|        _|  _|
_|_|_|    _|    _|      _|      _|    _|  _|_|_|    _|    _|  _|_|_|    _|_|_|_|
*/
function statisticsInternalVersioncontrol(){
  if(statisticsVersion != data["options"]["character"]["scriptversion"]){
    var installedversion = parseFloat(data["options"]["character"]["scriptversion"].replace(/v/g, ""));
    if(installedversion < 0.95){ //update to 0.98
      data["options"]["tracking"]["plumbumclump"] = false;
      installedversion = 0.98;
    }
    if(installedversion < 1.1){
      installedversion = 1.1;
    }
    //add code here, if there were some changes to the DB between versions
    //use ifs, so that even jumps from 0.x to much higher version are possible.

    data["options"]["character"]["scriptversion"] = "v"+installedversion;
    saveData(data);

  }
}

function standardDatabase(){
  var database = {
    options:{
      character:{
        isEndNode: 1,
        charlvl: 1,
        luck: 1,
        botany: 1,
        drill: 0,
        gardenlvl: 0,
        altarlvl: 0,
        horselvl: 0,
        stablelvl: 0,
        gardening: false,
        faith: false,
        hunt: false,
        spotScrolls: false,
        librarian: false,
        magicalBrainwave: false,
        glyphskill: false,
        artifactRake: false,
        luckmonument: false,
        autoupdate: false,
        lastupdate: 0,
        scriptversion: "v"+statisticsVersion
      },
      tracking:{
        isEndNode: 1,
        herbs: false,
        bird: false,
        wilderness: false,
        garden: false,
        altar: false,
        horse: false,
        leatherpouches: false,
        research: false,
        phasecrystals: false,
        staffEnhancement: false,
        glyphboards: false,
        stoneOfPatience: false,
        plumbumclump: false
      },
      prices:{
        isEndNode: 1,
        "Guljakbeere": 6,
        "Jorugawurzel": 12,
        "Soragepilz": 10,
        "Kuragknolle": 12,
        "Kurelblüte": 40,
        "Tairanblatt": 40,
        "Tolwarknospe": 40,
        "Eisblume": 40,
        "getrocknete Jorugawurzel": 12,
        "Heiltrank": 24,
        "Erzklumpen": 1,
        "alte Silbermünze": 40,
        "Lederbeutel": 20,
        "Wüstenkristall": 68,
        "Spiegelkristall": 10,
        "Manakristall": 350,
        "Edelstein des Gleichgewichts": 7000
      }
    },
    flags:{
      garden:{
        isEndNode: 1,
        harvestbonusFlag: 0,
        fertilizerTarget: ""
      },
      leatherpouches:{
        isEndNode: 1,
        lastIrregular: false
      },
      phasecrystals:{
        isEndNode: 1,
        energyshards: -1
      },
      staffEnhancement:{
        isEndNode: 1,
        lastStaff: ""
      },
      glyphboards:{
        isEndNode: 1,
        lastGlyphboard: 0
      }
    }
  };

  return database;
}

//target "db" gives keys, target "trans" gives values
function getTranslation(selector, target){
  var translations = {
    options: "Einstellungen",
    help: "Hilfe",
    statistics: "Statistiken",
    charlvl: "Charakterstufe",
    luck : "Glück",
    botany: "Pflanzenkunde",
    drill: "Abrichten",
    gardenlvl: "Gartenstufe",
    altarlvl: "Altarstufe",
    horselvl: "Pferdestufe",
    stablelvl: "Stallstufe",
    faith: "Glaube",
    hunt: "Jagd",
    gardening: "Gartenbau",
    spotScrolls: "Spruchrollen erkennen",
    librarian: "Bibliothekar",
    magicalBrainwave: "mag. Geistesblitz",
    glyphskill: "Zeichenkunst",
    artifactRake: "Gartenharke aktiv",
    luckmonument: "Gilden-Glücksmonument",
    autoupdate: "Auto-Update",
    lastupdate: "Letztes Update",
    scriptversion: "Scriptversion",
    prices: "Preise",
    nothing: "nichts",

    herbs: "Kräutersammeln",
    herbsHourCount : "h",
    herbsNothing: "h<sub>0<sub>",
    bird : "Begleiter",
    birdCount: "Einsätze",
    birdNothing: "nichts",
    wilderness: "Wildnisfunde",
    herbsTripcount: "Kräuterausflüge",


    altar: "Altar",
    prayCount: "&#9815;",
    prayNothing: "&#9815;<sub>0</sub>",
    prayEPCount: "&#9815;EP",
    prayEPAmount: "&sum;EP",
    prayEPHighest: "&#9650;EP",
    prayEPLowest: "&#9660;EP",
    prayGoldCount: "&#9815;Gold",
    prayGoldAmount: "&sum;Gold",
    prayGoldHighest: "&#9650;Gold",
    prayGoldLowest: "&#9660;Gold",
    prayHarvestCount: "&#9815;Ernte",
    prayHealCount: "&#9815;Heilung",
    prayActionpointsCount: "&#9815;AP",
    prayProtbuffCount: "&#9815;+3V",

    horse: "Pferd",
    horseCount: "&#9816;",
    horseEPAmount: "&sum;&#9816;EP",
    horsePlayerEPAmount: "&sum;Spieler-EP",
    horsePlayerLPAmount: "&sum;Spieler-LP",
    horseEncounters: "ZEs",

    garden: "Kräutergarten",
    harvestbonusFlag: "Ernte-Zusatzboni",
    harvestbonusNone: "keine Boni",
    harvestbonusGardening: "Gartenbau",
    harvestbonusRake: "Gartenharke",
    harvestbonusFertilizer: "Dünger",
    harvestbonusGardeningRake: "Gartenbau & Gartenharke",
    harvestbonusGardeningFertilizer: "Gartenbau & Dünger",
    harvestCount: "&#9880;",
    harvestHerbCount: "&#9880;",
    harvestHerbAmount: "&sum;",
    harvestHerbHighest: "&#9650;",
    harvestHerbLowest: "&#9660;",
    fertilizerSuccessCount: "&#10003;&#9880;",
    fertilizerFailureCount: "&#10007;&#9880;",
    fertilizerSuccessHerb: "&#10003;",
    fertilizerFailureHerb: "&#10007;",

    leatherpouches: "Lederbeutel",
    leatherpouchesCount: "Beutel",
    leatherpouchesDamaged : "beschädigt",
    leatherpouchesGoldAmount: "&sum;Gold",
    leatherpouchesGoldHighest: "&#9650;Gold",
    leatherpouchesGoldLowest: "&#9660;Gold",

    research: "Forschung",
    researchCount: "Einheiten",
    researchSparks: "&#10024;",

    phasecrystals: "Phasenkristalle",
    phasecrystalAttemptES:"&#9889;",
    phasecrystalFailES: "&#10007;&#9889;",

    staffEnhancement: "Stab verstärken",
    staffEnhancementAttemptCountTo: "&#9874;+",
    staffEnhancementSuccessCountTo: "&#10003;+",

    glyphboards: "Zeichentafeln",

    stoneOfPatience: "Stein der Geduld",
    sopAttemptCount: "&#9714;",
    sopNothingCount: "&#9714;<sub>0</sub>",
    sopThrowAwayCount:"&#9714;<sub>Wut</sub>",
    sopEPCount: "&#9714;EP",
    sopEPAmount: "&sum;EP",
    sopEPHighest: "&#9650;EP",
    sopEPLowest: "&#9660;EP",
    sopGloryCount: "&#9714;Ruhm",
    sopGloryAmount: "&sum;Ruhm",
    sopGloryHighest: "&#9650;Ruhm",
    sopGloryLowest: "&#9660;Ruhm",
    sopCrystalglassCount: "&#9714;Kr.glas",
    sopGlassclumpCount: "&#9714;Glaskl.",
    sopPlumbumclumpCount: "&#9714;Blei",

    plumbumclump: "Bleiklumpen",
    plumbumclumpCount: "Umwandlungen",
    plumbumclumpGoldAmount: "&sum;Gold",
    plumbumclumpGoldHighest: "&#9650;Gold",
    plumbumclumpGoldLowest: "&#9660;Gold"
  };

  if (target == "translation" && translations[selector]){
    return translations[selector];
  }else if(target == "db"){
    for(var db in translations) {
      if(translations[db] === selector) {
        return db;
      }
    }
  }else{
    return selector;
  }
}

function getShortName(selector){
  var shortened={
    "Guljakbeere": "Guljak",
    "Jorugawurzel": "Joruga",
    "Soragepilz": "Sorage",
    "Kuragknolle": "Kurag",
    "Kurelblüte": "Kurel",
    "Tairanblatt": "Tairan",
    "Tolwarknospe": "Tolwar",
    "Eisblume": "Eisblume",
    "getrocknete Jorugawurzel": "g.Joruga",
    "Heiltrank": "Heili",
    "Erzklumpen": "Erz",
    "alte Silbermünze": "AS",
    "Lederbeutel": "LB",
    "Wüstenkristall": "WüKri",
    "Spiegelkristall": "SpKri",
    "Manakristall": "Mana",
    "Edelstein des Gleichgewichts": "EdG",
    "Edelstein des Lichts": "EdL",
    "Edelstein der Dunkelheit": "EdD",
    "Spruchrolle: Heimkehr": "SR Heimkehr",
    "Spruchrolle: kleiner Zeitsprung": "SR kl.Zeitsp.",
    "Spruchrolle: Metamorphose": "SR Meta.",
    "Spruchrolle: schwache Heilung": "SR schw.Heil.",
    "Spruchrolle: leichte Heilung": "SR l.Heil.",
    "Spruchrolle: mittlere Heilung": "SR m.Heil.",
    "Spruchrolle: Erfahrung": "SR EP",
    "Spruchrolle: Vergessen": "SR Verg.",
    "Spruchrolle: globale Erfahrung": "SR gl.EP",
    "Bündnisrolle: Erfahrungsraub": "BR EP-Raub",
    "Spruchrolle: Pfeilregen": "SR Pfeilr.",
    "Spruchrolle: Beschwörung (schwach)": "SR Beschw.(schw.)",
    "Buch: Fleiß": "B Fleiß",
    "Buch: kritischer Treffer": "B Krit"
  };
  if(shortened[selector]){
    return shortened[selector];
  }else{
    return selector;
  }
}

function getGlyphboardType(id){
  switch(parseInt(id)){
    case 4435:
      var glyphboardType = "Holz";
    break;
    case 4436:
      var glyphboardType = "Stein";
    break;
    case 4437:
      var glyphboardType = "Kupfer";
    break;
    case 4438:
      var glyphboardType = "Eisen";
    break;
    case 4439:
      var glyphboardType = "Kristall";
    break;
    default:
      var glyphboardType = false;
  }
  return glyphboardType;
}


function loadData(){
  return JSON.parse(localStorage.getItem(charID));
}

function saveData(dataObject){
  localStorage.setItem(charID, JSON.stringify(dataObject));
}

function removeDatabase(){
  if(confirm("Die gesamte Datenbank inkl. aller Statistiken wird gelöscht. Bist du dir wirklich sicher?") == true){
    localStorage.removeItem(charID);
    localStorage.removeItem(charID+"_lastupdate");
    localStorage.removeItem(charID+"_autoupdate");
    $("#toggleToolboxButtonImage").attr("src", iconBad);
    toggle("optionsMenu");
    alert("Alle Daten wurden gelöscht.");
    $(document).ready(function(){
      $('html,body').animate({ 'scrollTop': $('#toolboxMenuDiv').offset().top }, 800);
    });
  }
}

function sortData(data){
  if(data["isEndNode"]){
    return data;
  }else{
    var orderedData = {};
    var orderedArray = [];
    var keyArray = [];
    $.each(data, function(key){
      orderedArray.push(stripStuffFromStrings(key));
      keyArray.push(key);
    });
    orderedArray.sort();
    for(var i=0; i < orderedArray.length; i++ ){
      for(var j=0; j < orderedArray.length; j++ ){
        if(orderedArray[i] == stripStuffFromStrings(keyArray[j])){
          orderedData[keyArray[j]] = data[keyArray[j]];
        }
      }
    }
    $.each(orderedData, function(key){
      if($.inArray(key, ["options", "flags"]) == -1){
        orderedData[key] = sortData(orderedData[key]);
      }
    });
    return orderedData;
  }
}

function secureDataExistence(dataToCheck, checkArray, endNode){
  if(checkArray.length > 0){
    var firstInArray = checkArray.shift();
    if(dataToCheck[firstInArray] == null){
      dataToCheck[firstInArray] = {};
    }
    dataToCheck[firstInArray] = secureDataExistence(dataToCheck[firstInArray], checkArray, endNode);
    return dataToCheck;
  }else{
    dataToCheck = endNode;
    return dataToCheck;
  }
}

function doAdditiveImport(originalData, newData){
  if(originalData["isEndNode"]){
    $.each(newData, function(key){
      if(key != "isEndNode"){
        if(key.indexOf("Highest")>-1 || key.indexOf("Lowest")>-1){
          if(key.indexOf("Highest")>-1){
            if(newData[key] > originalData[key]){
              originalData[key] = newData[key];
            }
          }else{
            if(newData[key] < originalData[key]){
              originalData[key] = newData[key];
            }
          }
        }else{
          originalData[key] += newData[key];
        }
      }
    });
    return originalData;
  }else{
    $.each(newData, function(key){
      if($.inArray(key, ["options", "flags"]) == -1){
        if(originalData[key]){
          originalData[key] = doAdditiveImport(originalData[key], newData[key]);
        }else{
          originalData[key] = newData[key];
        }
      }
    });
    return originalData;
  }
}



function saveOptions(){
  if ( ($("#optionsHuntInput").attr("checked") && $("#optionsFaithInput").attr("checked")) ||
       ($("#optionsHuntInput").attr("checked") && $("#optionsGardeningInput").attr("checked")) ||
       ($("#optionsFaithInput").attr("checked") && $("#optionsGardeningInput").attr("checked")) ){
    alert("Von Gartenbau, Glaube und Jagd kann nur eines aktiv sein. Die Einstellungen wurden nicht übernommen.");
  }else if($("#optionsLibrarianInput").attr("checked") && $("#optionsSpotScrollsInput").attr("checked") == false){
    alert("Spruchrollen erkennen ist die Vorraussetzung für Bibliothekar. Die Einstellungen wurden nicht übernommen.");
  }else{
    var message = "Die Einstellungen wurden gespeichert.";
    var okcheck = true;
    var rakeActive = false;
    if(data["options"]["character"]["artifactRake"] == true){
      rakeActive = true;
    }
    $.each(data["options"]["character"], function(key, value){
      if($.inArray(key, ["isEndNode", "lastupdate", "scriptversion"]) == -1){
        if($("#options"+firstLetterUpperCase(key)+"Input").attr("type") == "checkbox"){
          data["options"]["character"][key] = $("#options"+firstLetterUpperCase(key)+"Input").attr("checked");
        }else if( $("#options"+firstLetterUpperCase(key)+"Input").attr("type") == "number" &&
                  isNumeric($("#options"+firstLetterUpperCase(key)+"Input").val()) &&
                  $("#options"+firstLetterUpperCase(key)+"Input").val() >= 0){
            data["options"]["character"][key] = parseInt($("#options"+firstLetterUpperCase(key)+"Input").val());
        }else{
          okcheck = false;
          message = "Einige Einstellungen konnten nicht gespeichert werden, da deren Eingabeformate falsch sind.";
        }
      }
    });
    if(rakeActive==false && data["options"]["character"]["artifactRake"] == true){
      if(data["flags"]["garden"]["harvestbonusFlag"] > -1){
        data["flags"]["garden"]["harvestbonusFlag"] += 2;
      }
    }else if(rakeActive==true && data["options"]["character"]["artifactRake"] == false){
      data["flags"]["garden"]["harvestbonusFlag"] -= 2;
    }


    data["options"]["character"]["lastupdate"] = Date.now();
    localStorage.setItem(charID+"_lastupdate", Date.now());
    saveData(data);

    if(data["options"]["character"]["autoupdate"] == true){
      localStorage.setItem(charID+"_autoupdate", "true");
      checkSiteforAutoupdates();
    }else{
      localStorage.setItem(charID+"_autoupdate", "false");
    }
    if(okcheck){
      $("#toggleToolboxButtonImage").attr("src", iconGood);
    }
    alert(message);
  }
}

function saveTracking(){
  var message = "Die Einstellungen wurden gespeichert.";
  $.each(data["options"]["tracking"], function(key, value){
    if(key != "isEndNode"){
      if($("#tracking"+firstLetterUpperCase(key)+"Input").attr("type") == "checkbox"){
        data["options"]["tracking"][key] = $("#tracking"+firstLetterUpperCase(key)+"Input").attr("checked");
      }else{
        message = "Es gab einen Fehler. Die Trackingeinstellungen konnten nicht gespeichert werden.";
      }
    }
  });
  saveData(data);
  alert(message);
}

function savePrices(){
  var message = "Die Preise wurden gespeichert.";
  $.each(data["options"]["prices"], function(key, value){
    if(key != "isEndNode"){
      if( isNumeric($("#prices"+firstLetterUpperCase(stripStuffFromStrings(key))+"Input").val()) && parseInt($("#prices"+firstLetterUpperCase(stripStuffFromStrings(key))+"Input").val()) >=0){
        data["options"]["prices"][key] = parseInt($("#prices"+firstLetterUpperCase(stripStuffFromStrings(key))+"Input").val());
      }else{
        message = "Einige Preise konnten nicht gespeichert werden, da nur Ganzzahlen erlaubt sind.";
      }
    }
  });
  saveData(data);
  alert(message);
}


function herbsDataInput(line, herbsLocation){
  //herbs -> location -> botany -> luck -> hourcount, nothing, herb
  var luckAmount = getLuckAmount();
  var botany = "PK "+data["options"]["character"]["botany"];

  try{
    var testDataPath = data["herbs"][herbsLocation][botany][luckAmount]["herbsHourCount"];
  }catch(error){
    var endNode = {isEndNode:1, herbsHourCount:0};
    var checkArray=["herbs", herbsLocation, botany, luckAmount];
    data = secureDataExistence(data, checkArray, endNode);
  }

  var enddata = data["herbs"][herbsLocation][botany][luckAmount];
  enddata["herbsHourCount"]++;
  if(line.indexOf("konnte leider nichts finden.")>-1){
    if(!enddata["herbsNothing"]){
      enddata["herbsNothing"] = 0;
    }
    enddata["herbsNothing"]++;
  }else if(line.indexOf(" gefunden!")>-1){
    line = line.substring( line.indexOf(" hat ")+1, line.indexOf(" gefunden!")+10 );
    line = line.replace("x ", " mal ").replace("die Pflanze ", "");
    var count = parseInt(line.substring( line.indexOf("hat ")+4 , line.indexOf(" mal ") ));
    var item = line.substring( line.indexOf(" mal ")+5 , line.indexOf(" gefunden") );

    if(!enddata[item]){
      enddata[item] =0;
    }
    enddata[item] += count;
    if(!data["options"]["prices"][item]){
      data["options"]["prices"][item] = 1;
    }
  }
  data["herbs"][herbsLocation][botany][luckAmount] = enddata;
}

function wildernessDataInput(line){
  //wilderness -> count, leatherpouch
  try{
    var testDataPath = data["wilderness"]["herbsTripcount"];
  }catch(error){
    var endNode = {isEndNode:1, herbsTripcount:0, "nichts gefunden":0 ,Lederbeutel:0};
    var checkArray=["wilderness"];
    data = secureDataExistence(data, checkArray, endNode);
  }

  if(line.indexOf("sammelt Kräuter im")>-1){
    data["wilderness"]["herbsTripcount"]++;
    data["wilderness"]["nichts gefunden"]++;
  }else if(line.indexOf("hat in der Wildnis einen Lederbeutel gefunden")>-1){
    data["wilderness"]["Lederbeutel"]++;
    data["wilderness"]["nichts gefunden"]--;
  }
}

function birdDataInput(line){
  //bird -> luck -> count/nothing/items
  var luckAmount = getLuckAmount();

  try{
    var testDataPath = data["bird"][luckAmount]["birdCount"];
  }catch(error){
    var endNode = {isEndNode:1, birdCount:0};
    var checkArray=["bird" , luckAmount];
    data = secureDataExistence(data, checkArray, endNode);
  }

  var enddata = data["bird"][luckAmount];
  enddata["birdCount"]++;
  if(line.indexOf("Begleiter findet nichts")>-1){
    if(!enddata["birdNothing"]){
      enddata["birdNothing"] = 0;
    }
    enddata["birdNothing"]++;

  }else if(line.indexOf("beschworene Begleiter findet ")>-1){
    line = line.substring(line.indexOf("beschworene Begleiter ")+22, line.indexOf(".")+1);
    if(line.indexOf(" eine ")>-1 || line.indexOf(" ein ")){
      var count = 1;
      if(line.indexOf(" eine ")>-1){
        var item = line.substring(line.indexOf("eine ")+5, line.indexOf("."));
      }else{
        var item = line.substring(line.indexOf("ein ")+4, line.indexOf("."));
      }
    }else{
      var count = parseInt( line.substring(line.indexOf("findet ")+7, line.indexOf("x ")) );
      var item = line.substring(line.indexOf("x ")+2, line.indexOf("."));
    }

    if(!enddata[item]){
      enddata[item] = 0;
    }
    enddata[item] += count;
    if(!data["options"]["prices"][item]){
      data["options"]["prices"][item] = 1;
    }
  }

  data["bird"][luckAmount] = enddata;
}

function altarDataInput(line){
  //altar -> altarlvl -> faith/nofaith -> luckAmount -> prayCount, nothing, ep_xy, gold_XY, garden, heal, actionpoint, prayProtbuffCount
  if(data["options"]["character"]["faith"] === true){
    var faith = "Glaube";
  }else{
    var faith = "kein Glaube";
  }
  var luckAmount = getLuckAmount();
  var altarlvl = "Altarstufe "+data["options"]["character"]["altarlvl"];

  try{
    var testDataPath = data["altar"] [altarlvl] [faith] [luckAmount] ["prayCount"];
  }catch(error){
    var endNode = {isEndNode:1, prayCount:0};
    var checkArray=[ "altar", altarlvl, faith, luckAmount ];
    data = secureDataExistence(data, checkArray, endNode);
  }
  var enddata = data["altar"][altarlvl][faith][luckAmount];
  enddata["prayCount"]++;
  if(line.indexOf("aber es geschieht nichts.")>-1){
    if(!enddata["prayNothing"]){
      enddata["prayNothing"] = 0;
    }
    enddata["prayNothing"]++;

  }else if(line.indexOf("Erfahrungspunkt")>-1){
    var epgain = parseInt(line.substring( line.indexOf("erhält ")+7, line.indexOf(" Erfahrungspunkt") ));
    if(!enddata["prayEPCount"]){
      enddata["prayEPCount"] = 0;
      enddata["prayEPAmount"] = 0;
      enddata["prayEPLowest"] = epgain;
      enddata["prayEPHighest"] = epgain;
    }

    enddata["prayEPCount"]++;
    enddata["prayEPAmount"] += epgain;
    if(enddata["prayEPLowest"] > epgain){
      enddata["prayEPLowest"] = epgain;
    }
    if(enddata["prayEPHighest"] < epgain){
      enddata["prayEPHighest"] = epgain;
    }

  }else if(line.indexOf("Gold auf dem Altar")>-1){
    var goldgain = parseInt(line.substring( line.indexOf("plötzlich ")+10, line.indexOf(" Gold") ));
    if(!enddata["prayGoldCount"]){
      enddata["prayGoldCount"] = 0;
      enddata["prayGoldAmount"] = 0;
      enddata["prayGoldLowest"] = goldgain;
      enddata["prayGoldHighest"] = goldgain;
    }

    enddata["prayGoldCount"]++;
    enddata["prayGoldAmount"] += goldgain;
    if(enddata["prayGoldLowest"] > goldgain){
      enddata["prayGoldLowest"] = goldgain;
    }
    if(enddata["prayGoldHighest"] < goldgain){
      enddata["prayGoldHighest"] = goldgain;
    }

  }else if(line.indexOf(" einige Pflanzen ")>-1){
    if(!enddata["prayHarvestCount"]){
      enddata["prayHarvestCount"] = 0;
    }
    enddata["prayHarvestCount"]++;

  }else if(line.indexOf(" geheilt")>-1){
    if(!enddata["prayHealCount"]){
      enddata["prayHealCount"] = 0;
    }
    enddata["prayHealCount"]++;

  }else if(line.indexOf("zusätzliche Aktion")>-1){
    if(!enddata["prayActionpointsCount"]){
      enddata["prayActionpointsCount"] = 0;
    }
    enddata["prayActionpointsCount"]++;

  }else if(line.indexOf("Verteidigung für eine ")>-1){
    if(!enddata["prayProtbuffCount"]){
      enddata["prayProtbuffCount"] = 0;
    }
    enddata["prayProtbuffCount"]++;
  }

  data["altar"][altarlvl][faith][luckAmount] = enddata;
}

function horseDataInput(line){
  //horse -> horselvl -> horseCount/-ep, encounters
  var arr = [parseInt(data["options"]["character"]["drill"]), parseInt(data["options"]["character"]["horselvl"]), parseInt(data["options"]["character"]["stablelvl"])];
  arr.sort();
  var horselvl = "Pferdestufe "+parseInt(arr[0]);
  try{
    var testDataPath = data["horse"][horselvl]["horseCount"];
  }catch(error){
    var endNode = {isEndNode:1, horseCount:0};
    var checkArray=[ "horse" , horselvl ];
    data = secureDataExistence(data, checkArray, endNode);
  }
  var enddata = data["horse"][horselvl];
  if( (line.indexOf(" Schattenross erhält ")>-1 ||
      line.indexOf(" Einhorn erhält ")>-1 ||
      line.indexOf(" Pferd erhält ")>-1)){
    var epgain = parseInt(line.substring( line.indexOf("erhält ")+7, line.indexOf(" Erfahrungspunkt") ));
    enddata["horseCount"]++;
    if(!enddata["horseEPAmount"]){
      enddata["horseEPAmount"] = 0;
    }
    enddata["horseEPAmount"] += epgain;

  }else if(line.indexOf(" Erfahrungspunkt")>-1 && !(line.indexOf("Pferd")>-1 || line.indexOf("Einhorn")>-1 || line.indexOf("Schattenross")>-1) ){ //playerep
    var epgain = parseInt(line.substring( line.indexOf("erhält ")+7, line.indexOf(" Erfahrungspunkt") ));
    if(!enddata["horsePlayerEPAmount"]){
      enddata["horsePlayerEPAmount"] = 0;
    }
    enddata["horsePlayerEPAmount"] += epgain;

  }else if(line.indexOf("regeneriert ")>-1){
    var lpgain = parseInt(line.substring( line.indexOf("regeneriert ")+12, line.indexOf(" Lebenspunkt") ));
    if(!enddata["horsePlayerLPAmount"]){
      enddata["horsePlayerLPAmount"] = 0;
    }
    enddata["horsePlayerLPAmount"] += lpgain;

  }else if(line.indexOf("Unterwegs passiert etwas interessantes")>-1){
    if(!enddata["horseEncounters"]){
      enddata["horseEncounters"] = 0;
    }
    enddata["horseEncounters"]++;
  }
  data["horse"][horselvl] = enddata;
}

function gardenDataInput(line){
  //garden -> gardenlvl -> luckAmount -> harvestbonusFlag -> harvest-count, herbs,....
  //flags -> garden-> harvestbonus/fertilizertarget
  if(line.indexOf("verteilt die Samen im Garten")>-1){
    setHarvestbonusFlag("ignore");
    data["flags"]["garden"]["fertilizerTarget"] = "";
  }

  if(data["flags"]["garden"]["harvestbonusFlag"] >= 0){
    if(line.indexOf(" ist mit der Gartenarbeit fertig")>-1 || line.indexOf(" düngt den Garten und versucht ")>-1){
      setHarvestbonusFlag(line);

    }else if(line.indexOf(" erntet ")>-1){
      var luckAmount = getLuckAmount();
      var gardenlvl = "Gartenstufe "+data["options"]["character"]["gardenlvl"];
      var fertilizerTarget = data["flags"]["garden"]["fertilizerTarget"];
      var herb = line.substring(line.indexOf("x ")+2, line.indexOf("."));
      var amount = parseInt(line.substring( line.indexOf(" erntet ")+8, line.indexOf("x ") ));
      if($.inArray(parseInt(data["flags"]["garden"]["harvestbonusFlag"]), [4, 5, 6])>-1){
        if(herb == fertilizerTarget){
          if(data["options"]["character"]["artifactRake"]==true){
            data["flags"]["garden"]["harvestbonusFlag"] -= 2;
          }
          var harvestbonusFlag = getHarvestbonusflag();
          try{
            var testDataPath = data["garden"][gardenlvl][luckAmount][harvestbonusFlag]["harvestCount"];
          }catch(error){
            var endNode = {isEndNode:1, harvestCount:0};
            var checkArray=["garden" , gardenlvl, luckAmount, harvestbonusFlag];
            data = secureDataExistence(data, checkArray, endNode);
          }
          var enddata = data["garden"][gardenlvl][luckAmount][harvestbonusFlag];
          data["flags"]["garden"]["fertilizerTarget"] = "";
          setHarvestbonusFlag("reset");
          enddata["harvestCount"]++;
          if(!enddata["harvest"+getShortName(herb)+"Count"]){
            enddata["harvest"+getShortName(herb)+"Count"] = 0;
            enddata["harvest"+getShortName(herb)+"Amount"] = 0;
            enddata["harvest"+getShortName(herb)+"Highest"] = amount;
            enddata["harvest"+getShortName(herb)+"Lowest"] = amount;
          }
          enddata["harvest"+getShortName(herb)+"Count"]++;
          enddata["harvest"+getShortName(herb)+"Amount"] += amount;

          if(enddata["harvest"+getShortName(herb)+"Highest"] < amount){
            enddata["harvest"+getShortName(herb)+"Highest"] = amount;
          }
          if(enddata["harvest"+getShortName(herb)+"Lowest"] > amount){
            enddata["harvest"+getShortName(herb)+"Lowest"] = amount;
          }
          if(!enddata["fertilizerSuccessCount"]){
            enddata["fertilizerSuccessCount"] = 0;
          }
          enddata["fertilizerSuccessCount"]++;
          if(!enddata["fertilizerSuccess"+getShortName(herb)]){
            enddata["fertilizerSuccess"+getShortName(herb)] = 0;
          }
          enddata["fertilizerSuccess"+getShortName(herb)]++;

        }else{
          if(data["options"]["character"]["artifactRake"]==true){
            data["flags"]["garden"]["harvestbonusFlag"] -= 2;
          }
          var harvestbonusFlag = getHarvestbonusflag();
          try{
            var testDataPath = data["garden"][gardenlvl][luckAmount][harvestbonusFlag]["harvestCount"];
          }catch(error){
            var endNode = {isEndNode:1, harvestCount:0};
            var checkArray=["garden" , gardenlvl, luckAmount, harvestbonusFlag];
            data = secureDataExistence(data, checkArray, endNode);
          }
          var enddata = data["garden"][gardenlvl][luckAmount][harvestbonusFlag];

          if(!enddata["fertilizerFailureCount"]){
            enddata["fertilizerFailureCount"] = 0;
          }
          enddata["fertilizerFailureCount"]++;
          if(!enddata["fertilizerFailure"+getShortName(data["flags"]["garden"]["fertilizerTarget"])]){
            enddata["fertilizerFailure"+getShortName(data["flags"]["garden"]["fertilizerTarget"])] = 0;
          }
          enddata["fertilizerFailure"+getShortName(data["flags"]["garden"]["fertilizerTarget"])]++;
          data["garden"][gardenlvl][luckAmount][harvestbonusFlag] = enddata;
          data["flags"]["garden"]["harvestbonusFlag"] -= 4;
          if(data["options"]["character"]["artifactRake"]==true){
            data["flags"]["garden"]["harvestbonusFlag"] += 2;
          }
          data["flags"]["garden"]["fertilizerTarget"] = "";
          harvestbonusFlag = getHarvestbonusflag();
          try{
            var testDataPath = data["garden"][gardenlvl][luckAmount][harvestbonusFlag]["harvestCount"];
          }catch(error){
            var endNode = {isEndNode:1, harvestCount:0};
            var checkArray=["garden" , gardenlvl, luckAmount, harvestbonusFlag];
            data = secureDataExistence(data, checkArray, endNode);
          }
          enddata = data["garden"][gardenlvl][luckAmount][harvestbonusFlag];
          enddata["harvestCount"]++;
          if(!enddata["harvest"+getShortName(herb)+"Count"]){
            enddata["harvest"+getShortName(herb)+"Count"] = 0;
            enddata["harvest"+getShortName(herb)+"Amount"] = 0;
            enddata["harvest"+getShortName(herb)+"Highest"] = amount;
            enddata["harvest"+getShortName(herb)+"Lowest"] = amount;
          }
          enddata["harvest"+getShortName(herb)+"Count"]++;
          enddata["harvest"+getShortName(herb)+"Amount"] += amount;

          if(enddata["harvest"+getShortName(herb)+"Highest"] < amount){
            enddata["harvest"+getShortName(herb)+"Highest"] = amount;
          }
          if(enddata["harvest"+getShortName(herb)+"Lowest"] > amount){
            enddata["harvest"+getShortName(herb)+"Lowest"] = amount;
          }
          setHarvestbonusFlag("ignore");
        }

      }else{
        var harvestbonusFlag = getHarvestbonusflag();
        try{
          var testDataPath = data["garden"][gardenlvl][luckAmount][harvestbonusFlag]["harvestCount"];
        }catch(error){
          var endNode = {isEndNode:1, harvestCount:0};
          var checkArray=["garden" , gardenlvl, luckAmount, harvestbonusFlag];
          data = secureDataExistence(data, checkArray, endNode);
        }
        var enddata = data["garden"][gardenlvl][luckAmount][harvestbonusFlag];

        enddata["harvestCount"]++;
        if(!enddata["harvest"+getShortName(herb)+"Count"]){
          enddata["harvest"+getShortName(herb)+"Count"] = 0;
          enddata["harvest"+getShortName(herb)+"Amount"] = 0;
          enddata["harvest"+getShortName(herb)+"Highest"] = amount;
          enddata["harvest"+getShortName(herb)+"Lowest"] = amount;
        }
        enddata["harvest"+getShortName(herb)+"Count"]++;
        enddata["harvest"+getShortName(herb)+"Amount"] += amount;

        if(enddata["harvest"+getShortName(herb)+"Highest"] < amount){
          enddata["harvest"+getShortName(herb)+"Highest"] = amount;
        }
        if(enddata["harvest"+getShortName(herb)+"Lowest"] > amount){
          enddata["harvest"+getShortName(herb)+"Lowest"] = amount;
        }
        setHarvestbonusFlag("reset");
      }
      data["garden"][gardenlvl][luckAmount][harvestbonusFlag] = enddata;
    }
  }else{
    if(line.indexOf("verteilt die Samen im Garten")>-1){
      setHarvestbonusFlag("ignore");
    }else{
      setHarvestbonusFlag("reset");
    }
    data["flags"]["garden"]["fertilizerTarget"] = "";
  }
}

function leatherpouchesDataInput(line){
  //leatherpouches -> luckAmount -> Count/GoldAmount/Min/Max//items
  var luckAmount = getLuckAmount();

  try{
    var testDataPath = data["leatherpouches"][luckAmount]["leatherpouchesCount"];
  }catch(error){
    var endNode = {isEndNode:1, leatherpouchesCount:0};
    var checkArray=[ "leatherpouches" , luckAmount];
    data = secureDataExistence(data, checkArray, endNode);
  }

  var enddata = data["leatherpouches"][luckAmount];

  if(line.indexOf(" erhält ")>-1 && line.indexOf(" Gold")>-1){
    enddata["leatherpouchesCount"]++;

    var goldgain = parseInt(line.substring( line.indexOf(" erhält ")+8, line.indexOf(" Gold") ));
    if(!enddata["leatherpouchesGoldAmount"]){
      enddata["leatherpouchesGoldAmount"] = 0;
      enddata["leatherpouchesGoldHighest"] = goldgain;
      enddata["leatherpouchesGoldLowest"] = goldgain;
    }
    enddata["leatherpouchesGoldAmount"] += goldgain;

    if(enddata["leatherpouchesGoldHighest"] < goldgain){
      enddata["leatherpouchesGoldHighest"] = goldgain;
    }
    if(enddata["leatherpouchesGoldLowest"] > goldgain){
      enddata["leatherpouchesGoldLowest"] = goldgain;
    }
    if(line.indexOf(" Gold und ")>-1){
      var item = line.substring(line.indexOf("Gold und ")+9, line.indexOf("."));
      if(!enddata[item]){
        enddata[item] = 0;
      }
      enddata[item]++;
    }
  }else if(line.indexOf("Der Lederbeutel ist ziemlich beschädigt")>-1){
    if(!enddata["leatherpouchesDamaged"]){
      enddata["leatherpouchesDamaged"] = 0;
    }
    enddata["leatherpouchesDamaged"]++;
  }
  data["leatherpouches"][luckAmount] = enddata;
}

function researchDataInput(line){
  //research (->luckAmount) -> researchCount/sparks/items
  var luckAmount = getLuckAmount();
  if(data["options"]["character"]["librarian"] == true){
    var researchbonus = getTranslation("librarian", "translation");
  }else if(data["options"]["character"]["spotScrolls"] == true){
    var researchbonus = getTranslation("spotScrolls", "translation");
  }

  try{
    var testDataPath = data["research"][luckAmount][researchbonus]["researchCount"];
  }catch(error){
    var endNode = {isEndNode:1, researchCount:0};
    var checkArray=[ "research" , luckAmount, researchbonus];
    data = secureDataExistence(data, checkArray, endNode);
  }

  var enddata = data["research"][luckAmount][researchbonus];

  if(line.indexOf("hat die Nachbearbeitung erfolgreich durchgeführt")>-1){
    enddata["researchCount"]++;

  }else if(line.indexOf(" erzeugt einen magischen Funken.")>-1 && data["options"]["character"]["magicalBrainwave"] == true){
    if(!enddata["researchSparks"]){
      enddata["researchSparks"] = 0;
    }
    enddata["researchSparks"]++;

  }else if(line.indexOf(" findet ein")>-1){
    if(line.indexOf(" findet ein ")>-1){
      var item = line.substring(line.indexOf(" ein ")+5, line.length).replace(".", "");
    }else if(line.indexOf(" findet eine ")>-1){
      var item = line.substring(line.indexOf(" eine ")+6, line.length).replace(".", "");
    }
    if(!enddata[item]){
      enddata[item] = 0;
    }
    enddata[item]++;
  }

  data["research"][luckAmount][researchbonus] = enddata;
}


function phasecrystalsDataInput(line){
  var luckAmount = getLuckAmount();
  if(line.indexOf(" erhält Phasenkristall ")>-1){
    var pclvl = parseInt(line.substring(line.indexOf(" Phasenkristall +")+17, line.indexOf(".")))-1;
  }else if(line.indexOf("Fehlschlag, ein Phasenkristall ")>-1){
    var pclvl = parseInt(line.substring(line.indexOf(" Phasenkristall +")+17, line.indexOf(" wurde zer")));
  }
  pclvl = "+" +pclvl+ " auf +" +(pclvl+1);

  try{
    var testDataPath = data["phasecrystals"][luckAmount][pclvl]["isEndNode"];
  }catch(error){
    var endNode = {isEndNode:1};
    var checkArray=[ "phasecrystals" , luckAmount, pclvl];
    data = secureDataExistence(data, checkArray, endNode);
  }
  var enddata = data["phasecrystals"][luckAmount][pclvl];
  var energyshards = parseInt(data["flags"]["phasecrystals"]["energyshards"]);

  if(!enddata["phasecrystalAttemptES"+energyshards]){
    enddata["phasecrystalAttemptES"+energyshards] = 0;
  }
  enddata["phasecrystalAttemptES"+energyshards]++;

  if(!enddata["phasecrystalFailES"+energyshards]){
    enddata["phasecrystalFailES"+energyshards] = 0;
  }

  if(line.indexOf("Fehlschlag, ein Phasenkristall ")>-1){
    enddata["phasecrystalFailES"+energyshards]++;
  }

  data["phasecrystals"][luckAmount][pclvl] = enddata;
}


function staffEnhancementDataInput(line){
  var luckAmount = getLuckAmount();

  try{
    var testDataPath = data["staffEnhancement"][luckAmount]["isEndNode"];
  }catch(error){
    var endNode = {isEndNode:1};
    var checkArray=[ "staffEnhancement" , luckAmount];
    data = secureDataExistence(data, checkArray, endNode);
  }
  var staff = data["flags"]["staffEnhancement"]["lastStaff"];
  var stafflvl = 0;
  if(staff.indexOf("+")>-1){
     stafflvl = parseInt(staff.substring(staff.indexOf("+")+1, staff.indexOf(" ")));
  }

  var enddata = data["staffEnhancement"][luckAmount];
  if(line.indexOf("Die magische Verstärkung ist leider fehlgeschlagen")>-1){//useless, but safety first
    if(!enddata["staffEnhancementAttemptCountTo"+(stafflvl+1)]){
      enddata["staffEnhancementAttemptCountTo"+(stafflvl+1)] = 0;
    }
    enddata["staffEnhancementAttemptCountTo"+(stafflvl+1)]++;

  }else if(line.indexOf("Hier ist deine neue Waffe")>-1){
    if(!enddata["staffEnhancementAttemptCountTo"+(stafflvl+1)]){
      enddata["staffEnhancementAttemptCountTo"+(stafflvl+1)] = 0;
    }
    enddata["staffEnhancementAttemptCountTo"+(stafflvl+1)]++;

    if(!enddata["staffEnhancementSuccessCountTo"+(stafflvl+1)]){
      enddata["staffEnhancementSuccessCountTo"+(stafflvl+1)] = 0;
    }
    enddata["staffEnhancementSuccessCountTo"+(stafflvl+1)]++;

    if(staff.indexOf("+")>-1){
      data["flags"]["staffEnhancement"]["lastStaff"] = "+"+(stafflvl+1)+" "+staff.substring(staff.indexOf(" ")+1, staff.length);
    }else{
      data["flags"]["staffEnhancement"]["lastStaff"] = "+1 "+staff;
    }
  }
  data["staffEnhancement"][luckAmount] = enddata;
}

function glyphboardDataInput(line){
  var luckAmount = getLuckAmount();

  if(data["options"]["character"]["glyphskill"]){
    var glyphResearch = "Zeichenkunst";
  }else{
    var glyphResearch = "Standard";
  }

  var glyphboardType = getGlyphboardType(data["flags"]["glyphboards"]["lastGlyphboard"]);
  if(glyphboardType != false){
    try{
      var testDataPath = data["glyphboards"][luckAmount][glyphResearch][glyphboardType]["isEndNode"];
    }catch(error){
      var endNode = {isEndNode:1};
      var checkArray=[ "glyphboards" , luckAmount, glyphResearch, glyphboardType];
      data = secureDataExistence(data, checkArray, endNode);
    }

    var enddata = data["glyphboards"][luckAmount][glyphResearch][glyphboardType];
    if(!enddata["glyphboardCount"]){
      enddata["glyphboardCount"] = 0;
    }
    enddata["glyphboardCount"]++;

    var effective = "normal";
    if(line.indexOf("effektiv")>-1){
      effective = "effektiv";
    }

    var attribute = "ohne";
    if(line.indexOf("(")>-1 && line.indexOf(")")>-1){
      attribute = line.substring( line.indexOf("(")+1, line.indexOf(")") );
    }

    if(!enddata[effective+"#"+attribute]){
      enddata[effective+"#"+attribute] = 0;
    }
    enddata[effective+"#"+attribute]++;

    data["glyphboards"][luckAmount][glyphResearch][glyphboardType] = enddata;
  }
}

function stoneOfPatienceDataInput(line){
  var luckAmount = getLuckAmount();

  try{
    var testDataPath = data["stoneOfPatience"][luckAmount]["isEndNode"];
  }catch(error){
    var endNode = {isEndNode:1};
    var checkArray=[ "stoneOfPatience" , luckAmount];
    data = secureDataExistence(data, checkArray, endNode);
  }

  var enddata = data["stoneOfPatience"][luckAmount];
  if(!enddata["sopAttemptCount"]){
    enddata["sopAttemptCount"] = 0;
  }
  enddata["sopAttemptCount"]++;

  if(line.indexOf("hat keinen Erfolg am Stein der Geduld")>-1){
    if(line.indexOf("in hohem Bogen weg")>-1){
      if(!enddata["sopThrowAwayCount"]){
        enddata["sopThrowAwayCount"] = 0;
      }
      enddata["sopThrowAwayCount"]++;
    }else{
      if(!enddata["sopNothingCount"]){
        enddata["sopNothingCount"] = 0;
      }
      enddata["sopNothingCount"]++;
    }

  }else if(line.indexOf("verschwindet mit einem schwachen Funkeln")>-1){
    var gain = 0;
    if(line.indexOf("Ruhm")>-1){
      var soptype = "Glory";
      var gain = parseInt(line.substring(line.indexOf("erhält ")+7, line.indexOf(" Ruhm")));
    }else if(line.indexOf("Erfahrung")>-1){
      var soptype = "EP";
      var gain = parseInt(line.substring(line.indexOf("erhält ")+7, line.indexOf(" Erfahrung")));
    }
    if(!enddata["sop"+soptype+"Count"]){
      enddata["sop"+soptype+"Count"] = 0;
      enddata["sop"+soptype+"Amount"] = 0;
      enddata["sop"+soptype+"Highest"] = gain;
      enddata["sop"+soptype+"Lowest"] = gain;
    }
    enddata["sop"+soptype+"Count"]++;
    enddata["sop"+soptype+"Amount"] += gain;
    if(enddata["sop"+soptype+"Highest"] < gain){
      enddata["sop"+soptype+"Highest"] = gain;
    }
    if(enddata["sop"+soptype+"Lowest"] > gain){
      enddata["sop"+soptype+"Lowest"] = gain;
    }

  }else if(line.indexOf("Stein der Geduld verwandelt sich")>-1){
    if(line.indexOf("Glasklumpen")>-1){
      if(!enddata["sopGlassclumpCount"]){
        enddata["sopGlassclumpCount"] = 0;
      }
      enddata["sopGlassclumpCount"]++;

    }else if(line.indexOf("Kristallglas")>-1){
      if(!enddata["sopCrystalglassCount"]){
        enddata["sopCrystalglassCount"] = 0;
      }
      enddata["sopCrystalglassCount"]++;

    }else if(line.indexOf("Bleiklumpen")>-1){
      if(!enddata["sopPlumbumclumpCount"]){
        enddata["sopPlumbumclumpCount"] = 0;
      }
      enddata["sopPlumbumclumpCount"]++;
    }
  }

  data["stoneOfPatience"][luckAmount] = enddata;
}

function plumbumclumpDataInput(line){
  var luckAmount = getLuckAmount();

  try{
    var testDataPath = data["plumbumclump"][luckAmount]["isEndNode"];
  }catch(error){
    var endNode = {isEndNode:1};
    var checkArray=[ "plumbumclump" , luckAmount];
    data = secureDataExistence(data, checkArray, endNode);
  }
  var enddata = data["plumbumclump"][luckAmount];

  var gain = parseInt(line.substring(line.indexOf("Blei in ")+8, line.indexOf(" Gold")));
  if(!enddata["plumbumclumpCount"]){
    enddata["plumbumclumpCount"] = 0;
    enddata["plumbumclumpGoldAmount"] = 0;
    enddata["plumbumclumpGoldHighest"] = gain;
    enddata["plumbumclumpGoldLowest"] = gain;
  }
  enddata["plumbumclumpCount"]++;
  enddata["plumbumclumpGoldAmount"] += gain;
  if(enddata["plumbumclumpGoldHighest"] < gain){
    enddata["plumbumclumpGoldLowest"] = gain;
  }
  if(enddata["plumbumclumpGoldLowest"] > gain){
    enddata["plumbumclumpGoldLowest"] = gain;
  }

  data["plumbumclump"][luckAmount] = enddata;
}
