const slide = {
    name:"pixi-template"    
}

let app;

async function initPixiAndLoadTexture() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'white',
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
        if(e.key == '1') {
            grid1.visible=true;
            grid2.visible=false;
            quadGroup.visible=false;
            hat.visible=false;
        }
        else if(e.key == '2') {
            grid1.visible=false;
            grid2.visible=true;
            quadGroup.visible=false;
            hat.visible=false;
        } else if(e.key == '3') {
            grid1.visible=false;
            grid2.visible=true;
            quadGroup.visible=true;
            hat.visible=false;
        } else if(e.key == '4') {
            grid1.visible=false;
            grid2.visible=false;
            quadGroup.visible=false;
            hat.visible=true;
        }
        console.log(e);
    })

    

}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    app.destroy();
    app = null;
}

const unit = 100;
const marginScale = 0.98;
const sqrt3_2 = Math.sqrt(3)/2;

let hex, quad, quad2;



function createHex() {
    hex = new PIXI.GraphicsContext();
    const r = unit * marginScale;
    hex.moveTo(r,0);
    for(let i=1;i<6;i++) {
        let phi = Math.PI*2*i/6;
        hex.lineTo(r*Math.cos(phi), r*Math.sin(phi));
    }
    hex.closePath();
    hex.fill('#eeee88');
    hex.stroke({color:'black', width:1.5})
}

function createQuad(color) {
    let quad = new PIXI.GraphicsContext();
    let x = unit * sqrt3_2 * Math.cos(Math.PI/6);
    let y = unit * sqrt3_2 * Math.sin(Math.PI/6);   
    let pts = [[0,0],[x,y],[unit,0],[x,-y]].map(([x,y])=>new PIXI.Point(x,y));
    let center = pts.reduce((a,b)=>a.add(b)).multiplyScalar(1/pts.length);
    let d = center.magnitude();
    let s = (unit * marginScale - d) / (unit - d); 
    pts = pts.map(p=>p.subtract(center).multiplyScalar(s).add(center));
    quad.moveTo(pts[0].x,pts[0].y);
    pts.slice(1).forEach(p=>quad.lineTo(p.x,p.y));
    quad.closePath();   
    quad.fill(color);
    quad.stroke({color:'black', width:1.5})
    return quad;
}


function createHexGrid() {
    
    let grid1 = new PIXI.Container();
    app.stage.addChild(grid1);
    for(let i=-4;i<=4;i++) {
        for(let j=-4;j<=4;j++) {
            let g = new PIXI.Graphics(hex);
            grid1.addChild(g);
            g.position.set(unit*1.5*j, (2*i+(j%2))*unit*sqrt3_2);
        }
    }
    return grid1;
}

function getMatrix(i,j,k) {
    let jodd = j>=0 ? j%2 : (-j)%2;
    return new PIXI.Matrix()
        .rotate(Math.PI*2*k/6)
        .translate(unit*1.5*j, (2*i+jodd)*unit*sqrt3_2)
        
}

function createQuadGrid() {    
    let grid = new PIXI.Container();
    app.stage.addChild(grid);
    for(let i=-4;i<=4;i++) {
        for(let j=-4;j<=4;j++) {
            for(let k=0; k<6;k ++) {
                let g = new PIXI.Graphics(quad);
                g.setFromMatrix(getMatrix(i,j,k));
                grid.addChild(g);
            }
        }
    }
    return grid;
}

function createQuadGroup() {
    quadGroup = new PIXI.Container();
    [[0,0,5],[0,0,0],[0,0,1],[0,0,2],[-1,1,2],[-1,1,3],[0,1,4],[0,1,5]]
    .forEach(([i,j,k])=>{
        let g = new PIXI.Graphics(quad2);
        g.setFromMatrix(getMatrix(i,j,k));
        quadGroup.addChild(g)
    })
    app.stage.addChild(quadGroup)
    return quadGroup;
}

let grid1, grid2;

let quadGroup, hat;

function createHat() {
    let g = new PIXI.Graphics();
    const ux = unit, uy = -unit * sqrt3_2;
    g.moveTo(0,0);
    g.lineTo(0,uy);
    g.lineTo(ux*0.5,uy);
    g.lineTo(ux*0.75,uy*1.5);
    g.lineTo(ux*1.5,uy);
    g.lineTo(ux*1.5,0);
    g.lineTo(ux*2,0);
    g.lineTo(ux*2.25,-uy*0.5);
    g.lineTo(ux*1.5,-uy);
    g.lineTo(ux*0.75,-uy*0.5);
    g.lineTo(ux*0.5,-uy);
    g.lineTo(-ux*0.5,-uy);
    g.lineTo(-ux*0.75,-uy*0.5);
    g.closePath();
    g.fill('cyan')
    g.stroke({color:'#22aadd', width:3})
    app.stage.addChild(g)
    
    return g;
}

function buildScene() {
    createHex();
    quad = createQuad('#eeee88');
    quad2 = createQuad('cyan');

    grid1 = createHexGrid();
    grid1.visible = false;
    grid2 = createQuadGrid();
    grid2.visible = false;

    quadGroup = createQuadGroup();
    quadGroup.visible = false;

    hat = createHat();
    hat.visible = true;

}