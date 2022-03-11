$(function(){

//запрос на создание визита +1
$.post('/siteStatistic/visit',{},function (){})

$('.inGameModal').fadeOut(0);


//Preloader
$(document).ready(function (){
    var $preloader = $('#page-preloader'),
        $spinner   = $preloader.find('.spinner');
    $spinner.fadeOut();
    $preloader.delay(100).fadeOut('slow');
});

var user = "";
setInterval(()=>{
	checkSession();
},2000)

checkSession()

setTimeout(()=>{
	if (user != "") {
		myRequests();
	}
},1500)





//Modal window
$('.nav__login').click(function(){
	$('#authorization').arcticmodal();
});

$('.toRegistration').click(function(){
	$('#authorization').arcticmodal('close');
	$('#registration').arcticmodal();
});

$('.toLogin').click(function(){
	$('#registration').arcticmodal('close');
	$('#authorization').arcticmodal();
});

$('.toRecovery').click(function(){
	$('#authorization').arcticmodal('close');
	$('#recovery').arcticmodal();
});

//left model window
$(".online__parent").fadeOut(0)

$(".online-collapse").click(()=>{
	$(".online").toggleClass("online__opened");

	if ($(".online").hasClass("online__opened") == true) {
		$(".online__parent").fadeIn(400)
	}else {
		$(".online__parent").fadeOut(400)
	}

})

$(".game-menu__nickname_right").click(()=>{
	$(".online").toggleClass("online__opened");
})



$(document).mouseup( function(e){ // событие клика по веб-документу

	var div = $( ".start__btn" ); // тут указываем ID элемента
	if ( !div.is(e.target) // если клик был не по нашему блоку
	    && div.has(e.target).length === 0 ) { // и не по его дочерним элементам
		$(".start__btn").removeClass('start__btn_clicked');
		$(".wrap__variables").removeClass('wrap__variables_active');
	}

	var divOnline = $( ".online" ); // тут указываем ID элемента
	if ( !divOnline.is(e.target) // если клик был не по нашему блоку
		&& divOnline.has(e.target).length === 0 ) { // и не по его дочерним элементам
		$(".online").removeClass("online__opened");
		$(".online__parent").fadeOut(400)
	}
});



//change stile for button play on click
$(".start__btn").click(()=>{
	if(user != "") {
		$(".start__btn").addClass('start__btn_clicked');
		$(".wrap__variables").addClass('wrap__variables_active');
	}else {
		addTextAlert("Для игры вам необходимо авторизоваться");
		$('#authorization').arcticmodal();
	}
})

$(".wrap__list").fadeOut(0)

//change stile for button history on click
$(".wrap__history-btn").click(()=>{
	if(user != "") {
		$(".wrap__history-btn").toggleClass('wrap__history-btn_clicked');
		if ($(".wrap__history-btn").hasClass('wrap__history-btn_clicked')) {
			$(".wrap__list").fadeIn(400)
			myMatches()
		}else {
			$(".wrap__list").fadeOut(400)
		}

	}else {
		addTextAlert("Для просмотра ваших партий необходимо авторизоваться");
		$('#authorization').arcticmodal();
	}
})

//проверка на сессию / обновление данных пользователя
function checkSession() {
	$.post('/auth/user',
		{},
		function(data) { 
			if (data.type == "successful") {
				user = data.user;
				task = user.task;
				if (task != "") {
					if (task.type == "lobby") {
						lobbyId = task.id;
					} else if (task.type == "game"){
						window.location.href = '/game';
					}
				}else {
					lobbyId = "";
				}

				checkLobby();
				$(".online__items").html('<p class="online__text">No one</p>')
				if (data.friendsOnline != "") {
					$(".online-collapse__inscription").css("display", "flex")
					$(".online-collapse__inscription").children("div").html(data.friendsOnline.length)
					$(".online__items").html("")
					for (var friend of data.friendsOnline) {
						$(".online__items").append( 
						`<div class="online__item" data-friend-id="${friend.id}">
							<div class="online__item-wrap">
								<div class="online__logo stat__icon">
									<i class="icon-pawn"></i>
									<div class="online__status online__status_on"></div>
								</div>

								<div class="online__info">
									<div class="online__nickname">
										${friend.nick}
									</div>
									<div class="online__stat">
										<div class="online__wins user__wins">
											${friend.wins}
										</div>
										<div class="online__percent user__percent">
											${friend.winrate + "%"}
										</div>
										<div class="online__wins user__loses">
											${friend.loses}
										</div>
									</div>
								</div>
								<div class="online__invite" title="Invite friend" data-friend-id="${friend.id}">
									<svg viewBox="0 0 448 512"><path d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"/></svg>
								</div>
							</div>
						</div>`);
					}
				}else {
					$(".online-collapse__inscription").css("display", "none")
				}
				applyUser();
				checkInvites();
				$(".online__invite").click(function (){
					var friendId = $(this).attr("data-friend-id");
					inviteFriend(friendId);
				});
			}else {
				cancelUser();
			}
		}
	);
}

function applyUser() {
	$('.nav__login').css('display', "none"); 
	$('.user').css('display', "flex");
	$('.user__nickname').html(user.nick);
		$('#userWins').html(user.wins);
		$('#userWinrate').html(user.winrate+"%");
		$('#userLoses').html(user.loses);
	$('.nav__friends').css('display', "flex");
	$('.online').css('display', "flex");
}

function cancelUser() {
	$('.nav__login').css('display', "flex"); 
	$('.user').css('display', "none");
	$('.nav__friends').css('display', "none");
	$('.online').css('display', "none");
	user = "";
	$(".wrap__list").fadeOut(400)
	$(".wrap__history-btn").removeClass('wrap__history-btn_clicked');

}

//authorization login
$("#authorization").submit(function(e){
	e.preventDefault();
	let logEmail = $("#logEmail").val().trim();
	let logPassword = $("#logPassword").val().trim();

	$.post('/auth/log',
		{ email: logEmail,
		  password: logPassword},
		function(data) { 
			if(data.type == "successful") {
				checkSession();
				$('#authorization').arcticmodal('close');
				addTextAlert(data.message)
			}else {
				addTextAlert(data.message)
			}
			
		}
	);
});

//authorization logout
$(".user__sign-out").on('click', ()=> {
	$.post('/auth/out',
		{},
		function(data) { 
			if (data.type == "successful") {
				cancelUser();
				addTextAlert(data.message)
			}else {
				addTextAlert(data.message)
			}
		}
	);
});

//recovery password
$("#recovery").submit(function(e){
	e.preventDefault();
	let recEmail = $("#recEmail").val().trim();

	$.post('/auth/recovery',
		{
			email: recEmail
		},
		function(data) {
			if(data.type == "successful") {
				addTextAlert(data.message)
			}else {
				addTextAlert(data.message)
			}

		}
	);
});


//Registration
$("#registration").submit(function(e){
	e.preventDefault();
	let regEmail = $("#regEmail").val().trim();
	let regNick = $("#regNick").val().trim();
	let regPassword1 = $("#regPassword1").val().trim();
	let regPassword2 = $("#regPassword2").val().trim();
	if(check2Pass() == true) {
    	$.post('/auth/reg',
    		{ email: regEmail,
			  nick: regNick,
    		  password: regPassword1
    		},
    		function(data) { 
    			if(data.type == "successful") {
    				$('#registration').arcticmodal('close');
    				addTextAlert(data.message)
					addTextAlert("Для входа в аккаунт подтвердите электронную почту")
    			}else {
    				addTextAlert(data.message)
    			}
    			
    		}
    	);
		
	}else {
		addTextAlert("Указанные вами пароли не совпадают")
	}
});

function check2Pass() {
	if ($("#regPassword1").val() === $("#regPassword2").val()) {
		$("#regPassword1").addClass("border__green").removeClass("border__red");
		$("#regPassword2").addClass("border__green").removeClass("border__red");
		return true
	}else {
		$("#regPassword1").addClass("border__red").removeClass("border__green");
		$("#regPassword2").addClass("border__red").removeClass("border__green");
		return false
	}
}

$(".logPassword__label").click(()=>{
	$(".eye__open").toggleClass("eye__sost")
	$(".eye__close").toggleClass("eye__sost")
	if($("#logPassword").attr("type") === "text") {
		$("#logPassword").attr("type","password")
	}else {
		$("#logPassword").attr("type","text")
	}
	
});

//проверка паролей при геристрации на совпадение
$("#regPassword1").on('input',()=>{
	check2Pass();
});
$("#regPassword2").on('input',()=>{
	check2Pass();
});

var invitesCount = 0;
function checkInvites() {
	$.post('/invites',
		{

		},
		function (data) {
			if(data.type === "successful") {
				for (var invite of data.invites) {
					invitesCount++;
					if (invite.type === "byte") {
						continue;
					}
					if (invite.type === "addFriend") {
						$('.invites').append(`<!-- Friends invite -->
							<div class="invite invite_friends animate__animated animate__fadeInRight" id="${"invite" + invitesCount}">
								<div class="invite__bar">
									<div class="invite__nick">${invite.nick}</div>
									<div class="invite__title"> отправил запрос в друзья	</div>
								</div>
								<div class="invite__info">
									<div class="online__stat">
										<div class="online__wins user__wins">
											${invite.wins}
										</div>
										<div class="online__percent user__percent">
											${invite.winrate + "%"}
										</div>
										<div class="online__wins user__loses">
											${invite.loses}
										</div>
									</div>
								</div>
								<div class="invite__text" onclick="addFriend(${invite.id});delInvite(${invitesCount})"">
									<span><svg viewBox="0 0 640 512"><path d="M274.7 304H173.3C77.61 304 0 381.6 0 477.3C0 496.5 15.52 512 34.66 512h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304zM413.3 480H34.66C33.2 480 32 478.8 32 477.3C32 399.4 95.4 336 173.3 336H274.7C352.6 336 416 399.4 416 477.3C416 478.8 414.8 480 413.3 480zM224 256c70.7 0 128-57.31 128-128S294.7 0 224 0C153.3 0 96 57.31 96 128S153.3 256 224 256zM224 32c52.94 0 96 43.06 96 96c0 52.93-43.06 96-96 96S128 180.9 128 128C128 75.06 171.1 32 224 32zM624 208h-64v-64C560 135.2 552.8 128 544 128s-16 7.156-16 16v64h-64C455.2 208 448 215.2 448 224s7.156 16 16 16h64v64c0 8.844 7.156 16 16 16s16-7.156 16-16v-64h64C632.8 240 640 232.8 640 224S632.8 208 624 208z"/></svg></span> Принять
								</div>
								<div class="invite__underline"></div>
							</div>`);
						delInviteTime(invitesCount);
						soundClick();
					}
					if (invite.type === "game") {
						function inviteGameMode(mode) {
							var modeCode;
							switch (mode) {
								case "default":
									modeCode = `<div class="game-menu__icon game-menu__icon_turtle invite__icon">
													<!-- Turtle -->
													<svg viewBox="0 0 640 512"><path d="M637.1 160.5c-5.25-20.75-18.88-38.25-36.13-50.62C556.3 78 545.1 64 507.6 64c-39.63 0-73.5 23.62-86.25 57.88C380.8 71.5 317.8 32 248.4 32C232.3 32 84.63 43.88 35.5 191.5C30.13 207.6 31 224.6 37.5 240H32C14.38 240 0 254.4 0 272V288c0 11.88 6.625 22.75 17.13 28.38l81.5 42.75L70.5 408c-8.625 14.75-8.625 33.25 0 48C79 470.8 94.88 480 112 480H149c17.13 0 32.1-9.125 41.5-24l27.75-47.88c40.25 10.38 97.5 10.88 139.6 0L385.5 456c8.5 14.88 24.38 24 41.5 24h37c17.13 0 33-9.25 41.5-24c8.625-14.75 8.625-33.25 0-48l-30.63-53.13c30.63-20.75 51.25-50 61.5-82.88h15C607.8 272 651.9 219.1 637.1 160.5zM81.13 206.6C100.3 149.1 167.5 80 247.6 80h.75c80.13 0 147.4 69.12 166.5 126.6C418.1 216.5 408.3 239 384.1 239.8L114.6 240C92.13 240 75.5 223.5 81.13 206.6zM551.4 224h-47.38c-11.25 90.38-74.88 101.6-96.5 110.2L464 432h-37l-46.75-81c-66.88 21.88-108.8 24.75-184.5 0L149 432H112l53.25-92.13L66.38 288l316.6 .0002c32.13 0 80.88-21.75 81-79.75V153c0-19.88 11.63-30.5 21.75-35.75c31.5-16.12 47.13 3 89.25 33c10.63 7.625 17 20 17 33.13C592 205.8 573.8 224 551.4 224zM512 143.1c-8.875 0-16 7.125-16 16s7.125 16 16 16s16-7.125 16-16S520.9 143.1 512 143.1z"/></svg>
													<div class="invite__dur game-menu__duration_first">
														<!-- Infinity simbol -->
													</div>
												</div>`;
									break;
								case "mild":
									modeCode = `<div class="game-menu__icon game-menu__icon_timer invite__icon">
													<!-- Timer -->
													<svg viewBox="0 0 512 512"><path d="M256 16c-13.25 0-24 10.75-24 24v80C232 133.3 242.8 144 256 144s24-10.75 24-24V65.5C374.6 77.34 448 158.3 448 256c0 105.9-86.13 192-192 192s-192-86.13-192-192c0-41.31 12.91-80.66 37.31-113.8c7.875-10.69 5.594-25.69-5.062-33.56C85.56 100.8 70.5 103.1 62.69 113.8C32.16 155.2 16 204.4 16 256c0 132.3 107.7 240 239.1 240S496 388.3 496 256S388.3 16 256 16zM239 272.1c4.688 4.688 10.81 7.031 16.97 7.031s12.28-2.344 16.97-7.031c9.375-9.375 9.375-24.56 0-33.94l-79.1-80c-9.375-9.375-24.56-9.375-33.94 0s-9.375 24.56 0 33.94L239 272.1z"/></svg>
													<div class="invite__dur">
													 15 M
													</div>
												</div>`;
									break;
								case "fast":
									modeCode = `<div class="game-menu__icon game-menu__icon_bolt invite__icon">
													<!-- Bolt / Thunder -->
													<svg viewBox="0 0 384 512"><path d="M373.1 280.1l-255.1 223.1C111.1 509.3 103.5 512 96 512c-6.593 0-13.19-2.016-18.81-6.109c-12.09-8.781-16.5-24.76-10.59-38.5L143.5 288L32.01 288c-13.34 0-25.28-8.266-29.97-20.75c-4.687-12.47-1.125-26.55 8.906-35.33l255.1-223.1c11.25-9.89 27.81-10.58 39.87-1.799c12.09 8.781 16.5 24.76 10.59 38.5l-76.88 179.4l111.5-.0076c13.34 0 25.28 8.266 29.97 20.75C386.6 257.2 383.1 271.3 373.1 280.1z"/></svg>
													<div class="invite__dur">
													 5 M
													</div>
												</div>`;
									break;
								case "mad":
									modeCode = `<div class="game-menu__icon game-menu__icon_fire invite__icon">
													<!-- Fire / Flame -->
													<svg viewBox="0 0 384 512"><path d="M203.1 4.364c-6.179-5.822-16.06-5.818-22.24 .005C74.52 104.6 0 220.2 0 298C0 423.1 79 512 192 512s192-88.01 192-213.1C384 219.9 309 104.2 203.1 4.364zM192 448c-70.62 0-128-52.88-128-117.9c0-44.12 25.88-71.5 34.38-79.75c3.125-3.125 8.125-3.125 11.25 0C111.1 251.9 112 253.9 112 256v40C112 327 137 352 168 352C198.9 352 224 327 224 296C224 224 111.4 231.2 184.5 131.6C187.5 127.8 192 127.5 195.1 128.5c1.625 .5 5.375 2.25 5.375 6.75c0 33.63 25.12 54.1 51.63 77.63C285.5 241.5 320 271 320 330.1C320 395.1 262.6 448 192 448z"/></svg>
													<div class="invite__dur">
													 1 M
													</div>
												</div>`;
									break;
							}
							return modeCode
						}
						$(".invites").append(`<!-- Game invite -->
							<div class="invite invite_game animate__animated animate__fadeInRight" id="${"invite" + invitesCount}">
								<div class="invite__bar">
									<div class="invite__nick">${invite.nick}</div>
									<div class="invite__title"> приглашает вас в игру</div>
								</div>
								<div class="invite__info">
									<div class="online__info">
										<div class="online__stat">
											<div class="online__wins user__wins">
												${invite.wins}
											</div>
											<div class="online__percent user__percent">
												${invite.winrate + "%"}
											</div>
											<div class="online__wins user__loses">
												${invite.loses}
											</div>
										</div>
									</div>
									${inviteGameMode(invite.mode)}
								</div>
								<div class="invite__text" data-lobby-id="${invite.lobby}" onclick="delInvite(${invitesCount});">
									<span>+</span> Присоединиться
								</div>
								<div class="invite__underline"></div>
							</div>`
						)
						$('.invite__text').click(function (){
							var id = $(this).attr("data-lobby-id");
							joinLobby(id);
						});
						delInviteTime(invitesCount);
						soundClick();
					}
				}
			}
		}
	)
}

function soundClick() {
	var audio = new Audio(); // Создаём новый элемент Audio
	audio.src = '../sounds/alert.mp3'; // Указываем путь к звуку "клика"
	audio.autoplay = true; // Автоматически запускаем
}










$('.nav__friends').on('click', ()=> {
	$('#friends').parent().fadeIn(400);

	$(document).mouseup( function(e){ // событие клика по веб-документу

		var div = $( "#friends" ); // тут указываем ID элемента
		if ( !div.is(e.target) // если клик был не по нашему блоку
			&& div.has(e.target).length === 0 )
		{ // и не по его дочерним элементам
			$('#friends').parent().fadeOut(400);

		}
	});
	myFriends();
})

//search friends
$('.friends__input').on('input', ()=> {

	var searchText = $('.friends__input').val().trim();

	if (searchText != "") {
		$('.friends__list').html("<div class=\"lds-roller spinner\" ><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>");
		$.post('/searchFriends',
			{ text: searchText},
			function(data) {
				if (data.found == true) {
					$('.friends__list').html("");
					for (var player of data.players) {
						if(player.id == user.id) {
							if(data.players.length == 1) {
								$('.friends__list').html(`<p class="friends__text">Игроков по запросу "${searchText}" не найденно</p>`)
							}
							continue
						}
						if (player.friend == true) {
							$('.friends__list').append(`
							<div class="friends__player animate__animated animate__fadeIn" data-driend-id="${player.id}">
								<div class="friends__logo">
									<i class="icon-knight"></i>
									<div class="friends__status ${player.online ? 'friends__status_on' : 'friends__status_off'}"></div>
								</div>
								<div class="friends__nickname">${player.nick}</div>
								<div class="friends__stat">
									<div class="friends__wins user__wins">
										${player.wins}
									</div>
									<div class="friends__percent user__percent">
										${player.winrate + "%"}
									</div>
									<div class="friends__loses user__loses">
										${player.loses}
									</div>
								</div> 
									<div class="friends__remove friends__icon" onclick="delFriends(${player.id})">
										<!-- User minus SVG (remove)-->
										<svg viewBox="0 0 640 512"><path d="M224 256c70.7 0 128-57.31 128-128S294.7 0 224 0C153.3 0 96 57.31 96 128S153.3 256 224 256zM224 32c52.94 0 96 43.06 96 96c0 52.93-43.06 96-96 96S128 180.9 128 128C128 75.06 171.1 32 224 32zM274.7 304H173.3C77.61 304 0 381.6 0 477.3C0 496.5 15.52 512 34.66 512h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304zM413.3 480H34.66C33.2 480 32 478.8 32 477.3C32 399.4 95.4 336 173.3 336H274.7C352.6 336 416 399.4 416 477.3C416 478.8 414.8 480 413.3 480zM624 208h-160C455.2 208 448 215.2 448 224s7.156 16 16 16h160C632.8 240 640 232.8 640 224S632.8 208 624 208z"/></svg>
									</div>
								</div>`)
						} else {
							$('.friends__list').append(`
							<div class="friends__player animate__animated animate__fadeIn" data-driend-id="${player.id}">
								<div class="friends__logo">
								<i class="icon-knight"></i>
							<div class="friends__status ${player.online ? 'friends__status_on' : 'friends__status_off'}"></div>
							</div>
								<div class="friends__nickname">${player.nick}</div>
								<div class="friends__stat">
									<div class="friends__wins user__wins">
										${player.wins}
									</div>
									<div class="friends__percent user__percent">
										${player.winrate + "%"}
									</div>
									<div class="friends__loses user__loses">
										${player.loses}
									</div>
								</div>
								<div class="friends__add friends__icon" data-friend-id="${player.id}" onclick="addFriend(${player.id})">
										<!-- User plus SVG (add)-->
									<svg viewBox="0 0 640 512"><path d="M274.7 304H173.3C77.61 304 0 381.6 0 477.3C0 496.5 15.52 512 34.66 512h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304zM413.3 480H34.66C33.2 480 32 478.8 32 477.3C32 399.4 95.4 336 173.3 336H274.7C352.6 336 416 399.4 416 477.3C416 478.8 414.8 480 413.3 480zM224 256c70.7 0 128-57.31 128-128S294.7 0 224 0C153.3 0 96 57.31 96 128S153.3 256 224 256zM224 32c52.94 0 96 43.06 96 96c0 52.93-43.06 96-96 96S128 180.9 128 128C128 75.06 171.1 32 224 32zM624 208h-64v-64C560 135.2 552.8 128 544 128s-16 7.156-16 16v64h-64C455.2 208 448 215.2 448 224s7.156 16 16 16h64v64c0 8.844 7.156 16 16 16s16-7.156 16-16v-64h64C632.8 240 640 232.8 640 224S632.8 208 624 208z"/></svg>
								</div>
							</div>`)
						}
					}
				}else {
					$('.friends__list').html(`<p class="friends__text">Игроков по запросу "${searchText}" не найденно</p>`)
				}
			}
		);
	}else {
		$('.friends__signpost-line').css("margin-left", "0px");
		myFriends();
	}
});

//my friends
$('.friends__all').on('click', ()=> {
	myFriends();
	$('.friends__signpost-line').css("margin-left", "0px")
});





//my requests
$('.friends__request').on('click', ()=> {
	myRequests();
	$('.friends__signpost-line').css("margin-left", "50%")
});

function myRequests() {
	$('.friends__list').html("<div class=\"lds-roller spinner\" ><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>");
	$.post('/myRequests',
		{},
		function(data) {
			if (data.friends != "") {
				$(".friends__inscription").css("display", "flex")
				$(".friends__inscription").children("div").html(data.friends.length)
				$('.friends__list').html("");
				for (var player of data.friends) {
					$('.friends__list').append(`
					<div class="friends__player animate__animated animate__fadeIn" data-friend-id="${player.id}">
						<div class="friends__logo">
							<i class="icon-knight"></i>
							<div class="friends__status ${player.online ? 'friends__status_on' : 'friends__status_off'}"></div>
						</div>
						<div class="friends__nickname">${player.nick}</div>
						<div class="friends__stat">
							<div class="friends__wins user__wins">
								${player.wins}
							</div>
							<div class="friends__percent user__percent">
								${player.winrate+"%"}
							</div>
							<div class="friends__loses user__loses">
								${player.loses}
							</div>
						</div> 
							<div class="friends__add friends__icon" data-friend-id="${player.id}" onclick="addFriend(${player.id});">
										<!-- User plus SVG (add)-->
								<svg viewBox="0 0 640 512"><path d="M274.7 304H173.3C77.61 304 0 381.6 0 477.3C0 496.5 15.52 512 34.66 512h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304zM413.3 480H34.66C33.2 480 32 478.8 32 477.3C32 399.4 95.4 336 173.3 336H274.7C352.6 336 416 399.4 416 477.3C416 478.8 414.8 480 413.3 480zM224 256c70.7 0 128-57.31 128-128S294.7 0 224 0C153.3 0 96 57.31 96 128S153.3 256 224 256zM224 32c52.94 0 96 43.06 96 96c0 52.93-43.06 96-96 96S128 180.9 128 128C128 75.06 171.1 32 224 32zM624 208h-64v-64C560 135.2 552.8 128 544 128s-16 7.156-16 16v64h-64C455.2 208 448 215.2 448 224s7.156 16 16 16h64v64c0 8.844 7.156 16 16 16s16-7.156 16-16v-64h64C632.8 240 640 232.8 640 224S632.8 208 624 208z"/></svg>
							</div>
						</div>`);
				}
			}else {
				$(".friends__inscription").css("display", "none")
				$(".friends__list").html('<p class="friends__text">У вас нет пока нет заявок в друзья</p>');
			}
		})
}


function getMinimizedTime(gameTimeLength) {
	var hours = Math.floor(gameTimeLength / 1000 / 60 / 60) % 24;
	var minutes = Math.floor(gameTimeLength / 1000 / 60) % 60;
	var seconds = Math.floor(gameTimeLength / 1000) % 60;

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

	return gameTimeStr
}

	function getMinimizedDate(longDate) {
		var days = longDate.getDate().toString()
		var months = (longDate.getMonth()+1).toString()
		var years = longDate.getFullYear().toString()
		var hours = longDate.getHours().toString()
		var minutes = longDate.getMinutes().toString()

		if (days.length < 2) {
			days = "0"+days
		}
		if (months.length < 2) {
			months = "0"+months
		}
		if (hours.length < 2) {
			hours = "0"+hours
		}
		if (minutes.length < 2) {
			minutes = "0"+minutes
		}

		return hours+":"+minutes+"</br> "+days+"."+months+"."+years
	}


function myMatches() {
	if (user != "") {
		$.post('/matchesHistory',{

		}, function (data) {
			if (data.type == "successful") {
				$(".wrap__list").html("<div class=\"lds-roller spinner\" ><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>");
				if (data.matchesArr.length > 0) {
					document.querySelector(".wrap__list").innerHTML= "";
					for (var match of data.matchesArr) {
						var matchPlayers = match.players

						var gameMinimizedTime = getMinimizedTime(match.duration)
						var matchDateStart = getMinimizedDate(new Date(new Date(match.timeStart).toLocaleString()))


						var matchPlayersUser;
						var matchPlayersEnemy;

						for (var p of matchPlayers) {
							if (p.id == user.id) {
								matchPlayersUser = p;
							}else {
								matchPlayersEnemy = p;
							}
						}
						var modeCode;
						switch (match.mode) {
							case "default":
								modeCode = `
											<!-- Turtle -->
											<svg style="fill: #92B9B9" viewBox="0 0 640 512"><path d="M637.1 160.5c-5.25-20.75-18.88-38.25-36.13-50.62C556.3 78 545.1 64 507.6 64c-39.63 0-73.5 23.62-86.25 57.88C380.8 71.5 317.8 32 248.4 32C232.3 32 84.63 43.88 35.5 191.5C30.13 207.6 31 224.6 37.5 240H32C14.38 240 0 254.4 0 272V288c0 11.88 6.625 22.75 17.13 28.38l81.5 42.75L70.5 408c-8.625 14.75-8.625 33.25 0 48C79 470.8 94.88 480 112 480H149c17.13 0 32.1-9.125 41.5-24l27.75-47.88c40.25 10.38 97.5 10.88 139.6 0L385.5 456c8.5 14.88 24.38 24 41.5 24h37c17.13 0 33-9.25 41.5-24c8.625-14.75 8.625-33.25 0-48l-30.63-53.13c30.63-20.75 51.25-50 61.5-82.88h15C607.8 272 651.9 219.1 637.1 160.5zM81.13 206.6C100.3 149.1 167.5 80 247.6 80h.75c80.13 0 147.4 69.12 166.5 126.6C418.1 216.5 408.3 239 384.1 239.8L114.6 240C92.13 240 75.5 223.5 81.13 206.6zM551.4 224h-47.38c-11.25 90.38-74.88 101.6-96.5 110.2L464 432h-37l-46.75-81c-66.88 21.88-108.8 24.75-184.5 0L149 432H112l53.25-92.13L66.38 288l316.6 .0002c32.13 0 80.88-21.75 81-79.75V153c0-19.88 11.63-30.5 21.75-35.75c31.5-16.12 47.13 3 89.25 33c10.63 7.625 17 20 17 33.13C592 205.8 573.8 224 551.4 224zM512 143.1c-8.875 0-16 7.125-16 16s7.125 16 16 16s16-7.125 16-16S520.9 143.1 512 143.1z"/></svg>
											`
								break;
							case "mild":
								modeCode = `
											<!-- Timer -->
											<svg style="fill: #F4B16B" viewBox="0 0 512 512"><path d="M256 16c-13.25 0-24 10.75-24 24v80C232 133.3 242.8 144 256 144s24-10.75 24-24V65.5C374.6 77.34 448 158.3 448 256c0 105.9-86.13 192-192 192s-192-86.13-192-192c0-41.31 12.91-80.66 37.31-113.8c7.875-10.69 5.594-25.69-5.062-33.56C85.56 100.8 70.5 103.1 62.69 113.8C32.16 155.2 16 204.4 16 256c0 132.3 107.7 240 239.1 240S496 388.3 496 256S388.3 16 256 16zM239 272.1c4.688 4.688 10.81 7.031 16.97 7.031s12.28-2.344 16.97-7.031c9.375-9.375 9.375-24.56 0-33.94l-79.1-80c-9.375-9.375-24.56-9.375-33.94 0s-9.375 24.56 0 33.94L239 272.1z"/></svg>
											`
								break;
							case "fast":
								modeCode = `
											<!-- Bolt / Thunder -->
											<svg style="fill: #F6D66D" viewBox="0 0 384 512"><path d="M373.1 280.1l-255.1 223.1C111.1 509.3 103.5 512 96 512c-6.593 0-13.19-2.016-18.81-6.109c-12.09-8.781-16.5-24.76-10.59-38.5L143.5 288L32.01 288c-13.34 0-25.28-8.266-29.97-20.75c-4.687-12.47-1.125-26.55 8.906-35.33l255.1-223.1c11.25-9.89 27.81-10.58 39.87-1.799c12.09 8.781 16.5 24.76 10.59 38.5l-76.88 179.4l111.5-.0076c13.34 0 25.28 8.266 29.97 20.75C386.6 257.2 383.1 271.3 373.1 280.1z"/></svg>
											`
								break;
							case "mad":
								modeCode = `
											<!-- Fire / Flame -->
											<svg style="fill: #AC0D11" viewBox="0 0 384 512"><path d="M203.1 4.364c-6.179-5.822-16.06-5.818-22.24 .005C74.52 104.6 0 220.2 0 298C0 423.1 79 512 192 512s192-88.01 192-213.1C384 219.9 309 104.2 203.1 4.364zM192 448c-70.62 0-128-52.88-128-117.9c0-44.12 25.88-71.5 34.38-79.75c3.125-3.125 8.125-3.125 11.25 0C111.1 251.9 112 253.9 112 256v40C112 327 137 352 168 352C198.9 352 224 327 224 296C224 224 111.4 231.2 184.5 131.6C187.5 127.8 192 127.5 195.1 128.5c1.625 .5 5.375 2.25 5.375 6.75c0 33.63 25.12 54.1 51.63 77.63C285.5 241.5 320 271 320 330.1C320 395.1 262.6 448 192 448z"/></svg>
											`
								break;
						}
						$(".wrap__list").append(`
							<div class="wrap__elem ${ match.winner == user.id ? "wrap__elem_win" : "wrap__elem_lose"}">
								<div class="wrap__players">
									<div class="wrap__player">
										<div class="wrap__nickname">
											${matchPlayersUser.nick}
										</div>
										<div class="user__stat">
											<div class="user__wins">
												${matchPlayersUser.wins}
											</div>
											<div class="user__percent">
												${matchPlayersUser.winrate + "%"}
											</div>
											<div class="user__loses">
												${matchPlayersUser.loses}
											</div>
										</div>
									</div>
									<div class="wrap__versus">
										VS
									</div>
									<div class="wrap__player">
										<div class="wrap__nickname">
											${matchPlayersEnemy.nick}
										</div>
										<div class="user__stat">
											<div class="user__wins">
												${matchPlayersEnemy.wins}
											</div>
											<div class="user__percent">
												${matchPlayersEnemy.winrate + "%"}
											</div>
											<div class="user__loses">
												${matchPlayersEnemy.loses}
											</div>
										</div>
									</div>
								</div>
								<div class="wrap__statistic">
									<div class="wrap__detail-stat">
										<div class="wrap__names">
											<div class="wrap__player-name">
												${matchPlayersUser.nick}
											</div>
											<div class="wrap__player-name">
												${matchPlayersEnemy.nick}
											</div>
											<div class="wrap__overall">
												Total
											</div>
										</div>
										<div class="wrap__table">
											<div class="wrap__moves wrap__column">
												<div class="wrap__cell-name">Moves</div>
												<div class="wrap__cell">
													${matchPlayersUser.movesCount}
												</div>
												<div class="wrap__cell">
													${matchPlayersEnemy.movesCount}
												</div>
												<div class="wrap__cell">
													${match.movesCount}
												</div>
											</div>
											<div class="wrap__figures wrap__column">
												<div class="wrap__cell-name">Сaptures</div>
												<div class="wrap__cell">
													${matchPlayersUser.kills}
												</div>
												<div class="wrap__cell">
													${matchPlayersEnemy.kills}
												</div>
												<div class="wrap__cell">
													${match.kills}
												</div>
											</div>
												<div class="wrap__check wrap__column">
												<div class="wrap__cell-name">Checks</div>
												<div class="wrap__cell">
													${matchPlayersUser.checks}
												</div>
												<div class="wrap__cell">
													${matchPlayersEnemy.checks}
												</div>
												<div class="wrap__cell">
													${match.checks}
												</div>
											</div>
										</div>
									</div>
									<div class="wrap__time">
										<div class="d-flex">
											<div class="wrap__icon">
												<svg viewBox="0 0 512 512">
													<path d="M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256c141.4 0 256-114.6 256-256C512 114.6 397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM280 249.6V120C280 106.8 269.3 96 256 96S232 106.8 232 120V256c0 4.219 1.109 8.359 3.219 12l52 90.06c4.438 7.703 12.52 12 20.8 12c4.078 0 8.203-1.031 11.98-3.219c11.48-6.625 15.41-21.3 8.781-32.78L280 249.6z"/>
												</svg>
											</div>
											<div class="wrap__text">
												${gameMinimizedTime + (gameMinimizedTime.length < 3 ? "s" : "")}
											</div>
											<div class="wrap__mode">
												${modeCode}
											</div>
										</div>
										<div class="d-flex">
											<div class="wrap__icon">
												<svg viewBox="0 0 448 512">
													<path d="M384 64h-40V24c0-13.25-10.75-24-23.1-24S296 10.75 296 24V64h-144V24C152 10.75 141.3 0 128 0S104 10.75 104 24V64H64C28.65 64 0 92.65 0 128v320c0 35.35 28.65 64 64 64h320c35.35 0 64-28.65 64-64V128C448 92.65 419.3 64 384 64zM384 464H64c-8.822 0-16-7.176-16-16V192h352v256C400 456.8 392.8 464 384 464z"/>
												</svg>
											</div>
											<div class="wrap__text">
												${matchDateStart}
											</div>
										</div>
									</div>
								</div>
							</div>`
						)
					}
				}else {
					$(".wrap__list").html('<p class="online__text" style="color: #9199A4">У вас пока нет сыгранных матчей</p>')
				}
			}
		})
	}
}












//to create game code

//open game-menu
$('.wrap__random-play').click(()=>{
	addTextAlert("Режим пока недоступен");
});

$('.wrap__friend-play').click(()=>{
	addLobby()
});
//close game-menu
$('.game-menu__exit').click(()=>{
	$('.game-menu').parent().fadeOut(400);
	leaveLobby()
});



var modeItem = "";
var lobbyId = "";
var role = "";

//switch mode game-menu
$(".game-menu__elem").click(function(){
	if(role == "admin") {
		modeItem = $(this).attr("data-mode");
		switchLobbyMode(modeItem)
	}else {
		addTextAlert("Только админ лобби может изменять настройки игры!")
	}

});



function addLobby(friendId) {
	$.post('/addLobby',{

	}, function (data) {
		if(data.type == "successful") {
			checkSession();
			lobbyId = data.lobbyId;
			if(friendId != undefined) {
				console.log("sdas")
				$.post('/inviteFriend', {
						friendId: friendId,
						lobbyId: lobbyId
					},
					function (data) {
						if(data.type == "successful") {
							addTextAlert(data.message);
						}
					}
				)
			}
		}
	});
}

function leaveLobby() {
	$.post('/leaveLobby',{
		lobbyId: lobbyId
	}, function (data) {
		if(data.type == "successful") {
			lobbyId = ""
			addTextAlert(data.message)
		}
	});
}

function switchLobbyMode(modeItem) {
	if (lobbyId != "") {
		var mode = "";
		//защита от вмешательств в html
		switch (modeItem) {
			case "default":
				mode = "default";
				break;
			case "mild":
				mode = "mild";
				break;
			case "fast":
				mode = "fast";
				break;
			case "mad":
				mode = "mad";
				break;
		}
		if(mode != "") {
			$.post('/lobbyMode', {
				lobbyId: lobbyId,
				mode: mode
			}, function (data) {
				if (data.message == "successful") {
					checkLobby();
				}
			});
			checkLobby();
		}else {
			alert("NAN TOKEN LOOBYMODE")
		}
	}else {
		alert("NAN TOKEN LOOBYID")
	}
}

function checkLobby() {
	if(lobbyId != "") {
		$.post('/checkLobby', {
				lobbyId: lobbyId
			},
			function (data) {
				if(data.type == "successful") {
					var lobby = data.lobby
					$('.game-menu').parent().fadeIn();
					$(".game-menu__elem").css("border-color", "transparent");
					$(".game-menu__elem").removeClass("game-menu__elem_active");
					$(".game-menu__start-btn").css("display", "none");

					$('.game-menu__settings').children('[data-mode="'+lobby.mode+'"]').addClass("game-menu__elem_active");
					var modeColor = $('.game-menu__settings').children('[data-mode="'+lobby.mode+'"]').attr("data-mode-color");
					$('.game-menu__settings').children('[data-mode="'+lobby.mode+'"]').css("border-color", modeColor);

					$(".game-menu__nickname_left").html(lobby.admin.nick)
					if (lobby.guest != "") {
						$(".game-menu__nickname_right").html(lobby.guest.nick)
					}else {
						$(".game-menu__nickname_right").html("...")

					}

					role = lobby.role;
					if (role == "admin") {
						$(".game-menu__start-btn").css("display", "flex");
					}
				}else {
					addTextAlert(data.message)
				}
			}
		)
	}else {
		$('.game-menu').parent().fadeOut(400);
	}
}


function inviteFriend(friendId) {

		if (lobbyId == "") {
			addLobby(friendId);
		} else {
			if(role == "admin") {
				$.post('/inviteFriend', {
						friendId: friendId,
						lobbyId: lobbyId
					},
					function (data) {
						if (data.type == "successful") {
							addTextAlert(data.message);
						}
					}
				)
			}else {
				addTextAlert("Только админ лобби может приглашать друзей")
			}
		}

}

function joinLobby(id) {
	console.log(id)
	$.post('/joinLobby', {
		lobbyId: id
	}, function (data) {
			if(data.type == "successful") {
				checkSession();
				checkLobby();
			}
			addTextAlert(data.message);
		}
	)
}

$(".game-menu__start-btn").click(function () {
	if (lobbyId != "") {
		if (role == "admin") {
			createGame(lobbyId);
		}else {
			addTextAlert("Только админ может запустить игру")
		}
	}else {
		alert("NAN LOBBY TOKEN");
	}
});

function createGame(lobbyId) {
	$.post('/createGame',
		{
			lobbyId: lobbyId
		}, function (data) {
			if (data.type == "successful") {

			}
			addTextAlert( data.message)
		});
}





$(".version").click(()=>{
	$(".control").parent("div").fadeIn(400)
	$(document).mouseup( function(e){ // событие клика по веб-документу

		var div = $( ".control" ); // тут указываем ID элемента
		if ( !div.is(e.target) // если клик был не по нашему блоку
			&& div.has(e.target).length === 0 )
		{ // и не по его дочерним элементам
			$('.control').parent().fadeOut(400);

		}
	});
});

$(".control__statistic").fadeOut(0)

$(".version-control__btn_updates").click(()=>{
	$(".control__signpost-line").css("margin-left","0px");
	$(".control__items").fadeIn(400)
	$(".control__statistic").fadeOut(200)
});

$(".control__btn_statistic").click(()=>{
	$.post('/siteStatistic', {},
	function (data) {
		if(data.type == "successful") {
			$(".control__signpost-line").css("margin-left","50%");
			$(".control__statistic").fadeIn(400)
			$(".control__items").fadeOut(200)

			var statisticObj = data.statisticObj

			$(".control__visits").children("span").html(statisticObj.visits)
			$(".control__users").children("span").html(statisticObj.usersCount)
			$(".control__matches").children("span").html(statisticObj.matchesCount)
			$(".control__online").children("span").html(statisticObj.onlineUsersCount)

		}else {
			addTextAlert(data.message)
		}
	})
});




})//JQuery close func


