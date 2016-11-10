module.exports = function(app){
  app.get('/',function(req,res){
    res.send('ok');
  });
  app.get('/redirect',function(req,res){
    console.log(req.body);
    res.send('ok');
  });
};