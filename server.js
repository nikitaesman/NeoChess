import express from 'express'
import chalk from 'chalk'
import path from 'path'
import mysql from 'mysql'
import nodemailer from 'nodemailer'
import bcrypt from 'bcryptjs'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import moment from 'moment-timezone'
moment.locale('ru')

import * as Config from './src/config.js'
import {emailConfirm, emailRecovery} from "./src/confirm_mail.js"

import {gameRoutes} from './src/gameRoutes.js'
import {indexRoutes} from './src/indexRoutes.js'
import {getRoutes} from "./src/getRoutes.js";




const __dirname = path.resolve()
const PORT = process.env.PORT ?? Config.__server.port
const app = express()


app.listen(PORT, ()=>{
	console.log(chalk.bgGreen(`Server started on ${PORT}...`))
})

//организация MidleWare
app.use(express.static(path.resolve(__dirname, "public")))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: Config.__server.secret
}))



var connection  = mysql.createPool({
	host: Config.__dataBase.host,
	user: Config.__dataBase.user,
	password: Config.__dataBase.password,
	database: Config.__dataBase.database
})


//обнуление полей с информацией об играх или лобби в базе данных
const queryClearTasks = `UPDATE users SET task = ""`

connection.query(queryClearTasks, function(err) {
	if (err) {
		console.log(err)
		return
	}
})

//функция генерации рандомной строки
function str_rand(e) {
	var result       = '';
	var words        = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
	var max_position = words.length - 1;
	for(var i = 0; i < e; ++i ) {
		var position = Math.floor ( Math.random() * max_position );
		result = result + words.substring(position, position + 1);
	}
	return result;
}

var lobbys = []
var games = []
var gamesLoop = []



getRoutes(app, connection, lobbys, games, str_rand, __dirname)

indexRoutes(app, connection, lobbys, games, str_rand)

gameRoutes(app, connection, lobbys, games, gamesLoop, str_rand)

































