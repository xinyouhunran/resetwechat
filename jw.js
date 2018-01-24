var express = require("express");
var app = express();
var mysql = require("mysql");
var url = require("url");
var multer = require ("multer");
var querystring  = require("querystring");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
//实例化express

app.use(express.static('../userlogo'));
var connection = mysql.createConnection({
		host:"10.40.153.231",
		user:"wy",
		password:"123456",
		database:"wechat"
	});
connection.connect();
//--------------------------------wang----------------------------------------
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/login/num', function(req, res) {
	res.append("Access-Control-Allow-Origin","*");
	//console.log(req.body)
	var sql=`SELECT * FROM userinfo where userNum='${req.body.username}'`;
    connection.query(sql, function (error, results, fields) {   
		res.send(results);
    });
});
app.post('/login/phone', function(req, res) {
	res.append("Access-Control-Allow-Origin","*");
	var sql=`SELECT * FROM userinfo where userPhone='${req.body.username}'`;
    connection.query(sql, function (error, results, fields) {  
		res.send(results);
    });
});
app.post('/userreg/isin', function(req, res) {
	res.append("Access-Control-Allow-Origin","*");
	var sql=`SELECT userNum,userPhone FROM userinfo`;
    connection.query(sql, function (error, results, fields) {  
		res.send(results);
    });
});
app.post('/userreg', function(req, res) {
	res.append("Access-Control-Allow-Origin","*");
	var sql=`INSERT INTO userinfo (userNum,userName,userPass,userGender,userPhone,userImg) VALUES ('${req.body.username}','${req.body.usernick}',${req.body.userpass},'${req.body.usergender}','${req.body.userphone}','http://10.40.153.231:88/wechat/userlogo/${req.body.userimg}')`;
    connection.query(sql, function (error, results, fields) {  
		if(error) throw error;
		res.send("1");
    });
});
//根据昵称查询我的好友
app.get("/searchfriend",function(req,res){
    res.append("Access-Control-Allow-Origin","*");
     let sql =`SELECT b.friId,a.userImg,b.remark FROM friends as b,userinfo as a WHERE a.userId=b.friId and b.userId=${req.query.userId} and b.accstatus=2 and b.remark like '%${req.query.searchcon}%'  ORDER BY CONVERT(b.remark USING gbk) ASC`;
     connection.query(sql,function(error,results,fields){
            if (error) throw error;
            res.send(JSON.stringify(results));
    })
}) 

var storage = multer.diskStorage({
	//存储文件地方
	destination:function(req,res,cb){
		cb(null,"userlogo");
	},
	//存储文件名字
	filename: function (req, file, cb) {
        var fileFormat = file.originalname.split(".");
        cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1])
    }
})
//配置上传参数
var upload = multer({
	storage:storage
})
app.post("/uploadimg",upload.any(),function(req,res){
	res.append("Access-Control-Allow-Origin","*");
	if(req.files.length==0){
		res.send('');
	}else{
		res.send(req.files[0].filename);
	}
})
//----------------------------------jian-----------------------------------------
//查询朋友
app.get("/findfriend",function(req,res){
    res.append("Access-Control-Allow-Origin","*");
     let sql =`select userId,userName,userAddress,userImg from userinfo where userPhone = '${req.query.findvalue}' or userNum='${req.query.findvalue}'`;
     connection.query(sql,function(error,results,fields){
                if (error) throw error;
                res.send(JSON.stringify(results));
        })
})

//添加朋友
app.post("/addfriend",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    var time = new Date();
    var timestring = ""+time.getFullYear()+time.getMonth()+time.getDate()+time.getHours()+time.getMinutes()+time.getSeconds()+"";    
	var sql=`insert into friends values (NULL,${req.body.userId},${req.body.friId},'${req.body.remark}',0,${timestring}),(NULL,${req.body.friId},${req.body.userId},'${req.body.userName}',1,${timestring})`;
	 connection.query(sql,function(error,results,fields){
            if (error) throw error;
            res.send("success");
            
    })
})
//查询是否已发送申请
app.post("/checkfriend",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    console.log(req.body);
	var sql=`select accstatus from friends where userId=${req.body.userId} and friId=${req.body.friId}`;
	 connection.query(sql,function(error,results,fields){
            if (error) throw error;
            res.send(JSON.stringify(results));
            
    })
})
//查询朋友表中的数据
app.get("/findall",function(req,res){
    res.append("Access-Control-Allow-Origin","*");
     let sql =`SELECT b.friId,a.userImg,b.remark,b.accstatus FROM friends as b,userinfo as a WHERE a.userId=b.friId and b.userId=${req.query.userId} and b.accstatus!=0  ORDER BY b.addtime DESC`;
     connection.query(sql,function(error,results,fields){
            if (error) throw error;
            res.send(JSON.stringify(results));
    })
})

