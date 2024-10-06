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
    // PIXI.Assets.unload(HORSES_URL);
    app.destroy();
    app = null;
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
    build(2,level,matrix);
    matrix = global.clone().append(new PIXI.Matrix().rotate(Math.PI).translate(0,d.y));
    build(4,level,matrix);

    global =  new PIXI.Matrix().scale(s,s).translate(200,0);

    d = tLpts[1].add(tLpts[2]).multiplyScalar(0.5);
    matrix = global.clone().append(new PIXI.Matrix().translate(0,-d.y));
    build(1,level,matrix);
    matrix = global.clone().append(new PIXI.Matrix().rotate(Math.PI).translate(0,d.y));
    build(3, level,matrix);
    

}

function buildScene() {
    


    foo(1);
    
       
}