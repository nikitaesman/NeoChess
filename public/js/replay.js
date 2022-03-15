$(function() {
//Preloader
$(document).ready(function () {
    var $preloader = $('#page-preloader'),
        $spinner = $preloader.find('.spinner');
    $spinner.fadeOut();
    $preloader.delay(100).fadeOut('slow');
});

function resizeBoard() {
    var windowWidth = $(this).width();
    var windowHeight = $(this).height();

    var scaleCorrect = windowWidth / 880
    if (windowWidth < 992) {

        var top = (windowHeight / 2) - 800 / 2;
        top = top + "px";
        var leftCorrect = (800 - windowWidth) / 2;

        if (windowWidth > 760) {
            leftCorrect = -leftCorrect + "px"
        } else {
            leftCorrect = "-" + leftCorrect + "px"
        }
        if (userColor == "black") {
            $('.board').css("transform", `scale(${scaleCorrect}) rotateX(180deg)`)
        } else {
            $('.board').css("transform", `scale(${scaleCorrect})`)
        }

        $('.board').css("left", leftCorrect);
        $('.board').css("top", top);


    }
}

$(window).resize(function () {
    resizeBoard()
});



function definitionColor() {
    if (userColor == "black") {
        if (992 < $(window).width() && $(window).width() < 1200) {
            $('.board').css("transform", `scale(0.85) rotateX(180deg)`)
        } else {
            resizeBoard()
        }
        $(".board").addClass("rotateBoard");


        $(".symbol__num").css({"flex-direction": "column-reverse", "transform": "rotateX(180deg)"});
        $('.transform-pawn').css("transform", `rotateX(180deg)`)

        console.log("Switch board")
    }
}

getGameInfo()

function createFigures(object, figClass) {
    var tempX = object.x * 100 - 100;
    var tempY = object.y * 100 - 100;
    var tempSrc;
    switch (object.chessmen) {
        case "pawn":
            if (object.color == "white") {
                tempSrc = '<i class="icon-pawn white__figures" style="transform:rotateY(90deg);"></i>';
            }else {
                tempSrc = '<i class="icon-pawn black__figures" style="transform:rotateY(90deg);"></i>';
            }
            break;
        case "knight":
            if (object.color == "white") {
                tempSrc = '<i class="icon-knight white__figures" style="transform:rotateY(90deg);"></i>';
            }else {
                tempSrc = '<i class="icon-knight black__figures" style="transform:rotateY(90deg);"></i>';
            }
            break;
        case "rook":
            if (object.color == "white") {
                tempSrc = '<i class="icon-rook white__figures" style="transform:rotateY(90deg);"></i>';
            }else {
                tempSrc = '<i class="icon-rook black__figures" style="transform:rotateY(90deg);"></i>';
            }
            break;
        case "bishop":
            if (object.color == "white") {
                tempSrc = '<i class="icon-bishop white__figures" style="transform:rotateY(90deg);"></i>';
            }else {
                tempSrc = '<i class="icon-bishop black__figures" style="transform:rotateY(90deg);"></i>';
            }
            break;
        case "queen":
            if (object.color == "white") {
                tempSrc = '<i class="icon-queen white__figures" style="transform:rotateY(90deg);"></i>';
            }else {
                tempSrc = '<i class="icon-queen black__figures" style="transform:rotateY(90deg);"></i>';
            }
            break;
        case "king":
            if (object.color == "white") {
                tempSrc = '<i class="icon-king white__figures" style="transform:rotateY(90deg);"></i>';
            }else {
                tempSrc = '<i class="icon-king black__figures" style="transform:rotateY(90deg);"></i>';
            }
            break;
    }
    figuresBlock.innerHTML += `<div class="${figClass}" data-figures-id='${object.id}' style="top: ${tempY+'px'}; left: ${tempX+'px'};">${tempSrc}</div>`;
    setTimeout(()=>{
        $('.figures').children('[data-figures-id=' + object.id + ']').children("i").css("transform","rotateY(0deg)");
    },10)
}

var userColor = ""
var board = ""
var figuresBlock = document.querySelector(".figures");

function getGameInfo() {
    var gameId = parseInt(getURLVar('gameId'));

    function getURLVar(key) {
        var vars = location.search.substr(1).split('&').reduce(function (res, a) {
            var t = a.split('=');
            res[decodeURIComponent(t[0])] = t.length == 1 ? null : decodeURIComponent(t[1]);
            return res;
        }, {});
        return vars[key] ? vars[key] : '';
    }

    if (gameId != "NaN") {
        $.post('/getGameInfo',{
            gameId: gameId
        }, function (data) {
            if (data.type == "successful") {
                userColor = data.user.color
                board = data.board
                resizeBoard()
                definitionColor()
                for (var row of board) {
                    for (var object of row) {
                        if (typeof(object) == "object") {
                            createFigures(object, "figures__item");
                        }
                    }
                }
                console.log(data.board)
            }
        })
    }
}

});// main JQ func