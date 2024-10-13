const slide = {
    name:"hat-metatiles"    
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

    fourMetatiles() {
        this.clear();
        let metatiles = createChildren(this.patches[0]);
        let lst = [
            {key:"H", pos:new PIXI.Point(-500,-100)},
            {key:"T", pos:new PIXI.Point(-500, 350)},
            {key:"P", pos:new PIXI.Point( 200, -150)},
            {key:"F", pos:new PIXI.Point( 200, 250)},
        ]
        this.metatiles = metatiles;
        for(let itm of lst) {
            let metatile = metatiles[itm.key];
            
            let matrix = new PIXI.Matrix().translate(itm.pos.x, itm.pos.y);

            let c = new PIXI.Container();
            this.container.addChild(c);
            c.position.copyFrom(itm.pos);
            this.addMetaTile(metatile, new PIXI.Matrix(), c);
            this.addMetaTileBounds(metatile, new PIXI.Matrix(), c);
            
        }
        //this.addMetaTile(metatiles.P, new PIXI.Matrix());
        //this.addMetaTile(metatiles.F, new PIXI.Matrix());
        //this.addMetaTile(metatiles.T, new PIXI.Matrix());
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
        this.model.fourMetatiles();

        let tiles = this.model.container.children;
        let h_tile = tiles[0];
        
        let qs = this.model.metatiles.H.bounds.map(p=>p.add(h_tile.position));
        let g = new PIXI.Graphics().poly(qs,true).stroke({color:'red', width:5});
        this.model.container.addChild(g);


        let qs2 = this.model.metatiles.P.bounds;
        g = new PIXI.Graphics().poly(qs2,true).stroke({color:'green', width:5});
        this.model.container.addChild(g);

        let matrix = getFourPointsTransform(qs2[2], qs2[3], qs[1], qs[0]);

        g.setFromMatrix(matrix);

        tiles[2].setFromMatrix(matrix);


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
    director.addAct(new Act3());
    director.addAct(new Act1());
    director.addAct(new Act2());


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
