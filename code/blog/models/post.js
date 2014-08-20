var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name, title, post){
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback){
	var date = new Date();

	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};

	//要存入数据库的文档
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post
	};

	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		//读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			//将文档插入posts集合
			collection.insert(post, {safe:true}, function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}

				callback(null);
			});
		});
	});
};

//读取全部文章及相关信息
Post.getAll = function(name, callback){
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		//读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if(name){
				query.name = name;
			}

			//根据query对象查找文章
			collection.find().toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				//解析markdown为html
				docs.forEach(function(doc){
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null, docs);
			});
		});
	});
};

//读取一篇文章
Post.getOne = function(name, day, title, callback){
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		//读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			//根据name、day、title进行查询
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc){
				mongodb.close();
				if(err){
					return callback(err);
				}

				doc.post = markdown.toHTML(doc.post);
				callback(null, doc);
			});
		});	
	});
};

//编辑文章 markdown格式
Post.edit = function(name, day, title, callback){
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		//读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			//根据name、day、title进行查询
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};

//更新文章
Post.update = function(name, day, title, post, callback){
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//更新内容
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {post: post}
			}, function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

//删除文章
Post.remove = function(name, day, title, callback){
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//根据name、day、title删除文章
			collection.remove({
				"name": name,
				"time.day": day,
				"title": title
			}, { w: 1}, function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};