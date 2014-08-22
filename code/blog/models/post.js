var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name, head, title, tags, post){
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
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
		head: this.head,
		time: time,
		title: this.title,
		tags: this.tags,
		post: this.post,
		comments: [],
		pv: 0
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
Post.getTen = function(name, page, callback){
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

			//使用count返回文档数total
			collection.count(query, function(err, total){
				//根据query查询，返回第page*10-9到page*10个结果
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({ time: -1 }).toArray(function(err, docs){
					mongodb.close();
					if(err){
						return callback(err);
					}
					//解析markdown为html
					docs.forEach(function(doc){
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null, docs, total);
				});
			});
			// //根据query对象查找文章
			// collection.find().toArray(function(err, docs){
			// 	mongodb.close();
			// 	if(err){
			// 		return callback(err);
			// 	}
				

			// });
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
				
				if(err){
					mongodb.close();
					return callback(err);
				}

				if(doc){
					//每访问1次，pv增加1
					collection.update({
						"name": name,
						"time.day": day,
						"title": title
					}, { $inc:{ "pv": 1}}, function(err){
						mongodb.close();
						if(err){
							return callback(err);
						}
					});
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){
						comment.content = markdown.toHTML(comment.content);
					});
				}
				
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

////获得只包含name、time、title属性的文档存档
Post.getArchive = function(callback){
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		//读取posts
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			//返回只包含name、time、title属性的文档组成的数组
			collection.find({},{
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({ time: -1}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//获得所有标签
Post.getTags = function(callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//使用distinct找出给定key的不同值
			collection.distinct("tags", function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回特定标签的所有文章
Post.getTag = function(tag, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//查找tag文档，并返回name、time、title
			collection.find({ "tags": tag }, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({ time: -1}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

Post.search = function(keyword, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp("^.*" + keyword + ".*$", "i");
			collection.find({"title": pattern}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({ time: -1}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};