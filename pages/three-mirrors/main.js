const slide = {
    name:"three-mirrors"    
}

let imageLayer, mirrorLayer, dotLayer;
let app, director, animations;
let mirrorBox;
let theDot;

class MovingDot {
    constructor(options) {
        const color = options.color || 'gray';
        const cb = this.callback = options.callback;
        const dot = this.asset = new PIXI.Graphics()
            .circle(0, 0, 4)
            .fill(color)
            .stroke({color:'black', width:1})
        dot.eventMode = 'dynamic';
        dot.cursor = 'pointer';
        let dragOffset = new PIXI.Point(0,0);
        dot.onpointerdown = function(e) {  
            this.position.subtract(e.global, dragOffset)
            function onDrag(e) {
                e.global.add(dragOffset, dot.position);
                if(cb) cb(dot.position);
            } 
            function dragEnd(e) {
                app.stage.off('globalpointermove', onDrag)
                app.stage.off('pointerup', dragEnd)
                app.stage.off('pointerupoutside', dragEnd)
            }
            app.stage.on('globalpointermove', onDrag)
            app.stage.on('pointerup', dragEnd)
            app.stage.on('pointerupoutside', dragEnd)
        }
        dotLayer.addChild(dot);
    }

    setPos(x,y) {
        this.asset.position.set(x,y);
        if(this.callback)this.callback(this.asset.position);
    }
}

class Mirror {
    constructor(p, angle) {
        let rad = angle * Math.PI/180;
        let p0 = new PIXI.Matrix().rotate(rad).apply(new PIXI.Point(1000,0));
        let p1 = new PIXI.Point(-p0.x,-p0.y);
        let line = this.line = new PIXI.Graphics()
        .moveTo(p0.x,p0.y)
        .lineTo(p1.x,p1.y)
        .stroke({color:'black', width:4});
        line.position.set(p.x,p.y)
        mirrorLayer.addChild(line);

        this.matrix = new PIXI.Matrix().translate(-p.x,-p.y).rotate(-rad).scale(1,-1)
            .rotate(rad).translate(p.x,p.y)
    }
    destroy() {
        this.line.destroy();
    }
}

class MirrorBox {
    constructor() {
        const myRenderTexture = PIXI.RenderTexture.create({width:512, height:256, autoGenerateMipmaps:true});

        const txt = new PIXI.Text({
            text:'Fermhamente', 
            style: {
                fontFamily: 'Arial',
                fontSize: 40,
                fontWeight: 'bold',
                fill: 0xffffff, // Colore del testo (bianco)
                align: 'center',
    
            }
        });
        // txt.anchor.set(0.5,0.5)

        // do some rendering..
        app.renderer.render({target:myRenderTexture, container:txt});

        // now refresh mipmaps when you are ready
        myRenderTexture.source.updateMipmaps();


        
        let gc = this.gc = new PIXI.GraphicsContext()
        //.rect(-100, -50, 200, 100)
        //.fill("orange")
        .texture(myRenderTexture, 'white', 0,0)



        this.instances = [];
        this.pool = [];    
        this.seedMatrix = new PIXI.Matrix();
        this.matrices = [];

        let mirror1 = new Mirror(new PIXI.Point(0,100), 0);
        let mirror2 = new Mirror(new PIXI.Point(-100,100), -60);
        let mirror3 = new Mirror(new PIXI.Point(300,100), 60);
        this.mirrors = [mirror1, mirror2, mirror3]
    
    }

    setInstances(matrices) {
        let n = matrices.length;
        const instances = this.instances;
        if(n>instances.length) {
            let m = Math.min(this.pool.length, n-instances.length);
            for(let i=0; i<m; i++) {
                let itm = this.pool.pop();
                itm.visible = true;
                instances.push(itm);
            }
            m = n - instances.length;
            for(let i=0; i<m; i++) {
                let itm = new PIXI.Graphics(this.gc);
                imageLayer.addChild(itm);
                instances.push(itm);
            }
        }
        matrices.forEach((mat,i) => {
            let itm = instances[i];
            itm.setFromMatrix(mat);
        })
        while(instances.length > matrices.length) {
            let itm = instances.pop();
            itm.visible = false;
            this.pool.push(itm);
        }
    }
    destroyInstances() {
        this.instances.forEach(itm => itm.destroy());
        this.pool.forEach(itm => itm.destroy());
        this.instances.length = 0;
        this.pool.length = 0;
    }
    
    _update() {
        const seedMatrix = this.seedMatrix;
        let matrices = this.matrices.map(mat => mat.clone().append(seedMatrix));
        this.setInstances(matrices);
    }
    setSeedMatrix(seedMatrix) {
        this.seedMatrix = seedMatrix;
        this._update();
    }
    setMirrorMatrices(matrices) {
        this.matrices = matrices;
        this._update();
    }


    set_2_60(mirror1, mirror2) {
        let m1 =  mirror1.matrix, m2 = mirror2.matrix;
        let rot = m2.clone().append(m1);
        let matrices = [new PIXI.Matrix(), m1];
        for(let i=2; i<6; i++) {
            matrices.push(rot.clone().append(matrices[i-2]));
        }
        this.setMirrorMatrices(matrices);
    }
    
    
    set_3_60(mirror1, mirror2, mirror3) {
        let startTime = performance.now();
        let m1 =  mirror1.matrix, m2 = mirror2.matrix, m3 = mirror3.matrix;
        let rot = m2.clone().append(m1);
        let baseMatrices = [new PIXI.Matrix(), m1];
        for(let i=2; i<6; i++) {
            baseMatrices.push(rot.clone().append(baseMatrices[i-2]));
        }
        let matrices = [];
        let t1 = m1.clone().append(m3).append(m1).append(m2);
        let t2 = m2.clone().append(m3).append(m2).append(m1);
        for(let x= -5; x<=5; x++) {
            for(let y = -5; y<=5; y++) {
                let tx = t1.tx * x + t2.tx * y;
                let ty = t1.ty * x + t2.ty * y;            
                baseMatrices.forEach(baseMatrix => {
                    matrices.push(baseMatrix.clone().translate(tx,ty));
                })
            }
        }    
        this.setMirrorMatrices(matrices);
        console.log("done in "+(performance.now()-startTime));
    }

