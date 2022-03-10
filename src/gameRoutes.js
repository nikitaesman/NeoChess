import moment from 'moment-timezone'
moment.locale('ru')

export function  gameRoutes(app,connection,lobbys,games,gamesLoop,str_rand)  {
    app.post('/createGame', function(req, res){
        if(req.session.user) {
            var data = req.body
            var lobbyId = data.lobbyId
            if (lobbys[lobbyId] != undefined) {
                if (lobbys[lobbyId].guest != "") {
                    var queryUser = `SELECT * FROM users WHERE id = ${req.session.user.id}`

                    connection.query(queryUser, function (err, rows) {
                        if (err) {
                            console.log(err)
                            return
                        }
                        var user = rows[0]

                        var queryFriend = `SELECT * FROM users WHERE id = ${lobbys[lobbyId].guest}`

                        connection.query(queryFriend, function (err, rows) {
                            if (err) {
                                console.log(err)
                                return
                            }
                            var friend = rows[0]

                            var gameId = str_rand(7)

                            var boardArr = board.concat()

                            var figId = 0
                            var adminKingCord
                            var guestKingCord
                            for (var figure of figures) {
                                figId++
                                figure.id = figId

                                boardArr[figure.y][figure.x] = figure
                                if (figure.chessmen == "king") {
                                    if (figure.color == "white") {
                                        adminKingCord = {
                                            x: figure.x,
                                            y: figure.y,
                                        }
                                    }else {
                                        guestKingCord = {
                                            x: figure.x,
                                            y: figure.y,
                                        }
                                    }
                                }
                            }




                            function getTimer(gameId) {
                                gamesLoop[gameId] = setInterval(()=>{
                                    games[gameId].timerCount++

                                    if(games[gameId].turnColor == "white") {
                                        games[gameId].players[0].timeMoves++
                                    }else {
                                        games[gameId].players[1].timeMoves++
                                    }
                                    switch (games[gameId].mode) {
                                        case "mild":
                                            chechEndGameTime(900)
                                            break;
                                        case "fast":
                                            chechEndGameTime(300)
                                            break;
                                        case "mad":
                                            chechEndGameTime(60)
                                            break;
                                    }
                                    //проверка на мат по времени
                                    function chechEndGameTime(matchLonger) {
                                        if (games[gameId].players[0].timeMoves >= matchLonger) {
                                            games[gameId].mate = true
                                            games[gameId].winner = games[gameId].players[1].id
                                            games[gameId].timeEnd = moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss")

                                            clearInterval(gamesLoop[gameId])

                                            setTimeout(()=>{
                                                saveGame(gameId)
                                            }, 5000)
                                        } else if (games[gameId].players[1].timeMoves >= matchLonger) {
                                            games[gameId].mate = true
                                            games[gameId].winner = games[gameId].players[0].id
                                            games[gameId].timeEnd = moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss")

                                            clearInterval(gamesLoop[gameId])

                                            setTimeout(()=>{
                                                saveGame(gameId)
                                            }, 5000)
                                        }
                                    }

                                },1000)
                            }

                            getTimer(gameId)

                            games[gameId] = {
                                id: gameId,
                                players: [
                                    {
                                        id: user.id,
                                        nick: user.nick,
                                        wins: user.wins,
                                        loses: user.loses,
                                        winrate: user.winrate,
                                        color: "white",
                                        movesCount: 0,
                                        userKing: adminKingCord,
                                        checks: 0,
                                        captured: [],
                                        kills: 0,
                                        timeMoves: 0
                                    },
                                    {
                                        id: friend.id,
                                        nick: friend.nick,
                                        wins: friend.wins,
                                        loses: friend.loses,
                                        winrate: friend.winrate,
                                        color: "black",
                                        movesCount: 0,
                                        userKing: guestKingCord,
                                        checks: 0,
                                        captured: [],
                                        kills: 0,
                                        timeMoves: 0
                                    }
                                ],
                                mode: lobbys[lobbyId].mode,
                                timeStart: moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss"),
                                timeEnd: "",
                                timerCount: 0,
                                movesArr: [],
                                movesCount: 0,
                                lastMove: "",
                                turnColor: "white",
                                checkState: false,
                                checks: 0,
                                kills: 0,
                                mate: false,
                                stalemate: false,
                                winner: "",
                                board: boardArr.concat()

                            }


                            var task = {
                                type: "game",
                                id: gameId
                            }

                            var taskStr = JSON.stringify(task)

                            var queryLobby = `UPDATE users SET task = '${taskStr}' WHERE id = ${req.session.user.id}`

                            connection.query(queryLobby, function(err) {
                                if (err) {
                                    console.log(err)
                                    return
                                }

                                var queryLobbyFriend = `UPDATE users SET task = '${taskStr}' WHERE id = ${lobbys[data.lobbyId].guest}`

                                connection.query(queryLobbyFriend, function(err) {
                                    if (err) {
                                        console.log(err)
                                        return
                                    }
                                    delete lobbys[lobbyId]

                                    res.status(200).json({type:"successful", message: "Игра созданна"})
                                })
                            })



                        })
                    })
                } else {
                    res.status(200).json({type:"error", message: "Чтобы начать игру пригласите друга в лобби"})
                }
            }
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })

    app.post('/checkGame', function(req, res){
        if(req.session.user) {
            var data = req.body
            var gameId = data.gameId

            if (games[gameId] != undefined) {
                var tmpGame = games[gameId]

                res.status(200).json({type:"successful", game: tmpGame})
            }else {
                res.status(200).json({type:"error", message: "Игровой комнаты не существует"})
            }
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })

    app.post('/gameUserTimer', function(req, res){
        if(req.session.user) {
            var data = req.body
            var gameId = data.gameId

            if (games[gameId] != undefined) {
                for (var player of games[gameId].players) {
                    if (req.session.user.id == player.id) {
                        var timeMoves =  player.timeMoves
                        res.status(200).json({type:"successful", timeMoves: timeMoves})
                    }
                }
            }else {
                res.status(200).json({type:"error", message: "Игровой комнаты не существует"})
            }

        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })

    app.post('/setBoard', function(req, res){
        if(req.session.user) {
            var data = JSON.parse(req.body.setBoardData)
            var gameId = data.gameId

            if (games[gameId] != undefined) {
                games[gameId].board = data.board
                games[gameId].lastMove = data.lastMove
                games[gameId].movesArr.push(data.lastMove)
                games[gameId].movesCount ++




                if (games[gameId].players[0].id == req.session.user.id) {
                    games[gameId].players[0].movesCount ++
                    if (data.lastMove.userKing != undefined) {
                        games[gameId].players[0].userKing = data.lastMove.userKing
                    }
                    if (data.lastMove.checkState) {
                        games[gameId].players[0].checks++
                        games[gameId].checks++
                        games[gameId].checkState = true
                    }
                    if (data.lastMove.killChessmen) {
                        games[gameId].players[0].captured.push({
                            chessmen: data.lastMove.killChessmen,
                            color: "black"
                        })
                        games[gameId].players[0].kills ++
                        games[gameId].kills++
                    }
                }else {
                    games[gameId].players[1].movesCount ++
                    if (data.lastMove.userKing != undefined) {
                        games[gameId].players[1].userKing = data.lastMove.userKing
                    }
                    if (data.lastMove.checkState) {
                        games[gameId].players[1].checks++
                        games[gameId].checks++
                        games[gameId].checkState = true
                    }
                    if (data.lastMove.killChessmen) {
                        games[gameId].players[1].captured.push({
                            chessmen: data.lastMove.killChessmen,
                            color: "white"
                        })
                        games[gameId].players[1].kills ++
                        games[gameId].kills++
                    }
                }


                if (games[gameId].turnColor == "white") {
                    games[gameId].turnColor = "black"
                }else {
                    games[gameId].turnColor = "white"
                }

                //проверка на мат в последнем ходе
                if (data.lastMove.mate) {
                    games[gameId].mate = true
                    games[gameId].winner = req.session.user.id
                    games[gameId].timeEnd = moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss")

                    clearInterval(gamesLoop[gameId])

                    setTimeout(()=>{
                        saveGame(gameId)
                    }, 5000)
                }

                if (data.lastMove.stalemate) {
                    games[gameId].stalemate = true
                    games[gameId].winner = 0
                    games[gameId].timeEnd = moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss")

                    clearInterval(gamesLoop[gameId])

                    setTimeout(()=>{
                        saveGame(gameId)
                    }, 5000)
                }


                res.status(200).json({type:"successful", message: "Ход сохранён"})
            }else {
                res.status(200).json({type:"error", message: "Игра не найденна"})
            }

        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })

    app.post('/gameSurrender', function(req, res){
        if(req.session.user) {
            var data = req.body
            var gameId = data.gameId

            if (games[gameId] != undefined) {

                for (var player of games[gameId].players) {
                    if (player.id != req.session.user.id) {
                        var enemy = player
                    }
                }

                games[gameId].movesCount++
                games[gameId].mate = true
                games[gameId].winner = enemy.id
                games[gameId].timeEnd = moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss")

                clearInterval(gamesLoop[gameId])

                setTimeout(()=>{
                    saveGame(gameId)
                }, 5000)

                res.status(200).json({type:"successful", message: "Вы успешно сдались"})
            }else {
                res.status(200).json({type:"error", message: "Игра не найденна"})
            }
        }else {
            res.status(200).json({type:"error", message: "Вы не авторизированны"})
        }
    })

    function saveGame(gameId) {

        if (games[gameId] != undefined) {
            var playersStr = JSON.stringify(games[gameId].players)


            var timeStart = new Date(games[gameId].timeStart)
            var timeEnd = new Date(games[gameId].timeEnd)

            function getTime(differenceNum) {

                var hours = Math.floor(differenceNum / 1000 / 60 / 60) % 24;

                var minutes = Math.floor(differenceNum / 1000 / 60) % 60;

                var seconds = Math.floor(differenceNum / 1000) % 60;

                return hours+":"+minutes+":"+seconds


            }

            var duration = timeEnd - timeStart


            var movesArrStr = JSON.stringify(games[gameId].movesArr)

            var gameBoardStr = JSON.stringify(games[gameId].board)


            const querySaveGame = `INSERT INTO matches (players, winner, mode, timeStart, duration, movesArr, movesCount, checks, kills, board) VALUES ('${playersStr}', '${games[gameId].winner}', '${games[gameId].mode}', '${games[gameId].timeStart}', '${duration}', '${movesArrStr}', '${games[gameId].movesCount}', '${games[gameId].checks}', '${games[gameId].kills}', '${gameBoardStr}')`

            var matchId = ""
            connection.query(querySaveGame, (err, result) => {
                if (err) {
                    console.log(err)
                    return
                }

                matchId = result.insertId

                function saveUpdatesPlayers(player, matchWinner) {
                    const queryPlayerInfo = `SELECT * FROM users WHERE id = '${player.id}'`

                    connection.query(queryPlayerInfo, (err, result)=>{
                        if (err) {
                            console.log(err)
                            return
                        }
                        var playerInfoDB = result[0]

                        var newTotalMatches = playerInfoDB.total_matches + 1

                        var newWins
                        var newLoses
                        var newWinrate

                        if (matchWinner != "none") {
                            if (games[gameId].winner == player.id) {
                                newWins = playerInfoDB.wins + 1
                                newLoses = playerInfoDB.loses
                                newWinrate = Math.round((newWins * 100)/newTotalMatches)
                            }else {
                                newWins = playerInfoDB.wins
                                newLoses = playerInfoDB.loses + 1
                                newWinrate = Math.round((newWins * 100)/newTotalMatches)
                            }
                        }else {
                            newWins = playerInfoDB.wins
                            newLoses = playerInfoDB.loses + 1
                            newWinrate = Math.round((newWins * 100)/newTotalMatches)
                        }

                        var matchesArr = JSON.parse(playerInfoDB.matches)
                        matchesArr.push(matchId)

                        var newMatchesStr = JSON.stringify(matchesArr)

                        const queryPlayerUpdate = `UPDATE users SET total_matches = ${newTotalMatches}, matches = '${newMatchesStr}', wins = ${newWins}, winrate = ${newWinrate}, loses = ${newLoses}, task = "" WHERE id = ${player.id}`

                        connection.query(queryPlayerUpdate, (err) => {
                            if (err) {
                                console.log(err)
                                return
                            }
                        })
                    })
                }

                for (var player of games[gameId].players) {
                    saveUpdatesPlayers(player, games[gameId].winner)
                }

                setTimeout(()=>{
                    delete games[gameId]
                },2000)




            })
        }
    }





    var board = [
        ["*","*","*","*","*","*","*","*","*"],
        ["*",0,0,0,0,0,0,0,0],
        ["*",0,0,0,0,0,0,0,0],
        ["*",0,0,0,0,0,0,0,0],
        ["*",0,0,0,0,0,0,0,0],
        ["*",0,0,0,0,0,0,0,0],
        ["*",0,0,0,0,0,0,0,0],
        ["*",0,0,0,0,0,0,0,0],
        ["*",0,0,0,0,0,0,0,0]
    ];


    var figures = [
        {
            chessmen: "king",
            color: "black",
            x: 1,
            y: 8,
            start: 0,
            killed: 0
        },
        {
            chessmen: "pawn",
            color: "white",
            x: 2,
            y: 6,
            start: 1,
            killed: 0
        },
        {
            chessmen: "king",
            color: "white",
            x: 5,
            y: 1,
            start: 0,
            killed: 0
        },
    ]
    // var figures = [
    //     {
    //         chessmen: "pawn",
    //         color: "black",
    //         x: 1,
    //         y: 2,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "black",
    //         x: 2,
    //         y: 2,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "black",
    //         x: 3,
    //         y: 2,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "black",
    //         x: 4,
    //         y: 2,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "black",
    //         x: 5,
    //         y: 2,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "black",
    //         x: 6,
    //         y: 2,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "black",
    //         x: 7,
    //         y: 2,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "black",
    //         x: 8,
    //         y: 2,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "rook",
    //         color: "black",
    //         x: 1,
    //         y: 1,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "rook",
    //         color: "black",
    //         x: 8,
    //         y: 1,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "knight",
    //         color: "black",
    //         x: 2,
    //         y: 1,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "knight",
    //         color: "black",
    //         x: 7,
    //         y: 1,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "bishop",
    //         color: "black",
    //         x: 3,
    //         y: 1,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "bishop",
    //         color: "black",
    //         x: 6,
    //         y: 1,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "queen",
    //         color: "black",
    //         x: 4,
    //         y: 1,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "king",
    //         color: "black",
    //         x: 5,
    //         y: 1,
    //         start: 1,
    //         killed: 0
    //     },
    //
    //
    //
    //     {
    //         chessmen: "pawn",
    //         color: "white",
    //         x: 1,
    //         y: 7,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "white",
    //         x: 2,
    //         y: 7,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "white",
    //         x: 3,
    //         y: 7,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "white",
    //         x: 4,
    //         y: 7,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "white",
    //         x: 5,
    //         y: 7,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "white",
    //         x: 6,
    //         y: 7,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "white",
    //         x: 7,
    //         y: 7,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "pawn",
    //         color: "white",
    //         x: 8,
    //         y: 7,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "rook",
    //         color: "white",
    //         x: 8,
    //         y: 8,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "rook",
    //         color: "white",
    //         x: 1,
    //         y: 8,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "knight",
    //         color: "white",
    //         x: 2,
    //         y: 8,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "knight",
    //         color: "white",
    //         x: 7,
    //         y: 8,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "bishop",
    //         color: "white",
    //         x: 3,
    //         y: 8,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "bishop",
    //         color: "white",
    //         x: 6,
    //         y: 8,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "queen",
    //         color: "white",
    //         x: 4,
    //         y: 8,
    //         start: 1,
    //         killed: 0
    //     },
    //     {
    //         chessmen: "king",
    //         color: "white",
    //         x: 5,
    //         y: 8,
    //         start: 1,
    //         killed: 0
    //     }
    // ]




}