//查询朋友表中的数据   显示列表
app.get("/friendList",function(req,res){
    res.append("Access-Control-Allow-Origin","*");
     let sql =`SELECT b.friId,a.userImg,b.remark FROM friends as b,userinfo as a WHERE a.userId=b.friId and b.userId=${req.query.userId} and b.accstatus=2 ORDER BY CONVERT(b.remark USING gbk) ASC`;
     connection.query(sql,function(error,results,fields){
            if (error) throw error;
            res.send(JSON.stringify(results));
    })
})


//修改朋友表中的状态(当已发送过了)  0
app.post("/updatestatus",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    var timestring =timeChange();
    var sql=`update friends set addTime=${timestring} where friId=${req.body.userId} and userId=${req.body.friId}`;
	 connection.query(sql,function(error,results,fields){
            if (error) throw error;
    })
    var sql=`update friends set remark='${req.body.remark}',addTime=${timestring} where userId=${req.body.userId} and friId=${req.body.friId}`;
	 connection.query(sql,function(error,results,fields){
            if (error) throw error;
    })
})
//修改朋友表中的状态（朋友邀请了）  1
app.post("/updatestatus1",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    var timestring =timeChange();
    var sql=`update friends set remark='${req.body.remark}' where userId=${req.body.userId} and friId=${req.body.friId}`;
	 connection.query(sql,function(error,results,fields){
            if (error) throw error; 
    })
    var sql=`update friends set addTime=${timestring},accstatus=1 where friId=${req.body.userId} and userId=${req.body.friId}`;
	 connection.query(sql,function(error,results,fields){
            if (error) throw error;   
    })
})
//同意添加好友  1req.query.userId
app.get("/aggreAdd",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    var timestring =timeChange();
    var sql1=`update friends set accstatus=2,addTime=${timestring} where userId=${req.query.userId} and friId=${req.query.friId}`;
	 connection.query(sql1,function(error,results,fields){
            if (error) throw error; 
    })
    var sql2=`update friends set addTime=${timestring},accstatus=2 where friId=${req.query.userId} and userId=${req.query.friId}`;
	 connection.query(sql2,function(error,results,fields){
            if (error) throw error;   
    })
    let sql3 =`SELECT b.friId,a.userImg,b.remark,b.accstatus FROM friends as b,userinfo as a WHERE a.userId=b.friId and b.userId=${req.query.userId} and b.accstatus!=0 ORDER BY b.addtime DESC`;
     connection.query(sql3,function(error,results,fields){
            if (error) throw error;
            res.send(JSON.stringify(results));
    })
})
//显示列表详情页
app.post("/getfridetail",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    let sql =`SELECT b.friId,a.userImg,b.remark,a.userName,a.userNum FROM friends as b,userinfo as a WHERE a.userId=b.friId and b.userId=${req.body.userId} and b.friId=${req.body.friId}`;
     connection.query(sql,function(error,results,fields){
            if (error) throw error;
            res.send(JSON.stringify(results));
    })
})

//修改备注名
app.post("/updateMark",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    let sql =`update friends set remark='${req.body.remark}' where userId=${req.body.userId} and friId=${req.body.friId}`;
     connection.query(sql,function(error,results,fields){
            if (error) throw error;
    })
    let sql1 =`SELECT b.friId,a.userImg,b.remark,a.userName,a.userNum FROM friends as b,userinfo as a WHERE a.userId=b.friId and b.userId=${req.body.userId} and b.friId=${req.body.friId}`;
     connection.query(sql1,function(error,results,fields){
            if (error) throw error;
            res.send(JSON.stringify(results));
    })
})
//----------------------------------liu-----------------------------------------
var userlist = {};
io.on("connection",function(socket){
    console.log(socket.id);
    socket.on("adduser",function(user){
        userlist["userNum"]=user;
        userlist["id"]=socket.id;
        socket.emit("showlist",userlist);
    })
    socket.on("setSocketId",function(data){
        console.log(data);
        connection.query(`update userInfo set userSocketId = '${data.socketId}' where userNum = '${data.userNum}'`,function(error,result){
            if(error) throw error;
            console.log('success');
        })
    })
    socket.on("gettou",function(data){
        connection.query(`select userImg from userInfo where userId = ${data}`,function(error,result){
            if(error) throw error;
            socket.emit("givetou",result[0].userImg);
        })
    })
    socket.on("getSocketId",function(data){
        connection.query(`select userSocketId from userInfo where userId = ${data}`,function(error,result){
            if(error) throw error;
            console.log(1);
            console.log(result);
            socket.emit("giveSocketId",result[0].userSocketId);
        })
    })
    socket.on("send",function(data){
        console.log(data);
        connection.query(`select userImg from userInfo where userId = ${data.user}`,function(error,result){
            if(error) throw error;
            console.log(2);
            io.sockets.sockets[data.id].emit("returnMess",{
                message:data.message,
                user:result[0].userImg
            })
        })
        
    })
    socket.on("chatinfo",function(data){
        var chatTime = timeChange();
        connection.query(`insert into chatInfo(userId,friId,myCon,chatTime) values (${data.userId},${data.friId},'${data.myCon}','${chatTime}')`,function(error,result){
            if(error) throw error;
            console.log("ok");
        })
    })
})

