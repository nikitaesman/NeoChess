import path from "path";


export function getRoutes(app, connection, lobbys, games, str_rand, __dirname) {
    app.get('/', (req, res)=>{
        res.sendFile(path.resolve(__dirname, "public", "index.html"))
    })

    app.get('/game', (req, res)=>{
        if(req.session.user) {
            const queryUser = `SELECT * FROM users WHERE id = '${req.session.user.id}'`

            connection.query(queryUser, function(err, rows) {
                if (err) {
                    console.log(err)
                    return
                }
                var user = rows[0]

                var task = ""
                if (user.task != "") {
                    task = JSON.parse(user.task)
                }

                if (task != "") {
                    if (task.type == "game" && games[task.id] != undefined) {
                        res.sendFile(path.resolve(__dirname, "public", "pages", "chess.html"))
                    }else {
                        res.sendFile(path.resolve(__dirname, "public", "pages", "404.html"))
                    }
                }else {
                    res.sendFile(path.resolve(__dirname, "public", "pages", "404.html"))
                }
            })
        }else {
            res.sendFile(path.resolve(__dirname, "public", "pages", "404.html"))
        }
    })
    app.get('/activeted', (req, res)=>{
        var hash = req.query.hash
        if (hash != undefined && hash != "") {

            const queryIsHash = `SELECT id FROM users WHERE hash = '${hash}'`

            connection.query(queryIsHash, function(err, rows) {
                if(err) {
                    console.log(err)
                    return
                }

                if (rows.length != 0) {
                    const queryActivate = `UPDATE users SET active = "1", hash = "" WHERE id = ${rows[0].id}`

                    connection.query(queryActivate, function(err) {
                        if (err) {
                            console.log(err)
                            return
                        }
                        res.sendFile(path.resolve(__dirname, "public", "pages", "activated.html"))
                    })
                }else {
                    res.sendFile(path.resolve(__dirname, "public", "pages", "404.html"))
                }
            })


        }else {
            res.sendFile(path.resolve(__dirname, "public", "pages", "404.html"))
        }

    })
    app.get('/recovery', (req, res)=>{
        var hash = req.query.hash
        if (hash != undefined && hash != "") {

            const queryIsHash = `SELECT id FROM users WHERE hash = '${hash}'`

            connection.query(queryIsHash, function(err, rows) {
                if(err) {
                    console.log(err)
                    return
                }

                if (rows.length != 0) {

                    res.sendFile(path.resolve(__dirname, "public", "pages", "recovery.html"))

                }else {
                    res.sendFile(path.resolve(__dirname, "public", "pages", "404.html"))
                }
            })


        }else {
            res.sendFile(path.resolve(__dirname, "public", "pages", "404.html"))
        }

    })


//The 404 Route (ALWAYS Keep this as the last route)
    app.get('*', function(req, res){
        res.sendFile(path.resolve(__dirname, "public", "pages", "404.html"))
    });
}