const slide = {
    name:"hat-metatiles"    
}

let app, model, director;

async function initPixi() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'lightgrey',
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

function smooth(t) {
    return (1.0-Math.cos(t*Math.PI))/2;
}


class Model {
    constructor(levelCount = 3) {
        let patches = this.patches = [];
        let patch = createPatch({
            'H': H_metatile,
            'P': P_metatile,
            'F': F_metatile,
            'T': T_metatile
        });
        patches.push(patch);
        for(let i=0; i<levelCount; i++) {
            patch = createPatch(createChildren(patch));
            patches.push(patch);
        }    
        this.container = new PIXI.Container();
        app.stage.addChild(this.container);
    }
    clear() {
        let lst = this.container.removeChildren();
        lst.forEach(g=>g.destroy());
    }

    addMetaTile(metatile, matrix, container = null) {
        if(container == null) container = this.container;
        metatile.children.forEach(child => {
            let g = new PIXI.Graphics(child.shape);
            g.setFromMatrix(matrix.clone().append(child.matrix));
            container.addChild(g);
        });
    }

    addPatchTiles(patch, container = null) {
        for(let itm of patch.children) {
            this.addMetaTile(itm.metatile, itm.matrix, container);
        }
    }

    addMetaTileBounds(metatile, matrix, container = null) {
        if(container == null) container = this.container;
        let g = new PIXI.Graphics().poly(metatile.bounds, true);
        g.stroke({color:'black', width:3});
        g.setFromMatrix(matrix);
        container.addChild(g);
    }
    simpleTiling() {
        this.clear();
        let patch = this.patches.at(-1);
        this.addPatchTiles(patch, this.container);
    }
    singleTile() {
        this.clear();
        let g = new PIXI.Graphics(H_shape);
        let s = 4;
        g.scale.set(s,s);
        g.rotation = -Math.PI/3;
        g.position.x = -200;
        this.container.addChild(g);
    }

    addMetaTileWithBounds(metatile, matrix, container = null) {
        this.addMetaTile(metatile, matrix, container);
        this.addMetaTileBounds(metatile, matrix, container);                
    }

    boh1(itm) {
        let g = new PIXI.Graphics();
        for(let childItm of itm.children) {
            let type = childItm.type;
            console.log(type);
            g.poly(childItm.bounds,true).stroke({color:'black', width:1});
        }
        g.poly(itm.outline,true).stroke({color:'magenta', width:3});
        this.container.addChild(g);
    }
    boh() {
        this.clear();
        let patch = this.patches[0];
        let children = createAbstractChildren(patch);
        this.boh1(children.H);
        //this.boh1(children.F);
        //this.boh1(children.P);
        //this.boh1(children.T);
    }

}


class Act1 extends Act {
    constructor() { super(); }
    start() {
        this.model.simpleTiling();
    }
}

class Act2 extends Act {
    constructor() { super(); }
    start() {
        this.model.singleTile();
    }
}

class Act3 extends Act {
    constructor() { super(); }
    start() {
        const model = this.model;

        model.clear();
        let metatiles = this.metatiles = createChildren(model.patches[0], false);
        let tiles = this.tiles = {};

        this.offsets = {
            'H': new PIXI.Point(-600,-50),
            'P': new PIXI.Point(-600,-50 + 200),
            'T': new PIXI.Point(-600 + 300,-50),
            'F': new PIXI.Point(-600+300,-50 - 50),            
        };

        for(let key of  ["H","T","P","F"]) {
            let metatile = metatiles[key];            
            let c = new PIXI.Container();
            c.position.copyFrom(this.offsets[key]);
            model.container.addChild(c);
            model.addMetaTile(metatile, new PIXI.Matrix(), c);


            let g = new PIXI.Graphics().poly(metatile.bounds, true);
            g.stroke({color:'black', width:6});
            c.addChild(g);


            tiles[key] = c;

        }
        this.curKey = '';
        this.targetKey = '';
        this.param = 0;

    }

    moveTile(key, t) {
        t = smooth(t);
        let dstKey = key == 'F' ? 'P' : 'H';
        let p = this.offsets[key].multiplyScalar(1-t)
            .add(this.offsets[dstKey].multiplyScalar(t));
        this.tiles[key].position.copyFrom(p);
    }

    tick(dt) {
        if(this.curKey != this.targetKey) {
            if(this.curKey == '') {
                this.curKey = this.targetKey;
            } else {
                this.param = Math.max(0.0, this.param - dt);
                this.moveTile(this.curKey, this.param);
                if(this.param == 0.0) this.curKey = this.targetKey;
            }
        }
        if(this.curKey==this.targetKey) {
            if(this.curKey == '') return;
            if(this.param >= 1.0) return;
            this.param = Math.min(1.0, this.param + dt);
            this.moveTile(this.curKey, this.param);
        } 
        
    }
    onkeydown(e) {
        if(this.curKey != this.targetKey || this.param != 0.0 && this.param != 1.0)
            return;
        let targetKey = {'1':'P','2':'T','3':'F'}[e.key];
        if(targetKey === undefined) return;
        this.targetKey = targetKey == this.targetKey ? "" : targetKey;
    }
}


class Act4 extends Act {
    constructor() { super() }
    start() {
        this.setLevel(0);
        
    }

