//获取document元素
let startBtn = document.getElementById('startBtn');
let gameWindow = document.getElementById('gameWindow');
let scoreDiv = document.getElementById('score');

//参数定义
let ctx = gameWindow.getContext('2d');
let score = 0;//分数
let gameTime = 0;//游戏时间
let mX = 250;//鼠标坐标
let mY = 400;
let playStatus = 0;//0表示游戏还没有开始状态,1表示正在进行游戏状态，2表示游戏在暂停状态
let gameTimer;
let player;//玩家
let enemy = [];//敌人
let daoju = [];//道具
let daojuText = ['H', 'U'];
let daojusorce = 500;//每500分就发送一个道具
//子弹类
class Bullet {
    x;
    y;
    color;
    HP;
    R;
    speed;
    status = 1;//1没有发射处于弹夹中，0处于发射状态，2击中目标状态
    long = 0;//记录子弹飞行的距离
    Maxlong = 490;//子弹飞行的最大距离
    orientation;//子弹方向
    constructor(HP, R, speed, color) {
        this.HP = HP;
        this.R = R;
        this.speed = speed;
        this.color = color;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.arc(this.x, this.y, this.R, 0, 2 * Math.PI, false);
        ctx.fill();
    }
    move(ctx) {
        if (this.status == 0) {
            this.length = this.length + this.speed;//计算子弹飞行的距离
            this.y = Math.sin(Math.PI / 180 * this.orientation) * this.speed + this.y;
            this.x = Math.cos(Math.PI / 180 * this.orientation) * this.speed + this.x;
            this.draw(ctx);
            //超过最大距离时，子弹回收。
            if (this.length > this.Maxlong) {
                this.status = 0;
            }
        }

    }
    fire(x, y, orientation) {
        this.x = x;
        this.y = y;
        this.orientation = orientation;
        this.status = 0;
    }
}
//道具类 
class Daoju {
    x;
    y;
    R = 15;
    status = 0;//0还没有被玩家拾取，1被玩拾取，2可以被删除
    text;//写在道具上的文字 H代表生命道具
    speedY = 1;//Y轴上的移动速度
    speedX = 1;//X轴上的移动速度
    color = 'rgb(255,215,0,1)';
    //变换用的参数
    a = 1;
    constructor(x, y, text) {
        this.text = text;
        this.x = x;
        this.y = y;
    }
    //道具的功能
    itsFunction(player) {
        //生命增加
        if (this.text == 'H') {
            //最多HP到10，之后会加分
            if (player.HP <= 8) {
                player.HP += 2;
            } else if (player.HP >= 8 && player.HP <= 10) {
                player.HP = 10;
            }
            if (player.HP >= 10) {
                score += 20;
            }
        }
        if (this.text == 'U') {
            if (player.fireTime > 100) {
                player.fireTime -= 100;
            } else {
                score += 30;
            }

        }
    }
    //状态为0的处理方法
    life() {
        if (this.y <= 515) {
            this.drew(ctx);
        } else {
            this.status = 2;
        }

    }
    //状态为1的处理方式
    isPick(ctx) {
        if (this.a <= 0) {
            this.status = 2;
        } else {
            this.a -= 0.01
        }
        this.drew(ctx);
    }
    //道具的移动方式
    move() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.x > 500) {
            this.speedX = -this.speedX;
        }
        if (this.x < 0) {
            this.speedX = -this.speedX;
        }
    }
    updata(ctx) {
        if (this.status == 0) {
            this.life(ctx);
            this.move();
        }
        if (this.status == 1) {
            this.isPick(ctx);
        }
    }
    drew(ctx) {
        ctx.beginPath();
        // ctx.fillStyle = 'rgb(0,0,0)'
        ctx.font = '20px 宋体';
        //ctx.globalAlpha = this.a;
        ctx.fillStyle = 'rgb(255,215,0,' + this.a + ')';
        ctx.arc(this.x, this.y, this.R, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillText(this.text, this.x - 5, this.y + 6);

    }
    statusSolve() {

    }
    isCrash(player) {
        // if(((player.x - this.x) ** 2 + (player.y - this.y) ** 2) ** 0.5 < this.R + player.R){
        //     console.log('距离'+(((player.x - this.x) ** 2 + (player.y - this.y) ** 2) ** 0.5)+"和"+(this.R + player.R)+"状态:"+player.status+this.status)
        // }
        //console.log('距离'+(((player.x - this.x) ** 2 + (player.y - this.y) ** 2) ** 0.5)+"和"+(this.R + player.R)+"状态:"+player.status+this.status)
        if (((player.x - this.x) ** 2 + (player.y - this.y) ** 2) ** 0.5 < this.R + player.R && player.status == 0 && this.status == 0) {
            console.log('碰撞');
            this.itsFunction(player);
            this.status = 1;
        }
    }
}
//玩家类
class Player {
    HP;
    x;
    y;
    atk;
    df;
    R = 15;
    speed;
    status = 0;//0为存活态，1为死亡态
    BulletSpeed = 6;
    bullet_cth = 0;//将要发射的第n个子弹
    fireTiming = 0;//计算上次发射子弹的时间 
    fireTime = 500;//发射子弹的间隔时间，默认500
    atkMethod;//0普通攻击模式，1散射攻击模式，2激光攻击模式
    magazineClip = [];//弹夹
    booAnimation;
    constructor(HP, x, y, atk, df, speed, atkMethod) {
        this.HP = HP;
        this.x = x;
        this.y = y;
        this.atk = atk;
        this.df = df;
        this.speed = speed;
        this.atkMethod = atkMethod;
        this.booAnimation = new BooAnimation(this.R, 0.1);
        for (let i = 0; i < 20; i++) {//初始化弹夹
            console.log('初始化弹夹');
            this.magazineClip.push(new Bullet(this.atk, 3, this.BulletSpeed, 'rgb(244,244,244)'));
        }
    }
    draw(ctx) {
        if (this.status != 1) {
            player.fire();//自动开火
            ctx.beginPath();
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'black';
            ctx.arc(this.x, this.y, 15, 0, 2 * Math.PI, false);
            ctx.fill();
        } else {
            //玩家死亡后的处理
            if (this.booAnimation.drew(ctx, this.x, this.y)) {
                playStatus = 0;
                ctx.beginPath();
                ctx.fillStyle = 'black';
                ctx.strokeStyle = 'black';
                ctx.font = '60px 微软雅黑'
                ctx.fillText(formatZero(score + parseInt(gameTime), 8), 100, 250);
                startBtn.innerHTML = 'START';
            }
        }
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.font = '30px 微软雅黑';
        ctx.fillText('HP:' + this.HP.toFixed(2), 0, 30);
    }
    fire() {
        this.fireTiming += 10;
        if (this.fireTiming > this.fireTime) {
            if (this.bullet_cth < this.magazineClip.length) {
                this.magazineClip[this.bullet_cth].fire(this.x, this.y, -90);
            } else {
                this.bullet_cth = 0;
                this.magazineClip[this.bullet_cth].fire(this.x, this.y, -90);
            }
            this.bullet_cth++;
            this.fireTiming = 0;
        }

    }
    move(ctx, x, y) {
        if (this.status == 1) {
            this.draw(ctx);
        } else {
            if (((x - this.x) ** 2 + (y - this.y) ** 2) ** 0.5 < 4) {//防止出现抖动
                this.draw(ctx);
            } else {
                this.x = this.x + this.speed * (x - this.x) / (((x - this.x) ** 2 + (y - this.y) ** 2) ** 0.5);
                this.y = this.y + this.speed * (y - this.y) / (((x - this.x) ** 2 + (y - this.y) ** 2) ** 0.5);
                this.draw(ctx);
            }
        }

    }
    //判断发生撞击
    isCrash(blt) {
        //console.log('距离：'+((blt.x - this.x) ** 2 + (blt.y - this.y) ** 2) ** 0.5+"半径和:"+blt.R+this.R)
        if (((blt.x - this.x) ** 2 + (blt.y - this.y) ** 2) ** 0.5 < blt.R + this.R && blt.status == 0 && this.status == 0) {
            this.HP = this.HP - blt.HP//与撞击物的HP相减
            if (this.HP <= 0) {
                this.status = 1;
            }
            return true;
        }
        return false;
    }
}
//敌人类
class Enemy {
    name;
    x;
    y;
    HP;
    R;
    color = 'rgb(165,255,45)';
    speedY = 1;
    speedX = 1;
    orientation;
    speed;
    score = 10;//击杀后可以获得的分数
    status = 0;//0存活，1敌人死亡状态，2要求删除
    daojuProbability = 0;//敌人爆出装备的概率

