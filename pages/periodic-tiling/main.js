"use strict";

const slide = {
    name:"periodic-slides"    
}

let app, model, director, animations;

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
    });
}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    model.destroy();
    model = null;
    director = null;
    app.destroy();
    app = null;
}

class Model {
    constructor() {
        this.shapes = [];
        this.shapeTable = {}
        this.unit = 100;
    }

    destroy() {
        this.shapes.forEach(d=>d.destroy());
        this.shapes.length = 0;
    }

    clearStage() {
        app.stage.removeChildren().forEach(d=>d.destroy());
    }
    createShapes() {
        const unit = this.unit;
        this.createRegularPolygonShape('rp3', 3,unit);
        this.createRegularPolygonShape('rp4', 4,unit);
        this.createRegularPolygonShape('rp5', 5,unit);
        this.createRegularPolygonShape('rp6', 6,unit);
        this.createRegularPolygonShape('rp7', 7,unit);        
    }
    createRegularPolygonShape(name, n, r) {
        let shape = new PIXI.GraphicsContext();
        shape.poly(getRegularPolygonPoints(n,r),true).fill('white').stroke('black');
        this.shapes.push(shape);
        this.shapeTable[name] = shape;
        return shape;
    } 
    createInstance(shapeName, matrix = null) {
        let shape = this.shapeTable[shapeName]
        let g = new PIXI.Graphics(shape);
        app.stage.addChild(g);
        return g;
    } 

    createTiling(polygons,d1,d2) {
        const width = app.canvas.width;
        const height = app.canvas.height;    
        const bounds = {x0:-width/2,y0:-height/2,x1:width/2,y1:height/2}    
        let grid = createGrid(new PIXI.Point(0,0), d1, d2, bounds);
        let g = new PIXI.Graphics();
        for(let v of grid) {
            let p = v.p;
            for(let polygon of polygons) {
                g.poly(polygon.map(q=>q.add(p)), true);
            }
        }
        g.fill('white').stroke('black');
        app.stage.addChild(g);
        return g;
    }

    createRegularTiling(n) {
        let polygons, d1, d2;
        if(n==3) {
            let pts = getRegularPolygonPoints(3,this.unit);
            let matrix = getRotateAroundMatrix(Math.PI/3, new PIXI.Point(this.unit,0));
            let pts2 = pts.map(p=>matrix.apply(p))
            polygons = [pts,pts2];
            d1 = pts[0].subtract(pts[2]);
            d2 = pts[1].subtract(pts[2]);            
        } else if(n==4) {
            let pts = getRegularPolygonPoints(4,this.unit);
            polygons = [pts];
            d1 = pts[0].subtract(pts[3]);
            d2 = pts[2].subtract(pts[3]);            
        } else if(n==6) {
            let pts = getRegularPolygonPoints(6,this.unit);
            polygons = [pts];
            d1 = pts[0].add(pts[1]);
            d2 = pts[0].add(pts[5]);        

        }
        else return;
        let g = this.createTiling(polygons, d1, d2);
    }
}

class RegularPolygonAct extends Act {
    constructor(m) { 
        super(); 
        this.m = m;
        this.n = 2*m/(m-2);
        this.step = 0;
        this.angle = Math.PI * (this.m-2)/this.m;
        
    }
    start() {
        const model = this.model;
        this.center = new PIXI.Point(model.unit,0);
        this.placeFirst();
    }
    end() {
        animations.clear();
        model.clearStage();
    }
    createPolygon() {
        return this.model.createInstance('rp'+this.m);
    }
    placeFirst() {
        const model = this.model;
        animations.clear();
        model.clearStage();
        this.createPolygon();
        this.step = 1;
    }
    placeSecond() {
        const model = this.model;
        animations.clear();
        if(this.step == 1) {
            let g = this.createPolygon();
            const {angle, center} = this;
            animations.run(e=>{
                g.setFromMatrix(getRotateAroundMatrix(angle*e.param, center))
            },0.5)            
        } else {
            model.clearStage();
            const {angle, center} = this;
            for(let i=0; i<2; i++) {
                let g = this.createPolygon();
                g.setFromMatrix(getRotateAroundMatrix(angle*i, center))
            }        
        }
        this.step = 2;
    }
    placeOthers() {
        const {n, angle, center, model} = this;
        animations.clear();
        if(this.step == 2) {
            let gs = [];
            for(let i=2; i<n; i++) {
                gs.push(this.createPolygon())
            }
            animations.run(e=>{
                let phi = angle+e.t*2;
                for(let i=0; i<n-2; i++) {
                    let g = gs[i];
                    let maxAngle = angle * (i+2);
                    let psi = Math.min(maxAngle,phi);
                    g.setFromMatrix(getRotateAroundMatrix(psi, center))
                }
                return phi<angle*(n-1);                
            },0.5)            
        } else {
            model.clearStage();
            for(let i=0; i<n; i++) {
                let g = model.createInstance('rp'+this.m);
                g.setFromMatrix(getRotateAroundMatrix(angle*i, center))
            }        
        }
        this.step = 3;
    }
    tilePlane() {
        animations.clear();
        model.clearStage();
        this.model.createRegularTiling(this.m);
    }

    onkeydown(e) {
        if(e.key=='1') this.placeFirst();
        else if(e.key=='2') this.placeSecond();
        else if(e.key=='3') this.placeOthers();
        else if(e.key=='4') this.tilePlane();
    }

}


class PentagonTilingAct extends Act {
    constructor() { 
        super(); 
    }
    start() {

    }
    end() {

    }
    onkeydown(e) {
        if(e.key=='1') {
            this.model.createInstance('rp3');
        }
    }
}


function buildScene() {
    model = new Model()
    model.createShapes();
    animations = new AnimationManager();
    director = new Director(model);
    director.addAct(new RegularPolygonAct(7));
    director.addAct(new RegularPolygonAct(3));
    director.addAct(new RegularPolygonAct(4));
    director.addAct(new RegularPolygonAct(6));
    PIXI.Ticker.shared.add((ticker)=>{
        animations.tick(ticker.elapsedMS);
    });

}