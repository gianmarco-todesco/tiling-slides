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
        this.position.subtract(e.global, dragOffset)
        function onDrag(e) {
            e.global.add(dragOffset, obj.position);
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


function smoothStep(t, t0, t1) {
    if(t<t0) return 0;
    else if(t>t1) return 1;
    else return (1-Math.cos(Math.PI*(t-t0)/(t1-t0)))*0.5;
}

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
    PIXI.Assets.unload(HORSES_URL);
    app.destroy();
    app = null;
}
