"use strict";

const slide = {
    name:"symmetry-break"    
}

let app;


function makeDraggable(obj, cb = null) {
    const dragOffset = new PIXI.Point(0,0);
    console.log("qua")
    obj.on('pointerdown', function(e) {  
        if(e.button != 1) return;
        e.preventDefault();
        this.position.subtract(e.global, dragOffset)
        function onDrag(e) {
            e.global.add(dragOffset, obj.position);
            console.log(obj.position);
            if(cb) cb(obj.position);
        } 
        function dragEnd(e) {
            app.stage.off('globalpointermove', onDrag)
            app.stage.off('pointerup', dragEnd)
            app.stage.off('pointerupoutside', dragEnd)
        }
        app.stage.on('globalpointermove', onDrag)
        app.stage.on('pointerup', dragEnd)
        app.stage.on('pointerupoutside', dragEnd)
    });
}

let winBounds;

async function initPixi() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'gray',
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

let param = 0.0;
let paramTarget = 0.0;

function buildScene() {
    const unit = 80.0; // 55.0;
    const r = unit;


    let mrg = -20;
    let x1 = app.canvas.width/2-mrg;
    let y1 = app.canvas.height/2-mrg;
    winBounds = {x0:-x1,y0:-y1,x1,y1};
    

    let hexPts = getRegularPolygonPoints(6,r);
    let squarePts = getAdjacentRegularPolygonPoints(hexPts, 0, 4);
    let triPts = getAdjacentRegularPolygonPoints(squarePts, 1, 3);
    
    let hexShape = new PIXI.GraphicsContext().poly(hexPts,true).fill('yellow').stroke('black');
    let squareShape = new PIXI.GraphicsContext().poly(squarePts,true).fill('cyan').stroke('black');
    let triangleShape = new PIXI.GraphicsContext().poly(triPts,true).fill('blue').stroke('black');



    let d1 = hexPts[0].add(hexPts[5]).multiplyScalar(1+1/Math.sqrt(3));
    let d2 = hexPts[0].add(hexPts[1]).multiplyScalar(1+1/Math.sqrt(3));

    let grid = createGrid(new PIXI.Point(0,0), d1,d2, winBounds);
    window.grid = grid;
    let container = new PIXI.Container();
    app.stage.addChild(container);

    for(let gridItm of grid) {
        const {p,i,j} = gridItm;
        // if(!(i==0 && -4<=j && j<4)) continue;
        if(i==0 && j==0) continue;
        // if(!(i==-1 && j==0)) continue;
        // if(gridItm.i== -1 && gridItm.j==0) continue;
        let g = new PIXI.Graphics(hexShape); container.addChild(g);
        g.position.copyFrom(p);

        let q = [true,true,true];
        let t = [true,true,false];

        if(i==-1 && j==0) t[0] = false;
        else if(i==1 && j==0) q[2] = false;
        else if(i==1 && j==-1) q[1] = t[1] = false;
        else if(i==0 && j==-1) q[0] = t[0] = t[1] = false;

        for(let i=0; i<3; i++) {
            let phi = Math.PI*2*i/6;
            if(q[i]) {
                g = new PIXI.Graphics(squareShape); container.addChild(g);
                g.rotation = phi;
                g.position.copyFrom(p);    
            }
            if(t[i]){
                g = new PIXI.Graphics(triangleShape); container.addChild(g);
                g.rotation = phi;
                g.position.copyFrom(p);    
            }
        }    

    }
    let wheel = new PIXI.Container();
    container.addChild(wheel);
    let g = new PIXI.Graphics(hexShape); wheel.addChild(g);
    for(let i=0; i<6; i++) {
        let phi = Math.PI*2*i/6;
        g = new PIXI.Graphics(squareShape); wheel.addChild(g);
        g.rotation = phi;
        g = new PIXI.Graphics(triangleShape); wheel.addChild(g);
        g.rotation = phi;
    }

    // console.log(grid);
 

    let gBounds = new PIXI.Graphics();
    drawRect(gBounds,-x1,-y1,x1,y1);
    gBounds.stroke({color:'green', width:2})
    app.stage.addChild(gBounds);
    

    PIXI.Ticker.shared.add(ticker=>{
        let t = performance.now() * 0.0005;
        const dt = ticker.elapsedMS * 0.001;
        if(param < paramTarget) {
            param = Math.min(paramTarget, param + dt);
        } else if(param > paramTarget) {
            param = Math.max(paramTarget, param - dt);
        }
        wheel.rotation = Math.PI/6 * smoothStep(param, 0, 1);
        // foo(new PIXI.Point(-220,0),t)
        // console.log(grid)
       // dotSet.set(grid)
    });

}

/*
let dotSet = new DotSet();

function foo(p0, phi) {
    const r = 50;
    let grid = createGrid(p0, 
        new PIXI.Point(Math.cos(phi)*r,Math.sin(phi)*r),
        new PIXI.Point(Math.cos(phi+Math.PI/3)*r,Math.sin(phi+Math.PI/3)*r),
        winBounds);
    // console.log(grid);
    dotSet.set(grid)
}
*/


function setup() {
    initPixi();
    document.addEventListener('keydown', (e) => {
        if(e.key == '1') paramTarget = 0.0;
        else if(e.key == '2')paramTarget = 1.0;
        console.log(e);
    })
}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    app.destroy();
    app = null;
}
