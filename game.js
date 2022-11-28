//获取document元素
let startBtn = document.getElementById('startBtn');
let gameWindow = document.getElementById('gameWindow');

//参数定义
let ctx = gameWindow.getContext('2d');
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
    player = new Player(3, 250, 400, 3, 1, 4, 0);
    player.draw(ctx);
}

//进行游戏
function Game() {
    gameTimer = setInterval(function () {
        ctx.clearRect(0, 0, 500, 500)
        player.fire();
        for(blt of player.magazineClip){
            blt.move(ctx);
        }
        player.move(ctx, mX, mY);
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