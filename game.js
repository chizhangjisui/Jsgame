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

//子弹类
class Bullet {
    x;
    y;
    color;
    R;
    speed;
    status = 0;//0没有发射处于弹夹中，1处于发射状态，2击中目标状态
    long = 0;//记录子弹飞行的距离
    Maxlong = 490;//子弹飞行的最大距离
    orientation;//子弹方向
    constructor(R, speed, color) {
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
        if (this.status == 1) {
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
        this.status = 1;
    }
}
//玩家类
class Player {
    HP;
    x;
    y;
    atk;
    df;
    speed;
    BulletSpeed = 6;
    bullet_cth = 0;//将要发射的第n个子弹
    fireTiming = 0;//计算上次发射子弹的时间 
    fireTime = 500;//发射子弹的间隔时间
    atkMethod;//0普通攻击模式，1散射攻击模式，2激光攻击模式
    magazineClip = [];//弹夹
    constructor(HP, x, y, atk, df, speed, atkMethod) {
        this.HP = HP;
        this.x = x;
        this.y = y;
        this.atk = atk;
        this.df = df;
        this.speed = speed;
        this.atkMethod = atkMethod;
        for (let i = 0; i < 20; i++) {//初始化弹夹
            console.log('初始化弹夹');
            this.magazineClip.push(new Bullet(3, this.BulletSpeed, 'rgb(244,244,244)'));
        }
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.arc(this.x, this.y, 15, 0, 2 * Math.PI, false);
        ctx.fill();
    }
    fire() {
        this.fireTiming += 10;
        if (this.fireTiming > this.fireTime) {
            console.log('发射')
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
        if (((x - this.x) ** 2 + (y - this.y) ** 2) ** 0.5 < 4) {//防止出现抖动
            this.draw(ctx);
        } else {
            this.x = this.x + this.speed * (x - this.x) / (((x - this.x) ** 2 + (y - this.y) ** 2) ** 0.5);
            this.y = this.y + this.speed * (y - this.y) / (((x - this.x) ** 2 + (y - this.y) ** 2) ** 0.5);
            this.draw(ctx);
        }

    }
}
//敌人类
class Enemy {
    name;
    x;
    y;
    HP;
    R;
    speed;
    score = 10;//击杀后可以获得的分数
    status = 0;//0存活，1被击中，2要求删除

    //爆炸动画
    booAnimation;
    constructor(name, x, y, HP, R, speed) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.HP = HP;
        this.R = R;
        this.speed = speed;
        this.booAnimation = new BooAnimation(this.R, 0.1, 'rgb(165,255,45)');
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.fillStyle = 'rgb(165,255,45)';
        ctx.arc(this.x, this.y, this.R, 0, Math.PI * 2, false);
        ctx.fill();
    }
    move(ctx) {
        if (this.status == 0) {
            this.y = this.y + this.speed;
            this.draw(ctx);
            if (this.y > 550) {
                this.status = 2;
            }
        }
        if (this.status == 1) {
            if (this.booAnimation.drew(ctx, this.x, this.y)) {
                this.status = 2;
            };

        }
    }
    //判断子弹是否击中
    isCrash(blt) {
        if (((blt.x - this.x) ** 2 + (blt.y - this.y) ** 2) ** 0.5 < this.R && blt.status == 1&&this.status == 0) {
            this.HP -= player.atk;
            if (this.HP <= 0) {
                score += this.score;
                this.status = 1;
            }
            return true;
        }
        return false;
    }
}

class BooAnimation {
    R;
    color;
    stutas = 1;
    timer = 0;
    time = 100;//爆炸持续时间

    //动画所要的参数
    r = 0;
    v = 5;//爆炸变化速度

    constructor(R, v, color) {
        this.R = R;
        this.r = R;
        this.v = v;
        this.color = color;
    }
    drew(ctx, X, Y) {
        this.timer++;
        if (this.timer > this.time) {
            return true;
        }

        for (let i = 0; i < Math.PI * this.R * 0.5; i++) {
            this.r += this.v;
            if (this.r > this.R * 1.3) {
                this.v = -this.v;
            }
            if (this.r < -this.R) {
                this.v = -this.v;
            }
            let R = parseInt(Math.random() * (this.r + 1));
            let x = Math.random() * R * ((-1) ** (parseInt(Math.random() * 2) + 1)) + X;
            let y = (-1) ** (parseInt(Math.random() * 2) + 1) * ((R ** 2 - ((x - X) ** 2)) ** 0.5) + Y;
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(x, y, 2, R, Math.PI * 2, false);
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
    player = new Player(3, 250, 400, 1, 1, 4, 0);
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
//敌人类型一
function makeEnemy01() {
    let R = mathAnd(10, 40);//半径随机
    let HP = R / 10;//半径越大，HP越多
    let speed = 2 - 2 * HP / 4;//HP越多，速度越慢
    let enemy01 = new Enemy('石头', 30 + Math.random() * 470, Math.random() * (-300), HP, R, speed);
    return enemy01;
}
//敌人生成与删除 随着分数的增加 难度增加
function enemyMake() {
    //检测敌人与子弹碰撞若碰撞更改敌人状态，根据敌人的状态将不符合要求删除。
    for (let i = 0; i < enemy.length; i++) {
        //检测子弹碰撞
        for (v of player.magazineClip) {
            if (enemy[i].isCrash(v)) {
                v.status = 2;
            }
        }
        if (enemy[i].status == 2) {
            enemy.splice(i, 1);
        }
    }
    //当分数小于100时会生成4个敌人
    // if (score + gameTime < 100) {
    //     while(enemy.length<4){
    //         enemy.push(makeEnemy01());
    //     }
    // }

    //测试ing
    while (enemy.length < 4) {
        enemy.push(makeEnemy01());
    }
}
//进行游戏
function Game() {
    gameTimer = setInterval(function () {
        ctx.clearRect(0, 0, 500, 500)
        gameTime += 0.01;//更新游戏时间
        scoreupdata();//更新分数
        enemyMake();//敌人生成
        player.fire();//自动开火
        for (v of player.magazineClip) {
            v.move(ctx);
        }//子弹移动
        player.move(ctx, mX, mY);//玩家移动
        for (v of enemy) {
            v.move(ctx);
        }//敌人移动

    }, 10);

}

//点击按钮开始游戏
startBtn.onclick = () => {
    if (playStatus == 0) {
        playStatus = 1;
        startBtn.innerHTML = 'PAUSE';
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