    clearScene() {
        this.mirrors.forEach(mirror => mirror.line.visible = false);
        this.setMirrorMatrices([]);
    }

    setScene1() {
        this.clearScene();        
        this.mirrors[0].line.visible = true;
        this.setMirrorMatrices([new PIXI.Matrix(), this.mirrors[0].matrix]);
    }

    setScene2() {
        let mirrors = this.mirrors;
        this.clearScene();
        mirrors[0].line.visible = true;
        mirrors[1].line.visible = true;
        this.set_2_60(...mirrors)
    }

    setScene3() {
        let mirrors = this.mirrors;
        this.clearScene();
        mirrors[0].line.visible = true;
        mirrors[1].line.visible = true;
        mirrors[2].line.visible = true;
        this.set_3_60(...mirrors)
    }

}


class Act1 extends Act {
    constructor() { super(); }
    start() {
        let mirrorBox = this.model;
        mirrorBox.setScene1();
    }
}

function smooth(x) { return (1.0-Math.cos(x*Math.PI))/2; }

class Act2 extends Act {
    constructor() { super(); }
    start() {
        let mirrorBox = this.model;
        mirrorBox.setScene2();
        this.mirror = null;
    }

    end() {
        if(this.mirror) {this.mirror.destroy(); this.mirror=null;}
    }

    toggleMirror() {
        if(this.mirror) {this.mirror.destroy(); this.mirror=null;}
        else {
            let g = new PIXI.Graphics();
            let phi = Math.PI/3;
            let r = 1000;
            const x = r * Math.cos(phi), y = r * Math.sin(phi);
            const x0 = -100, y0 = 100;
            g.moveTo(x0-x,y0-y);g.lineTo(x0+x,y0+y);
            g.stroke({color:'magenta', width:6})
            app.stage.addChildAt(g,0);
            this.mirror = g;
        }
    }
    onkeydown(e) {
        if(e.key == 'm') {
            this.toggleMirror();            
        } else if(e.key == 'r') {
            this.showRotation();
        }
    }

    showRotation() {
        const mirrorBox = this.model;
        let matrices = mirrorBox.instances.map(i=>i.localTransform);
        let rotArrows = new PIXI.Graphics();
        app.stage.addChild(rotArrows)
        let cx = -100, cy = 100;

        
        animations.run(e=>{

            if(e.param < 1.0) {
                let phi = -smooth(e.param)*2*Math.PI/3;
                let rot = new PIXI.Matrix().translate(-cx,-cy)
                    .rotate(phi)
                    .translate(cx,cy);
                let rMatrices = matrices.map(m=>rot.clone().append(m));    
                mirrorBox.setInstances(matrices.concat(rMatrices));

                this.drawArrows(rotArrows, rot);

            } else {
                rotArrows.destroy();
                mirrorBox.setInstances(matrices);  
            }

        }, 2)
    }


    drawArrows(g, rot) {
        let center = new PIXI.Point(-100,100);
        let dotPos = theDot.asset.position;
        g.clear();
        g.moveTo(center.x, center.y);
        g.lineTo(dotPos.x, dotPos.y);
        let p = rot.apply(dotPos);
        g.moveTo(center.x, center.y);
        g.lineTo(p.x, p.y);
        let r = 40;
        let d1 = dotPos.subtract(center);
        let d2 = p.subtract(center);
        
        let q = center.add(d1.normalize().multiplyScalar(r));
        g.moveTo(q.x,q.y);
        g.arc(center.x, center.y, r, Math.atan2(d1.y,d1.x), Math.atan2(d2.y,d2.x),true)
        g.lineTo(center.x, center.y);
        g.fill('cyan');
        g.stroke({color:'blue', width:1})
    }
}


class Act3 extends Act {
    constructor() { super(); }
    start() {
        let mirrorBox = this.model;
        mirrorBox.setScene3();
    }
}



async function initialize() {
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

    // texture = await PIXI.Assets.load("/images/fermhamente.png");


    document.body.appendChild(app.canvas);
    app.stage.eventMode = 'dynamic';
            
    app.stage.position.set(app.canvas.width/2,app.canvas.height/2);


    imageLayer = new PIXI.Container();
    mirrorLayer = new PIXI.Container();
    dotLayer = new PIXI.Container();
    app.stage.addChild(imageLayer);
    app.stage.addChild(mirrorLayer);
    app.stage.addChild(dotLayer);

    let p = new PIXI.Point(0,-50);
    mirrorBox = new MirrorBox();
    mirrorBox.setSeedMatrix(new PIXI.Matrix().translate(p.x,p.y))

    let dot = theDot = new MovingDot({color:'grey', callback:(p) =>{
        mirrorBox.setSeedMatrix(new PIXI.Matrix().translate(p.x,p.y))
    }})
    dot.asset.position.set(p.x,p.y)

    // set_3_60(...mirrors)

    mirrorBox.setScene1();

    director = new Director(mirrorBox);
    director.addAct(new Act1());
    director.addAct(new Act2());
    director.addAct(new Act3());
    
    animations = new AnimationManager();
    PIXI.Ticker.shared.add((ticker)=>{
        animations.tick(ticker.elapsedMS * 0.001);
    });
}

async function setup() {
    initialize()
}

function cleanup() {
    
}

