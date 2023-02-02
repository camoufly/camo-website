for (var animateButton = function(t) {
    t.preventDefault, t.target.classList.remove("animate"), t.target.classList.add("animate"), setTimeout(function() {
        t.target.classList.remove("animate")
    }, 700)
}, buttons = document.getElementsByClassName("button"), i = 0; i < buttons.length; i++) buttons[i].addEventListener("click", animateButton, !1);

function addToMailingList() {
if (mail = document.getElementById("mailbox_input").value, "" != mail && null != mail) {
    var t = new XMLHttpRequest;
    t.open("POST", "https://camoufly-mailing-list.z8.re/add_to_mailing_list?email=" + mail), t.onload = function() {
        200 == t.status ? document.getElementsByClassName("button")[0].innerHTML = "Success!" : 400 == t.status && (document.getElementsByClassName("button")[0].innerHTML = "An Error occurred!")
    }, t.send()
}
}

function visibleLength(str) {
    return [...new Intl.Segmenter().segment(str)].length
}

function limitKeypress(event, value, maxLength) {
    if (value != undefined && visibleLength(value.toString()) >= maxLength) {
        event.preventDefault();
    }
}

function submitSecretPassword() {
    const emoji1 = document.querySelector("#emoji1").value;
    const emoji2 = document.querySelector("#emoji2").value;
    const emoji3 = document.querySelector("#emoji3").value;
    const emoji4 = document.querySelector("#emoji4").value;
    const str = emoji1 + emoji2 + emoji3 + emoji4;
    var t = new XMLHttpRequest;
    t.open("POST", "https://treasure-hunt.z8.re/secret?password=" + str), t.onload = function() {
        if (200 == t.status) {
            document.getElementsByClassName("button")[0].innerHTML = "Success! ;)";
            location.href = t.responseText;
            document.getElementById("secret_dialog").style.display = "none";
            document.getElementById("secret_dialog").innerHTML = "";
        }
        else if (401 == t.status) {
            document.getElementById("secret_dialog").innerHTML = t.responseText;
            document.getElementById("secret_dialog").style.display = "block";
        }
        else if (400 == t.status) {
            document.getElementsByClassName("button")[0].innerHTML = "Access denied!";
            document.getElementById("secret_dialog").style.display = "none";
            document.getElementById("secret_dialog").innerHTML = "";
        }
    }, t.send()
    }