    //自由变换参数
    a; b; c; d;

    //爆炸动画
    booAnimation;
    constructor(name, x, y, HP, R) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.HP = HP;
        this.R = R;
        this.booAnimation = new BooAnimation(this.R, 0.1);
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.R, 0, Math.PI * 2, false);
        ctx.fill();
    }
    //移动方式
    move() {
        this.y = this.y + this.speedY;
    }
    //存活处理
    life(ctx) {
        this.move();
        this.draw(ctx);
        if (this.y > 550) {
            this.status = 2;
        }
    }
    //死亡处理 
    die(ctx) {
        this.move();
        if (this.booAnimation.drew(ctx, this.x, this.y)) {

            this.status = 2;
        };
    }
    //根据状态做出对应的处理
    updata(ctx) {
        if (this.status == 0) {
            this.life(ctx);
        }
        if (this.status == 1) {
            this.die(ctx);
        }
    }
    daojuMake() {
        //道具随机生成
        if (Math.random() <= this.daojuProbability) {
            let dao = new Daoju(this.x, this.y, daojuText[parseInt(Math.random() * 2)])
            daoju.push(dao);
        }
    }
    //判断碰撞
    isCrash(blt) {
        //console.log(blt);
        if (((blt.x - this.x) ** 2 + (blt.y - this.y) ** 2) ** 0.5 < this.R + blt.R * 0.8 && blt.status == 0 && this.status == 0) {
            this.HP -= blt.HP;
            if (this.HP <= 0) {
                score += this.score;
                this.daojuMake();
                this.status = 1;
            }
            return true;
        }
        return false;
    }
}
//敌人类型一
function makeEnemy01() {
    let R = mathAnd(10, 40);//半径随机
    let HP = R / 13;//半径越大，HP越多
    let speedY = 2.5 - 2 * HP / 4;//HP越多，速度越慢
    let enemy01 = new Enemy('石头', 30 + Math.random() * 470, Math.random() * (-300), HP, R);
    enemy01.daojuProbability = 0.05;
    enemy01.speedY = speedY;
    return enemy01;
}
//敌人类型二
function makeEnemy02() {
    let R = 30;
    let HP = 3;
    let speedY = 2;
    let speedX = 0.5;
    let enemy02 = new Enemy('糖葫芦', Math.random() * 500, Math.random() * (-300), HP, R);
    enemy02.speedX = speedX;
    enemy02.speedY = speedY;
    enemy02.move = function () {
        this.y += this.speedY;
        if (Math.abs(this.x - player.x) >= 4) {
            if (this.x > player.x && this.y < player.y) {
                this.x -= this.speedX;
            } else {
                this.x += this.speedX;
            }
        }
    }
    enemy02.color = 'rgb(230,0,0)'
    enemy02.daojuProbability = 0.07;
    return enemy02;
}
//敌人类型三
function makeEnemy03() {
    let R = 13;
    let HP = 1;
    let speed = 4;
    let enemy03 = new Enemy('导弹', Math.random() * 500, Math.random() * (-300), HP, R);
    //let enemy03 = new Enemy('导弹',150,150,HP,R);
    enemy03.daojuProbability = 0.07;
    enemy03.color = 'rgb(139,0,139)'
    //enemy03.color = 'rgb(230,0,0)'

    enemy03.a = (player.x - enemy03.x) / (((enemy03.x - player.x) ** 2 + (enemy03.y - player.y) ** 2) ** 0.5);
    enemy03.b = (player.y - enemy03.y) / (((enemy03.x - player.x) ** 2 + (enemy03.y - player.y) ** 2) ** 0.5);
    enemy03.move = function () {
        this.x += speed * this.a;
        this.y += speed * this.b;
    }
    return enemy03;
}
class BooAnimation {
    R;
    color = 'rgb(190,15,15)';
    stutas = 1;
    timer = 0;
    time = 100;//爆炸持续时间

