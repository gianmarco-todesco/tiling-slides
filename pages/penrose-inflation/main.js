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

function foo(level) {
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

function foo2(level) {
    // clear
    while(app.stage.children.length>0) {
        app.stage.children.at(-1).destroy();
    }

    let s = 2; // 0.7;
    let global = new PIXI.Matrix().scale(s,s).translate(0,-400);

    let patch = buildPatch('tL',1,global);
    window.patch = patch;
    patch.placeTiles();

    /* // show connection
    let g = new PIXI.Graphics();
    for(let cell of patch.cells) {
        for(let edge of cell.edges) {
            if(edge.tween != null) {
                let p0 = cell.center;
                let p1 = edge.tween.cell.center;
                p1 = lerp(p0,p1,0.47);
                g.moveTo(p0.x,p0.y);
                g.lineTo(p1.x,p1.y);
                g.stroke({color:'red', width:3})
            }            
        }
    }
    app.stage.addChild(g);
    */

    /* // show border
    let g2 = new PIXI.Graphics();
    for(let i=0; i<3; i++) {
        let color = ['red','green','blue'][i];
        for(let edge of patch.edges[i]) {
            let pa = edge.pa;
            let pb = edge.pb;
            let c = lerp(pa,pb,0.5);
            let v = pb.subtract(pa);
            let pc = c.add(new PIXI.Point(-v.y,v.x).multiplyScalar(0.2));
            g2.poly([pa,pc,lerp(pc,pb,0.5)], false).stroke(color)
        }
    }
    app.stage.addChild(g2);
    */
   /*
    let g2 = new PIXI.Graphics();
    for(let i=0; i<3; i++) {
        for(let edge of patch.edges[i]) {
            if(edge.i != 0) continue;
            let pa = edge.pa;
            let pb = edge.pb;
            let c = lerp(pa,pb,0.5);
            let v = pb.subtract(pa);
            let pc = c.add(new PIXI.Point(-v.y,v.x).multiplyScalar(0.2));
            g2.poly([pa,pc,lerp(pc,pb,0.5)], false).stroke('black')

            if(edge.cell.key == "TL") {
                let g3 = new PIXI.Graphics(TRprotoTile);
                let matrix = getFourPointsTransform(
                    TRpts[1], TRpts[2],
                    pa,pb
                );
                g3.alpha = 0.2;
                g3.setFromMatrix(matrix);
                app.stage.addChild(g3);
            } else if(edge.cell.key == "TR") {
                let g3 = new PIXI.Graphics(TLprotoTile);
                let matrix = getFourPointsTransform(
                    TLpts[1], TLpts[2],
                    pb,pa
                );
                g3.alpha = 0.2;
                g3.setFromMatrix(matrix);
                app.stage.addChild(g3);
            }
        }
    }
    app.stage.addChild(g2);
    */

    // dot = addDot({x:0,y:0});


/*
    let L = build2(1,level,global);
    L.forEach(itm=>itm.placeTile())
    window.L = L;
*/
}

function createRhomb(tT, level) {
    let container = new PIXI.Container();

    let key = tT + 'L';
    
    let d = lerp(ptsTable[key][1], ptsTable[key][2], 0.5);
    let matrix = new PIXI.Matrix().translate(0,-d.y);
    let patch = buildPatch(key,level,matrix);
    patch.placeTiles(container);
    patch.placeTweens(container);
    matrix = new PIXI.Matrix().rotate(Math.PI).translate(0,d.y);
    patch = buildPatch(tweenKeyTable[key],level,matrix);
    patch.placeTiles(container);
    patch.placeTweens(container);
    
    app.stage.addChild(container);
    return container;
}

let c1, c2;

function buildScene() {
    

    foo(0)
    // foo2(1);
}

function foo(level) {
    if(c1) c1.destroy();
    if(c2) c2.destroy();
    c1 = createRhomb('t',level);
    c1.scale.set(0.6,0.6)
    c1.position.x -= 150;
    c2 = createRhomb('T',level);
    c2.scale.set(0.6,0.6);
    c2.position.x += 100;
    
}