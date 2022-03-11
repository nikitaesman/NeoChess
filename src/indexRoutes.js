import moment from "moment-timezone";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import * as Config from "./config.js";
import {emailConfirm, emailRecovery} from "./confirm_mail.js";
import session from 'express-session'
import {resolveContent} from "nodemailer/lib/shared/index.js";


export function indexRoutes(app,connection,lobbys,games,str_rand) {
    app.post('/auth/user', function(req, res){
        if(req.session.user) {
            const queryOnline = `UPDATE users SET last_online = '${moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss")}' WHERE id = ${req.session.user.id}`

            connection.query(queryOnline, function(err, rows) {
                if(err) {
                    console.log(err)
                    return
                }
            })

            const query = `SELECT * FROM users WHERE id = '${req.session.user.id}'`
            var tmpObj;
            connection.query(query, function(err, rows) {
                if(err) {
                    console.log(err)
                    return
                }
                var user = rows[0]

                if (req.session.user.sessionId != user.sessionId) {
                    req.session.destroy()
                    res.status(200).json({type:"error", message: "Сессия устарела"})
                    return
                }

                var task = ""
                if (user.task != "") {
                    task = JSON.parse(user.task)
                }

                tmpObj = {
                    id: user.id,
                    nick: user.nick,
                    email: user.email,
                    active: user.active,
                    wins: user.wins,
                    loses: user.loses,
                    winrate: user.winrate,
                    task: task
                }

                var friendsArr = JSON.parse(user.friends)

                if(friendsArr.length != 0) {
                    var friendsOnline = []
                    var nowDate = new Date(moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss"))
                    var friendsCount = friendsArr.length

                    for (var friendId of friendsArr) {
                        var queryFriend = `SELECT * FROM users WHERE id = '${friendId}';`

                        connection.query(queryFriend, function(error, results) {

                            friendsCount--;
                            if(error) {
                                console.log(error)
                                return
                            }

                            var friendLastOnline = new Date(results[0].last_online)

                            if (nowDate-friendLastOnline < 300000) {
                                friendsOnline.push({
                                    id: results[0].id,
                                    nick: results[0].nick,
                                    wins: results[0].wins,
                                    loses: results[0].loses,
                                    winrate: results[0].winrate
                                })
                            }
                            if(friendsCount == 0) {
                                res.status(200).json({type:"successful", user: tmpObj, friendsOnline: friendsOnline})
                            }
                        })
                    }
                }else {
                    res.status(200).json({type:"successful", user: tmpObj, friendsOnline: ""})
                }
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    });



    app.post('/myFriends', function(req, res){
        if(req.session.user) {
            var queryUser = `SELECT * FROM users WHERE id = '${req.session.user.id}';`

            connection.query(queryUser, function(err, rows) {
                if (err) {
                    console.log(err)
                    return
                }
                var friendsArr = JSON.parse(rows[0].friends)
                if(friendsArr.length != 0) {

                    var nowDate = new Date()
                    var friendsCount = friendsArr.length
                    var friends = []

                    for (var friendId of friendsArr) {
                        var queryFriend = `SELECT * FROM users WHERE id = '${friendId}';`

                        connection.query(queryFriend, function (error, results) {

                            friendsCount--;
                            if (error) {
                                console.log(error)
                                return
                            }

                            var friendLastOnline = new Date(results[0].last_online)
                            var onlineFriends = false
                            if (nowDate - friendLastOnline < 300000) {
                                onlineFriends = true
                            }

                            friends.push({
                                id: results[0].id,
                                nick: results[0].nick,
                                wins: results[0].wins,
                                loses: results[0].loses,
                                winrate: results[0].winrate,
                                online: onlineFriends
                            })
                            if (friendsCount == 0) {
                                res.status(200).json({type: "successful", friends: friends})
                            }
                        })
                    }
                }else {
                    res.status(200).json({type: "successful", friends: ""})
                }
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    });

    app.post('/addFriend', function(req, res) {
        if (req.session.user) {
            var data = req.body
            data.friendId = parseInt(data.friendId)

            const queryUser = `SELECT * FROM users WHERE id = '${req.session.user.id}';`

            connection.query(queryUser, function (err, rows) {
                if (err) {
                    console.log(err)
                    return
                }
                var user = rows[0]

                const query = `SELECT * FROM users WHERE id = '${data.friendId}';`

                connection.query(query, function (err, rows) {
                    if (err) {
                        console.log(err)
                        return
                    }
                    var friendsRequestsArr = JSON.parse(rows[0].requests)
                    var userRequestsArr = JSON.parse(user.requests)

                    //отрабавывание функции если друг уже отправил нам запрос
                    if(userRequestsArr.includes(data.friendId)) {

                        //обновляем заявки пользователя
                        var indexFriend = userRequestsArr.indexOf(data.friendId)
                        userRequestsArr.splice(indexFriend, 1)
                        var userRequestsStr = JSON.stringify(userRequestsArr)

                        const queryUpdateUser = `UPDATE users SET requests = '${userRequestsStr}' WHERE id = '${user.id}';`
                        connection.query(queryUpdateUser, function (error, result) {
                            if (error) {
                                console.log(error)
                                return
                            }
                        })

                        var friendFriendsArr = JSON.parse(rows[0].friends)
                        var userFriendsArr = JSON.parse(user.friends)

                        //обновляем друзей пользователя
                        userFriendsArr.push(data.friendId)
                        var userFriendsStr = JSON.stringify(userFriendsArr)

                        const queryUpdateUser2 = `UPDATE users SET friends = '${userFriendsStr}' WHERE id = '${user.id}';`
                        connection.query(queryUpdateUser2, function (error, result) {
                            if (error) {
                                console.log(error)
                                return
                            }
                        })

                        //обновляем друзей друга
                        friendFriendsArr.push(user.id)
                        var friendFriendsStr = JSON.stringify(friendFriendsArr)

                        const queryUpdateFriend2 = `UPDATE users SET friends = '${friendFriendsStr}' WHERE id = '${data.friendId}';`
                        connection.query(queryUpdateFriend2, function (error, result) {
                            if (error) {
                                console.log(error)
                                return
                            }
                        })

                        res.status(200).json({type:"successful", message: `Пользователь ${rows[0].nick} добавлен в друзья`})
                        return;
                    }
                    //отрабавывание функции если если запрос уже был отправлен

                    if(friendsRequestsArr.includes(req.session.user.id)) {
                        res.status(200).json({type:"error", message: `Запрос уже отправлен`})
                        return;
                    }
                    friendsRequestsArr.push(req.session.user.id)
                    var friendsRequestsStr = JSON.stringify(friendsRequestsArr)

                    const queryUpdate = `UPDATE users SET requests = '${friendsRequestsStr}' WHERE id = '${data.friendId}';`

                    connection.query(queryUpdate, function (error, result) {
                        if (error) {
                            console.log(error)
                            return
                        }
                        var friendInvitesArr =  JSON.parse(rows[0].invites)
                        friendInvitesArr.push({
                            type: "addFriend",
                            friendId: req.session.user.id
                        })
                        var friendInvitesStr = JSON.stringify(friendInvitesArr)
                        const queryInvite = `UPDATE users SET invites = '${friendInvitesStr}' WHERE id = '${data.friendId}';`

                        connection.query(queryInvite, function (error, result) {
                            if (error) {
                                console.log(error)
                                return
                            }
                            res.status(200).json({type:"good", message: `Запрос на добовление в друзья к ${rows[0].nick} отправлен`})
                        })
                    })
                })
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }

    })

    app.post('/myRequests', function(req, res){
        if(req.session.user) {
            var queryUser = `SELECT * FROM users WHERE id = '${req.session.user.id}';`

            connection.query(queryUser, function(err, rows) {
                var user = rows[0]
                if(user.requests != "[]") {
                    var requestsArr = JSON.parse(user.requests)
                    var nowDate = new Date()
                    var requestsCount = requestsArr.length
                    var requests = []

                    for (var requestId of requestsArr) {
                        var queryFriend = `SELECT * FROM users WHERE id = '${requestId}';`

                        connection.query(queryFriend, function (error, results) {

                            requestsCount--;
                            if (error) {
                                console.log(error)
                                return
                            }

                            var friendLastOnline = new Date(results[0].last_online)
                            var onlineFriends = false
                            if (nowDate - friendLastOnline < 300000) {
                                onlineFriends = true
                            }

                            requests.push({
                                id: results[0].id,
                                nick: results[0].nick,
                                wins: results[0].wins,
                                loses: results[0].loses,
                                winrate: results[0].winrate,
                                online: onlineFriends
                            })
                            if (requestsCount == 0) {
                                res.status(200).json({type: "successful", friends: requests})
                            }
                        })
                    }
                }else {
                    res.status(200).json({type: "successful", friends: ""})
                }
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })

    app.post('/invites', function(req, res) {
        if(req.session.user) {
            var data = req.body
            const queryUser = `SELECT * FROM users WHERE id = '${req.session.user.id}';`


            connection.query(queryUser, function(err, rows) {
                if (err) {
                    console.log(err)
                    return
                }
                var user = rows[0]
                var invites = JSON.parse(user.invites)
                if(invites.length != 0) {
                    var clientInvites = []
                    for (var invite of invites) {
                        if (invite.type === "addFriend") {
                            const queryFriend = `SELECT * FROM users WHERE id = '${invite.friendId}';`

                            connection.query(queryFriend, function(error, result) {
                                if(error) {
                                    console.log(error)
                                    return
                                }
                                var friend = result[0]
                                clientInvites.push({
                                    type: "addFriend",
                                    id: friend.id,
                                    nick: friend.nick,
                                    wins: friend.wins,
                                    winrate: friend.winrate,
                                    loses: friend.loses
                                })
                                if(invites.length === clientInvites.length) {
                                    const queryUpdate = `UPDATE users SET invites = '[]' WHERE id = ${user.id}`
                                    connection.query(queryUpdate, function(error) {
                                        if (error) {
                                            console.log(error)
                                            return
                                        }
                                        res.status(200).json({type:"successful", invites: clientInvites})
                                    })
                                }
                            })
                        }
                        if(invite.type === "game") {
                            const queryFriend = `SELECT * FROM users WHERE id = '${invite.friendId}';`

                            connection.query(queryFriend, function(error, result) {
                                if(error) {
                                    console.log(error)
                                    return
                                }
                                var friend = result[0]

                                if(lobbys[invite.lobbyId] == undefined) {
                                    clientInvites.push({
                                        type: "byte"
                                    })
                                }else {
                                    clientInvites.push({
                                        type: "game",
                                        id: friend.id,
                                        nick: friend.nick,
                                        wins: friend.wins,
                                        winrate: friend.winrate,
                                        loses: friend.loses,
                                        lobby: invite.lobbyId,
                                        mode: lobbys[invite.lobbyId].mode
                                    })
                                }
                                if(invites.length === clientInvites.length) {
                                    const queryUpdate = `UPDATE users SET invites = '[]' WHERE id = ${user.id}`
                                    connection.query(queryUpdate, function(error) {
                                        if (error) {
                                            console.log(error)
                                            return
                                        }
                                        res.status(200).json({type:"successful", invites: clientInvites})
                                    })
                                }
                            })
                        }
                    }
                }else {
                    res.status(200).json({type:"neutral", message: "Нет уведомлений"})
                }
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })


    app.post('/searchFriends', function(req, res){
        if(req.session.user) {
            var data = req.body

            const query = `SELECT id FROM users WHERE UPPER(nick) LIKE UPPER('${data.text+"%"}');`


            connection.query(query, function(err, rows) {
                if(err) {
                    console.log(err)
                    return
                }
                if(rows.length != 0) {
                    var queryUser = `SELECT friends FROM users WHERE id = '${req.session.user.id}';`;
                    var friendsArr = [];

                    connection.query(queryUser, function(error, friendsResult) {
                        if(error) {
                            console.log(error)
                            return
                        }
                        friendsArr = JSON.parse(friendsResult[0].friends)

                        var tempArr = [];
                        var nowDate = new Date();
                        for (var row of rows) {
                            var query2 = `SELECT * FROM users WHERE id = '${row.id}';`

                            connection.query(query2, function(error, results) {
                                if(error) {
                                    console.log(error)
                                    return
                                }

                                var friendLastOnline = new Date(results[0].last_online)
                                var onlineFiend = false
                                if (nowDate-friendLastOnline < 300000) {
                                    onlineFiend = true
                                }
                                tempArr.push({
                                    id: results[0].id,
                                    nick: results[0].nick,
                                    wins: results[0].wins,
                                    loses: results[0].loses,
                                    winrate: results[0].winrate,
                                    friend: friendsArr.includes(results[0].id),
                                    online: onlineFiend
                                })
                                if(tempArr.length == rows.length) {
                                    return res.status(200).json({found: true, players: tempArr})
                                }
                            })
                        }
                    })
                }else {
                    res.status(200).json({found: false})
                }
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    });




//авторизация
    app.post('/auth/log', function(req, res){
        var data = req.body



        const query = `SELECT * FROM users WHERE email = '${data.email}'`
        // Use the connection
        connection.query(query, function(err, rows) {
            if(err) {
                console.log(err)
                return
            }

            if (rows.length != 0) {

                var hashAnswer = bcrypt.compareSync(data.password, rows[0].password);


                if (hashAnswer) {
                    if(rows[0].active == 1) {
                        var tempUser = {
                            id: rows[0].id,
                            nick: rows[0].nick,
                            sessionId: str_rand(7)
                        }



                        const querySessionId = `UPDATE users SET SessionId = '${tempUser.sessionId}' WHERE id = ${tempUser.id}`

                        connection.query(querySessionId, (err, result)=>{
                            if (err) {
                                console.log(err)
                                return
                            }

                            req.session.user = tempUser
                            req.session.save()

                            //User is valid
                            res.status(200).json({type: "successful", message: `Пользователь ${data.email} авторизирован`})
                        })

                    }else {
                        res.status(200).json({type: "error", message: `Для входа в аккаунт подтвердите электронную почту`})
                    }
                }else {
                    //User not valid
                    res.status(200).json({type: "error", message: `Пароль для ${data.email} введён не верно`})
                }
            }else {
                //User not find
                res.status(200).json({type: "error", message: `Пользователя с почтой ${data.email} не существует`})
            }
        });

    });
//logout
    app.post('/auth/out', function(req, res){
        if(req.session.user) {
            req.session.destroy()
            res.status(200).json({type:"successful", message: `Вы вышли из аккаунта`})
        }else {
            res.status(200).json({type:"error"})
        }
    });

    app.post('/auth/changePass', (req, res)=>{
        var data = req.body

        if (data.hash != undefined && data.password != undefined) {
            const queryIsHash = `SELECT * FROM users WHERE hash = '${data.hash}'`

            connection.query(queryIsHash, function (err, rows) {
                if (err) {
                    console.log(err)
                    return
                }
                if (rows.length != 0) {
                    var hashPassword = bcrypt.hashSync(data.password, 7)

                    const queryChangePass = `UPDATE users SET password = '${hashPassword}', hash = "" WHERE hash = '${data.hash}'`

                    connection.query(queryChangePass, function (err, rows) {
                        if (err) {
                            console.log(err)
                            return
                        }
                        res.status(200).json({type: "successful", message: `Пароль успешно изменён`})
                    })


                } else {
                    res.status(200).json({type: "error", message: `Hash устарел`})
                }
            })
        }else {
            res.status(200).json({type: "error", message: `Hash не найден`})
        }
    })

//recovery password
    app.post('/auth/recovery', function(req, res){
        var data = req.body
        const query = `SELECT * FROM users WHERE email = '${data.email}'`
        // Use the connection
        connection.query(query, function(err, rows) {
            if (err) {
                console.log(err)
                return
            }


            if (rows.length != 0) {
                var user = rows[0]
                if (user.active == 1) {
                    var recoveryHash = str_rand(10)

                    const queryRecovery = `UPDATE users SET hash = '${recoveryHash}' WHERE id = '${user.id}'`

                    connection.query(queryRecovery, function (err, rows) {
                        if (err) {
                            console.log(err)
                            return
                        }
                        res.status(200).json({
                            type: "successful",
                            message: `Письмо со ссылкой на восстановление пароля было отправленноо на ${data.email}`
                        })
                        sendRecoveryEmail(user.nick, recoveryHash, data.email)
                    })
                }else {
                    res.status(200).json({type:"error", message: `Для восстановления пароля сначала подтвердите электронную почту`})
                }
            }else {
                res.status(200).json({type:"error", message: `Акаунта с почтой ${data.email} не существует`})
            }

        })
    });



    async function sendConfirmEmail(nick,hash,email) {
        let testEmailAccount = await nodemailer.createTestAccount()

        let transporter = nodemailer.createTransport({
            host: Config.__mailer.host,
            port: Config.__mailer.port,
            secure: Config.__mailer.secure,
            auth: {
                user: Config.__mailer.user,
                pass: Config.__mailer.pass,
            }
        })
//
        let result = await transporter.sendMail({
            from: `"NeoChess" ${Config.__mailer.user}`,
            to: email,
            subject: 'Message from NeoChess',
            text: 'Для завершения процесса регистрации, пожалуйста, пройдите по ссылке',
            html: emailConfirm(nick,hash)
        })

        console.log(result)
    }

    async function sendRecoveryEmail(nick,hash,email) {
        let testEmailAccount = await nodemailer.createTestAccount()

        let transporter = nodemailer.createTransport({
            host: Config.__mailer.host,
            port: Config.__mailer.port,
            secure: Config.__mailer.secure,
            auth: {
                user: Config.__mailer.user,
                pass: Config.__mailer.pass,
            }
        })
//
        let result = await transporter.sendMail({
            from: `"NeoChess" ${Config.__mailer.user}`,
            to: email,
            subject: 'Message from NeoChess',
            text: 'Для восстановления пароля, пожалуйста, пройдите по ссылке',
            html: emailRecovery(nick,hash)
        })

        console.log(result)
    }

//регистрация
    app.post('/auth/reg', function(req, res){
        var data = req.body

        var query = `SELECT * FROM users WHERE email = '${data.email}'`
        // Use the connection
        connection.query(query, function(err, rows) {
            if(err) {
                console.log(err)
                return
            }

            if (rows.length != 0) {
                //User is valid
                res.status(200).json({type:"error", message: `Пользователь с почтой ${data.email} уже зарегистрирован`})
            }else {
                query = `SELECT * FROM users WHERE nick = '${data.nick}'`

                connection.query(query, function(err, rows) {
                    if(err) {
                        console.log(err)
                        return
                    }

                    if (rows.length != 0) {
                        //User is valid
                        res.status(200).json({type:"error",message: `Пользователь с ником ${data.nick} уже зарегистрирован`})
                    }else {
                        var hashPassword = bcrypt.hashSync(data.password,7)

                        var tmpHash = str_rand(10)

                        query = `INSERT INTO users (email, nick, password, hash) VALUES ('${data.email}','${data.nick}','${hashPassword}','${tmpHash}')`

                        connection.query(query, function(err, rows) {
                            if(err) {
                                console.log(err)
                                return
                            }
                            res.status(200).json({type:"successful",message: `Пользователь успешно зарегистрирован`})
                            sendConfirmEmail(data.nick, tmpHash, data.email)
                        });
                    }
                });
            }
        });

    });

    app.post('/matchesHistory', function(req, res){
        if(req.session.user) {
            const queryUser = `SELECT * FROM users WHERE id = ${req.session.user.id}`

            connection.query(queryUser, (err, result)=>{
                if(err) {
                    console.log(err)
                    return
                }
                var user = result[0]

                var matchesArr =  JSON.parse(user.matches)

                if (matchesArr.length > 0) {
                    matchesArr.reverse()
                    var clientMatchesArr = []


                    var matchCount = 0

                    selectMatchFromDB ()

                    function selectMatchFromDB () {
                        var queryMatch = `SELECT * FROM matches WHERE id = ${matchesArr[matchCount]}`

                        connection.query(queryMatch, (err, rows)=>{
                            if(err) {
                                console.log(err)
                                return
                            }

                            var matchPlayersArr = JSON.parse(rows[0].players)

                            const queryPlayer = `SELECT * FROM users WHERE id = ${matchPlayersArr[0].id}`
                            connection.query(queryPlayer, (err, playerResult)=>{
                                if(err) {
                                    console.log(err)
                                    return
                                }
                                var playerDB = playerResult[0]
                                matchPlayersArr[0].wins = playerDB.wins
                                matchPlayersArr[0].winrate = playerDB.winrate
                                matchPlayersArr[0].loses = playerDB.loses

                                const queryPlayer = `SELECT * FROM users WHERE id = ${matchPlayersArr[1].id}`
                                connection.query(queryPlayer, (err, playerResult)=>{
                                    if(err) {
                                        console.log(err)
                                        return
                                    }
                                    var playerDB = playerResult[0]
                                    matchPlayersArr[1].wins = playerDB.wins
                                    matchPlayersArr[1].winrate = playerDB.winrate
                                    matchPlayersArr[1].loses = playerDB.loses

                                    rows[0].players = matchPlayersArr
                                    clientMatchesArr.push(rows[0])

                                    if (matchCount == matchesArr.length-1 || matchCount == 10) {
                                        res.status(200).json({type: "successful", matchesArr: clientMatchesArr})
                                    }else {
                                        matchCount++
                                        selectMatchFromDB();
                                    }
                                })
                            })
                        })
                    }
                }else {
                    res.status(200).json({type: "successful", matchesArr: []})
                }
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })


    app.post('/addLobby', function(req, res){
        if(req.session.user) {
            var data = req.body

            var lobbyId = str_rand(7)
            lobbys[lobbyId] = {
                id: lobbyId,
                admin: req.session.user.id,
                guest: "",
                mode: "default"
            }
            var task = {
                type: "lobby",
                id: lobbyId
            }

            var taskStr = JSON.stringify(task)

            var queryLobby = `UPDATE users SET task = '${taskStr}' WHERE id = ${req.session.user.id}`

            connection.query(queryLobby, function(err) {
                if (err) {
                    console.log(err)
                    return
                }
                res.status(200).json({type:"successful", lobbyId: lobbyId})
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })

    app.post('/leaveLobby', function(req, res){
        if(req.session.user) {
            var data = req.body

            var queryLobby = `UPDATE users SET task = "" WHERE id = ${req.session.user.id}`

            connection.query(queryLobby, function(err) {
                if (err) {
                    console.log(err)
                    return
                }
                if(req.session.user.id == lobbys[data.lobbyId].admin) {

                    if (lobbys[data.lobbyId].guest != "") {
                        var queryLobbyFriend = `UPDATE users SET task = "" WHERE id = ${lobbys[data.lobbyId].guest}`

                        connection.query(queryLobbyFriend, function(err) {
                            if (err) {
                                console.log(err)
                                return
                            }
                            delete lobbys[data.lobbyId]
                            res.status(200).json({type:"successful", message: "Лобби удаленно"})
                            return;
                        })
                    }else {
                        delete lobbys[data.lobbyId]
                        res.status(200).json({type:"successful", message: "Лобби удаленно"})
                        return;
                    }
                }
                if(req.session.user.id == lobbys[data.lobbyId].guest) {
                    lobbys[data.lobbyId].guest = ""
                    res.status(200).json({type:"successful", message: "Вы вышли из лобби"})
                    return;
                }



            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })

    app.post('/lobbyMode', function(req, res){
        if(req.session.user) {
            var data = req.body

            var lobbyId = data.lobbyId
            lobbys[lobbyId].mode = data.mode
            res.status(200).json({type:"successful", lobbyId: lobbyId})
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })


    app.post('/inviteFriend', function(req, res){
        if(req.session.user) {
            var data = req.body

            const friendQuery = `SELECT * FROM users WHERE id = ${data.friendId}`

            connection.query(friendQuery, function (error, result) {
                if (error) {
                    console.log(error)
                    return
                }
                var friend = result[0]
                var task = ""
                if (friend.task != "") {
                    task = JSON.parse(friend.task)
                }

                if(task != "") {
                    if (task.type == "lobby") {
                        res.status(200).json({
                            type: "successful",
                            message: `Игрок ${friend.nick} сейчас в другом лобби`
                        })
                    }else {
                        res.status(200).json({
                            type: "successful",
                            message: `Игрок ${friend.nick} сейчас в игре`
                        })
                    }
                    return
                }

                let friendInvitesArr = JSON.parse(friend.invites)

                friendInvitesArr.push({
                    type: "game",
                    friendId: req.session.user.id,
                    lobbyId: data.lobbyId
                })
                var friendInvitesStr = JSON.stringify(friendInvitesArr)
                const queryInvite = `UPDATE users SET invites = '${friendInvitesStr}' WHERE id = '${data.friendId}';`

                connection.query(queryInvite, function (error, result) {
                    if (error) {
                        console.log(error)
                        return
                    }
                    res.status(200).json({
                        type: "successful",
                        message: `Приглашение в игру игроку ${friend.nick} отправленно`
                    })
                })
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })


    app.post('/joinLobby', function(req, res){
        if(req.session.user) {
            var data = req.body
            var lobbyId = data.lobbyId

            if (lobbys[lobbyId] != undefined) {
                if (lobbys[lobbyId].guest == "") {
                    lobbys[lobbyId].guest = req.session.user.id

                    var task = {
                        type: "lobby",
                        id: lobbyId
                    }

                    var taskStr = JSON.stringify(task)

                    var queryLobby = `UPDATE users SET task = '${taskStr}' WHERE id = ${req.session.user.id}`

                    connection.query(queryLobby, function (err) {
                        if (err) {
                            console.log(err)
                            return
                        }
                        res.status(200).json({
                            type: "successful",
                            message: "Вы успешно подключились к лобби",
                            lobbyId: lobbyId
                        })
                    })
                } else {
                    res.status(200).json({type: "error", message: "Лобби переполненно"})
                }
            }else {
                res.status(200).json({type: "error", message: "Лобби было удаленно"})
            }


        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })


    app.post('/checkLobby', function(req, res){
        if(req.session.user) {
            var data = req.body
            var lobbyId = data.lobbyId

            if(lobbys[lobbyId] == undefined) {
                res.status(200).json({type:"error", message: "Лобби было удалено"})
                return
            }

            var queryUser = `SELECT * FROM users WHERE id = ${req.session.user.id}`

            connection.query(queryUser, function(err, rows) {
                if (err) {
                    console.log(err)
                    return
                }
                var user = rows[0]
                if(req.session.user.id == lobbys[lobbyId].admin) {

                    var clientLobby = {
                        id: lobbyId,
                        role: "admin",
                        admin: {
                            id: user.id,
                            nick: user.nick,
                            wins: user.wins,
                            loses: user.loses,
                            winrate: user.winrate
                        },
                        guest: "",
                        mode: lobbys[lobbyId].mode
                    }
                    if (lobbys[lobbyId].guest != "") {
                        var queryFriend = `SELECT * FROM users WHERE id = ${lobbys[lobbyId].guest}`

                        connection.query(queryFriend, function(error, rows) {
                            if (error) {
                                console.log(error)
                                return
                            }
                            var friend = rows[0]

                            clientLobby.guest = {
                                id: friend.id,
                                nick: friend.nick,
                                wins: friend.wins,
                                loses: friend.loses,
                                winrate: friend.winrate
                            }
                            res.status(200).json({type:"successful", lobby: clientLobby})
                        })
                    }else {
                        res.status(200).json({type:"successful", lobby: clientLobby})
                    }
                }else if(req.session.user.id == lobbys[lobbyId].guest) {
                    var queryFriend = `SELECT * FROM users WHERE id = ${lobbys[lobbyId].admin}`

                    connection.query(queryFriend, function(error, rows) {
                        if (error) {
                            console.log(error)
                            return
                        }
                        var friend = rows[0]

                        var clientLobby = {
                            id: lobbyId,
                            role: "guest",
                            admin: {
                                id: friend.id,
                                nick: friend.nick,
                                wins: friend.wins,
                                loses: friend.loses,
                                winrate: friend.winrate
                            },
                            guest: {
                                id: user.id,
                                nick: user.nick,
                                wins: user.wins,
                                loses: user.loses,
                                winrate: user.winrate
                            },
                            mode: lobbys[lobbyId].mode
                        }
                        res.status(200).json({type:"successful", lobby: clientLobby})
                    })
                }else {
                    res.status(200).json({type:"error", message: "У вас нет доступа к лобби"})
                }
            })
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })


    app.post('/siteStatistic', function(req, res){
        if(req.session.user) {
            const queryRegUsers = `SELECT COUNT('id') AS usersCount FROM users`

            connection.query(queryRegUsers, (err, result)=>{
                if (err) {
                    console.log(err)
                    return
                }
                var usersCount = result[0].usersCount

                const queryRegUsers = `SELECT COUNT('id') AS matchesCount FROM matches`

                connection.query(queryRegUsers, (err, result)=> {
                    if (err) {
                        console.log(err)
                        return
                    }
                    var matchesCount = result[0].matchesCount


                    let lastOnlineMayDate = new Date();
                    let m = lastOnlineMayDate.setMinutes(lastOnlineMayDate.getMinutes() - 5)
                    let lastOnlineMayStr = moment(lastOnlineMayDate).tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss")


                    const onlineUsersQuery = `SELECT COUNT('id') AS onlineUsersCount FROM users WHERE last_online >= '${lastOnlineMayStr}';`

                    connection.query(onlineUsersQuery, (err, result)=> {
                        if (err) {
                            console.log(err)
                            return
                        }

                        var onlineUsersCount = result[0].onlineUsersCount

                        const visitsQuery = `SELECT * FROM statistic WHERE id = '1';`

                        connection.query(visitsQuery, (err, result)=> {
                            if (err) {
                                console.log(err)
                                return
                            }

                            var visits = result[0].visits

                            var statisticObj = {
                                usersCount: usersCount,
                                matchesCount: matchesCount,
                                onlineUsersCount: onlineUsersCount,
                                visits: visits
                            }


                            res.status(200).json({type: "successful", statisticObj: statisticObj})
                        })
                    })
                })
            })
        }else {
            res.status(200).json({type:"error", message: "Статистика доступна только авторизированным пользователям"})
        }
    })

    app.post('/siteStatistic/visit', function(req, res){
        const visitsQuery = `UPDATE statistic SET visits = visits + 1`
        connection.query(visitsQuery, (err, result)=>{
            if(err) {
                console.log(err)
                return
            }
            res.status(200).send("Визит добавлен")
        })
    })
}