var alertCount = 0;
function addTextAlert(text) {
	alertCount++;
	document.querySelector('.alerts').innerHTML += `
		<div class="alert__item animate__animated animate__fadeInUp" id="${"alert"+alertCount}">
			<img class="alerts__icon" src="img/icons/alert.png">
			<p class="alerts__text">
				${text}
			</p>
			<div class="alerts__close" onclick="delTextAlert(${alertCount});">
				<img src="img/icons/cross.png">
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



function delInviteTime(el) {
	setTimeout(()=>{
		delInvite(el)
	},7000)
}

function delInvite(el) {
	$(`${"#invite"+el}`).addClass("animate__fadeOutRight")
	setTimeout(()=>{
		$(`${"#invite"+el}`).remove()
	},600)
}





function myFriends() {
	$('.friends__signpost-line').css("margin-left", "0px")
	$('.friends__list').html("<div class=\"lds-roller spinner\" ><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>");
	$.post('/myFriends',
		{},
		function(data) {
			if (data.friends != "") {
				$('.friends__list').html("");
				for (var player of data.friends) {
					$('.friends__list').append(`
					<div class="friends__player animate__animated animate__fadeIn" data-friend-id="${player.id}">
						<div class="friends__logo">
							<i class="icon-knight"></i>
							<div class="friends__status ${player.online ? 'friends__status_on' : 'friends__status_off'}"></div>
						</div>
						<div class="friends__nickname">${player.nick}</div>
						<div class="friends__stat">
							<div class="friends__wins user__wins">
								${player.wins}
							</div>
							<div class="friends__percent user__percent">
								${player.winrate+"%"}
							</div>
							<div class="friends__loses user__loses">
								${player.loses}
							</div>
						</div> 
							<div class="friends__remove friends__icon" onclick="delFriends(${player.id})">
								<!-- User minus SVG (remove)-->
								<svg viewBox="0 0 640 512"><path d="M224 256c70.7 0 128-57.31 128-128S294.7 0 224 0C153.3 0 96 57.31 96 128S153.3 256 224 256zM224 32c52.94 0 96 43.06 96 96c0 52.93-43.06 96-96 96S128 180.9 128 128C128 75.06 171.1 32 224 32zM274.7 304H173.3C77.61 304 0 381.6 0 477.3C0 496.5 15.52 512 34.66 512h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304zM413.3 480H34.66C33.2 480 32 478.8 32 477.3C32 399.4 95.4 336 173.3 336H274.7C352.6 336 416 399.4 416 477.3C416 478.8 414.8 480 413.3 480zM624 208h-160C455.2 208 448 215.2 448 224s7.156 16 16 16h160C632.8 240 640 232.8 640 224S632.8 208 624 208z"/></svg>
							</div>
						</div>`);
				}
			}else {
				$('.friends__list').html(`<p class="friends__text">Ваш список друзей пока пуст</p>`)
			}
		})
}



function addFriend(friendId) {
	$.post('/addFriend',
	{
		friendId: friendId
	}, function(data) {
		if(data.type == "successful") {
			$('.friends__signpost-line').css("margin-left", "0px")
			myFriends()
		}
		addTextAlert(data.message)
	});
}

function delFriends(friendId) {
	addTextAlert("К сожалению функция удаления пока не доступна")
}








