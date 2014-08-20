
/*
 * GET home page.
 */
var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
	fs = require('fs');
	
module.exports = function(app){
	//主页
	app.get('/', function(req, res){
		Post.getAll(null, function(err, posts){
			if(err){
				posts = [];
			}
			
			res.render('index', {
				title: '主页',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
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
		var currentUser = req.session.user,
			post = new Post(currentUser.name, req.body.title, req.body.post);
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

	//用户页面
	app.get('/u/:name', function(req, res){
		//检查用户是否存在
		User.get(req.params.name, function(err, user){
			if(!user){
				req.flash('error', '用户不存在！');
				return res.redirect('/');
			}

			//查询并返回该用户的所有文章
			Post.getAll(user.name, function(err, posts){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
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