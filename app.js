var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs=require('express-handlebars')
// let fu=require('express-fileupload')
let session=require('express-session');
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
var db=require('./config/connection')
let Handlebars = require('handlebars');
const Trusthub = require('twilio/lib/rest/Trusthub');
const bodyParser=require('body-parser')
const dotenv=require('dotenv')
Handlebars.registerHelper("inc", function(value, options)//increment
{
    return parseInt(value) + 1;
});

Handlebars.registerHelper('if_eq', function(a, b, opts) {//for condition checking for status
  if(a == b)
      return opts.fn(this);
  else
      return opts.inverse(this);
});

var app = express();
dotenv.config()
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(session({ secret: "Key", cookie: { maxAge: 600000 } }));
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//body parser use
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// app.use(fu())
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, private,no-store,must-revalidate,max-stale=0,pre-check=0')
  next()
})

db.connect((err)=> {
  if(err) console.log('CONNECTION ERROR'+err);  

  else console.log('database seccesfully conncted to 27017');
})

app.use('/admin', adminRouter);
app.use('/', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
