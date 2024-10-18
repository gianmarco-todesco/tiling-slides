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
        // autoDensity: true,
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
            'P': new PIXI.Point(-600,-50 + 200 -100),
            'T': new PIXI.Point(-600 + 300,-50),
            'F': new PIXI.Point(-600+300,-50 - 50),            
        };
        /*
        this.offsets = {
            'H': new PIXI.Point(-600,50),
            'P': new PIXI.Point(-300,-50 + 200),
            'T': new PIXI.Point(-300 + 300,-50),
            'F': new PIXI.Point(-300+300,-50 - 50),            
        };
        */

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

        let offsets = {
            'H': new PIXI.Point(-400,-200),
            'P': new PIXI.Point(-400,300),
            'T': new PIXI.Point(140,-250),
            'F': new PIXI.Point(400,200),            
        }
        let colors = {
            'H':'#dd5544',
            'P':'#55dd44',
            'T':'#ddaa44',
            'F':'#44ccee'
        };

        for(let key of ["H","P","T","F"]) {
            let metatile = metatiles[key];
            let cnt = new PIXI.Container();
            let g = new PIXI.Graphics();
            g.alpha = 0.3
            metatile.metatilesBounds.forEach(extbounds=>{      
                let bounds = extbounds.bounds;          
                g.poly(bounds.map(p=>p.multiplyScalar(scaleFactor)),true)
                    .fill(colors[extbounds.type])
                
            })
            cnt.addChild(g);
            g = new PIXI.Graphics();
            metatile.metatilesBounds.forEach(extbounds=>{      
                let bounds = extbounds.bounds;          
                g.poly(bounds.map(p=>p.multiplyScalar(scaleFactor)),true)
                    .stroke({color:'gray', width:2});                
            })
            g.poly(metatile.bounds.map(p=>p.multiplyScalar(scaleFactor)),true)
                .stroke({color:colors[key], width:8});
            cnt.addChild(g);
            model.container.addChild(cnt);
            let off = offsets[key];
            cnt.position.copyFrom(off);
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
        this.magenta = true;
        this.setLevel(0);
    }

    setLevel(level) {
        this.level = level;
        let scaleMatrix = new PIXI.Matrix().scale(0.5,0.5);
        let model = this.model;
        let metatiles = createChildren(model.patches[level]);
        model.clear();
        model.addMetaTile(metatiles.H, scaleMatrix);
        if(this.magenta) {
            let g = new PIXI.Graphics();    
            
            metatiles.H.metatilesBounds.forEach(extbound=>{
                let bounds = extbound.bounds.map(p=>scaleMatrix.apply(p));
                g.poly(bounds,true).stroke({color:'magenta', width:5});
            })
            model.container.addChild(g);
        }
        model.addMetaTileBounds(metatiles.H, scaleMatrix);        
    }
    onkeydown(e) {
        if(e.key == '1') this.setLevel(1);
        else if (e.key == '2') this.setLevel(2);
        else if (e.key == '3') this.setLevel(3);
        else if (e.key == '0') this.setLevel(0);
        else if (e.key == 'm') {
            this.magenta = !this.magenta;
            this.setLevel(this.level);
        }
    }

}




function buildScene() {    
    let startTime = performance.now();
    model = new Model(3);
    let dt = (performance.now()-startTime).toFixed(0);
    console.log("model created in "+dt+"ms");

    director = new Director(model);
    director.addAct(new Act1());
    director.addAct(new Act3());
    director.addAct(new Act4());
    director.addAct(new Act5());

    function drawPolygon(shape, polygon) {
        shape.moveTo(...coords(polygon[polygon.length-1]));
        polygon.forEach(p=>shape.lineTo(...coords(p)));
    }
}

