"use strict";

const slide = {
    name:"spiral"    
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
        if(e.key=='2') targetStatus = 2;
        else if(e.key=='1' ) targetStatus = 0;
    })
}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    app.destroy();
    app = null;
}


class Model {
    constructor(n, size) {
        this.n = n;
        this.size = size;
        this.p1 = new PIXI.Point(size,0);
        this.p2 = new PIXI.Matrix().rotate(2*Math.PI/n).apply(this.p1);
        this.d12 = this.p2.subtract(this.p1);
        this.top = new PIXI.Container();
        this.bottom = new PIXI.Container();
        this.bottom.position.x = -size/2;
        this.top.position.x = size/2;
        
        app.stage.addChild(this.top);
        app.stage.addChild(this.bottom);
                
        this.color1 = 'yellow';
        this.color2 = 'cyan';
        
        let gc = new PIXI.GraphicsContext();
        this._drawPrototile(gc, this.color1);
        this.prototile1 = gc;
        gc = new PIXI.GraphicsContext();
        this._drawPrototile(gc, this.color2);
        this.prototile2 = gc;
        
        this.items = [];
    }

    updatePrototiles(param) {
        this.prototile1.clear();
        this._drawPrototile(this.prototile1, this.color1, param);
        this.prototile2.clear();
        this._drawPrototile(this.prototile2, this.color2, param);   
    }

    _drawPrototile(path, color, param = 1) {
        let pts = [];

        function rot(p,ang,center) {
            p = p.subtract(center);
            return new PIXI.Matrix().rotate(ang).apply(p).add(center);
        }
        let psi1 = 70*param*Math.PI/180;
        let psi2 = 30*param*Math.PI/180;
        
        pts.push(rot(this.p1.multiplyScalar(0.2), psi1, new PIXI.Point(0,0)));
        pts.push(rot(this.p1.multiplyScalar(0.33), psi2, new PIXI.Point(0,0)));
        for(let i = pts.length-1; i>=0; i--) {
            let p = new PIXI.Point(this.p1.x - pts[i].x, -pts[i].y);
            pts.push(p);
        }
        pts.push(this.p1);
        let rotMat = new PIXI.Matrix().rotate(2*Math.PI/this.n);
        for(let i = pts.length-1; i>=0; i--) {
            pts.push(rotMat.apply(pts[i]))
        }
        console.log(pts);
        path.moveTo(0,0);
        pts.forEach(p=>path.lineTo(p.x,p.y));
        path.closePath();
        path.fill(color);
        path.stroke({color : "black", width:1.5, join:"round"});
    }

    getMatrix(k,i,j) {
        if(k<0 || k>=this.n) return null;
        if(i<0) return null;
        if(j<0 || j>2*i) return null;
        let matrix = new PIXI.Matrix();
        /*
        if(k>=this.n/2) {
            let q = this.p1.multiplyScalar(-1.0);
            matrix.translate(q.x, q.y);
        }
            */
        if(i==0) {
            matrix.rotate(k*2*Math.PI/this.n);
        } else {

            if(j%2==1) {
                matrix.rotate(Math.PI);
                matrix.translate(this.p2.x, this.p2.y);
            }    

            let delta = this.d12.multiplyScalar(Math.floor(j/2));
            matrix.translate(this.p1.x*i, this.p1.y*i);
            matrix.translate(delta.x, delta.y);



            matrix.rotate(k*2*Math.PI/this.n);                
            
        }
        return matrix;
    }

    place(k,i,j) {
        
        let matrix = this.getMatrix(k,i,j);
        if(matrix === null) return;
        let t = (k+j)%2; 
        
        let itm = new PIXI.Graphics(t==0 ? this.prototile1 : this.prototile2);
        itm.setFromMatrix(matrix);
        this.items.push(itm);
        if(k*2<this.n) this.bottom.addChild(itm);
        else this.top.addChild(itm);
        // itm.alpha = 0.7;
        return itm; 
    }
    placeRing(i) {
        for(let k=0; k<this.n; k++) {
            for(let j=0; j<=2*i; j++) this.place(k,i,j);
        }
    }
}

let model;
let curStatus = 0;
let targetStatus = 0;


function smoothStep(t, t0, t1) {
    if(t<t0) return 0;
    else if(t>t1) return 1;
    else return (1-Math.cos(Math.PI*(t-t0)/(t1-t0)))*0.5;
}

function buildScene() {
    console.log("qui")
    model = new Model(30, 200);
    const m = 15;
    model.place(0,0,0);
    model.place(m,0,0);
    
    
    let ring = 0;
    let k = 1, j = 0;
    let count = 0;

    PIXI.Ticker.shared.add((ticker)=>{
        let t = performance.now() * 0.001;

        while(ring < 6 && count<Math.exp(t)) {
            count++;
            model.place(k,ring,j);
            model.place(m+k,ring,j);
            if(ring==0) {
                k++;
                if(k>=m) {k=0; ring++;}
            } else {
                j++;
                if(j>ring*2) {
                    j=0; k++;
                    if(k>=m) {
                        ring++;
                        k=j=0;
                    }
                }
            }
            if(ring == 6) console.log("stopped:", model.items.length);
            
        }
        

        let changed = false;
        let elapsed = ticker.elapsedMS * 0.001;
        if(curStatus < targetStatus) {
            curStatus = Math.min(targetStatus, curStatus + elapsed);
            changed = true;
        } else if(curStatus > targetStatus) {
            curStatus = Math.max(targetStatus, curStatus  - elapsed);
            changed = true;
        }

        if(changed) {
            let t0 = smoothStep(curStatus, 0.0, 1.0);
            let t1 = smoothStep(curStatus, 1.0, 2.0);
            model.updatePrototiles(1-t0);
            model.bottom.position.x = -model.size/2 * (1-t1);
            model.top.position.x = model.size/2 * (1-t1);
            
        }

    })
        
}
/*
function makeBuilder(model) {
    let i = 0;
    let k = 0;
    let j = 0;
    const it = {
        step() {
            console.log(i,j,k)
            if(i==0) {
                if(k<model.n) model.place(k++,i,0);
                else {
                    i = 1;
                    j = 0;
                    k = 0;
                }
            } else {
                if(j<=2*i) model.place(k,i,j++);
                else if(k+1<model.n) {
                    model.place(++k,i,j=0);
                }
            }

        }
    }
    return it;
}

let model;
let builder;


function setup() {
    paper.setup('myCanvas');
    with(paper) {

        view.setCenter(new Point(0,0));

        model = new Model(30,200);
        
        builder = makeBuilder(model); 

        
        // for(let i=0; i<12; i++) model.placeRing(i);
        
        model.place(0,0,0);
        model.place(15,0,0);
        
        // 1,0,0 => 14,0,0
        // model.place(1,0,0);
        // model.place(1,0,0);

        let ring = 0;
        let count = 0;
        let intervalId = setInterval(() => {
            count++;
            console.log(count);
            if(count<15) {
                model.place(count,0,0);
                model.place(15+count,0,0);
            } else if(count<15+15*3) {
                let hi = Math.floor((count-15)/3);
                let lo = (count-15)%3;
                model.place(hi,1,lo);
                model.place(15+hi,1,lo);
            } else clearInterval(intervalId);
        }, 100);

    }
}

*/
