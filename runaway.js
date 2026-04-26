const SIZE = 50;
const gameEl = document.getElementById('game');
const movesEl = document.getElementById('moves');
const resetBtn = document.getElementById('reset');
let grid = [];
let player, monster, exitPos;
let moves = 0;
let turnCounter = 0;

function make2D(n, val){
    return Array.from({length:n}, ()=> Array(n).fill(val));
}

function initPositions(){
    player = {x:1,y:1};
    monster = {x:SIZE-3,y:SIZE-3};
    exitPos = {x:SIZE-2,y:SIZE-2};
}

function generateMaze(){
    grid = make2D(SIZE,1);
    function carve(x,y){
        const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(()=>Math.random()-0.5);
        for(const [dx,dy] of dirs){
            const nx = x+dx, ny = y+dy;
            if(nx>0 && ny>0 && nx<SIZE-1 && ny<SIZE-1 && grid[ny][nx]===1){
                grid[ny][nx]=0;
                grid[y+dy/2][x+dx/2]=0;
                carve(nx,ny);
            }
        }
    }
    grid[1][1]=0;
    carve(1,1);
    grid[exitPos.y][exitPos.x]=0;
}

function render(){
    gameEl.innerHTML='';
    for(let y=0;y<SIZE;y++){
        for(let x=0;x<SIZE;x++){
            const div = document.createElement('div');
            div.className='cell';
            if(grid[y][x]===1) div.classList.add('wall');
            if(x===player.x && y===player.y) div.classList.add('player');
            if(x===monster.x && y===monster.y) div.classList.add('monster');
            if(x===exitPos.x && y===exitPos.y) div.classList.add('exit');
            gameEl.appendChild(div);
        }
    }
    movesEl.textContent = String(moves);
}

function valid(nx,ny){
    return nx>=0 && ny>=0 && nx<SIZE && ny<SIZE && grid[ny][nx]===0;
}

function bfs(start, goal){
    const q = [];
    const visited = make2D(SIZE,false);
    const parent = make2D(SIZE, null);
    q.push([start.x,start.y]);
    visited[start.y][start.x] = true;
    while(q.length){
        const [x,y] = q.shift();
        if(x===goal.x && y===goal.y) break;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
            const nx=x+dx, ny=y+dy;
            if(nx>=0 && ny>=0 && nx<SIZE && ny<SIZE && !visited[ny][nx] && grid[ny][nx]===0){
                visited[ny][nx]=true;
                parent[ny][nx] = [x,y];
                q.push([nx,ny]);
            }
        }
    }
    // reconstruct path from goal to start
    const path = [];
    let cur = [goal.x,goal.y];
    while(parent[cur[1]][cur[0]]){
        path.push(cur);
        cur = parent[cur[1]][cur[0]];
    }
    path.reverse();
    return path; // array of [x,y], first step is next move
}

function moveMonster(){
    const path = bfs({x:monster.x,y:monster.y}, {x:player.x,y:player.y});
    if(path.length>0){
        const [nx,ny] = path[0];
        monster.x = nx; monster.y = ny;
    } else {
        // try any valid move to avoid permanent stuck
        const movesTry = [[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-0.5);
        for(const [dx,dy] of movesTry){
            const nx = monster.x+dx, ny = monster.y+dy;
            if(valid(nx,ny)){
                monster.x = nx; monster.y = ny; break;
            }
        }
    }
}

function plotTwist(){
    // choose an open cell to close, not player or exit or monster
    const open = [];
    for(let y=1;y<SIZE-1;y++){
        for(let x=1;x<SIZE-1;x++){
            if(grid[y][x]===0 && !(x===player.x && y===player.y) && !(x===exitPos.x && y===exitPos.y) && !(x===monster.x && y===monster.y)){
                open.push([x,y]);
            }
        }
    }
    if(open.length>0){
        const [cx,cy] = open[Math.floor(Math.random()*open.length)];
        grid[cy][cx] = 1;
    }
    // open a random wall
    const walls = [];
    for(let y=1;y<SIZE-1;y++){
        for(let x=1;x<SIZE-1;x++){
            if(grid[y][x]===1) walls.push([x,y]);
        }
    }
    if(walls.length>0){
        const [wx,wy] = walls[Math.floor(Math.random()*walls.length)];
        grid[wy][wx] = 0;
    }
    // ensure exit remains reachable from player
    const path = bfs(player, exitPos);
    if(path.length===0){
        // undo the change by regenerating a short corridor between player and exit
        carveCorridorBetween(player, exitPos);
    }
}

function carveCorridorBetween(a,b){
    // simple carve along manhattan route
    let x = a.x, y = a.y;
    while(x !== b.x){
        grid[y][x] = 0;
        x += x<b.x?1:-1;
    }
    while(y !== b.y){
        grid[y][x] = 0;
        y += y<b.y?1:-1;
    }
}

function movePlayer(dx,dy){
    const nx = player.x+dx, ny = player.y+dy;
    if(valid(nx,ny)){
        player.x = nx; player.y = ny;
        moves++;
        turnCounter++;
        moveMonster();
        if(turnCounter % 5 === 0) plotTwist();
        render();
        checkEnd();
    }
}

function checkEnd(){
    if(player.x===monster.x && player.y===monster.y){
        setTimeout(()=>{alert('Game Over. Monster caught you.'); start();},10);
        return;
    }
    if(player.x===exitPos.x && player.y===exitPos.y){
        setTimeout(()=>{alert('You Win. You escaped.'); start();},10);
    }
}

function start(){
    initPositions();
    generateMaze();
    moves = 0; turnCounter = 0;
    render();
}

// input
window.addEventListener('keydown', e=>{
    if(e.key === 'ArrowUp') movePlayer(0,-1);
    if(e.key === 'ArrowDown') movePlayer(0,1);
    if(e.key === 'ArrowLeft') movePlayer(-1,0);
    if(e.key === 'ArrowRight') movePlayer(1,0);
});

resetBtn.addEventListener('click', start);

start();