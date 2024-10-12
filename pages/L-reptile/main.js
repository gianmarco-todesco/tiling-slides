const slide = {
    name:"L-reptile"    
}

let app;

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
        console.log(e);
    })
}

function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    app.destroy();
    app = null;
}

class LRepTile {
    constructor() {
        let unit = this.unit = 100;
        let path2 = [0,0,2,0,2,1,1,1,1,2,0,2].map(v=>v*unit+0.5);
        let eps = 0.05;
        let path = [
            0+eps,0+eps,
            2-eps,0+eps, 2-eps,1-eps,
            1-eps,1-eps,
            1-eps,2-eps, 0+eps,2-eps].map(v=>v*unit+0.5);
        let shape = new PIXI.Graphics();
        shape.poly(path2, true);
        shape.stroke({width:1, color:"black"})
        shape.poly(path, true);
        shape.fill(0x657688);    
        shape.stroke({ width: 4, color: 0xfeeb77 });
        let texture = app.renderer.generateTexture( shape, {resolution: 1} )
        this.texture = texture;
        let matrices = this.matrices = [];
        matrices.push(new PIXI.Matrix().translate(0,0));
        matrices.push(new PIXI.Matrix().translate(-unit, -unit));
        matrices.push(new PIXI.Matrix().rotate(Math.PI/2).translate(unit, -unit));
        matrices.push(new PIXI.Matrix().rotate(-Math.PI/2).translate(-unit, unit));
        this.container = new PIXI.Container();
        app.stage.addChild(this.container);
        this.pool = [];
    }
 
    place(matrix) {
        let s;
        if(this.pool.length>0) {
            s = this.pool.pop();
            s.visible = true;
        } else {
            s = new PIXI.Sprite({texture:this.texture, anchor:new PIXI.Point(0.5,0.5)});
        }
        s.setFromMatrix(matrix);
        this.container.addChild(s);
    }
    
    placeRecursively(level, matrix) {
        if(level == 0) {
            this.place(matrix);
        } else {
            this.matrices.forEach(mat => {
                let mat2 = matrix.clone()
                    .append(new PIXI.Matrix().scale(0.5,0.5))
                    .append(mat);
                this.placeRecursively(level-1, mat2);
           });
        }
    }

    clear() {
        let L = this.container.removeChildren();
        this.pool = this.pool.concat(L);        
        L.forEach(child => child.visible=false);
    }

    periodic(nx,ny,s) {
        this.clear();
        const unit = this.unit;
        let mat1 = new PIXI.Matrix().translate(0,-unit).rotate(Math.PI);
        for(let i=-nx; i<=nx; i++) {
            for(let j=-ny;j<=ny;j++) {
                let dx = unit*2*j, dy = unit*3*i;
                this.place(new PIXI.Matrix().translate(dx,dy).scale(s,s));
                this.place(new PIXI.Matrix().translate(dx,dy).append(mat1).scale(s,s));                
            }
        }
        

    }
}


class Act1 {
    constructor(){}

    init(model) {
        this.model = model;
        let unit = slide.reptile.unit;
        model.placeRecursively(8, new PIXI.Matrix().translate(unit/2,unit/2).scale(64,64).translate(0.5,0.5));    
    }
    forward() { return false;}
    backward() { return false;}
    tick() {}
}


class Act2 {
    constructor(){}

    init(model) {
        this.model = model;
        model.clear();
        model.placeRecursively(0, new PIXI.Matrix().scale(2,2))
        this.level = 0;
    }
    forward() { 
        this.level++;
        this.model.clear();
        let sc = 2**this.level;
        this.model.placeRecursively(this.level, new PIXI.Matrix().scale(2,2))
        return true;
    }
        
    backward() { return false;}
    tick() {}

}

class Act3 {
    constructor() {}
    init(model) {
        this.model = model;
        model.clear();
        model.periodic(30,10,0.25);
        // app.stage.scale.set(0.2,0.2);
    }
    forward() { return false;}
    backward() { return false;}
    tick() {}
}


class Director {
    constructor(model) {
        this.model = model; 
        this.acts = []
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

    addAct(act) {
        this.acts.push(act);
        if(!this.currentAct) this.startAct(0);
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

async function buildScene() {

    slide.reptile = new LRepTile();
    director = new Director(slide.reptile);

    director.addAct(new Act1());
    director.addAct(new Act2());
    director.addAct(new Act3());

    
    
    //matrices.push(new PIXI.Matrix().translate(unit*4,0));
    //matrices.push(new PIXI.Matrix().translate(0,unit*4).rotate(-Math.PI/2));

    //let mainContainer = new PIXI.Container();
    //window.mainContainer = mainContainer;
    //app.stage.addChild(mainContainer);

    

    //place(8, new PIXI.Matrix().scale(64,64).translate(-200.5,-200.5))
    // place(4, new PIXI.Matrix().scale(2,2).translate(100.5,100.5))
    /*
    matrices.forEach(mat => {
        let s = new PIXI.Sprite(texture);
        s.setFromMatrix(new PIXI.Matrix().translate(200,100).append(mat));
        
        app.stage.addChild(s);

    });
    */

    document.addEventListener('pointerdown', (e)=>{
        let mousePos = new PIXI.Point(e.clientX,e.clientY); 
        console.log(mousePos)

        document.addEventListener('pointermove', onDrag);
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointerleave', onDragEnd);
        
        
        function onDrag(e) {
            let dx = e.clientX - mousePos.x;
            let dy = e.clientY - mousePos.y;
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
            app.stage.position.add(new PIXI.Point(dx,dy), app.stage.position)
        }
        function onDragEnd(e) {
            console.log("dragend");
            document.removeEventListener('pointermove', onDrag);
            document.removeEventListener('pointerup', onDragEnd);
            document.removeEventListener('pointerleave', onDragEnd);
            
            
        }
    })

}