app.get("/getChat",function(req,res){
    res.append("Access-Control-Allow-Origin","*");
    connection.query(`select friId,myCon,chatTime from chatinfo where userId = ${req.query.id} order by chatTime desc`,function(error,result){
        if(error) throw error;
        console.log(result);
        res.send(JSON.stringify(result));
    })
})

app.post("/fritou",function(req,res){
    res.append("Access-Control-Allow-Origin","*");
    connection.query(`select userImg,userName,userId from userinfo where userId = ${req.body.id}`,function(error,result){
        if(error) throw error;
        res.send(JSON.stringify(result));
    })
})
function timeChange(){ 
    var time = new Date();
    return ""+time.getFullYear()+stringNum(time.getMonth())+stringNum(time.getDate())+stringNum(time.getHours())+stringNum(time.getMinutes())+stringNum(time.getSeconds())+"";
}
function stringNum(ti){
    if(ti<10){
        ti="0"+ti;
    }
    return ti;
}

//----------------------------------huchong-----------------------------------------
//向数据库获取用户信息，并传给页面
app.get("/getuserinfo",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    let sql =`SELECT userId, userName,  userGender, userPhone, userAddress, userImg, userNum, userSocketId FROM userinfo WHERE userId=${req.query.id}`;
    connection.query(sql,function(error,results,fields){
            if (error) throw error;
            var str = JSON.stringify(results)
            res.send(str)
    })
    
})
//前台提交信息，并向数据库里面的修改昵称
app.get("/changuserName",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    let sql =`UPDATE userinfo SET userName='${req.query.name}' WHERE userId=${req.query.id}`;
    console.log(sql);
    connection.query(sql,function(error,results,fields){
            if (error) throw error;
            // var str = JSON.stringify(results)
            res.send("修改成功")
    })
    
})
//前台往后台存储性别
app.get("/changuserGender",function(req,res){
	res.append("Access-Control-Allow-Origin","*");
    //req.body是post传输的数据
    let sql =`UPDATE userinfo SET userGender='${req.query.userGender}' WHERE userId=${req.query.id}`;
    connection.query(sql,function(error,results,fields){
            if (error) throw error;
            // var str = JSON.stringify(results)
            res.send("修改成功")
    })
    
})


// app.get("/aggreAdd",function(req,res){
// 	res.append("Access-Control-Allow-Origin","*");
//     //req.body是post传输的数据
//     var timestring =timeChange();
//     var sql1=`update friends set accstatus=2,addTime=${timestring} where userId=${req.query.userId} and friId=${req.query.friId}`;
// 	 connection.query(sql1,function(error,results,fields){
//             if (error) throw error; 
//     })
//     var sql2=`update friends set addTime=${timestring},accstatus=2 where friId=${req.query.userId} and userId=${req.query.friId}`;
// 	 connection.query(sql2,function(error,results,fields){
//             if (error) throw error;   
//     })
//     let sql3 =`SELECT b.friId,a.userImg,b.remark,b.accstatus FROM friends as b,userinfo as a WHERE a.userId=b.friId and b.userId=${req.query.userId} and b.accstatus!=0 ORDER BY b.addtime DESC`;
//      connection.query(sql3,function(error,results,fields){
//             if (error) throw error;
//             res.send(JSON.stringify(results));
//     })
// })

server.listen(1701);
console.log("开启服务器");
