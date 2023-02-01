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

document.getElementById('secret_password').addEventListener('keyup', function(e) {

        if(this.value.length === 4) {
            submitSecretPassword();
        }
});

function submitSecretPassword() {
    if (pw = document.getElementById("secret_password").value, "" != pw && null != pw) {
        var t = new XMLHttpRequest;
        t.open("POST", "https://treasure-hunt.z8.re/secret?password=" + pw), t.onload = function() {
            if (200 == t.status) {
                document.getElementsByClassName("button")[0].innerHTML = "Success!";
                location.href = t.responseText;
                document.getElementById("secret_dialog").style.display = "none";
                document.getElementById("secret_dialog").innerHTML = "";
            }
            else if (401 == t.status) {
                //document.getElementsByClassName("button")[0].innerHTML = "You think you're clever, huh?";
                document.getElementById("secret_dialog").innerHTML = t.responseText;
                document.getElementById("secret_dialog").style.display = "block";
            }
            else if (400 == t.status) {
                document.getElementsByClassName("button")[0].innerHTML = "Wrong password!";
                document.getElementById("secret_dialog").style.display = "none";
                document.getElementById("secret_dialog").innerHTML = "";
            }
        }, t.send()
    }
    }