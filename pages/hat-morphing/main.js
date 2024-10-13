const slide = {
    name:"hat-morphing"    
}

let app, model, director;

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

function setup() {
    initPixi();
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


function drawPolygon(pts) {
    let g = new PIXI.Graphics().poly(pts,true).stroke({color:'black', width:1.5});
    app.stage.addChild(g);
    return g;
}

class Painter {
    constructor(model, container = app.stage) { 
        this.model = model;
        this.matrix = new PIXI.Matrix(); 
        this.pool = [];
        this.items = [];
        this.container = container;
    }
    clear() {
        this.items.forEach(itm => {
            itm.visible = false;
            this.container.removeChild(itm);
            itm.clear();
            this.pool.push(itm);
        })
        this.items.length = 0;
    }
    newG() {
        let g;
        if(this.pool.length == 0) {
            g = new PIXI.Graphics();
        } else {
            g = this.pool.pop();
            g.visible = true;
        }
        this.items.push(g);
        return g;
    }
    shape(s) {
        const model = this.model;
        let pts = s.pts.map(p=>model.getPoint(p));
        // console.log(pts, label, color)
        let g = this.newG();
        g.poly(pts.map(p=>this.matrix.apply(p)), true)
            .stroke({color:"cyan", width:3, join:'round'});
        this.container.addChild(g)
    }
}

let painter;

function foo(param) {
    painter.clear();
    model.setAb(param);
    model.sys.H8.accept(painter);
}

class ShapeCollector {
    constructor() {
        this.shapes = [];
    }
    shape(s) {
        this.shapes.push(s);
    }
}


// (0,0),(1,0) => p0,p1
function getTwoPointsTransform(p0, p1) {
    let e0 = p1.subtract(p0);
    let e1 = new PIXI.Point(-e0.y,e0.x);
    return new PIXI.Matrix(e0.x,e0.y,e1.x,e1.y,p0.x,p0.y);
}

// p0,p1 => p2,p3
function getFourPointsTransform(p0,p1,p2,p3) {
    let mat1 = getTwoPointsTransform(p0,p1).invert();
    let mat2 = getTwoPointsTransform(p2,p3);
    return mat2.append(mat1);
}

function getFourPointsFlippedTransform(p0,p1,p2,p3) {
    let mat1 = getTwoPointsTransform(p0,p1).invert();
    let mat2 = new PIXI.Matrix().scale(1,-1);
    let mat3 = getTwoPointsTransform(p2,p3);
    return mat3.append(mat2).append(mat1);
}

let sc;

class Painter2 {
    constructor(model) {
        this.model = model;
        let sc = new ShapeCollector();
        model.sys.H8.accept(sc);
        this.shapes = sc.shapes;

        let baseMatrix = this.baseMatrix = new PIXI.Matrix().scale(10,10);
        // let pts = this.pts = model.getPoints(model.pts).map(p=>baseMatrix.apply(p));    
        const prototile = this.prototile = new PIXI.GraphicsContext()       
        this.container = new PIXI.Container();
        app.stage.addChild(this.container);
        this.items = this.shapes.map(s=>{
            let g = new PIXI.Graphics(prototile);
            this.container.addChild(g);
            s.g = g;
            return g;
        });        
    }

    updateMatrix(shape) {
        const baseMatrix = this.baseMatrix;
        const pts = this.pts;
        let qs = shape.getPoints().map(p=>baseMatrix.apply(p));
        if(shape.label == 'flipped')
        {
            shape.matrix = getFourPointsFlippedTransform(pts[1],pts[0], qs[12], qs[13]);
        }
        else 
        {
            shape.matrix = getFourPointsTransform(pts[0],pts[1], qs[0], qs[1]);
        }
    }

    updatePrototile() {
        const baseMatrix = this.baseMatrix;

        let pts = this.pts = model.getPoints(model.pts).map(p=>baseMatrix.apply(p));    
        this.prototile.clear().poly(pts,true).fill('yellow').stroke({color:'black', width:1.5})
    }

    paint(value) {
        value = Math.max(0.0001, Math.min(1.0, value));
        this.model.setAb(value);
        this.updatePrototile()        
        this.shapes.forEach(shape=>{
            this.updateMatrix(shape);
            shape.g.setFromMatrix(shape.matrix);
        })
    }



}

function buildScene() {
    model = h7h8(4);
    // model.setAb(0.5);


    painter = new Painter2(model);

    painter.paint(0.5);

    PIXI.Ticker.shared.add((ticker)=>{
        let value = 0.5+0.5*Math.sin(performance.now()*0.001);
       //  painter.paint(value);
        // foo()
    });
    return;


    painter = new Painter(model);
    painter.matrix =  new PIXI.Matrix().scale(10,10);
    

    let mat2 = new PIXI.Matrix().scale(10,10).translate(0,-150);
    let pts = model.getPoints(model.pts).map(p=>mat2.apply(p));
    
    let g = new PIXI.Graphics().poly(pts,true).fill('red'); app.stage.addChild(g)
    
    sc = new ShapeCollector();
    model.sys.H8.accept(sc);

    sc.shapes.forEach(shape=>{
        let qs = shape.getPoints().map(p=>painter.matrix.apply(p));
        if(shape.label == 'flipped')
        {
            let j = 1;
            shape.matrix = getFourPointsFlippedTransform(pts[1],pts[0], qs[12], qs[13]);
        }
        else 
        {
            shape.matrix = getFourPointsTransform(pts[0],pts[1], qs[0], qs[1]);
        }

        let g2 = g.clone();
        g2.setFromMatrix(shape.matrix);
        app.stage.addChild(g2);
    })
    model.sys.H8.accept(painter);



    

}

