
/*
 * GET home page.
 */
var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require('../models/comment.js');
	fs = require('fs');
	
module.exports = function(app){
	//主页
	app.get('/', function(req, res){
		//判断是否为第一页
		var page = req.query.p ? parseInt(req.query.p) : 1;
		Post.getTen(null, page, function(err, posts, total){
			if(err){
				posts = [];
			}
			
			res.render('index', {
				title: '主页',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 10 + posts.length) == total
			});
		});
	});


	//注册页
	app.get('/signup', checkNotLogin);
	app.get('/signup', function(req, res){
		res.render('signup', {
			title: '注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/signup', checkNotLogin)
	app.post('/signup', function(req, res){
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		//检查密两次输入密码是否一致
		if(password != password_re){
			req.flash('error', '两次输入密码不一致');
			return res.redirect('/signup');
		}

		//生成MD5
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});

		//检查用户名是否已经存在
		User.get(newUser.name, function(err, user){
			if(user){
				req.flash('error', '用户已存在');
				return res.redirect('/signup');
			}

			newUser.save(function(err, user){
				if(err){
					req.flash('error', err);
					return res.redirect('/signup');
				}
				req.session.user = user;
				req.flash('success', '注册成功');
				res.redirect('/');
			});
		});
	});

	//登录页
	app.get('/signin', checkNotLogin);
	app.get('/signin', function(req, res){
		res.render('signin', {
			title: '登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/signin', checkNotLogin);
	app.post('/signin', function(req, res){
		//生成MD5
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');

		//检查用户是否存在
		User.get(req.body.name, function(err, user){
			if(!user){
				req.flash('error', '用户不存在');
				return res.redirect('/signin');
			}

			//检查密码一致
			if(password != user.password){
				req.flash('error', '密码错误');
				return res.redirect('/signin');
			}

			req.session.user = user;
			req.flash('success', '注册成功');
			res.redirect('/');
		});
	});

	//发表页
	app.get('/post', checkLogin);
	app.get('/post', function(req, res){
		res.render('post', {
			title: '发表',
			user: req.session.user,
		    success: req.flash('success').toString(),
		    error: req.flash('error').toString()
		});
	});
	app.post('/post', checkLogin);
	app.post('/post', function(req, res){
		console.log(req.body.tag1);
		console.log(req.body.tag2);
		console.log(req.body.tag3);
		var currentUser = req.session.user,
			tags = [req.body.tag1, req.body.tag2, req.body.tag3],
			post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功');
			res.redirect('/');
		});
	});

	//登出
	app.get('/signout', function(req, res){
		req.session.user = null;
		req.flash('success', '登出成功！');
		res.redirect('/');
	});

	//上传
	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res){
		res.render('upload', {
			title: '文件上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/upload', checkLogin);
	app.post('/upload', function(req, res){
		for(var i in req.files){
			if(req.files[i].size == 0){
				//使用同步方法删除文件
				fs.unlinkSync(req.files[i].path);
				console.log('Successfully removed an empty file!');
			}else{
				var target_path = './public/images/' + req.files[i].name;
				//使用同步方法重命名文件
				fs.renameSync(req.files[i].path, target_path);
				console.log('Successfully renamed a file!');
			}
		}

		req.flash('success', '文件上传成功！');
		res.redirect('/upload');
	});

	//存档界面
	app.get('/archive', function(req, res){
		Post.getArchive(function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('archive', {
				title: '存档',
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	//用户页面
	app.get('/u/:name', function(req, res){
		var page = req.query.p? parseInt(req.query.p) : 1;
		//检查用户是否存在
		User.get(req.params.name, function(err, user){
			if(!user){
				req.flash('error', '用户不存在！');
				return res.redirect('/');
			}

			//查询并返回该用户的所有文章
			Post.getTen(user.name, page, function(err, posts, total){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString(),
					page: page,
					isFirstPage: (page - 1) == 0,
					isLastPage: ((page - 1) * 10 + posts.length) == total
				});
			});
		});
	});

	//文章页面
	app.get('/u/:name/:day/:title', function(req, res){
		Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	//文章留言
	app.post('/u/:name/:day/:title', function(req, res){
		var date = new Date(),
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
		var md5 = crypto.createHash('md5'),
			email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
			head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 
		var comment = {
			name: req.body.name,
			head: head,
			email: req.body.email,
			website: req.body.website,
			time: time,
			content: req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '留言成功！');
			res.redirect('back');
		});
	});

	//修改文章
	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post){
			if(err){
				req.flash('error', err);
				res.redirect('back');
			}
			res.render('edit', {
				title: '编辑',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err, post){
			var url = '/u/' + req.params.name + '/' + req.params.day + '/' + encodeURI(req.params.title);
			console.log(req.params.title);
			if(err){
				req.flash('error', err);
				return res.redirect(url); //返回文章页
			}

			req.flash('success', '修改成功！');
			res.redirect(url);
		});
	});

	//删除
	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '删除成功！');
			res.redirect('/');
		});
	});

	//标签页
	app.get('/tags', function(req, res){
		Post.getTags(function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tags', {
				title: '标签',
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	//包含标签的文章
	app.get('/tags/:tag', function(req, res){
		Post.getTag(req.params.tag, function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tag', {
				title: "TAG:" + req.params.tag,
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	//搜索文章标题
	app.get("/search", function(req, res){
		Post.search(req.query.keyword, function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('search', {
				title: "SEARCH:" + req.query.keyword,
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	//友情链接页面
	app.get('/links', function(req, res){
		res.render('link', {
			title: '友情链接',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	//404
	app.use(function(req, res){
		res.render("404");
	});
};


//页面控制功能中间件
function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '未登录!'); 
    res.redirect('/signin');
  }
  next();
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登录!'); 
    res.redirect('back');//返回之前的页面
  }
  next();
}