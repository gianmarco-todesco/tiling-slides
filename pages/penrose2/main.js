const slide = {
    name:"penrose2"    
}

let app;

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
    buildScene();
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
    // PIXI.Assets.unload(HORSES_URL);
    app.destroy();
    app = null;
}


function buildScene() {
    // let a = place(tLprotoTile, new PIXI.Matrix())
    
    let center = tLpts.reduce((a,b)=>a.add(b)).multiplyScalar(1/3);
    let s = 30;
    let matrix = new PIXI.Matrix().translate(-center.x,-center.y).scale(s,s);
    let startTime = performance.now();
    build(1,12,matrix);
    console.log(performance.now() - startTime)
    //let g = new PIXI.Graphics().circle(0,0,5).fill('magenta');
    //app.stage.addChild(g);
    /*
    place(tLprotoTile, mat11);
    place(TLprotoTile, mat12);
    */
       
}