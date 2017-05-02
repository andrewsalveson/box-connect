'use strict';

// dependencies ===============================================================
var express       = require('express');
var cors          = require('cors');
var app           = express();
var morgan        = require('morgan');
var bodyParser    = require('body-parser')
var cookieParser  = require('cookie-parser');
var crypto        = require('crypto');

// load configuration objects =================================================
var boxConn       = new(require('./app/models/boxConnectionModel'));
var mKs           = new(require('./app/models/mKsModel'));
var BoxConfig     = require('./config/box');
var port          = process.env.PORT || 80;
var now           = (new Date()).getTime();

// configure app ==============================================================
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(morgan('dev')); // log every request to the console

// routes =====================================================================
app.get('/',function(req,res){
  res.write('<!DOCTYPE html><html lang="en"><head>');
  if(boxConn.expiresAt < now){
    res.write('<meta http-equiv="refresh" content="0;URL=\'./login\'"></head><body>expired...');
  }else{
    res.write('</head><body>connected to Box:<br><pre>./mk\n./mk/application/:app\n./mk/application/:app/card/:card</pre>');
  }
  res.end('</body></html>');
});
app.get('/login',function(req,res){
  var state = crypto.createHash('md5').update('this is temporary'+Math.random()).digest('hex');
  res.send('<!DOCTYPE html><html lang="en"><head><meta http-equiv="refresh" content="0;URL=\'https://account.box.com/api/oauth2/authorize?response_type=code&client_id='+BoxConfig.clientID+'&state='+state+'\'"></head><body>redirecting...</body>');
});
app.get('/redirect',function(req,res){
  var code = req.query.code;
  boxConn.connect(code,function(err,response){
    if(err)return res.send(err);
    return res.send('<!DOCTYPE html><html lang="en"><head><meta http-equiv="refresh" content="0;URL=\'./\'"></head><body><a href="./">redirect</a></body>');
  });
});
app.get('/mk',function(req,res){
  // if(mKs.applications && mKs.applications.length > 0){
    // return res.send(Object.keys(mKs.applications));
  // }
  boxConn.getFolder('9362209266',function(err,response){
    if(err)return res.send([]);
    var body = JSON.parse(response.body);
    var applications = [];
    if(body.item_collection){
      for(var i in body.item_collection.entries){
        var item = body.item_collection.entries[i];
        if(item.type == 'file'){
          continue;
        }
        if(item.name == 'Upload New mK Cards'){
          continue;
        }
        mKs.addApplication(item);
      }
    }
    res.send(Object.keys(mKs.applications));
  });
});
app.get('/mk/application/:application',function(req,res){
  if(!mKs.applications[req.params.application]){
    return res.send(cards);
  }
  var application = mKs.applications[req.params.application];
  if(application.cards){
    return res.send(Object.keys(application.cards));
  }
  application.cards = {};
  var id = application.id;
  boxConn.getFolder(id,function(err,response){
    if(err)return res.send(err);
    var body = JSON.parse(response.body);
    for(var i in body.item_collection.entries){
      var item = body.item_collection.entries[i];
      if(item.type != 'file'){
        continue;
      }
      application.cards[item.name] = item;
    }
    res.send(Object.keys(application.cards));
  });
});
app.get('/mk/application/:application/card/:card',function(req,res){
  if(!mKs.applications[req.params.application]){
    return res.send('NOT FOUND: Application');
  }
  var application = mKs.applications[req.params.application];
  if(!application.cards){
    return res.send('No cards');
  }
  if(!application.cards[req.params.card]){
    return res.send('card '+req.params.card+' does not exist for application '+application.name);
  }
  var card = application.cards[req.params.card];
  // console.log(card);
  boxConn.getCard(card.id,function(err,response){
    if(err)return res.send(err);
    var ob = JSON.parse(response);
    res.send(ob.shared_link);
    // res.setHeader('Content-type','application/vnd.openxmlformats-officedocument.presentationml.presentation; charset=utf-8');
    // res.setHeader('Content-disposition','attachment; filename='+card.name);
    // res.setHeader('Transfer-Encoding', 'chunked');
    // response.pipe(res);
    // res.write(response.body);
    // res.end();
  });
});
app.get('/mk/search/:term',function(req,res){
  
});
// app.get('/folder/:folder',function(req,res){
  // if(!req.params.folder){
    // return res.send('bad request');
  // }
  // boxConn.getFolder(req.params.folder,function(err,response){
    // if(err)return res.send('<a href="../login">login</a>');
    // if(!response.body){
      // return res.send('nada');
    // }
    // var body = JSON.parse(response.body);
    // if(body.path_collection){
      // var breadcrumbs = [];
      // for(var e in body.path_collection.entries){
        // var entry = body.path_collection.entries[e];
        // breadcrumbs.push('<a href="./'+entry.id+'">'+entry.name+'</a>');
        
      // }
      // res.write(breadcrumbs.join(' / '));
    // }
    // if(body.item_collection){
      // var items = [];
      // for(var i in body.item_collection.entries){
        // var item = body.item_collection.entries[i];
        // if(item.type == 'file'){
          // items.push('<p>'+item.name+'</p>');
        // }
        // if(item.type == 'folder'){
          // items.push('<p><a href="./'+item.id+'">'+item.name+'</a></p>');
        // }
      // }
      // res.write('<p><b>'+body.name+'</b></p>'+items.join("\n"));
    // }
    // res.end();
  // });
// });

// start the server ===========================================================
app.listen(port);
console.log('listening on port '+port);