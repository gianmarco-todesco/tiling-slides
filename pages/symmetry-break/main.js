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

async function initPixiAndLoadTexture() {
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

    let g = new PIXI.Graphics();
    const unit = 40.0; // 55.0;
    const r = unit;
    let pts = getRegularPolygonPoints(6,r);
    g.poly(pts,true); // drawPolygon(g, pts);
    g.fill('yellow');
    g.stroke('black');
    let outPts = [];
    for(let i = 6-1; i<6+2; i++) {
        let squarePts = getAdjacentRegularPolygonPoints(pts, i, 4);
        g.poly(squarePts, true);
        g.fill('cyan');
        g.stroke('black');
        if(i>5) {
            let tPts = getAdjacentRegularPolygonPoints(squarePts, 1, 3);
            g.poly(tPts, true);
            g.fill('blue');
            g.stroke('black');
            outPts.push(squarePts[2]);
    
        }
        /*
        tPts = getAdjacentRegularPolygonPoints(squarePts, 3, 3);
        drawPolygon(g,tPts);
        g.fill('magenta');
        g.stroke('black');
        */
    }
    app.stage.addChild(g)

    outPts.forEach(p=>{
        createDot(p.x,p.y);
    })


    let d1 = pts[0].add(pts[5]).multiplyScalar(1+1/Math.sqrt(3)+0.1);
    let d2 = pts[0].add(pts[1]).multiplyScalar(1+1/Math.sqrt(3)+0.1);

    function placeCopy(i,j) {
        let g2 = g.clone();
        app.stage.addChild(g2)
        let p = d1.multiplyScalar(i).add(d2.multiplyScalar(j));
        g2.position.set(p.x,p.y);    
    }

    placeCopy(-2,0);
    // placeCopy(-1,0);
    placeCopy(1,0);
    placeCopy(2,0);

    placeCopy(-2,1);
    placeCopy(-1,1);
    placeCopy( 0,1);
    placeCopy( 1,1);
    
    placeCopy(-1,-1);
    // placeCopy( 0,-1);
    // placeCopy( 1,-1);
    placeCopy( 2,-1);

    placeCopy( 0,-2);
    placeCopy( 1,-2);
    placeCopy( 2,-2);

    let gBounds = new PIXI.Graphics();
    let mrg = 100;
    let x1 = app.canvas.width/2-mrg;
    let y1 = app.canvas.height/2-mrg;
    drawRect(gBounds,-x1,-y1,x1,y1);
    gBounds.stroke({color:'green', width:2})
    app.stage.addChild(gBounds);
    winBounds = {x0:-x1,y0:-y1,x1,y1};


    PIXI.Ticker.shared.add(ticker=>{
        let t = performance.now() * 0.0005;
        // foo(new PIXI.Point(-220,0),t)
        // console.log(grid)
       // dotSet.set(grid)
    });
    /*

    makeDraggable(app.stage);


    let gc = new PIXI.GraphicsContext();
    const unit = 55.0;
    gc.moveTo(-unit,-unit);gc.lineTo(unit,-unit).lineTo(unit,unit).closePath()
    gc.fill('orange');
    gc.moveTo(-unit,-unit);gc.lineTo(unit,unit).lineTo(-unit,unit).closePath();
    gc.fill('cyan');
    let m = 10;
    let curg;
    for(let i=-m;i<=m;i++) {
        for(let j=-m;j<=m;j++) {
            let g = new PIXI.Graphics(gc);
            g.position.set(2.05*unit*j, 2.05*unit*i);
            if(i==0 && j==0) curg=g;
            else app.stage.addChild(g);
        }
    }
    app.stage.addChild(curg);

    PIXI.Ticker.shared.add(ticker=>{
        let t = performance.now() * 0.0005;
        t -= Math.floor(t);
        let q = smoothStep(t, 0, 0.1) - smoothStep(t, 0.5, 0.6);
        curg.rotation = q * Math.PI/2

    })
    */
}

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

function setup() {
    initPixiAndLoadTexture();
    document.addEventListener('keydown', (e) => {
        console.log(e);
    })
}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    app.destroy();
    app = null;
}
