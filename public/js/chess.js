$(function(){

function resizeBoard() {
	var windowWidth = $(this).width();
	var windowHeight = $(this).height();

	var scaleCorrect = windowWidth/880
	if (windowWidth<992) {

		var top = (windowHeight/2) - 800/2;
		top = top + "px";
		var leftCorrect = (800 - windowWidth)/2;

		if (windowWidth > 760) {
			leftCorrect = -leftCorrect+"px"
		}else {
			leftCorrect = "-"+leftCorrect+"px"
		}
		if (userColor == "black") {
			$('.board').css("transform",`scale(${scaleCorrect}) rotateX(180deg)`)
		}else {
			$('.board').css("transform",`scale(${scaleCorrect})`)
		}

		$('.board').css("left", leftCorrect);
		$('.board').css("top", top);


	}
}
$(window).resize(function() {
	resizeBoard()
});

resizeBoard()



$('.inGameModal').fadeOut(0);


$('.result').fadeOut(0)


//Preloader
$(document).ready(function (){
	var $preloader = $('#page-preloader'),
		$spinner   = $preloader.find('.spinner');
	$spinner.fadeOut();
	$preloader.delay(100).fadeOut('slow');
});

var board = "";

var user;
var game = "";
var oldGameMovesCount = -1;
var gameId = "";
var firstUpdate = true;


var gridCordX;
var gridCordY;
var check = 0;
var userKing;
var enemyKing;
var selectedFigures = "";
var attackFig;
var attackAngle;
var lightCells = [];
var saveCells = [];
var stepVariations = [];
var figuresBlock = document.querySelector(".figures");
var userColor;
var turnColor;
var lastMove;


var soundStep = new Audio();
	soundStep.src = '../sounds/step.mp3';
	soundStep.autoplay = false;

var soundCheck = new Audio();
	soundCheck.src = '../sounds/check.mp3';
	soundCheck.autoplay = false;

var soundTransform = new Audio();
	soundTransform.src = '../sounds/transform.mp3';

	soundTransform.autoplay = false;

var soundKill = new Audio();
	soundKill.src = '../sounds/kill.mp3';

	soundKill.autoplay = false;

var soundCastling = new Audio();
	soundCastling.src = '../sounds/castling.mp3';

	soundCastling.autoplay = false;

var soundWin = new Audio();
	soundWin.src = '../sounds/win.mp3';
	soundWin.autoplay = false;

var soundLose = new Audio();
	soundLose.src = '../sounds/lose.mp3';

	soundLose.autoplay = false;

$(".volume__range").on('input', ()=>{
	soundVolumeChange();
})

soundVolumeChange();

function soundVolumeChange() {
	var volumeRange = $(".volume__range").val()
	$('.volume__value').html(volumeRange)
	var polzunRight = 130-(volumeRange*1.3)

	var polzunGradient = `linear-gradient(90deg,#B5AAFF 0%, #B5AAFF ${volumeRange}%, #fff ${100-volumeRange}%, #fff 100%)`;
	$('.volume__range').css("background", polzunGradient);

	$('.volume__value').css("right",polzunRight);
	$('.volume__value').css("opacity","1");

	setTimeout(()=>{
		$('.volume__value').css("opacity","0")
	},1000)

	soundStep.volume=volumeRange/100;
	soundCheck.volume=volumeRange/100;
	soundTransform.volume=volumeRange/100;
	soundKill.volume=volumeRange/100;
	soundCastling.volume=volumeRange/100;
	soundWin.volume=volumeRange/100;
	soundLose.volume=volumeRange/100;
}



function checkUser() {
	$.post('/auth/user',{

	}, function(data) {
		if(data.type == "successful") {
			user = data.user;
			gameId = user.task.id;
			console.log("checkUser")
			checkGame();

		}
	})
}

var gameLoop = setInterval(()=>{
	if(game != "") {
		checkGame()

		switch (game.mode) {
			case "default":
				getGameTime()
				$(".timer__title").html("match time")
				$("#bar").css("stroke","#77C19F")
				$(".timer__count").css("color","#77C19F")
				break;
			case "mild":
				getMoveTime(900)
				$(".timer__title").html("your time")
				$("#bar").css("stroke","#ff8b02")
				$(".timer__count").css("color","#ff8b02")
				break;
			case "fast":
				getMoveTime(300)
				$(".timer__title").html("your time")
				$("#bar").css("stroke","#ffc700")
				$(".timer__count").css("color","#ffc700")
				break;
			case "mad":
				getMoveTime(60)
				$(".timer__title").html("your time")
				$("#bar").css("stroke","#af1905")
				$(".timer__count").css("color","#af1905")
				break;
		}
	}

}, 1000)

checkUser()


function getGameTime() {
	if (game.timeStart != undefined) {
		var nowDate = new Date();
		var startDate = new Date(game.timeStart)

		var gameTimeLength = nowDate - startDate;

		var hours = Math.floor(gameTimeLength / 1000 / 60 / 60) % 24;

		var minutes = Math.floor(gameTimeLength / 1000 / 60) % 60;

		var seconds = Math.floor(gameTimeLength / 1000) % 60;



		var gameTimeStr = "";


		if (hours > 0) {
			gameTimeStr += hours + ":";
		}

		if (minutes > 0) {
			if (hours > 0 && minutes < 10) {
				gameTimeStr += "0" + minutes + ":";
			} else {
				gameTimeStr += minutes + ":";
			}
		}

		if (seconds < 10 && minutes > 0) {
			gameTimeStr += "0" + seconds;
		}else {
			gameTimeStr += seconds;
		}

		document.querySelector(".timer__count").innerHTML = gameTimeStr

		var $circle = $('#svg #bar');

		var r = $circle.attr('r');
		var c = Math.PI*(r*2);

		$("#bar").attr("stroke-dasharray", c);

		var pct = (c/60)*seconds;

		pct = c - pct

		if (seconds == 0 ) {
			$("#svg").children("circle").css("transition", "none")
		}else {
			$("#svg").children("circle").css("transition", "all 1s linear")
		}


		$circle.css({ strokeDashoffset: pct});


	}
}

function getMoveTime(matchLonger) {
	$.post('/gameUserTimer',{
		gameId: gameId
	}, function (data) {
		if(data.type == "successful") {
			var timeMoves = data.timeMoves;

			var matchTimeLeft = matchLonger - timeMoves


			var hours = Math.floor(matchTimeLeft  / 60 / 60) % 24;
			var minutes = Math.floor(matchTimeLeft  / 60) % 60;
			var seconds = Math.floor(matchTimeLeft) % 60;


			var gameTimeStr = "";


			if (hours > 0) {
				gameTimeStr += hours + ":";
			}

			if (minutes > 0) {
				if (hours > 0) {
					gameTimeStr += "0" + minutes + ":";
				} else {
					gameTimeStr += minutes + ":";
				}
			}

			if (seconds < 10 && minutes > 0) {
				gameTimeStr += "0" + seconds;
			}else {
				gameTimeStr += seconds;
			}

			if (matchTimeLeft<2) {
				checkGame();
			}

			if (matchTimeLeft<30) {
				$(".timer__count").addClass("timer__bounse");
			}

			document.querySelector(".timer__count").innerHTML = gameTimeStr


			var $circle = $('#svg #bar');

			var r = $circle.attr('r');
			var c = Math.PI*(r*2);

			$("#bar").attr("stroke-dasharray", c);

			var pct = (c/matchLonger)*matchTimeLeft

			pct = c - pct


			$circle.css({ strokeDashoffset: pct});

		}
	})
}


function outputCapturedFigures(player, typeOfPlayer) {
	$(".stat__figures").eq(typeOfPlayer).html("")
	if (player.captured.length == 0) {
		return
	}
	for (var playerCaptured of player.captured) {
		var tempSrc
		switch (playerCaptured.chessmen) {
			case "pawn":
				if (playerCaptured.color == "white") {
					tempSrc = '<div class="stat__icon"><i class="icon-pawn white__figures"></i></div>';
				}else {
					tempSrc = '<div class="stat__icon"><i class="icon-pawn black__figures"></i></div>';
				}
				break;
			case "knight":
				if (playerCaptured.color == "white") {
					tempSrc = '<div class="stat__icon"><i class="icon-knight white__figures"></i></div>';
				}else {
					tempSrc = '<div class="stat__icon"><i class="icon-knight black__figures"></i></div>';
				}
				break;
			case "rook":
				if (playerCaptured.color == "white") {
					tempSrc = '<div class="stat__icon"><i class="icon-rook white__figures"></i></div>';
				}else {
					tempSrc = '<div class="stat__icon"><i class="icon-rook black__figures"></i></div>';
				}
				break;
			case "bishop":
				if (playerCaptured.color == "white") {
					tempSrc = '<div class="stat__icon"><i class="icon-bishop white__figures"></i></div>';
				}else {
					 tempSrc = '<div class="stat__icon"><i class="icon-bishop black__figures"></i></div>';
				}
				break;
			case "queen":
				if (playerCaptured.color == "white") {
					 tempSrc = '<div class="stat__icon"><i class="icon-queen white__figures"></i></div>';
				}else {
					 tempSrc = '<div class="stat__icon"><i class="icon-queen black__figures"></i></div>';
				}
				break;
			case "king":
				if (playerCaptured.color == "white") {
					 tempSrc = '<div class="stat__icon"><i class="icon-king white__figures""></i></div>';
				}else {
					 tempSrc = '<div class="stat__icon"><i class="icon-king black__figures""></i></div>';
				}
				break;
		}

		$(".stat__figures").eq(typeOfPlayer).append(tempSrc)

	}
}

function  checkGame() {
	if (gameId != "") {
		$.post('/checkGame',
			{
				gameId: gameId
			}, function (data) {
				if (data.type == "successful" && oldGameMovesCount != data.game.movesCount) {
					oldGameMovesCount = data.game.movesCount
					game = data.game;
					board = game.board.concat();

					var modeCode;
					switch (game.mode) {
						case "default":
							modeCode = `<div class="game-menu__icon game-menu__icon_turtle">
													<!-- Turtle -->
													<svg viewBox="0 0 640 512"><path d="M637.1 160.5c-5.25-20.75-18.88-38.25-36.13-50.62C556.3 78 545.1 64 507.6 64c-39.63 0-73.5 23.62-86.25 57.88C380.8 71.5 317.8 32 248.4 32C232.3 32 84.63 43.88 35.5 191.5C30.13 207.6 31 224.6 37.5 240H32C14.38 240 0 254.4 0 272V288c0 11.88 6.625 22.75 17.13 28.38l81.5 42.75L70.5 408c-8.625 14.75-8.625 33.25 0 48C79 470.8 94.88 480 112 480H149c17.13 0 32.1-9.125 41.5-24l27.75-47.88c40.25 10.38 97.5 10.88 139.6 0L385.5 456c8.5 14.88 24.38 24 41.5 24h37c17.13 0 33-9.25 41.5-24c8.625-14.75 8.625-33.25 0-48l-30.63-53.13c30.63-20.75 51.25-50 61.5-82.88h15C607.8 272 651.9 219.1 637.1 160.5zM81.13 206.6C100.3 149.1 167.5 80 247.6 80h.75c80.13 0 147.4 69.12 166.5 126.6C418.1 216.5 408.3 239 384.1 239.8L114.6 240C92.13 240 75.5 223.5 81.13 206.6zM551.4 224h-47.38c-11.25 90.38-74.88 101.6-96.5 110.2L464 432h-37l-46.75-81c-66.88 21.88-108.8 24.75-184.5 0L149 432H112l53.25-92.13L66.38 288l316.6 .0002c32.13 0 80.88-21.75 81-79.75V153c0-19.88 11.63-30.5 21.75-35.75c31.5-16.12 47.13 3 89.25 33c10.63 7.625 17 20 17 33.13C592 205.8 573.8 224 551.4 224zM512 143.1c-8.875 0-16 7.125-16 16s7.125 16 16 16s16-7.125 16-16S520.9 143.1 512 143.1z"/></svg>
													<div class="invite__dur game-menu__duration_first">
														<!-- Infinity simbol -->
													</div>
												</div>`;
							break;
						case "mild":
							modeCode = `<div class="game-menu__icon game-menu__icon_timer">
													<!-- Timer -->
													<svg viewBox="0 0 512 512"><path d="M256 16c-13.25 0-24 10.75-24 24v80C232 133.3 242.8 144 256 144s24-10.75 24-24V65.5C374.6 77.34 448 158.3 448 256c0 105.9-86.13 192-192 192s-192-86.13-192-192c0-41.31 12.91-80.66 37.31-113.8c7.875-10.69 5.594-25.69-5.062-33.56C85.56 100.8 70.5 103.1 62.69 113.8C32.16 155.2 16 204.4 16 256c0 132.3 107.7 240 239.1 240S496 388.3 496 256S388.3 16 256 16zM239 272.1c4.688 4.688 10.81 7.031 16.97 7.031s12.28-2.344 16.97-7.031c9.375-9.375 9.375-24.56 0-33.94l-79.1-80c-9.375-9.375-24.56-9.375-33.94 0s-9.375 24.56 0 33.94L239 272.1z"/></svg>
													<div class="invite__dur">
													 15 M
													</div>
												</div>`;
							break;
						case "fast":
							modeCode = `<div class="game-menu__icon game-menu__icon_bolt">
													<!-- Bolt / Thunder -->
													<svg viewBox="0 0 384 512"><path d="M373.1 280.1l-255.1 223.1C111.1 509.3 103.5 512 96 512c-6.593 0-13.19-2.016-18.81-6.109c-12.09-8.781-16.5-24.76-10.59-38.5L143.5 288L32.01 288c-13.34 0-25.28-8.266-29.97-20.75c-4.687-12.47-1.125-26.55 8.906-35.33l255.1-223.1c11.25-9.89 27.81-10.58 39.87-1.799c12.09 8.781 16.5 24.76 10.59 38.5l-76.88 179.4l111.5-.0076c13.34 0 25.28 8.266 29.97 20.75C386.6 257.2 383.1 271.3 373.1 280.1z"/></svg>
													<div class="invite__dur">
													 5 M
													</div>
												</div>`;
							break;
						case "mad":
							modeCode = `<div class="game-menu__icon game-menu__icon_fire">
													<!-- Fire / Flame -->
													<svg viewBox="0 0 384 512"><path d="M203.1 4.364c-6.179-5.822-16.06-5.818-22.24 .005C74.52 104.6 0 220.2 0 298C0 423.1 79 512 192 512s192-88.01 192-213.1C384 219.9 309 104.2 203.1 4.364zM192 448c-70.62 0-128-52.88-128-117.9c0-44.12 25.88-71.5 34.38-79.75c3.125-3.125 8.125-3.125 11.25 0C111.1 251.9 112 253.9 112 256v40C112 327 137 352 168 352C198.9 352 224 327 224 296C224 224 111.4 231.2 184.5 131.6C187.5 127.8 192 127.5 195.1 128.5c1.625 .5 5.375 2.25 5.375 6.75c0 33.63 25.12 54.1 51.63 77.63C285.5 241.5 320 271 320 330.1C320 395.1 262.6 448 192 448z"/></svg>
													<div class="invite__dur">
													 1 M
													</div>
												</div>`;
							break;
					}
					$(".game-menu__icon").parent("div").html(modeCode);




					for (var player of game.players) {
						if (player.id == user.id) {
							userColor = player.color
							userKing = player.userKing

							$(".players__item").eq(0).find(".players__name").html(player.nick)
							$(".players__item").eq(0).find(".user__wins").html(player.wins)
							$(".players__item").eq(0).find(".user__percent").html(player.winrate+"%")
							$(".players__item").eq(0).find(".user__loses").html(player.loses)

							outputCapturedFigures(player, 0)


						}else {
							enemyKing = {
								x: player.userKing.x,
								y: player.userKing.y,
							}

							$(".players__item").eq(1).find(".players__name").html(player.nick)
							$(".players__item").eq(1).find(".user__wins").html(player.wins)
							$(".players__item").eq(1).find(".user__percent").html(player.winrate+"%")
							$(".players__item").eq(1).find(".user__loses").html(player.loses)

							outputCapturedFigures(player, 1)
						}
					}

					$(".players__item").removeClass("players__item_turn");
					$(".grid__cell").removeClass("grid__turn");

					if (game.turnColor == userColor) {
						//Ходит 0
						$(".players__item").eq(0).addClass("players__item_turn")
						$(".grid__cell").addClass("grid__turn");
					}else {
						//Ходит 1
						$(".players__item").eq(1).addClass("players__item_turn")
					}

					if (firstUpdate) {
						firstUpdate = false

						definitionColor()

						for (var row of board) {
							for (var object of row) {
								if (typeof(object) == "object") {
									createFigures(object);
								}
							}
						}
					}
					//если мат то...
					if (game.mate == true) {
						clearInterval(gameLoop);
						if (game.winner == user.id) {
							$('.result').fadeIn(400)
							$(".result__item_win").css("display", "flex")
							fireworkAnimation();
							soundWin.play()
						}else {
							addTextAlert("Вам поставили мат.")
							$('.result').fadeIn(400)
							$(".result__item_lose").css("display", "flex")
							soundLose.play()
						}

						setTimeout(()=>{
							window.location.href = '/';
						},8000)
					}
					if (game.stalemate == true) {
						$('.result').fadeIn(400)
						$(".result__item_stalemate").css("display", "flex")

						setTimeout(()=>{
							window.location.href = '/';
						},8000)
					}
					turnColor = game.turnColor;
					if (game.lastMove != "") {

						function numToAbc(ax,ay) {
							var alfabet = ["a","a","b","c","d","e","f","g","h"];
							return alfabet[ax] + (9-ay)
						}

						$(".moves__numbers").attr("data-last-cord-from",`${game.lastMove.from.x+"."+game.lastMove.from.y}`)
						$(".moves__numbers").attr("data-last-cord-to",`${game.lastMove.to.x+"."+game.lastMove.to.y}`)

						$('.moves__from').html(numToAbc(game.lastMove.from.x,game.lastMove.from.y))
						$('.moves__to').html(numToAbc(game.lastMove.to.x,game.lastMove.to.y))

						if (game.lastMove.checkState == true && game.mate == false && board[game.lastMove.to.y][game.lastMove.to.x].color != userColor) {
							check = 1
							soundCheck.play();
							addTextAlert("Шах!!!")

							//добовление анимации тряски для короля
							$('.figures').children("i").removeClass("king__check");
							$('.figures').children('[data-figures-id="'+game.lastMove.chechKingId+'"]').addClass("king__check");

						}else if (game.lastMove.checkState == undefined){
							//снятие анимации тряски для фигур
							$('.figures').children('.figures__item').removeClass("king__check");
						}
						var selFigId = game.lastMove.selFigId;
						if (game.lastMove.type == "kill" || game.lastMove.type == "castling") {
							var newFigId = game.lastMove.newFigId;
						}
						switch (game.lastMove.type) {
							case "move":
								$('.figures').children('[data-figures-id="'+selFigId+'"]').css({"top": (game.lastMove.to.y*100-100)+"px", "left": (game.lastMove.to.x*100-100)+"px"});
								soundStep.play()
								break;
							case "kill":
								//визуальное убийство фигуры
								$('.figures').children('[data-figures-id="'+newFigId+'"]').children("i").css("transform","rotateY(90deg)");
								setTimeout(()=>{
									$('.figures').children('[data-figures-id="'+newFigId+'"]').remove();
								},800);
								soundKill.play();

								//визуальное перемещение фигуры
								$('.figures').children('[data-figures-id="'+selFigId+'"]').css({"top": (game.lastMove.to.y*100-100)+"px", "left": (game.lastMove.to.x*100-100)+"px"});
								break;
							case "castling":
								//визуальное перемещение короля
								$('.figures').children('[data-figures-id="'+selFigId+'"]').css({"top": (game.lastMove.to.y*100-100)+"px", "left": (game.lastMove.to.x*100-100)+"px"});

								//визуальное перемещение ладьи
								$('.figures').children('[data-figures-id="'+newFigId+'"]').css({"top": (game.lastMove.to.y*100-100)+"px", "left": (game.lastMove.rookXTo*100-100)+"px"});
								soundCastling.play()
								break;
						}




						//проверка на замену пешки на королеву
						if (game.lastMove.transformation) {
							switchPawnHtml(selFigId)
							soundTransform.play();
						}
					}
					console.log(game)
					//console.log(board)

				}
			}
		);
	}else {
		alert("NAN GAME ID TOKEN")
	}
}

function setBoard() {
	console.log(lastMove)
	var setBoardData = {
		gameId: gameId,
		board: board.concat(),
		lastMove: lastMove
	}
	setBoardData = JSON.stringify(setBoardData)
	$.post('/setBoard',{
		setBoardData: setBoardData
	}, function (data) {
		if (data.type == "successful") {
			checkGame()
		}
	})
}





function  definitionColor() {
	if (userColor == "black") {
		if (992 < $(window).width() && $(window).width() < 1200) {
			$('.board').css("transform",`scale(0.85) rotateX(180deg)`)
		}else {
			resizeBoard()
		}
		$(".board").addClass("rotateBoard");


		$(".symbol__num").css({"flex-direction": "column-reverse", "transform": "rotateX(180deg)"});
		$('.transform-pawn').css("transform",`rotateX(180deg)`)

		console.log("Switch board")
	}
}




function createFigures(object) {
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
	figuresBlock.innerHTML += `<div class="figures__item" data-figures-id='${object.id}' style="top: ${tempY+'px'}; left: ${tempX+'px'};">${tempSrc}</div>`;
	setTimeout(()=>{
		$('.figures').children('[data-figures-id=' + object.id + ']').children("i").css("transform","rotateY(0deg)");
	},10)
}






function switchPawnHtml(oldId) {
	var oldObj = undefined;
	for (var row of board) {
		oldObj =  row.find(o => o.id == oldId)
		if (oldObj != undefined) {
			break
		}
	}
	if (oldObj == undefined) {
		console.log("bag in switchPawnHtml function")
		return
	}

	if ($('.figures').children('[data-figures-id="'+oldId+'"]').children("i").attr("data-figure-status") == "changed") {
		return;
	}

	$('.figures').children('[data-figures-id="' + oldId + '"]').children("i").css("transform", "rotateY(90deg)");

	setTimeout(() => {
		var tempSrc
		switch (oldObj.chessmen) {
			case "pawn":
				if (oldObj.color == "white") {
					tempSrc = '<i class="icon-pawn white__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}else {
					tempSrc = '<i class="icon-pawn black__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}
				break;
			case "knight":
				if (oldObj.color == "white") {
					tempSrc = '<i class="icon-knight white__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}else {
					tempSrc = '<i class="icon-knight black__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}
				break;
			case "rook":
				if (oldObj.color == "white") {
					tempSrc = '<i class="icon-rook white__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}else {
					tempSrc = '<i class="icon-rook black__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}
				break;
			case "bishop":
				if (oldObj.color == "white") {
					tempSrc = '<i class="icon-bishop white__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}else {
					tempSrc = '<i class="icon-bishop black__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}
				break;
			case "queen":
				if (oldObj.color == "white") {
					tempSrc = '<i class="icon-queen white__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}else {
					tempSrc = '<i class="icon-queen black__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}
				break;
			case "king":
				if (oldObj.color == "white") {
					tempSrc = '<i class="icon-king white__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}else {
					tempSrc = '<i class="icon-king black__figures" style="transform:rotateY(90deg);" data-figure-status="changed"></i>';
				}
				break;
		}

		$('.figures').children('[data-figures-id="' + oldId + '"]').html(`${tempSrc}`)

		setTimeout(()=>{
			$('.figures').children('[data-figures-id="' + oldId + '"]').children("i").css("transform", "rotateY(0deg)");
		},10)

	}, 400);
}







function drawBoard(obje,name) {
	var obj = JSON.parse(JSON.stringify(obje))
	var drawStr = name+"\n";
	if (userColor == "black") {
		obj.reverse()
	}
	for (var row in obj) {
		for(r of obj[row]) {
			if(r == 0) {
				drawStr += "\u25AD";
				 //FA0B uF98A
			}else {
				switch (r.chessmen) {
					case "pawn":
						if (r.color == "white") {
							drawStr += '\u2659';
						}else {
							drawStr += '\u265F';
						}
						break;
					case "knight":
						if (r.color == "white") {
							drawStr += '\u2658';
						}else {
							drawStr += '\u265E';
						}
						break;
					case "rook":
						if (r.color == "white") {
							drawStr += '\u2656';
						}else {
							drawStr += '\u265C';
						}
						break;
					case "bishop":
						if (r.color == "white") {
							drawStr += '\u2657';
						}else {
							drawStr += '\u265D';
						}
						break;
					case "queen":
						if (r.color == "white") {
							drawStr += '\u2655';
						}else {
							drawStr += '\u265B';
						}
						break;
					case "king":
						if (r.color == "white") {
							drawStr += '\u2654';
						}else {
							drawStr += '\u265A';
						}
						break;
					
				}
			}
		}
		drawStr += "\n";
	}
	console.log(drawStr);
}

function pawnStep(ax,ay,arrStep,cellCordX,cellCordY) {
	if (((cellCordX+ax)<9 && (cellCordX+ax)>0)
		&&
		((cellCordY+ay)<9 && (cellCordY+ay)>0)) 
	{
		if (ax == 0) {
			if (board[cellCordY+ay][cellCordX+ax] == 0) {
				arrStep.push(
				{
					x: cellCordX,
					y: cellCordY+ay,
					type: "move"
				});
			} 
			if (((cellCordX+ax)<9 && (cellCordX+ax)>0)
				&&
				((cellCordY+ay+ay)<9 && (cellCordY+ay+ay)>0)) 
			{
				if (board[cellCordY+ay][cellCordX+ax] == 0 && board[cellCordY+ay+ay][cellCordX+ax] == 0 && board[cellCordY][cellCordX].start == 1) {
					arrStep.push(
					{
						x: cellCordX,
						y: cellCordY+ay+ay,
						type: "move"
					});
				} 
			}
		}else {
			if (board[cellCordY+ay][cellCordX+ax] != 0 && board[cellCordY+ay][cellCordX+ax].color != board[cellCordY][cellCordX].color) {
				arrStep.push(
				{
					x: cellCordX+ax,
					y: cellCordY+ay,
					type: "kill"
				});
			}
		}
		
	}
}

function rookStep(ax,ay,arrStep,cellCordX,cellCordY) {
	while (
			((cellCordX+ax)<9 && (cellCordX+ax)>0)
			&&
			((cellCordY+ay)<9 && (cellCordY+ay)>0)
		  ) 
	{
		if (board[cellCordY+ay][cellCordX+ax] == 0) {
			arrStep.push(
			{
				x: cellCordX+ax,
				y: cellCordY+ay,
				type: "move"
			});
		}else {
			if(board[cellCordY+ay][cellCordX+ax].color != board[cellCordY][cellCordX].color) {
				arrStep.push(
				{
					x: cellCordX+ax,
					y: cellCordY+ay,
					type: "kill"
				});
			}
			break;
		}
		if (ax>0) {
			ax++;
		}else if(ax<0){
			ax--;
		}

		if (ay>0) {
			ay++;
		}else if(ay<0){
			ay--;
		}

	}
}

function knightStep(ax,ay,arrStep,cellCordX,cellCordY) {
	if (((cellCordX+ax)<9 && (cellCordX+ax)>0)
		&&
		((cellCordY+ay)<9 && (cellCordY+ay)>0)) 
	{
		if (board[cellCordY+ay][cellCordX+ax] == 0) {
			arrStep.push(
			{
				x: cellCordX+ax,
				y: cellCordY+ay,
				type: "move"
			});
		}else {
			if(board[cellCordY+ay][cellCordX+ax].color != board[cellCordY][cellCordX].color) {
				arrStep.push(
				{
					x: cellCordX+ax,
					y: cellCordY+ay,
					type: "kill"
				});
			}
		}
	}
}

function castling(cellGo,arrStep) {
	if (cellGo.chessmen != "king" || cellGo.start != 1) {
		return
	}
	//правая рокировка
	if (board[cellGo.y][cellGo.x+3].chessmen == "rook" && board[cellGo.y][cellGo.x+3].start == 1) {
		if(board[cellGo.y][cellGo.x+1] == 0 && board[cellGo.y][cellGo.x+2] == 0) {
			arrStep.push(
			{
				x: cellGo.x+2,
				y: cellGo.y,
				type: "castling",
				side: "right",
				rookXFrom: cellGo.x+3,
				rookXTo: cellGo.x+1
			});
		}
	}
	//левая рокировка
	if (board[cellGo.y][cellGo.x-4].chessmen == "rook" && board[cellGo.y][cellGo.x-4].start == 1) {
		if(board[cellGo.y][cellGo.x-1] == 0 && board[cellGo.y][cellGo.x-2] == 0 && board[cellGo.y][cellGo.x-3] == 0) {
			arrStep.push(
			{
				x: cellGo.x-2,
				y: cellGo.y,
				type: "castling",
				side: "left",
				rookXFrom: cellGo.x-4,
				rookXTo: cellGo.x-1
			});
		}
	}

}

function whereStep(cellGo,arrStep) {
	switch (cellGo.chessmen) {
		case "pawn":
			if (cellGo.color == "white") {
				pawnStep(0,-1,arrStep,cellGo.x,cellGo.y);
				pawnStep(-1,-1,arrStep,cellGo.x,cellGo.y);
				pawnStep(1,-1,arrStep,cellGo.x,cellGo.y);
			}else {
				pawnStep(0,1,arrStep,cellGo.x,cellGo.y);
				pawnStep(-1,1,arrStep,cellGo.x,cellGo.y);
				pawnStep(1,1,arrStep,cellGo.x,cellGo.y);
			}
			
			break;
		case "knight":
			knightStep(-1,-2,arrStep,cellGo.x,cellGo.y);
			knightStep(1,-2,arrStep,cellGo.x,cellGo.y);
			knightStep(-1,2,arrStep,cellGo.x,cellGo.y);
			knightStep(1,2,arrStep,cellGo.x,cellGo.y);

			knightStep(-2,-1,arrStep,cellGo.x,cellGo.y);
			knightStep(-2,1,arrStep,cellGo.x,cellGo.y);
			knightStep(2,-1,arrStep,cellGo.x,cellGo.y);
			knightStep(2,1,arrStep,cellGo.x,cellGo.y);
			break;
		case "rook":
			rookStep(1,0,arrStep,cellGo.x,cellGo.y);
			rookStep(0,1,arrStep,cellGo.x,cellGo.y);
			rookStep(-1,0,arrStep,cellGo.x,cellGo.y);
			rookStep(0,-1,arrStep,cellGo.x,cellGo.y);
			break;
		case "bishop":
			rookStep(1,1,arrStep,cellGo.x,cellGo.y);
			rookStep(-1,-1,arrStep,cellGo.x,cellGo.y);
			rookStep(-1,1,arrStep,cellGo.x,cellGo.y);
			rookStep(1,-1,arrStep,cellGo.x,cellGo.y);
			break;
		case "queen":
			rookStep(1,0,arrStep,cellGo.x,cellGo.y);
			rookStep(0,1,arrStep,cellGo.x,cellGo.y);
			rookStep(-1,0,arrStep,cellGo.x,cellGo.y);
			rookStep(0,-1,arrStep,cellGo.x,cellGo.y);
			rookStep(1,1,arrStep,cellGo.x,cellGo.y);
			rookStep(-1,-1,arrStep,cellGo.x,cellGo.y);
			rookStep(-1,1,arrStep,cellGo.x,cellGo.y);
			rookStep(1,-1,arrStep,cellGo.x,cellGo.y);
			break;
		case "king":
			knightStep(1,0,arrStep,cellGo.x,cellGo.y);
			knightStep(0,1,arrStep,cellGo.x,cellGo.y);
			knightStep(-1,0,arrStep,cellGo.x,cellGo.y);
			knightStep(0,-1,arrStep,cellGo.x,cellGo.y);
			knightStep(1,1,arrStep,cellGo.x,cellGo.y);
			knightStep(-1,-1,arrStep,cellGo.x,cellGo.y);
			knightStep(-1,1,arrStep,cellGo.x,cellGo.y);
			knightStep(1,-1,arrStep,cellGo.x,cellGo.y);
			if (check == 0) {
				castling(cellGo,arrStep);
			}
			break;
		
	}
}

function kingCheck1(kingX,kingY,testBoard,ax,ay,status) {
	var firsttAtackAngle = {
		x: ax,
		y: ay
	}
	while (
			((kingX+ax)<9 && (kingX+ax)>0)
			&&
			((kingY+ay)<9 && (kingY+ay)>0)
		  ) 
	{
		if (typeof(testBoard[kingY+ay][kingX+ax]) == "object") {
			if(testBoard[kingY+ay][kingX+ax].color != testBoard[kingY][kingX].color) {
				if (ax == 0 || ay == 0) {
					switch (testBoard[kingY+ay][kingX+ax].chessmen) {
						case "rook":
							check = 1;
							if (status == true) {
								attackFig = testBoard[kingY+ay][kingX+ax];
								attackAngle = {
									x: firsttAtackAngle.x,
									y: firsttAtackAngle.y
								}
							}
							return;
						case "queen":
							check = 1;
							if (status == true) {
								attackFig = testBoard[kingY+ay][kingX+ax];
								attackAngle = {
									x: firsttAtackAngle.x,
									y: firsttAtackAngle.y
								}
							}
							return;
						case "pawn":
							return;
						
						
					}
				}else {
					switch (testBoard[kingY+ay][kingX+ax].chessmen) {
						case "bishop":
							check = 1;
							if (status == true) {
								attackFig = testBoard[kingY+ay][kingX+ax];
								attackAngle = {
									x: firsttAtackAngle.x,
									y: firsttAtackAngle.y
								}
							}
							return;
						case "queen":
							check = 1;
							if (status == true) {
								attackFig = testBoard[kingY+ay][kingX+ax];
								attackAngle = {
									x: firsttAtackAngle.x,
									y: firsttAtackAngle.y
								}
							}
							return;
						case "pawn":
							return;
						
					}
				}
			}else {
				break;
			}
			
		}
		if (ax>0) {
			ax++;
		}else if(ax<0){
			ax--;
		}

		if (ay>0) {
			ay++;
		}else if(ay<0){
			ay--;
		}

	}
}

function kingCheck2(kingX,kingY,testBoard,ax,ay,status) {
	if (((kingX+ax)<9 && (kingX+ax)>0)
		&&
		((kingY+ay)<9 && (kingY+ay)>0)) 
	{
		if (typeof(testBoard[kingY+ay][kingX+ax]) == "object") {
			if(testBoard[kingY+ay][kingX+ax].color != testBoard[kingY][kingX].color && testBoard[kingY+ay][kingX+ax].chessmen == "knight") {
				check = 1;
				if (status == true) {
					attackFig = testBoard[kingY+ay][kingX+ax];
				}
			}
		}
	}
}
//проверка пешек
function kingCheck3(kingX,kingY,testBoard,ax,ay,status) {
	if (status == true ) {
		console.log("in func")
		console.log("kingX+ax",kingX+ax)
		console.log("kingY+ay",kingY+ay)
	}
	if (((kingX+ax)<9 && (kingX+ax)>0)
		&&
		((kingY+ay)<9 && (kingY+ay)>0)
	)
	{
		if (status == true ) {
			console.log("in if")
			console.log("ax",ax,"ay",ay)
		}

		if (typeof(testBoard[kingY+ay][kingX+ax]) == "object") {
			if (status == true ) {
				console.log("in obj")
			}

			if(testBoard[kingY+ay][kingX+ax].color != testBoard[kingY][kingX].color && testBoard[kingY+ay][kingX+ax].chessmen == "pawn") {

				if (status == true ) {
					console.log("in check")
				}
				check = 1;
				if (status == true) {
					attackFig = testBoard[kingY+ay][kingX+ax];
				}
			}
		}
	}
}

function kingPos(kingX,kingY,testBoard,status) {
	check = 0;
	kingCheck1(kingX,kingY,testBoard,1,0,status);
	kingCheck1(kingX,kingY,testBoard,0,1,status);
	kingCheck1(kingX,kingY,testBoard,-1,0,status);
	kingCheck1(kingX,kingY,testBoard,0,-1,status);
	kingCheck1(kingX,kingY,testBoard,1,1,status);
	kingCheck1(kingX,kingY,testBoard,-1,-1,status);
	kingCheck1(kingX,kingY,testBoard,-1,1,status);
	kingCheck1(kingX,kingY,testBoard,1,-1,status);

	kingCheck2(kingX,kingY,testBoard,-1,-2,status);
	kingCheck2(kingX,kingY,testBoard,1,-2,status);
	kingCheck2(kingX,kingY,testBoard,-1,2,status);
	kingCheck2(kingX,kingY,testBoard,1,2,status);
	kingCheck2(kingX,kingY,testBoard,-2,-1,status);
	kingCheck2(kingX,kingY,testBoard,-2,1,status);
	kingCheck2(kingX,kingY,testBoard,2,-1,status);
	kingCheck2(kingX,kingY,testBoard,2,1,status);



	if (testBoard[kingY][kingX].color == "white") {
		kingCheck3(kingX,kingY,testBoard,-1,-1,status)
		kingCheck3(kingX,kingY,testBoard,1,-1,status)
	}else if(testBoard[kingY][kingX].color == "black"){
		kingCheck3(kingX,kingY,testBoard,-1,1,status)
		kingCheck3(kingX,kingY,testBoard,1,1,status)
	}

	// if (testBoard[kingY][kingX].color == "white") {
	// 		if (typeof(testBoard[kingY-1][kingX-1]) == "object") {
	// 			if(testBoard[kingY-1][kingX-1].color != testBoard[kingY][kingX].color && testBoard[kingY-1][kingX-1].chessmen == "pawn") {
	// 				check = 1;
	// 				if (status == true) {
	// 					attackFig = testBoard[kingY-1][kingX-1];
	// 				}
	// 			}
	// 		}
	// 	if (typeof(testBoard[kingY-1][kingX+1]) == "object") {
	// 		if(testBoard[kingY-1][kingX+1].color != testBoard[kingY][kingX].color && testBoard[kingY-1][kingX+1].chessmen == "pawn") {
	// 			check = 1;
	// 			if (status == true) {
	// 				attackFig = testBoard[kingY-1][kingX+1];
	// 			}
	// 		}
	// 	}
	// }else if(testBoard[kingY][kingX].color == "black"){
	// 	if (typeof(testBoard[kingY+1][kingX-1]) == "object") {
	// 		if(testBoard[kingY+1][kingX-1].color != testBoard[kingY][kingX].color && testBoard[kingY+1][kingX-1].chessmen == "pawn") {
	// 			check = 1;
	// 			if (status == true) {
	// 				attackFig = testBoard[kingY+1][kingX-1];
	// 			}
	// 		}
	// 	}
	// 	if (typeof(testBoard[kingY+1][kingX+1]) == "object") {
	// 		if(testBoard[kingY+1][kingX+1].color != testBoard[kingY][kingX].color && testBoard[kingY+1][kingX+1].chessmen == "pawn") {
	// 			check = 1;
	// 			if (status == true) {
	// 				attackFig = testBoard[kingY+1][kingX+1];
	// 			}
	// 		}
	// 	}
	// }
}

//проверка на пат если противник не может ходить
function stalemateCheck1() {
	var stalemateSteps = [];
	for (var row of board) {
		for (var fig of row) {
			if (typeof(fig) == "object") {
				if (fig.color != userColor) {
					whereStep(fig,stalemateSteps);
					var stalemateStepsMate = JSON.parse(JSON.stringify(stalemateSteps));
					var tpmUserKing = JSON.parse(JSON.stringify(enemyKing));

					for (var mayStep of stalemateStepsMate) {
						var boardMate = JSON.parse(JSON.stringify(board));

						boardMate[mayStep.y][mayStep.x] = boardMate[fig.y][fig.x];
						boardMate[fig.y][fig.x] = 0;

						if (boardMate[mayStep.y][mayStep.x].chessmen == "king") {
							tpmUserKing.x = mayStep.x;
							tpmUserKing.y = mayStep.y;
						}

						check = 0;

						kingPos(tpmUserKing.x, tpmUserKing.y, boardMate,false);

						if (check == 1) {
							var mayStepOld = stalemateSteps.find(o => o.x === mayStep.x && o.y === mayStep.y)

							var mayStepIndex = stalemateSteps.indexOf(mayStepOld)

							stalemateSteps.splice(mayStepIndex, 1)
						}
					}
					if (stalemateSteps.length > 0) {
						return
					}
				}
			}
		}
	}

	if (stalemateSteps.length == 0) {
		addTextAlert("Пат у противника")
		lastMove.stalemate = true;
	}
}

//проверка на пат если осталось только 2 короля
function stalemateCheck2() {
	var allFiguresCount = [];
	for (var row of board) {
		for (var fig of row) {
			if (typeof(fig) == "object") {
				allFiguresCount.push(fig);
				if (allFiguresCount.length > 2) {
					return
				}
			}
		}
	}

	if (allFiguresCount.length == 2) {
		addTextAlert("Пат")
		lastMove.stalemate = true;
	}
}

function reset() {
	selectedFigures = "";
	stepVariations = [];
	lightCells = [];
	$('.grid__cell').removeClass("active");
	$('.figures__item').removeClass("select__figures");
	$('.figures__item').removeClass("kill__figures");
}

//нажатие на клетку
$(".grid__cell").click(function(){
	if(turnColor == userColor && game.mate == false) {
		gridCordX = parseInt($(this).attr('data-cord').substr(0,1));
	 	gridCordY = parseInt($(this).attr('data-cord').substr(-1,1));
	 	console.log('gridCordX: '+gridCordX+'\ngridCordY: '+gridCordY);
	 	console.log("selected figure", board[gridCordY][gridCordX])
	 	//проверка на возможность хода
	 	for (v of stepVariations) {
	 		if (gridCordX == v.x && gridCordY == v.y) {

				var selFigId = selectedFigures.id;


			 	//формирования объекта последнего хода для backend
			 	lastMove = {
					 type: v.type,
					 from: {
						 x: selectedFigures.x,
						 y: selectedFigures.y
					 },
					 to: {
						 x: gridCordX,
						 y: gridCordY
					 },
					 selFigId: selFigId
			 	}

	 			if (v.type == "kill") {

					var newFigId = board[gridCordY][gridCordX].id;
					lastMove.newFigId = newFigId;
					lastMove.killChessmen = board[gridCordY][gridCordX].chessmen;

	 				$('.figures').children('[data-figures-id="'+newFigId+'"]').children("i").css("transform","rotateY(90deg)");
					setTimeout(()=>{
						$('.figures').children('[data-figures-id="'+newFigId+'"]').remove();
					},800);

					board[gridCordY][gridCordX] = selectedFigures;
					board[selectedFigures.y][selectedFigures.x] = 0;


		 			board[gridCordY][gridCordX].x = gridCordX;
		 			board[gridCordY][gridCordX].y = gridCordY;

		 			//визуальное перемещение фигуры
					$('.figures').children('[data-figures-id="'+selFigId+'"]').css({"top": (gridCordY*100-100)+"px", "left": (gridCordX*100-100)+"px"});
					soundKill.play()
	 			}

	 			
	 			if (v.type == "move") {
	 				board[selectedFigures.y][selectedFigures.x] = 0;
		 			board[gridCordY][gridCordX] = selectedFigures;

		 			board[gridCordY][gridCordX].x = gridCordX;
		 			board[gridCordY][gridCordX].y = gridCordY;

		 			//визуальное перемещение фигуры
					$('.figures').children('[data-figures-id="'+selFigId+'"]').css({"top": (gridCordY*100-100)+"px", "left": (gridCordX*100-100)+"px"});
					soundStep.play();
	 			}

	 			if (v.type == "castling") {

					var rookId = board[v.y][v.rookXFrom].id;
					lastMove.newFigId = rookId;
					lastMove.rookXTo = v.rookXTo;

					 //перемещение ладьи
					board[v.y][v.rookXTo] = board[v.y][v.rookXFrom];
					board[v.y][v.rookXTo].x = v.rookXTo;
					board[v.y][v.rookXFrom] = 0

					//визуальное перемещение ладьи
					$('.figures').children('[data-figures-id="'+rookId+'"]').css({"top": (v.y*100-100)+"px", "left": (v.rookXTo*100-100)+"px"});


					//перемещение короля
					board[v.y][v.x] = selectedFigures;
					board[v.y][selectedFigures.x] = 0;
					board[v.y][v.x].x = v.x;

		 			//визуальное перемещение короля
					$('.figures').children('[data-figures-id="'+selFigId+'"]').css({"top": (gridCordY*100-100)+"px", "left": ((v.x)*100-100)+"px"});
	 			}

			 	if (selectedFigures.chessmen == "king" || v.type == "castling") {
					//изменения позиции короля
					userKing = {
						x: gridCordX,
						y: gridCordY
					};
					console.log(userKing)
					lastMove.userKing = userKing;
					soundCastling.play()
				}


	 			if (selectedFigures.start == 1) {
					selectedFigures.start = 0;
				}
				
				//проверка на замену пешки
				if (selectedFigures.chessmen == "pawn" && (gridCordY == 1 || gridCordY == 8)) {

					let promise = new Promise((resolve, reject) => {
						// Тут должна быть ваша функция, из-за которой весь код будет приостановлен
						$(".transform-pawn").parent().fadeIn(400);

						$('.grid__cell').removeClass("active");
						$('.figures__item').removeClass("select__figures");
						$('.figures__item').removeClass("kill__figures");

						$(".transform-pawn__item").on("click", function () {
							var selectChessmen = $(this).attr("data-figure");
							switch (selectChessmen) {
								case "queen":
									selectChessmen = "queen";
									break
								case "bishop":
									selectChessmen = "bishop";
									break
								case "rook":
									selectChessmen = "rook";
									break
								case "knight":
									selectChessmen = "knight";
									break
								default:
									selectChessmen = "queen";
									break
							}
							resolve(selectChessmen);
						})
						//Как только функция завершила свое действие, вызываем следующий метод, который продолжит выполнение кода:
					});

					promise.then((selectChessmen)=>{
						$(".transform-pawn").parent().fadeOut(400);

						console.log(selectChessmen)
						board[gridCordY][gridCordX].chessmen = selectChessmen;
						board[gridCordY][gridCordX].x = gridCordX;
						board[gridCordY][gridCordX].y = gridCordY;

						lastMove.transformation = true
						lastMove.transformationChessmen = selectChessmen






						switchPawnHtml(selFigId);
						soundTransform.play();
						afterMoveCode()
					})
				}else {
					afterMoveCode()
				}

				function afterMoveCode() {

					kingPos(enemyKing.x, enemyKing.y, board, true);


					var enemyKingId = board[enemyKing.y][enemyKing.x].id;

					var textFotTextAlert = "";

					if (check == 1) {

						lastMove.checkState = true;
						lastMove.chechKingId = enemyKingId;
						textFotTextAlert = "Вы сделали шах";

						//добовление анимации тряски для короля
						$('.figures').children("i").removeClass("king__check");
						$('.figures').children('[data-figures-id="' + enemyKingId + '"]').addClass("king__check");

						//проверка возможного отхода короля
						function testMove(bx, by) {
							//проверка вписываются ли координаты в пределы поля
							if (
								!((enemyKing.x + bx) < 9 && (enemyKing.x + bx) > 0)
								||
								!((enemyKing.y + by) < 9 && (enemyKing.y + by) > 0)
							) {
								return;
							}

							//deep clone array
							var boardMate = JSON.parse(JSON.stringify(board))


							if (boardMate[enemyKing.y + by][enemyKing.x + bx] == 0) {
								boardMate[enemyKing.y + by][enemyKing.x + bx] = boardMate[enemyKing.y][enemyKing.x];
								boardMate[enemyKing.y][enemyKing.x] = 0;
							} else {
								if (boardMate[enemyKing.y + by][enemyKing.x + bx].color != boardMate[enemyKing.y][enemyKing.x].color) {
									boardMate[enemyKing.y + by][enemyKing.x + bx] = boardMate[enemyKing.y][enemyKing.x];
									boardMate[enemyKing.y][enemyKing.x] = 0;
								} else {
									return;
								}
							}

							check = 0;
							kingPos(enemyKing.x + bx, enemyKing.y + by, boardMate, false);
							if (check == 0) {
								saveCells.push({
									x: enemyKing.x + bx,
									y: enemyKing.y + by
								});
							}
						}

						saveCells = [];
						$('.grid__cell').removeClass("save__zone");

						testMove(1, 0);
						testMove(-1, 0);
						testMove(0, 1);
						testMove(0, -1);

						testMove(1, 1);
						testMove(-1, -1);
						testMove(-1, 1);
						testMove(1, -1);

						check = 1;

						//проверка на мат если не можем отойти
						if (saveCells.length == 0) {
							var defVariations = [];

							//создание массива с вариациями защиты
							for (var row of board) {
								for (var fig of row) {
									if (typeof (fig) == "object") {
										if (fig.chessmen == "king") {
											continue;
										}
										if (fig.color == board[enemyKing.y][enemyKing.x].color) {
											whereStep(fig, defVariations);
										}
									}
								}
							}

							var tempObjStep = {
								x: attackFig.x,
								y: attackFig.y,
								type: "kill"
							};

							//проверка можем если не можем побить атакующую фигуру
							if (defVariations.some(o => o.x === attackFig.x && o.y === attackFig.y && o.type == "kill") == false) {
								if (attackFig.chessmen == "knight") {
									textFotTextAlert = "Вы сделали мат";
									lastMove.mate = true;
								}
								if (attackFig.chessmen == "pawn") {
									textFotTextAlert = "Вы сделали мат";
									lastMove.mate = true;
								}

								var overlapDefCells = 0;

								//функция создания массива для ходов перекрытия угла атаки
								function overlapDef(cx, cy) {
									if (enemyKing.x + cx == attackFig.x && enemyKing.y + cy == attackFig.y) {
										return;
									}

									while ((enemyKing.x + cx == attackFig.x && enemyKing.y + cy == attackFig.y) == false) {
										if (defVariations.some(o => o.x === (enemyKing.x + cx) && o.y === (enemyKing.y + cy) && o.type == "move")) {
											overlapDefCells++;
											break;
										}
										cx += cx;
										cy += cy;
									}
								}

								overlapDef(attackAngle.x, attackAngle.y);

								if (overlapDefCells == 0) {
									textFotTextAlert = "Вы сделали мат";
									lastMove.mate = true;
								}

							}
						}
					} else {
						//проверка на паты
						stalemateCheck1();
						stalemateCheck2();

						attackFig = "";
						saveCells = [];
						$('.figures').children('[data-figures-id="' + enemyKingId + '"]').removeClass("king__check");
					}
					if (textFotTextAlert != "") {
						addTextAlert(textFotTextAlert)
					}
					setBoard();
					check = 0;

					reset();
				}

				return;
	 		}
	 	}
	 	reset();

	 	//создание массива возможных ходов для разных видов фигур
		if(board[gridCordY][gridCordX] != 0 && board[gridCordY][gridCordX].color == userColor) {
	 		selectedFigures = board[gridCordY][gridCordX];

	 		whereStep(selectedFigures,stepVariations);


		 	//проверка на возможный шах после перестановки фигуры
		 	if (stepVariations.length != 0) {
				 var stepVariationsMate = JSON.parse(JSON.stringify(stepVariations));
				 var tpmUserKing = JSON.parse(JSON.stringify(userKing));

				 for (var mayStep of stepVariationsMate) {
					 var boardMate = JSON.parse(JSON.stringify(board));

					 boardMate[mayStep.y][mayStep.x] = boardMate[selectedFigures.y][selectedFigures.x];
					 boardMate[selectedFigures.y][selectedFigures.x] = 0;

					 if (boardMate[mayStep.y][mayStep.x].chessmen == "king") {
						 tpmUserKing.x = mayStep.x;
						 tpmUserKing.y = mayStep.y;
					 }

					 check = 0;

					 kingPos(tpmUserKing.x, tpmUserKing.y, boardMate,false);

					 if (check == 1) {
						 var mayStepOld = stepVariations.find(o => o.x === mayStep.x && o.y === mayStep.y)

						 var mayStepIndex = stepVariations.indexOf(mayStepOld)

						 stepVariations.splice(mayStepIndex, 1)
					 }
				 }
			}

	 		//свечение выбранной фигуры
			var selFId = board[gridCordY][gridCordX].id
			$('.figures').children('[data-figures-id="'+selFId+'"]').addClass("select__figures");

			//свечение возможных ходов
	 		for (v of stepVariations) {
			 	if (v.type == "kill") {
					var killFId = board[v.y][v.x].id
					$('.figures').children('[data-figures-id="'+killFId+'"]').addClass("kill__figures");
				}

	 			lightCells.push({
					x: v.x,
					y: v.y
				})
	 		}
	 	}
	 	//отрисовка свечения
	 	if (lightCells.length != 0) {
			for (c of lightCells) {
				var cellCord = c.x+"."+c.y;
				$('.grid__row').children('[data-cord="'+cellCord+'"]').addClass("active");
			}
		}
	}
 });//конец главной функции игры


//обработчик кнопки сдаться
$(".surrender").click(()=>{
	$(".surrender-confirm").parent("div").fadeIn(400)
});

$(".surrender-confirm__button_yes").click(()=>{
	if (gameId != "") {
		$.post('/gameSurrender', {
			gameId: gameId
		}, function (data) {
			if (data.type == "successful") {
				$(".surrender-confirm").parent("div").fadeOut(400)
				addTextAlert("Вы сдались")
				checkGame();
			}
		})

	}else {
		$(".surrender-confirm").parent("div").fadeOut(400)
		alert("NAN GAME TOKEN")
	}
});

$(".surrender-confirm__button_no").click(()=>{
	$(".surrender-confirm").parent("div").fadeOut(400)
});





//цветовая палитра фигур и клеток
var schemeArr = [
	{
		whiteFigures: "#a67d30",
		blackFigures: "#263f91",
		whiteBoard: "#EBEEF6",
		blackBoard: "#CDD1DE"
	},
	{
		whiteFigures: "#5391ef",
		blackFigures: "#745ff2",
		whiteBoard: "#EBEEF6",
		blackBoard: "#CDD1DE"
	},
	{
		whiteFigures: "#d91f1f",
		blackFigures: "#043207",
		whiteBoard: "#d4d5d7",
		blackBoard: "#810c0c"
	},
	{
		whiteFigures: "#d1d4dd",
		blackFigures: "#000",
		whiteBoard: "#edcea7",
		blackBoard: "#7e4310"
	},
	{
		whiteFigures: "#51a197",
		blackFigures: "#d9719b",
		whiteBoard: "#EBEEF6",
		blackBoard: "#CDD1DE"
	},
	{
		whiteFigures: "#ee7755",
		blackFigures: "#272E6D",
		whiteBoard: "#F6F4EA",
		blackBoard: "#E4DDD3",
	},
	{
		whiteFigures: "#54aac7",
		blackFigures: "#66056e",
		whiteBoard: "#072064",
		blackBoard: "#ed871f"
	}
]

for (var i in schemeArr) {
	$(".palette__wrap").children('[data-scheme="'+i+'"]').children(".palette__inner").eq(0).css("background", schemeArr[i].whiteFigures);
	$(".palette__wrap").children('[data-scheme="'+i+'"]').children(".palette__inner").eq(1).css("background", schemeArr[i].blackFigures);
}


$(".palette__item").click(function (){
	var scheme = $(this).attr("data-scheme");

	$(".palette__item").removeClass("palette__item_active")
	$(this).addClass("palette__item_active")

	$(".white__figures").css("background-color",schemeArr[scheme].whiteFigures)
	$(".black__figures").css("background-color",schemeArr[scheme].blackFigures)

	$(".board__cell_white").css("background-color",schemeArr[scheme].whiteBoard)
	$(".board__cell_black").css("background-color",schemeArr[scheme].blackBoard)
});


//наведение на блок последнего хода
$(".moves").click(()=>{
	var moves__numbersFrom = $(".moves__numbers").attr("data-last-cord-from")
	var moves__numbersTo = $(".moves__numbers").attr("data-last-cord-to")
	if (moves__numbersFrom != "") {
		$('.grid__row').children('[data-cord="'+moves__numbersFrom+'"]').addClass("grid__cell_lastMove");
		$('.grid__row').children('[data-cord="'+moves__numbersTo+'"]').addClass("grid__cell_lastMove");
	}
	setTimeout(()=>{
		console.log("fffff")
		$(".grid__cell").removeClass("grid__cell_lastMove");
	},3000)
})



//код для салюта
function fireworkAnimation() {
	var c = document.getElementById("canvas");
	var ctx = c.getContext("2d");

	var cwidth, cheight;
	var shells = [];
	var pass = [];

	var fireworkColors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];

	window.onresize = function () {
		reset();
	}
	reset();

	function reset() {

		cwidth = window.innerWidth;
		cheight = window.innerHeight;
		c.width = cwidth;
		c.height = cheight;
	}

	function newShell() {

		var left = (Math.random() > 0.5);
		var shell = {};
		shell.x = (1 * left);
		shell.y = 1;
		shell.xoff = (0.01 + Math.random() * 0.007) * (left ? 1 : -1);
		shell.yoff = 0.01 + Math.random() * 0.007;
		shell.size = Math.random() * 6 + 3;
		shell.color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];

		shells.push(shell);
	}

	function newPass(shell) {

		var pasCount = Math.ceil(Math.pow(shell.size, 2) * Math.PI);

		for (i = 0; i < pasCount; i++) {

			var pas = {};
			pas.x = shell.x * cwidth;
			pas.y = shell.y * cheight;

			var a = Math.random() * 4;
			var s = Math.random() * 10;

			pas.xoff = s * Math.sin((5 - a) * (Math.PI / 2));
			pas.yoff = s * Math.sin(a * (Math.PI / 2));

			pas.color = shell.color;
			pas.size = Math.sqrt(shell.size);

			if (pass.length < 1000) {
				pass.push(pas);
			}
		}
	}

	var lastRun = 0;
	fireworkRun();

	function fireworkRun() {

		var dt = 1;
		if (lastRun != 0) {
			dt = Math.min(50, (performance.now() - lastRun));
		}
		lastRun = performance.now();

		//ctx.clearRect(0, 0, cwidth, cheight);
		ctx.fillStyle = "rgba(255,255,255,0.001)";
		ctx.fillRect(0, 0, cwidth, cheight);

		if ((shells.length < 10) && (Math.random() > 0.96)) {
			newShell();
		}

		for (let ix in shells) {

			var shell = shells[ix];

			ctx.beginPath();
			ctx.arc(shell.x * cwidth, shell.y * cheight, shell.size, 0, 2 * Math.PI);
			ctx.fillStyle = shell.color;
			ctx.fill();

			shell.x -= shell.xoff;
			shell.y -= shell.yoff;
			shell.xoff -= (shell.xoff * dt * 0.001);
			shell.yoff -= ((shell.yoff + 0.2) * dt * 0.00005);

			if (shell.yoff < -0.005) {
				newPass(shell);
				shells.splice(ix, 1);
			}
		}

		for (let ix in pass) {

			var pas = pass[ix];

			ctx.beginPath();
			ctx.arc(pas.x, pas.y, pas.size, 0, 2 * Math.PI);
			ctx.fillStyle = pas.color;
			ctx.fill();

			pas.x -= pas.xoff;
			pas.y -= pas.yoff;
			pas.xoff -= (pas.xoff * dt * 0.001);
			pas.yoff -= ((pas.yoff + 5) * dt * 0.0005);
			pas.size -= (dt * 0.002 * Math.random())

			if ((pas.y > cheight) || (pas.y < -50) || (pas.size <= 0)) {
				pass.splice(ix, 1);
			}
		}
		requestAnimationFrame(fireworkRun);
	}
}



}) //JQ page load










var alertCount = 0;
function addTextAlert(text) {
	alertCount++;
	document.querySelector('.alerts').innerHTML += `
		<div class="alert__item animate__animated animate__fadeInUp" id="${"alert"+alertCount}">
			<img class="alerts__icon" src="../img/icons/alert.png">
			<p class="alerts__text">
				${text}
			</p>
			<div class="alerts__close" onclick="delTextAlert(${alertCount});">
				<img src="../img/icons/cross.png">
			</div>
		</div>`;
	delTextAlertTime(alertCount)
}

function delTextAlertTime(el) {
	setTimeout(()=>{
		delTextAlert(el)
	},3500)
}

function delTextAlert(id) {
	$(`${"#alert"+id}`).addClass("animate__fadeOutDown")
	setTimeout(()=>{
		$(`${"#alert"+id}`).remove()
	},500)

}
