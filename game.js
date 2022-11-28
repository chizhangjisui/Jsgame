//获取document元素
let startBtn = document.getElementById('startBtn');
let gameWindow = document.getElementById('gameWindow');

//参数定义
let ctx = gameWindow.getContext('2d');
let mX;//鼠标坐标
let mY;
let playStatus = 0;//0表示游戏还没有开始状态,1表示正在进行游戏状态，2表示游戏在暂停状态
let gameTimer;
let player;//玩家
let enemy = [];//敌人


//玩家类
class Player {
    HP;
    x;
    y;
    atk;
    df;
    speed;
    atkMethod;//0普通攻击模式，1散射攻击模式，2激光攻击模式
    constructor(HP, x, y, atk, df, speed, atkMethod) {
        this.HP = HP;
        this.x = x;
        this.y = y;
        this.atk = atk;
        this.df = df;
        this.speed = speed;
        this.atkMethod = atkMethod;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, 2 * Math.PI, false);
        ctx.fill();
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

//初始化游戏
function initGame() {
    console.log('初始化游戏');
    player = new Player(3, 250, 400, 3, 1, 4, 0);
    player.draw(ctx);
}

//进行游戏
function Game() {
    console.log('游戏中！');
    gameTimer = setInterval(function () {
        console.log('游戏进行中！');
        ctx.clearRect(0, 0, 500, 500)
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