    //动画所要的参数
    r = 0;
    v = 1;//爆炸变化速度

    constructor(R, v) {
        this.R = R;
        this.r = R;
        this.v = v;
    }
    drew(ctx, X, Y) {
        this.timer++;
        if (this.timer > this.time) {
            return true;
        }

        for (let i = 0; i < Math.PI * this.R; i++) {
            this.r += this.v;
            if (this.r > this.R * 1.3) {
                this.v = -this.v;
            }
            if (this.r < this.R * 0.3) {
                this.v = -this.v;
            }
            let R = Math.random() * this.r;
            let x = Math.random() * R * ((-1) ** (parseInt(Math.random() * 2) + 1)) + X;
            let y = (-1) ** (parseInt(Math.random() * 2) + 1) * ((R ** 2 - ((x - X) ** 2)) ** 0.5) + Y;
            ctx.beginPath();
            ctx.fillStyle = this.color;
            let r;
            if (R < this.r * 0.5) {
                r = Math.random()
            } else {
                r = 3 * Math.random()
            }
            if (R < this.r * 0.4) {
                ctx.fillStyle = 'rgb(200,100,50)';
            } else {
                ctx.fillStyle = this.color;
            }
            ctx.arc(x, y, r, R, Math.PI * 2, false);
            ctx.fill();
        }
        return false;
    }
}


