const __server = {
    port: 8080,
    domain: 'http://localhost:8080',
    secret: "secret"
}

const __dataBase = {
    host: "localhost",
    user: "root",
    password: "",
    database: "neochess"
}

const __mailer = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: "neocheesives@gmail.com",
    pass: "wkvmlqtpswybagzi",

}

const __OAuth = {
    google: {
        clientID: '83919273654-aefttpsv6hfo8b58t1gvujk6cjn0l5ru.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: "http://localhost:8080/passport/google/callback"
    },
    vkontakte: {
        clientID: '8101113',
        clientSecret: 'qtEtEB7qYG5wEDfzLbNL',
        callbackURL: "http://localhost:8080/passport/vk/callback"
    }
}

export {__server, __dataBase, __mailer, __OAuth}