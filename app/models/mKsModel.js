module.exports = function(){
  this.applications = {};
  this.index = {};
  this.cards = [];
  this.addCard = function(application,card){
    
  };
  this.addApplication = function(application){
    this.applications[application.name] = application;
    if(!this.index[application.name]){
      this.index[application.name] = [];
    }
  };
};