//获取鼠标的坐标
gameWindow.onmousemove = function (e) {
    mX = parseInt(e.x - gameWindow.getBoundingClientRect().left);
    mY = parseInt(e.y - gameWindow.getBoundingClientRect().top);
}
// gameWindow.ontouchmove = function (e) {
//     mX = parseInt(e.x - gameWindow.getBoundingClientRect().left);
//     mY = parseInt(e.y - gameWindow.getBoundingClientRect().top);
// }
//初始化游戏
function initGame() {
    daojusorce = 500;
    daoju = [];
    enemy = [];
    score = 0;
    gameTime = 0;
    player = new Player(4, 250, 400, 1, 1, 4, 0);
    player.draw(ctx);
}
//数字补零
function formatZero(num, len) {
    if (String(num).length < len) {
        let score = num;
        for (let i = 0; i <= len - String(num).length; i++) {
            score = '0' + score
        }
        return score;
    } else {
        return 99999999;
    }
}
//生成[a,b)间的随机数
function mathAnd(a, b) {
    let result = Math.random() * (b - a) + a;
    return parseInt(result);
}
//分数更新
function scoreupdata() {
    scoreDiv.innerHTML = '|' + formatZero(score + parseInt(gameTime), 8) + '|';//总分数为score加上时间
}

//道具的碰撞检测和删除
function daojuisCrashandDelete() {
    //console.log(daoju.length);
    for (let i = 0; i < daoju.length; i++) {
        //console.log('编号'+i)
        v.isCrash(player);
        if (v.status == 2) {
            daoju.splice(i, 1);
        }
    }
}
//玩家碰撞检测
function playerisCrash() {
    //判断玩家是否与敌人发生撞击
    for (let i = 0; i < enemy.length; i++) {
        player.isCrash(enemy[i]);
    }
}
//敌人碰撞检测，和删除敌人
function enemyisCrashandDelete() {
    //检测敌人碰撞若碰撞更改敌人状态，根据敌人的状态将不符合要求删除。
    for (let i = 0; i < enemy.length; i++) {
        //检测碰撞
        enemy[i].isCrash(player);
        for (v of player.magazineClip) {
            if (enemy[i].isCrash(v)) {
                v.status = 2;
            }
        }
        if (enemy[i].status == 2) {
            enemy.splice(i, 1);
        }
    }
}
//敌人生成 随着分数的增加 难度增加
function enemyMake() {

    //当分数小于100时会生成4个敌人
    if (score + gameTime < 100) {
        while (enemy.length < 3) {
            enemy.push(makeEnemy01());
        }
    } else if (score + gameTime >= 100 && score + gameTime < 500) {
        while (enemy.length < 4) {
            if (Math.random() > 0.7) {
                enemy.push(makeEnemy03());
            } else {
                enemy.push(makeEnemy01());
            }
        }
    } else if (score + gameTime >= 500) {
        while (enemy.length < 5) {
            let a = Math.random();
            if (a > 0.8) {
                enemy.push(makeEnemy02());
            } else if (a > 0.6) {
                enemy.push(makeEnemy03());
            } else {
                enemy.push(makeEnemy01());
            }
        }
    }

    //测试ing
    // while (enemy.length < 4) {
    //     enemy.push(makeEnemy03());
    // }
}
//随机生成道具
function daojuMake() {
    if (gameTime + score > daojusorce) {

        let dao = new Daoju(Math.random() * 500, Math.random() * (-300), daojuText[parseInt(Math.random() * 2)])
        daoju.push(dao);
        daojusorce+=500;
    }
}
//进行游戏
function Game() {
    gameTimer = setInterval(function () {
        ctx.clearRect(0, 0, 500, 500)
        if (player.status != 1) {
            gameTime += 0.01;//更新游戏时间
        }
        scoreupdata();//更新分数
        daojuisCrashandDelete();//道具碰撞检测，和删除道具
        daojuMake();//随机发送道具
        enemyisCrashandDelete();//敌人碰撞检测，和删除敌人
        playerisCrash();//玩家碰撞检测
        enemyMake();//敌人生成

        for (v of player.magazineClip) {
            v.move(ctx);
        }//子弹移动
        player.move(ctx, mX, mY);//玩家移动
        for (v of enemy) {
            //console.log(v.x+"  "+v.y);
            v.updata(ctx);
        }//敌人移动
        for (v of daoju) {
            v.updata(ctx);

        }


    }, 10);

}

//点击按钮开始游戏
startBtn.onclick = () => {
    if (playStatus == 0) {
        playStatus = 1;
        startBtn.innerHTML = 'PAUSE';
        clearInterval(gameTimer);
        initGame();
        Game();
    } else if (playStatus == 1) {
        playStatus = 2;
        startBtn.innerHTML = 'RESUME';
        clearInterval(gameTimer);
    } else {
        playStatus = 1;
        startBtn.innerHTML = 'PAUSE';
        Game();
    }

}