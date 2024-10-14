const slide = {
    name:"pixi-template"    
}

let app;

async function initPixiAndLoadTexture() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'black',
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        // autoStart: false,
        // backgroundColor: 0x333333,
        useBackBuffer:true,
        resolution: window.devicePixelRatio
        
    });
    document.body.appendChild(app.canvas);
    app.stage.eventMode = 'dynamic';
    app.stage.position.set(app.canvas.width/2,app.canvas.height/2);


    buildScenes();
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

let g1,g2;

function buildScenes() {
    let r = 200;
    g1 = new PIXI.Graphics().poly([
        {x:-r,y:-r},{x:r,y:-r},{x:r,y:r},{x:-r,y:r}
    ],true).fill('#888888');
    for(let i=0;i<10;i++) {
        let t = i/9;
        let y = (-r + 10) * (1-t) + (r - 10) * t; 
        for(let j=0;j<10; j++) {
            let s = j/9;
            let x = (-r + 10) * (1-s) + (r - 10) * s; 
            g1.circle(x,y,5).fill('#FF8800')
        }
    }
    g2 = new PIXI.Graphics().poly([
        {x:-r,y:-r},{x:r,y:-r},{x:r,y:r},{x:-r,y:r}
    ],true).fill('#777777');
    for(let i=0;i<10;i++) {
        let t = i/9;
        let y = (-r + 10) * (1-t) + (r - 10) * t; 
        for(let j=0;j<10; j++) {
            let s = j/9;
            let x = (-r + 10) * (1-s) + (r - 10) * s; 
            g2.circle(x,y,5).fill('#0077FF')
        }
    }
    app.stage.addChild(g1);
    app.stage.addChild(g2);

    PIXI.Ticker.shared.add((ticker)=>{
        g2.position.x = Math.cos(performance.now()*0.001) * 100;
    });

/*
    class InvertFilter extends PIXI.Filter {
        constructor() {
            super({fragment:"void main(void) { gl_FragColor = vec4(1.0,0.0,0.0,1.0);}"});
        }
    }

    let filter = new InvertFilter();
        
    g2.filters = [filter];
*/
    
    g2.blendMode = 'add';
}