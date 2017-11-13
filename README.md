# Arthoria-Scripts
Ein paar kleine Scripts für das Browsergame Arthoria.
Die Changelogs sind als Readme in den jeweiligen Unterordnern hinterlegt.

# Aktuelles
Derzeit wird alles, was ich vorher auf dem hingeworfenen Webspace gelagert habe, auf dieses Github-Repo transferiert. Einerseits ist die Erreichbarkeit deutlich besser, andererseits erleichtert es mir den Arbeitsprozess ein wenig und schafft Transparenz.
Außerdem hab ich seit >2 Jahren nichts mehr mit git gemacht.

### Autokampfeinstellungen
Ermöglich es, für (von mir) festgelegte Monster die Autokampfeinstellungen festzulegen und Zaubericons auszublenden.
### Phasendrache
Setzt Zusatzlinks zu den Aktionen im Kampf gegen den Phasendrachen und stellt die automatische Entladung dort aus.
### Phasenmuster
Löst das Phasenmuster.
### Statistiken
Sammelt aus den Infoboxen automatisch Ergebnisse aus verschiedenen Bereichen des Spiels, speichert sie und bereitet sie optisch auf.

# FAQ
**Hä? Es gibt wohl noch nicht genug Scripts, oder was?**
Jup.

**Und die sind alle von Xeridar abgesegnet und regelkonform?**
Jup.

**Wirklich?**
Jup.

**Wirklich wirklich?**
Ja. Wenn das mal nicht so sein sollte und die „nur“ regelkonform sind, vermerke ich das schon. Xeri hat ja auch nicht den lieben langen Tag Zeit, sich durch irgendwelche Scripts zu wühlen.

**Und wie kann ich die nutzen?**
Die Scripts können mit Greasemonkey bzw. Tampermonkey genutzt oder bei Opera 12 in den Scriptordner eingebunden werden. Wie man die hinzufügt, kann man sich ganz schnell aus dem Internet anlesen. Da gibt es genug Anleitungen.
Außerdem solltest du JavaScript aktiviert haben. Das hilft ungemein, da das alles JS-Scripts sind.

**Und wenn ich mir das nicht anlesen will?**
Direktlink zum Script aufrufen und den Installationsdialog ausführen. Oder eben in den Ordner knallen.

**Welche Browser können das Script eigentlich nutzen?**
Keine Ahnung. Ich versuche, die Kompatibilität zu Firefox, Chromium-Ablegern (Chrome, Vivaldi) und dem alten Opera 12 aufrecht zu erhalten. Wenn es bei anderen Browsern funktioniert, ist das gut, wenn nicht, juckt mich das nicht.

**Funktioniert dein Script XY mit dem Script ABC?**
Meine Scripts sind untereinander kompatibel. Wenn sie mit Scripts von anderen Leuten nicht funktionieren, dann ist das halt so. Aber vielleicht lässt sich da was drehen - schreibt mich einfach mal an.

**Wo werden die Daten, die das Script speichert, eigentlich abgelegt?**
Alles bei dir auf deinem Rechner in deinem Browser im sogenannten localStorage. Da das natürlich von/in deinem Browser gespeichert wird, werden die Daten je nach Browser auch beim Löschen von Cookies/Cache mitgelöscht.

**Telefonieren die Scripts nach hause?**
Teilweise. Derzeit verfügen das Statistik-Script und das Script für die Autokampfeinstellungen über eine Funktion, die einmal alle zwei Tage eine Datei hier auf dem Server aufruft, sich dort die hinterlegte Nummer holt und diese dann mit der im Script selbst hinterlegten Versionsnummer abgleicht. Da gibt es dann eine Updatebenachrichtigung, falls verfügbar.

**Was kann ich denn sonst noch fragen?**
Weiß ich nicht. Ich musste mir schon Teile dieser FAQ aus den Fingern saugen. Fühl dich frei, mich bei Fragen zu fragen.
