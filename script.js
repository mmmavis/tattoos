const ANIMATION_DELAY = 0; // in ms

const FIREBASE_DB_PATH = `/notes`;

// Initialize Firebase
const FIREBASE_CONFIG = {
  apiKey: " AIzaSyC7rQA676zBUxi7mpX9VNbQX8yQd8FxP40 ",
  authDomain: "jesse-tattoos.firebaseapp.com",
  databaseURL: "https://jesse-tattoos.firebaseio.com",
  projectId: "jesse-tattoos",
  storageBucket: "jesse-tattoos.appspot.com"
};

firebase.initializeApp(FIREBASE_CONFIG);

firebase.auth().signInAnonymously().catch(function(error) {
  console.log("error", error);
});

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    // var isAnonymous = user.isAnonymous;
    // var uid = user.uid;
    // console.log("user");

    setTimeout(function () {
      $("body").removeClass("taken-over");
      $("#screen-takeover").fadeOut(500);

      renderAllNotes(function() {
        setTimeout(function() {
          $("#inner-wrapper").append(createHTML({},"new-note-template"));
        }, ANIMATION_DELAY);
      });
    }, 1500);
  } else {
    // User is signed out.
    // console.log("out");
  }
});

Handlebars.registerHelper("localTime", function(timestamp) {
  return moment.unix(timestamp/1000).format("YYYY-MM-DD hh:mma");
});

function renderAllNotes(done) {
  firebase.database().ref(FIREBASE_DB_PATH).once('value').then(function(snapshot) {
    var notes = snapshot.val();
    console.log(notes);
    var numNotes = Object.keys(notes).length;
    var currIndex = 0;

    if (numNotes === 0) {
      done();
    }

    function renderNotesWithDelay() {
      var key = Object.keys(notes)[currIndex];
      var currentNote = notes[key];

      currentNote.id = key;
      renderNote(currentNote);

      currIndex += 1;
      if (currIndex <= numNotes-1) {
        setTimeout(renderNotesWithDelay, ANIMATION_DELAY);
      } else {
        done();
      }
    }

    renderNotesWithDelay();
  });
}

function createHTML(data, templateId) {
  var source = document.getElementById(templateId).innerHTML;
  var template = Handlebars.compile(source);

  return template(data);
}

function getFileExtensionFromLink(url) {
  var extension;
  var mediaType = "webpage";

  try {
    extension = url.split('.').pop().split(/\#|\?/g)[0];

    switch (extension.toLowerCase()) {
    case "":
      mediaType = false;
      break;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      mediaType = "image"
      break;
    case "mp4":
    case "avi":
    case "mpg":
      mediaType = "video";
    }
  } catch (error) {
    console.error(error);
  }

  return {
    extension: extension,
    mediaType: mediaType
  };
}

function isSrcVideo(filename = "") {
  var ext = filename.split("?")[0].split(".").pop();

  switch (ext.toLowerCase()) {
    case "mp4":
    case "avi":
    case "mpg":
      return true;
    }

  return false;
}

function renderNote(note) {
  switch (getFileExtensionFromLink(note.imgSrc).mediaType) {
    case "video":
      note.imgSrcIsVideo = true;
      break;
    case "webpage":
      note.imgSrcIsWebpage = true;
  }

  $("#inner-wrapper").append(createHTML(note,"note-template"));
}

function sensorSwearWord(word) {
  if (!word) return null;

  var sensored = "";
  var mask = "#$%^&*";

  for (var i = 0; i < word.length; i++) {
    var char = word.charAt(i);
    var shouldSensor = Math.random() < 0.35;
    console.log(char);

    if ( char == " " || !shouldSensor ) {
      sensored += char;
    } else {
      sensored = sensored + mask[Math.floor(Math.random() * mask.length)] ;
    }
  }

  console.log(sensored);

  return sensored;
}

// send new note
$("body").on("submit", "#new-note-form", function(event) {
  event.preventDefault();

  var ref = firebase.database().ref(FIREBASE_DB_PATH).push();
  var task = ref.set({
    timestamp: Date.now().toString(),
    message: $(this).find("[name=message]").val().replace(/\n/g,"<br>"),
    submitter: $(this).find("[name=submitter]").val(),
    imgSrc: $(this).find("[name=imgSrc]").val(),
    faveSwearWord: $(this).find("[name=faveSwearWord]").val(),
    sensoredFaveSwearWord: sensorSwearWord($(this).find("[name=faveSwearWord]").val()),
    textColor: null
  }, function complete() {
      // reload page so new notes shows... a cheat...
      window.location.reload(true);
      done();
    }
  );
});

$("body").on("change", "#new-note-form input[type=radio][name=bgColor]", function(event) {
  $.each($("input[type=radio][name=bgColor]"), function(index, option) {
    $("#new-note").removeClass(option.value);
  });

  $("#new-note").addClass(this.value);
});
