var path = require('path');
var qs = require('querystring');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var https = require('https')
var fs = require('fs')
var request = require('request');

var clientId = process.env.APP_CLIENT_ID || require('./conf.js').APP_CLIENT_ID;
var clientSecret = process.env.APP_CLIENT_SECRET || require('./conf.js').APP_CLIENT_SECRET;
var redirectUri = process.env.APP_REDIRECT_URI || 'https://localhost:3002/auth/yahoo/callback';

const PORT = process.env.PORT || 3002;
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

const getUserInfo = (token) => {
    return request.get('https://userinfo.yahooapis.jp/yconnect/v1/attribute?schema=openid', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}
app.get('/', function (req, res) {
    var data;
    // if (req.session.result)
    //     data = JSON.stringify(req.session.result, null, 2);

    res.render('home', {
        title: 'Home',
        // user: req.session.token,
        // data: data
    });
});

app.get('/logout', function(req, res) {
    // delete req.session.token;
    res.redirect('/');
  });

app.get('/auth/yahoo', function (req, res) {
    var authorizationUrl = 'https://auth.login.yahoo.co.jp/yconnect/v2/authorization';
    var queryParams = qs.stringify({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid'
    });

    res.redirect(authorizationUrl + '?' + queryParams);
});

app.get('/auth/yahoo/callback', function (req, res) {
    var accessTokenUrl = 'https://auth.login.yahoo.co.jp/yconnect/v2/token';
    // var accessTokenUrl = 'https://auth.login.yahoo.co.jp/oauth/v2/get_token';
    var options = {
        url: accessTokenUrl,
        headers: { Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64') },
        rejectUnauthorized: false,
        json: true,
        form: {
            code: req.query.code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        }
    };

    request.post(options, function (err, response, body) {
        if (err)
            console.log(err);
        else {
            console.log("response", response.body)
            user=response
            const { accessToken } = response
            getUserInfo(accessToken, (err, resp) => {
                if(err){
                    console.log("err", err)
                    return
                }
                console.log(resp)
            })
            res.render('home', {
                title: 'Home',
                user,
                // data: data
            });
            // var accessToken = body.access_token;
            // TODO : Handle this refreshToken!
            //var refreshToken = body.refresh_token;

            // req.session.token = response.body.accessToken;

        }
    });
});
// app.listen(app.get('port'), function () {
//     console.log('Express server listening on port ' + app.get('port'));
// });

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app)
    .listen(PORT, function () {
        console.log('Express server listening on port ' + app.get('port'));
    })