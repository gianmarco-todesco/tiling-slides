const slide = {
    name:"L-reptile"    
}

let app, director, animations;

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
        let unit = this.unit = 128;
        this.pts = [[0,0],[2,0],[2,1],[1,1],[1,2],[0,2]]
            .map(([x,y])=>new PIXI.Point((x-0.5)*unit+0.5, (y-0.5)*unit+0.5));

        let matrices = this.matrices = [];
        matrices.push(new PIXI.Matrix().translate(-unit/2,-unit/2));
        matrices.push(new PIXI.Matrix().translate( unit/2, unit/2));
        matrices.push(new PIXI.Matrix().rotate(Math.PI/2).translate( 5*unit/2,-unit/2));
        matrices.push(new PIXI.Matrix().rotate(-Math.PI/2).translate(-unit/2, 5*unit/2));
        this.container = new PIXI.Container();
        app.stage.addChild(this.container);
        
        /*
        let g = new PIXI.Graphics().circle(0,0,2).fill('red');
        g.moveTo(-200,-200);g.lineTo(200,200);
        g.moveTo(-200, 200);g.lineTo(200,-200);
        g.stroke('red');
        app.stage.addChild(g)
        */
    }
 
    getMatrices(level) {
        if(level == 0) return [new PIXI.Matrix()];
        else {
            let scMatrix = new PIXI.Matrix().scale(0.5,0.5);
            let outMatrices = [];            
            let childrenMatrices = this.getMatrices(level-1);
            for(let parentMatrix of this.matrices) {
                for(let childMatrix of childrenMatrices) {
                    outMatrices.push(scMatrix.clone().append(parentMatrix).append(childMatrix));
                }
            }
            return outMatrices;
        }
    }

    createTiling(level, scaleFactor, fill = '#ddeeff', stroke = {color:'black', width:1.5}) {
        let matrices = this.getMatrices(level);
        let g = new PIXI.Graphics();
        const pts = this.pts;
        for(let matrix of matrices) {
            let apts = pts.map(p=>matrix.apply(p).multiplyScalar(scaleFactor));
            /*
            apts = apts.map(p=>{
                p.x = Math.floor(p.x+0.5) + 0.5;
                p.y = Math.floor(p.y+0.5) + 0.5;
                return p;                
            })
            */
            g.poly(apts,true);
        }
        if(fill != null) g.fill(fill)
        if(stroke != null) g.stroke(stroke);
        this.container.addChild(g);
        return g;
    }

    clear() {
        let L = this.container.removeChildren().forEach(d=>d.destroy());
    }

    createPeriodicTiling(nx,ny,s) {
        let g = new PIXI.Graphics();
        let fill = '#ddeeff';
        let stroke = {color:'black', width:1.5};
        const unit = this.unit;
        let mat1 = new PIXI.Matrix().translate(-unit,-2*unit).rotate(Math.PI);
        const pts = this.pts;
        for(let i=-nx; i<=nx; i++) {
            for(let j=-ny;j<=ny;j++) {
                let dx = unit*2*j, dy = unit*3*i + unit*1*(j%2);
                let apts = pts.map(p=>p.add(new PIXI.Point(dx,dy)));
                g.poly(apts, true);
                let mat2 = new PIXI.Matrix().translate(dx,dy).append(mat1);
                apts = pts.map(p=>mat2.apply(p));
                g.poly(apts, true);
                
            }
        }
        g.fill(fill);
        g.stroke(stroke);
        this.container.addChild(g);
        return g;
    }
}


class Act1 extends Act {
    constructor(){ super() }

    start() {
        let model = this.model;
        let unit = slide.reptile.unit;
        let g = model.createTiling(7, 32);
    }
}


class Act2 extends Act {
    constructor(){super();}

    start() {
        let model = this.model;
        this.scaleFactor = 3;
        this.level = 0;
        this.build();
        app.stage.position.set(app.canvas.width/2,app.canvas.height/2)
    }
    build() {
        const model = this.model;
        let colors = chroma.scale('Spectral').colors(5, null);
        model.clear();
        model.createTiling(this.level, this.scaleFactor,'#ddeeff',{color:'black', width:0.5});
        let w = 2.5;
        for(let i = this.level-1; i>=0; i--) {
            w += 1;
            model.createTiling(i, this.scaleFactor, null, {color:colors[i].hex(), width:w});
        }
    }
    backward() {
        if(this.level==0) return false;
        this.level--;
        this.build();
        return true;
    }
    forward() { 
        if(this.level == 5) return false;
        this.level++;
        this.build();
        return true;
    }
        
}

class Act3 extends Act {
    constructor() { super(); }
    start() {
        let model = this.model;
        model.clear();
        model.createPeriodicTiling(30,10,0.25);
        // app.stage.scale.set(0.2,0.2);
    }
}


async function buildScene() {

    slide.reptile = new LRepTile();
    director = new Director(slide.reptile);

    director.addAct(new Act1());
    director.addAct(new Act2());
    director.addAct(new Act3());

    

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

