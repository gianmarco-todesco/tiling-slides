const slide = {
    name:"penrose2"    
}

let app;

async function initPixi() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'lightgray',
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        // autoStart: false,
        // backgroundColor: 0x333333,
        resolution: window.devicePixelRatio
        
    });
    document.body.appendChild(app.canvas);
    app.stage.eventMode = 'dynamic';
    app.stage.position.set(app.canvas.width/2,app.canvas.height/2);
    buildScene();
}

function setup() {
    initPixi();
    /*
    document.addEventListener('keydown', (e) => {
        console.log(e);
        if(e.key == '0') foo(0);
        else if(e.key == '1') foo(1);
        else if(e.key == '2') foo(2);
        else if(e.key == '3') foo(3);
        else if(e.key == '4') foo(4);
        
    })
        */
}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    app.destroy();
    app = null;
}

function addDot(p) {
    let g = new PIXI.Graphics().circle(p.x,p.y,5).fill('red').stroke('black');
    app.stage.addChild(g);
    return g;
}

touched = {}
stack = [];
let cur = 0;
let filter;


function buildScene() {
    let y = ptsTable['tL'][1].y * 0.8;
    let s = 20;
    let globalMatrix = new PIXI.Matrix().translate(0,-y).scale(s,s);
    const width = app.canvas.width * 3, height = app.canvas.height * 3;
    let startTime = performance.now();
    let patch = buildPatch('tL',10,globalMatrix, width*0.4, height*0.4);
    console.log("patch:", performance.now() - startTime);
    window.patch = patch;
    startTime = performance.now();    
    patch.placeTiles(app.stage, 2000);
    console.log("tiles:", performance.now() - startTime);

    patch.cells.forEach((cell,i) => cell.index = i);

    let scale = 1.0;
    document.addEventListener('wheel', (e)=>{
        console.log(e);
        scale = Math.max(0.1, Math.min(5.0, scale * Math.exp(-e.deltaY*0.002)));
        app.stage.scale.set(scale,scale);
        console.log(scale);
    })

    filter = new PIXI.ColorMatrixFilter(); 
    filter.hue(60);
    setInterval(foo, 100)
}

function foo() {
    if(stack.length > 0) {
        let cell = stack.pop();
        for(let edge of cell.edges) {
            if(edge.tween && (edge.tween.cell.key.startsWith('T'))) {
                let other = edge.tween.cell;
                if(!touched[other.index]) {
                    touched[other.index] = true;
                    other.itm.filters = [filter];
                    stack.push(other);
                }    
            }
        }
    } else {
        while(cur < patch.cells.length) 
        {
            let cell = patch.cells[cur];
            if(!touched[cell.index] && cell.key.startsWith('T'))
                break;
            cur++;
        }
        if(cur < patch.cells.length) 
        {
            let cell = patch.cells[cur];
            cur++;
            touched[cell.index] = true;
            stack.push(cell);
            cell.itm.filters = [filter];
        }
        
    }
}


