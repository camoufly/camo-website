for(var animateButton=function(t){t.preventDefault,t.target.classList.remove("animate"),t.target.classList.add("animate"),setTimeout(function(){t.target.classList.remove("animate")},700)},buttons=document.getElementsByClassName("button"),i=0;i<buttons.length;i++)buttons[i].addEventListener("click",animateButton,!1);function addToMailingList(){if(mail=document.getElementById("mailbox_input").value,""!=mail&&null!=mail){var t=new XMLHttpRequest;t.open("POST","https://camoufly-mailing-list.mrwnwttk.xyz/add_to_mailing_list?email="+mail),t.onload=function(){200==t.status?document.getElementsByClassName("button")[0].innerHTML="Success!":400==t.status&&(document.getElementsByClassName("button")[0].innerHTML="An Error occurred!")},t.send()}}