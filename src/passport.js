import passport from 'passport'
import {Strategy as GoogleStrategy} from "passport-google-oauth2";
import {Strategy as VKStrategy} from "passport-vkontakte";

import * as Config from './config.js'

export function passportRoutes(app, connection, str_rand) {

    passport.serializeUser(function (user, done) {
        done(null,user)
    })

    passport.deserializeUser(function (user, done) {
        done(null,user)
    })

    //============ GOOGLE
    passport.use('google', new GoogleStrategy({
            clientID: Config.__OAuth.google.clientID,
            clientSecret: Config.__OAuth.google.clientSecret,
            callbackURL: Config.__OAuth.google.callbackURL,
            passReqToCallback   : true
        },
        function(request, accessToken, refreshToken, profile, done) {

            return done(null, profile);

        }
    ));

    //============ VK
    passport.use('vkontakte', new VKStrategy({
            clientID: Config.__OAuth.vkontakte.clientID,
            clientSecret: Config.__OAuth.vkontakte.clientSecret,
            callbackURL: Config.__OAuth.vkontakte.callbackURL
        },
        function(accessToken, refreshToken, params, profile, done) {
            profile = JSON.parse(JSON.stringify(profile));
            profile.email = params.email
            process.nextTick(() => {
                return done(null, profile);
            });
        }));

    app.get('/passport/auth/google',
        passport.authenticate('google', { scope: ['email', 'profile'] })
    )

    app.get('/passport/google/callback',
        passport.authenticate( 'google', {
            successRedirect: '/passport/google/success',
            failureRedirect: '/passport/google/failure'
        })
    )

    app.get('/passport/auth/vk',
        passport.authenticate('vkontakte', { scope: ['email', 'profile'] })
    )

    app.get('/passport/vk/callback',
        passport.authenticate( 'vkontakte', {
            successRedirect: '/passport/vkontakte/success',
            failureRedirect: '/passport/vkontakte/failure'
        })
    )

    app.get('/passport/google/success', (req, res) => {
        if (req.user) {
            const queryLog = `SELECT * FROM users WHERE email = '${req.user.email}' and type = 'google'`
            // Use the connection
            connection.query(queryLog, function (err, rows) {
                if (err) {
                    console.log(err)
                    return
                }

                if (rows.length != 0) {
                    var tempUser = {
                        id: rows[0].id,
                        sessionId: str_rand(7)
                    }

                    const querySessionId = `UPDATE users SET SessionId = '${tempUser.sessionId}' WHERE id = ${tempUser.id}`

                    connection.query(querySessionId, (err, result) => {
                        if (err) {
                            console.log(err)
                            return
                        }

                        req.logout()

                        req.session.user = tempUser
                        req.session.save()

                        res.redirect('/')

                    })
                } else {
                    var randomNick = "User#" + str_rand(4)
                    const queryReg = `INSERT INTO users (email, type, nick, active) VALUES ('${req.user.email}','google','${randomNick}', 1)`

                    connection.query(queryReg, function (err, rows) {
                        if (err) {
                            console.log(err)
                            return
                        }

                        var tempUser = {
                            id: rows.insertId,
                            sessionId: str_rand(7)
                        }

                        const querySessionId = `UPDATE users SET SessionId = '${tempUser.sessionId}' WHERE id = ${tempUser.id}`

                        connection.query(querySessionId, (err, result) => {
                            if (err) {
                                console.log(err)
                                return
                            }

                            req.logout()

                            req.session.user = tempUser
                            req.session.save()

                            res.redirect('/')
                        })
                    });
                }
            });
        }else {
            res.redirect('/gfdhd')
        }
    })

    app.get('/passport/vkontakte/success', (req, res) => {
        if (req.user) {
            const queryLog = `SELECT * FROM users WHERE email = '${req.user.email}' and type = 'vkontakte'`
            // Use the connection
            connection.query(queryLog, function (err, rows) {
                if (err) {
                    console.log(err)
                    return
                }

                if (rows.length != 0) {
                    var tempUser = {
                        id: rows[0].id,
                        sessionId: str_rand(7)
                    }

                    const querySessionId = `UPDATE users SET SessionId = '${tempUser.sessionId}' WHERE id = ${tempUser.id}`

                    connection.query(querySessionId, (err, result) => {
                        if (err) {
                            console.log(err)
                            return
                        }

                        req.logout()

                        req.session.user = tempUser
                        req.session.save()

                        res.redirect('/')

                    })
                } else {
                    var randomNick = "User#" + str_rand(4)
                    const queryReg = `INSERT INTO users (email, type, nick, active) VALUES ('${req.user.email}','vkontakte','${randomNick}', 1)`

                    connection.query(queryReg, function (err, rows) {
                        if (err) {
                            console.log(err)
                            return
                        }

                        var tempUser = {
                            id: rows.insertId,
                            sessionId: str_rand(7)
                        }

                        const querySessionId = `UPDATE users SET SessionId = '${tempUser.sessionId}' WHERE id = ${tempUser.id}`

                        connection.query(querySessionId, (err, result) => {
                            if (err) {
                                console.log(err)
                                return
                            }

                            req.logout()

                            req.session.user = tempUser
                            req.session.save()

                            res.redirect('/')
                        })
                    });
                }
            });
        }else {
            res.redirect('/gfdhd')
        }
    })
}