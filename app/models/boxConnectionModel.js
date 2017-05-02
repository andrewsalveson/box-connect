var request    = require('request');
var BoxConfig  = require('../../config/box');

module.exports = function(){
  this.keepAlive = true;
  this.expiresAt = 0;
  this.tokenInfo = null;
  
  this.connect = function(code,callback){
    var conn = this;
    request.post('https://api.box.com/oauth2/token',{formData:{
      grant_type: 'authorization_code',
      code: code,
      client_id: BoxConfig.clientID,
      client_secret: BoxConfig.clientSecret      
    }},function(err,response,body){
      if(err)return callback(err,null);
      conn.tokenInfo = JSON.parse(body);
      conn.expiresIn = (conn.tokenInfo.expires_in * 1000) - 1000; // milliseconds, 1 sec before real expiry
      conn.expiresAt = (new Date()).getTime() + conn.expiresIn;
      conn.refreshCycle();
      callback(null,response);
    });
  };
  this.refreshCycle = function(){
    var conn = this;
    setTimeout(function(){
      conn.refresh();
    },conn.expiresIn);
  };
  this.refresh = function(){
    var conn = this;
    if(!conn.keepAlive){
      return false;
    }
    if(!this.tokenInfo){
      return false;
    }
    request.post('https://api.box.com/oauth2/token',{formData:{
      grant_type: 'refresh_token',
      refresh_token: conn.tokenInfo.refresh_token,
      client_id: BoxConfig.clientID,
      client_secret: BoxConfig.clientSecret
    }},function(err,response,body){
      conn.tokenInfo = JSON.parse(body);
      conn.expiresIn = (conn.tokenInfo.expires_in * 1000) - 1000;
      conn.expiresAt = (new Date()).getTime() + conn.expiresIn;
      if(err){
        return console.log(err);
      }
    });
  };
  this.getCard = function(id,callback){
    var conn = this;
    if(conn.tokenInfo == null){
      callback('no token',null);
    }
    if(conn.expiresAt < (new Date()).getTime()){
      callback('expired',null);
    }
    request({
      url: 'https://www.box.com/api/2.0/files/'+id,
      method: 'PUT',
      body: JSON.stringify({
        shared_link: {
          "access"  : "open"
          // note: do not change the 'password' property
          // of shared_link - you don't want to clear a
          // password that someone else has set, and you
          // don't want to set a password that someone 
          // else has intentionally left clear!
        }
      }),
      headers: {
        'Authorization':'Bearer '+conn.tokenInfo.access_token
      }
    },function(err,response,body){
      if(err)return callback(err,null);
      callback(err,body);
    });
  };
  this.getFolder = function(folder,callback){
    var conn = this;
    if(conn.tokenInfo == null){
      callback('no token',null);
    }
    if(conn.expiresAt < (new Date()).getTime()){
      callback('expired',null);
    }
    request({
      url: 'https://www.box.com/api/2.0/folders/'+folder,
      headers: {
        'Authorization':'Bearer '+conn.tokenInfo.access_token
      }
    },callback);
  };
};