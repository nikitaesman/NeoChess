$(function(){

//Preloader
$(document).ready(function (){
    var $preloader = $('#page-preloader'),
        $spinner   = $preloader.find('.spinner');
    $spinner.fadeOut();
    $preloader.delay(100).fadeOut('slow');
    //postLoadAnimate();
});


//recovery pass
$("#recovery").submit(function(e){
    e.preventDefault();
    let recPassword1 = $("#recPassword1").val().trim();
    let recPassword2 = $("#recPassword2").val().trim();

    if(check2Pass()) {

        var hash = getURLVar('hash');

        function getURLVar(key) {
            var vars = location.search.substr(1).split('&').reduce(function (res, a) {
                var t = a.split('=');
                res[decodeURIComponent(t[0])] = t.length == 1 ? null : decodeURIComponent(t[1]);
                return res;
            }, {});
            return vars[key] ? vars[key] : '';
        }

        if (hash != "") {
            $.post('/auth/changePass',
                {
                    hash: hash,
                    password: recPassword1
                },
                function (data) {
                    if (data.type == "successful") {
                        alert(data.message)
                        window.location.href = '/';
                    } else {
                        alert(data.message)
                    }
                }
            );
        }
    }else {
        alert("Пароли не совпадают")
    }
});

//проверка паролей при геристрации на совпадение
$("#recPassword1").on('input',()=>{
    check2Pass();
});
$("#recPassword2").on('input',()=>{
    check2Pass();
});

function check2Pass() {
    if ($("#recPassword1").val() === $("#recPassword2").val()) {
        $("#recPassword1").addClass("border__green").removeClass("border__red");
        $("#recPassword2").addClass("border__green").removeClass("border__red");
        return true
    }else {
        $("#recPassword1").addClass("border__red").removeClass("border__green");
        $("#recPassword2").addClass("border__red").removeClass("border__green");
        return false
    }
}






})/// close Jq main func