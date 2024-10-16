const slide = {
    name:"hat-morphing"    
}

let app, model, director;

async function initPixi() {
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


class Act1 extends Act {
    constructor() { 
        super(); 
        this.letters = [];
    }
    start() {
        let model = this.model;
        let sc = new ShapeCollector();
        model.sys.H8.accept(sc);
        this.shapes = sc.shapes;
        let g = this.g = new PIXI.Graphics();
        app.stage.addChild(g);
        this.value = 1.0/(1+Math.sqrt(3));
        this.paint(this.value);
    }

    end() {
        this.letters.forEach(d=>d.destroy());
        this.letters.length = 0;
        if(this.g) { this.g.destroy(); this.g = null; }
    }
    setLetters(pts) {
        if(this.value < 0.2 || this.value > 0.8) {
            this.letters.forEach(letter=>letter.visible=false)
            return;
        }
        console.log(this.letters.length)
        for(let i = 0; i<pts.length; i++) {
            let p1 = pts[i];
            let p2 = pts[(i+1)%pts.length];
            let pm = p1.add(p2).multiplyScalar(0.5);
            let d = p2.subtract(p1).normalize().multiplyScalar(10);
            pm.x += d.y; pm.y += -d.x;
            let txt;
            const letters = ['a','a','b','b','a','a','b','b','a','a','a','a','b','b']
            if(this.letters.length<=i) {
                txt = new PIXI.Text({
                    text: letters[i],
                    // align:'center',
                    anchor: new PIXI.Point(0.5,0.5),
                    style:{
                      fontFamily:'short-stack'
                    }
                  })
                this.letters.push(txt);
                app.stage.addChild(txt);
            } else txt = this.letters[i];
            txt.visible = true;
            txt.x = pm.x;
            txt.y = pm.y;
        }
    }
    drawAngles(g, pts) {
        if(this.value < 0.1 || this.value > 0.9) return;

        for(let i = 0; i<pts.length; i++) {
            let p = pts[i];
            let e1 = pts[(i+1)%pts.length].subtract(p).normalize();
            let e2 = pts[(i+pts.length-1)%pts.length].subtract(p).normalize();
            let dot = e1.dot(e2);
            const r = 10;
            if(Math.abs(dot)<1.0e-6) {
                // angolo retto
                let u1 = e1.multiplyScalar(r);
                let u2 = e2.multiplyScalar(r);                
                g.poly([p.add(u1),p.add(u1).add(u2),p.add(u2)],false).stroke('black')
            } else if(dot > -0.9) {
                g.moveTo(p.x,p.y);
                g.arc(p.x,p.y,r,
                    Math.atan2(e1.y,e1.x),
                    Math.atan2(e2.y,e2.x)).stroke('black');
            } else {
                g.moveTo(p.x,p.y);
                g.arc(p.x,p.y,r*0.75,
                    Math.atan2(e1.y,e1.x),
                    Math.atan2(e2.y,e2.x)
                ).fill('black');    
            }
        }
    }

    paint(value = 0.5) {
        this.model.setAb(value);
        let baseMatrix = new PIXI.Matrix().scale(70,70);
        baseMatrix.rotate(2*Math.PI/3)
        baseMatrix.translate(200,0)
        let pts = this.model.getPoints(model.pts).map(p=>baseMatrix.apply(p));    

        let g = this.g;
        g.clear();
        g.poly(pts,true).fill('#cccc66').stroke({color:'black', width:1.5})

        // draw angles
        this.drawAngles(g, pts);
        this.setLetters(pts);
        
    }
    ondrag(dx,dy,e,startpos) {
        this.value = Math.max(0.0, Math.min(1, this.value + dx * 0.001));

        let value = this.value;
        const eps = 0.02;
        const values = [0.0, 1.0/(1.0+Math.sqrt(3)), 0.5, Math.sqrt(3)/(1.0+Math.sqrt(3)), 1];
        for(let v of values) {
            if(Math.abs(value - v) < eps) { value = v; break; }
        }
        this.paint(value);
    }
}


class Act2 extends Act {
    constructor() {super();}
    start() {
        this.model = model;
        let sc = new ShapeCollector();
        model.sys.H8.accept(sc);
        this.shapes = sc.shapes;
        this.scaleFactor = 20;


        // let pts = this.pts = model.getPoints(model.pts).map(p=>baseMatrix.apply(p));    
        this.prototiles = [];
        for(let i=0; i<3; i++) this.prototiles.push(new PIXI.GraphicsContext());
        const prototile = this.prototiles[0];
        let prototileTable = {
            'single': this.prototiles[0],
            'unflipped': this.prototiles[1],
            'flipped': this.prototiles[2],
        }
        this.container = new PIXI.Container();
        app.stage.addChild(this.container);
        this.items = this.shapes.map(s=>{

            let g = new PIXI.Graphics(prototileTable[s.label]);
            this.container.addChild(g);
            s.g = g;
            return g;
        }); 
        let value = this.value = 1.0/(1.0+Math.sqrt(3));
        this.model.setAb(value);
        

        this.setValue(value)    
    }
    end() {
        this.container.removeChildren().forEach(d=>d.destroy());
        this.container.destroy();
        this.container = null;
        this.prototiles.forEach(p=>p.destroy());
        this.prototiles.length = 0;

    }

    setValue(value) {
        this.value = value = Math.max(0.001, Math.min(1,value));
        console.log(value);
        this.model.setAb(value);

        const scaleFactor = this.scaleFactor;
        let baseMatrix = this.baseMatrix = new PIXI.Matrix().scale(scaleFactor, scaleFactor);    
        let pts = this.pts = model.getPoints(model.pts).map(p=>baseMatrix.apply(p));    
        
        this.updateMatrix(this.shapes[0]);
        this.updateMatrix(this.shapes.at(-1));
        let p0 = this.shapes[0].matrix.apply(PIXI.Point.shared);
        let p1 = this.shapes.at(-1).matrix.apply(PIXI.Point.shared);
        let dir = p1.subtract(p0);
        let theta = Math.atan2(dir.y,dir.x);

        theta = 0;
        this.baseMatrix = new PIXI.Matrix().scale(scaleFactor, scaleFactor).rotate(-theta);
        this.baseMatrix.translate(0,400)
        this.updatePrototile()        
        this.shapes.forEach(shape=>{
            this.updateMatrix(shape);
            shape.g.setFromMatrix(shape.matrix);
        })
        
        /*        
        let dot = new PIXI.Graphics().circle(p0.x,p0.y,5).fill('red');
        app.stage.addChild(dot);
        dot = new PIXI.Graphics().circle(p1.x,p1.y,5).fill('green');
        app.stage.addChild(dot);
        */

    }
    ondrag(dx,dy) {
        this.value = Math.max(0.0, Math.min(1.0, this.value += 0.01*dx));
        this.setValue(this.value);
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
        const colors = ['yellow','orange','magenta'];
        for(let i=0; i<3; i++) {
            let prototile = this.prototiles[i];
            prototile.clear().poly(pts,true).fill(colors[i]).stroke({color:'black', width:1.5, join:'round'})
        }   
    }

}


function buildScene() {
    model = h7h8(4);
    // model.setAb(0.5);


    //painter = new Painter2(model);
    director = new Director(model)
    director.addAct(new Act2())
    director.addAct(new Act1())
    director.enablePointer();
    //painter.paint(0.5);

    /*
    PIXI.Ticker.shared.add((ticker)=>{
        let value = 0.5+0.5*Math.sin(performance.now()*0.001);
        // painter.paint(value);
        // foo()
    });
    */
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