    setLevel(level) {
        const model = this.model;
        model.clear();

        let scaleFactor = 1/2.598076**level;

        let patch = model.patches[level];
        let metatiles = this.metatiles = createChildren(patch, true);

        /* let offsets = {
            'H': new PIXI.Point(-550,-10),
            'P': new PIXI.Point(-600,100),
            'T': new PIXI.Point(-150+200,-200),
            'F': new PIXI.Point(-500+500,-90+200),            
        } */
        let offsets = {
            'H': new PIXI.Point(-400,-200),
            'P': new PIXI.Point(-400,300),
            'T': new PIXI.Point(140,-250),
            'F': new PIXI.Point(400,200),            
        }
        let colors = {
            'H':'#6688dd',
            'P':'#8866dd',
            'T':'#dd8866',
            'F':'#66dd88'
        };

        for(let key of ["H","P","T","F"]) {
            let metatile = metatiles[key];
            let g = new PIXI.Graphics();
            g.alpha = 0.3
            metatile.metatilesBounds.forEach(bounds=>{                
                g.poly(bounds.map(p=>p.multiplyScalar(scaleFactor)),true)
                    .fill(colors[key])
                    .stroke({color:'gray', width:2});
                
            })
            g.poly(metatile.bounds.map(p=>p.multiplyScalar(scaleFactor)),true)
                .stroke({color:'black', width:6});
            model.container.addChild(g);
            let off = offsets[key];
            g.position.copyFrom(off);
        }
    }
    onkeydown(e) {
        if(e.key == '1') this.setLevel(1);
        else if (e.key == '2') this.setLevel(2);
        else if (e.key == '3') this.setLevel(3);
        else if (e.key == '0') this.setLevel(0);
    }
}

class Act5 extends Act {
    constructor() { super() }
    start() {
        let model = this.model;
        this.setLevel(0);
    }

    setLevel(level) {
        let model = this.model;
        let metatiles = createChildren(model.patches[level]);
        model.clear();
        model.addMetaTile(metatiles.H, new PIXI.Matrix());
        let g = new PIXI.Graphics();        
        metatiles.H.metatilesBounds.forEach(bound=>{
            g.poly(bound,true).stroke({color:'blue', width:3});
        })
        model.container.addChild(g);
        model.addMetaTileBounds(metatiles.H, new PIXI.Matrix());
        
    }
}




function buildScene() {



    //let g = new PIXI.Graphics();
    //g.circle(0,0,5).fill('red');
    //app.stage.addChild(g);

    app.stage.scale.set(0.5,0.5)
    
    let startTime = performance.now();
    model = new Model(3);
    let dt = (performance.now()-startTime).toFixed(0);
    console.log("model created in "+dt+"ms");

    director = new Director(model);
    director.addAct(new Act4());
    director.addAct(new Act3());
    
    
    director.addAct(new Act1());
    director.addAct(new Act2());
    director.addAct(new Act3());
    director.addAct(new Act4());
    director.addAct(new Act5());


    // p1 = patch.createObject(app);

    function drawPolygon(shape, polygon) {
        shape.moveTo(...coords(polygon[polygon.length-1]));
        polygon.forEach(p=>shape.lineTo(...coords(p)));
    }

    /*
    let shape = new PIXI.Graphics();
    drawPolygon(shape, patch.outlines.H);
    shape.stroke({width:6, color:0x000000});
    app.stage.addChild(shape);
    */


    //drawPolygon(shape, patch.outlines.P);
    //drawPolygon(shape, patch.outlines.F);
    //drawPolygon(shape, patch.outlines.T);

    /*
    p1.addChild(shape);

    p1.scale.set(1/3,1/3);
    p1.position.set(300,300);

    let metatiles = createChildren(patch);
    let Q = [];
    ch_H = metatiles.H.createObject(app);
    ch_H.scale.set(1/3,1/3);
    ch_H.position.set(100,110);
    Q.push(ch_H);
    ch_P = metatiles.P.createObject(app);
    ch_P.scale.set(1/3,1/3);
    ch_P.position.set(120,250);
    Q.push(ch_P);
    ch_F = metatiles.F.createObject(app);
    ch_F.scale.set(1/3,1/3);
    ch_F.position.set(100,350);
    Q.push(ch_F);
    ch_T = metatiles.T.createObject(app);
    ch_T.scale.set(1/3,1/3);
    ch_T.position.set(80,460);
    Q.push(ch_T);
    

    let cross = new PIXI.GraphicsContext();
    cross.moveTo(-50,0).lineTo(50,0).moveTo(0,-50).lineTo(0,50)
        .stroke({width:2.5, color:0x000000});
    Q.forEach(m=>{
        let c1 = new PIXI.Graphics(cross);
        app.stage.addChild(c1);
        c1.position.set(m.position.x,m.position.y);    
    });


    let patch2 = createPatch(metatiles);
    let p2 = patch2.createObject(app);

    p2.scale.set(0.2,0.2);
    p2.position.set(600,0);

    let elapsed = 0.0;

    app.ticker.add((ticker) => {
        elapsed += ticker.deltaTime;
        //place(B,A,i1,i2,elapsed);
        // hat.rotation = elapsed * 0.01;
        // patch.container.rotation += 0.01;
        // p2.rotation = elapsed * 0.01
    });
*/
}



function foo(container, itm) {
    const {matrix, metatile} = itm;
    metatile.children.forEach(child => {
        let g = new PIXI.Graphics(child.shape);
        g.setFromMatrix(matrix.clone().append(child.matrix));
        container.addChild(g);
    });

    /*

            let childObj = child.createObject(app, matrix);
            c.addChild(childObj);
        });
        let bounds = this.bounds;
        if(bounds) {
            bounds = bounds.map(p=>matrix.apply(p));
            let shape = new PIXI.Graphics()
            shape.moveTo(...coords(bounds[bounds.length-1]));
            bounds.forEach(p=>shape.lineTo(...coords(p)));
            shape.stroke({width:1.5, color:0xFF0000});
            
            c.addChild(shape);
        }
    */
}
