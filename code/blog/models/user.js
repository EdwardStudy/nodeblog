var mongodb = require('./db');

function User(user){
  this.name = user.name,
  this.password = user.password,
  this.email = user.email
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback){
  //要存入的用户文档
  var user = {
    name: this.name,
    password: this.password,
    email: this.email
  };

  //打开数据库
  mongodb.open(function(err, db){
    if(err){
      return callback(err);
    }

    //读取users集合
    db.collection('users', function(err, collection){
      if(err){
        mongodb.close();
        return callback(err);
      }

      //将用户数据插入users
      collection.insert(user, {safe: true}, function(err, user){
        mongodb.close();
        if(err){
          return callback(err);
        }
        //插入成功，返回用户文档
        callback(null, user[0]);
      });
    });
  });
};

//读取用户信息
User.get = function(name, callback){
  //打开数据库
  mongodb.open(function(err, db){
    if(err){
      return callback(err);
    }

    //读取users集合
    db.collection('users', function(err, collection){
      if(err){
        mongodb.close();
        return callback(err);
      }

      //查找name键
      collection.findOne({name: name}, function(err, user){
        mongodb.close();
        if(err){
          return callback(err);
        }

        callback(null, user); //成功
      });
    });
  });
};