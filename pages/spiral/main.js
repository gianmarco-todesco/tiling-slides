"use strict";

const slide = {
    name:"spiral"    
}

let app;


async function initPixi() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: '#aaaaaa',
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
        this.updatePrototile(gc, this.color1);
        this.prototile1 = gc;
        gc = new PIXI.GraphicsContext();
        this.updatePrototile(gc, this.color2);
        this.prototile2 = gc;
        
        this.items = [];
        this.table = {};        
        
    }

    updatePrototiles(param) {
        this.prototile1.clear();
        this.updatePrototile(this.prototile1, this.color1, param);
        this.prototile2.clear();
        this.updatePrototile(this.prototile2, this.color2, param);   
    }

    updatePrototile(path, color, param = 1) {
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

    getKey(k,i,j) {
        return "pos_"+k+","+i+","+j;
    }

    place(k,i,j) {        
        let matrix = this.getMatrix(k,i,j);
        if(matrix === null) return;
        let t = (k+j)%2; 
        
        let itm = new PIXI.Graphics(t==0 ? this.prototile1 : this.prototile2);
        itm.setFromMatrix(matrix);
        
        let key = this.getKey(k,i,j);
        this.items.push({g:itm, key});        
        this.table[key] = itm;
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
    clear() {
        this.items.forEach(item => item.g.destroy());
        this.items.length = 0;
        this.table = {}
    }

    getPositionIterator() {
        let ring = 0;
        let k = 0;
        let j = 0;
        const m = this.n/2;
        let count = 0;
        const it = {
            next() {
                let out = null;
                count++;
                if(count%2==1) 
                    out = {k,i:ring,j};
                else {
                    out = {k:m+k,i:ring,j}
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
                }
                return out;
            }
        }
        return it;
    }
    makeSpiral(n) {
        let touched = {}
        let it = this.getPositionIterator();
        for(let i=0; i<n; i++) {
            let p = it.next();
            let key = this.getKey(p.k,p.i,p.j);
            touched[key] = true;
            if(this.table[key]===undefined) {
                this.place(p.k,p.i,p.j)
            }
        }
        const items = this.items;
        for(let i=0; i<items.length; ) {
            let key = items[i].key;
            if(touched[key]) i++;
            else {
                items[i].g.destroy();
                delete this.table[key];
                items.splice(i,1);
            }
        }        
    }

}

let model;
let curStatus = 0;
let targetStatus = 0;

function lerp(a,b,t) { return a.multiplyScalar(1-t).add(b.multiplyScalar(t)); }

function smoothStep(t, t0, t1) {
    if(t<t0) return 0;
    else if(t>t1) return 1;
    else return (1-Math.cos(Math.PI*(t-t0)/(t1-t0)))*0.5;
}


class Act1 {
    init(model) {
        this.model = model;
        this.count = 1;
        this.automatic = false;
        model.clear();
        model.place(0,0,0);
    }
    forward() { 
        if(this.count >= 6) {
            if(this.count > 100) return false;
            this.automatic = true;
            this.t0 = performance.now();
            this.count0 = this.count;
        } else {
            this.count++;
            this.model.makeSpiral(this.count);
        }
        return true;
    }
    backward() {
        if(this.count < 6) {
            if(this.count <= 1) return false;
            this.count--;
        } else this.count = 1;
        this.model.makeSpiral(this.count);
        return false;
    }
    onKey(e) {}
    tick() {
        const maxCount = 3000;
        if(!this.automatic) return;
        let t =  (performance.now() - this.t0) * 0.001;
        let count = Math.min(maxCount, this.count0 + 
            Math.exp(t*0.5 + 4.0)) - Math.exp(4.0);
        this.count = count;
        this.model.makeSpiral(count);
        if(count >= maxCount) this.automatic = false;
    }
}

class Act2 {
    init(model) {
        this.model = model;
        this.model.makeSpiral(3000);
        this.curStatus = 0;
        this.targetStatus = 0;
    }   
    forward() {
        if(this.targetStatus<2)
            this.targetStatus++;
        return true;
    }
    backward() {
        if(this.targetStatus>0)
            this.targetStatus--;
        return true;
    }
    tick(elapsed) {
        let changed = false;
        let curStatus = this.curStatus;
        if(curStatus < this.targetStatus) {
            curStatus = Math.min(this.targetStatus, curStatus + elapsed);
            changed = true;
        } else if(this.curStatus > this.targetStatus) {
            curStatus = Math.max(this.targetStatus, curStatus  - elapsed);
            changed = true;
        }
        if(changed) {
            this.curStatus = curStatus;
            let t0 = smoothStep(curStatus, 0.0, 1.0);
            let t1 = smoothStep(curStatus, 1.0, 2.0);
            const model = this.model;
            model.updatePrototiles(1-t0);
            model.bottom.position.x = -model.size/2 * (1-t1);
            model.top.position.x = model.size/2 * (1-t1);
            
        }
    }
}


class Director {
    constructor() { 
        const m = 15;   
        this.model = new Model(2*m, 200);
        this.acts = [
            new Act1(), new Act2()
        ]
        this.startAct(0);
        const director = this;
        document.addEventListener('keydown', (e) => {
            console.log(e);
            if(e.key == "x") { director.forward(); }
            else if(e.key == 'z')  { director.backward(); }
            else if(e.key == 'd') { director.startAct(director.currentActIndex+1); }
        })

        PIXI.Ticker.shared.add((ticker)=>{
            if(director.currentAct) director.currentAct.tick(ticker.elapsedMS * 0.001);
        });

    }

    startAct(actIndex) {
        if(0<=actIndex && actIndex<this.acts.length) {
            this.currentActIndex = actIndex;
            this.currentAct = this.acts[actIndex];
            this.currentAct.init(this.model);
        }
    }
    forward() {
        if(this.currentAct) {
            if(this.currentAct.forward()) return;
        }
        this.startAct(this.currentActIndex+1);
    }

    backward() {
        if(this.currentAct) {
            if(this.currentAct.backward()) return;
        }
        this.startAct(this.currentActIndex-1);

    }
}

let director;

function buildScene() {
    // console.log("qui")
    director = new Director();

    let scale = 1.0;
    document.addEventListener('wheel', (e)=>{
        console.log(e);
        scale = Math.max(0.6, Math.min(2.0, scale * Math.exp(e.deltaY*0.005)));
        app.stage.scale.set(scale,scale);
        console.log(scale);
    })

    /*
    Questo è il modello di Voderberg

    vedi: https://faculty.washington.edu/cemann/Your%20Friendly%20Neighborhood%20Voderberg%20Tile.pdf

    let n = 30;
    let psi = 2*Math.PI/n;
    let beta = Math.PI/2 - Math.PI/n;
    let r = 200;
    let a = 2 * r * Math.sin(psi/2);

    let b = a * 1.4;
    let rho = 0.3;

    let p5 = new PIXI.Point(0,0);
    let p6 = new PIXI.Point(-a*Math.cos(beta), a*Math.sin(beta));
    let p9 = new PIXI.Point(r,0);
    let p8 = p9.add(new PIXI.Point(-b*Math.cos(rho),-b*Math.sin(rho)));
    let p7 = p6.add(p9.subtract(p8));

    let t = 0;
    p6 = lerp(p6, p9.multiplyScalar(0.3), t);
    p7 = lerp(p7, p9.multiplyScalar(0.5), t);
    p8 = lerp(p8, p9.multiplyScalar(0.75), t);
    

    let matrix = new PIXI.Matrix().rotate(psi);
    let pts = [p9,p8,p7,p6].map(p=>matrix.apply(p)).concat([p5,p6,p7,p8,p9]);

    let g = new PIXI.Graphics();
    g.moveTo(0,0);
    g.lineTo(p9.x,p9.y);
    g.lineTo(r*Math.cos(psi), r*Math.sin(psi));
    g.closePath();
    g.stroke({color:'black', join:'round'})

    g.poly(pts,true);
    g.fill('yellow');
    g.stroke({color:'magenta', join:'round'})

    g.poly(pts.map(p=>matrix.apply(p)),true);
    g.fill('cyan');
    let matrix2 = new PIXI.Matrix().rotate(Math.PI).translate(pts[0].x,pts[0].y);
    g.poly(pts.map(p=>matrix2.apply(p)),true);
    g.fill('orange');

    /*
    let matrix2 = new PIXI.Matrix().rotate(Math.PI+psi).translate(pts[0].x,pts[0].y);
    g.poly(pts.map(p=>matrix2.apply(p)),true);
    g.fill('orange');
    */
    // app.stage.addChild(g)
    

    
    
    
    let ring = 0;
    let k = 1, j = 0;
    let count = 0;
    /*
*/

    /*
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
        

        

    })
    */
}
