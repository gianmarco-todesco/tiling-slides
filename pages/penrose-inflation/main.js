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
    document.addEventListener('keydown', (e) => {
        console.log(e);
        if(e.key == '0') foo(0);
        else if(e.key == '1') foo(1);
        else if(e.key == '2') foo(2);
        else if(e.key == '3') foo(3);
        else if(e.key == '4') foo(4);
        
    })
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

function foo_obsolete(level) {
    // clear
    while(app.stage.children.length>0) {
        app.stage.children.at(-1).destroy();
    }

    let s = 0.7;
    let global = new PIXI.Matrix().scale(s,s).translate(-200,0);

    let d = TLpts[1].add(TLpts[2]).multiplyScalar(0.5);
    let matrix = global.clone().append(new PIXI.Matrix().translate(0,-d.y));
    buildPatch(2,level,matrix);
    matrix = global.clone().append(new PIXI.Matrix().rotate(Math.PI).translate(0,d.y));
    buildPatch(4,level,matrix);


    global =  new PIXI.Matrix().scale(s,s).translate(200,0);

    d = tLpts[1].add(tLpts[2]).multiplyScalar(0.5);
    matrix = global.clone().append(new PIXI.Matrix().translate(0,-d.y));
    buildPatch(1,level,matrix);
    matrix = global.clone().append(new PIXI.Matrix().rotate(Math.PI).translate(0,d.y));
    buildPatch(3, level,matrix);


}

let dot;

function q(p) {dot.position.copyFrom(p)}

function createRhomb(tT, level) {
    let container = new PIXI.Container();

    let key = tT + 'L';
    
    let d = lerp(ptsTable[key][1], ptsTable[key][2], 0.5);
    let topMatrix = new PIXI.Matrix().translate(0,-d.y);
    let patch = buildPatch(key,level,topMatrix);
    patch.placeTiles(container);
    patch.placeTweens(container);
    let bottomMatrix = new PIXI.Matrix().rotate(Math.PI).translate(0,d.y);
    patch = buildPatch(tweenKeyTable[key],level,bottomMatrix);
    patch.placeTiles(container);
    patch.placeTweens(container);

    if(level>0) {
        let p0 = topMatrix.apply(ptsTable[key][1]);
        let p1 = topMatrix.apply(ptsTable[key][0]);
        let p2 = topMatrix.apply(ptsTable[key][2]);
        let p3 = p0.add(p2).subtract(p1);
        let pts = [p0,p1,p2,p3];
        let g = new PIXI.Graphics();
        for(let i=0; i<4; i++) {
            let pa = pts[i], pb = pts[(i+1)%4];
            let m = 8;
            for(let j = 0; j<m; j++) {
                let pc = lerp(pa,pb,j/m);
                let pd = lerp(pa,pb,(j+0.5)/m);
                g.moveTo(pc.x,pc.y); g.lineTo(pd.x,pd.y);                
            }
        }        
        g.stroke({color:'blue', width:6});
        container.addChild(g);    
    }
    
    app.stage.addChild(container);
    return container;
}

let c1, c2;

function buildScene() {
    foo(0)
}

function foo(level) {
    if(c1) c1.destroy();
    if(c2) c2.destroy();
    let scale = app.canvas.height * 0.001;
    let dx = app.canvas.width * 0.2;
    c1 = createRhomb('t',level);
    c1.scale.set(scale, scale)
    c1.position.x -= dx;
    c2 = createRhomb('T',level);
    c2.scale.set(scale, scale);
    c2.position.x += dx;
    
}