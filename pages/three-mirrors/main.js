const slide = {
    name:"three-mirrors"    
}

let imageLayer, mirrorLayer, dotLayer;
// let texture;

class MovingDot {
    constructor(options) {
        const color = options.color || 'red';
        const cb = this.callback = options.callback;
        const dot = this.asset = new PIXI.Graphics()
            .circle(0, 0, 5)
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
}

let mirrorBox;
let mirrors = [];

function set_2_60(mirror1, mirror2) {
    let m1 =  mirror1.matrix, m2 = mirror2.matrix;
    let rot = m2.clone().append(m1);
    let matrices = [new PIXI.Matrix(), m1];
    for(let i=2; i<6; i++) {
        matrices.push(rot.clone().append(matrices[i-2]));
    }
    mirrorBox.setMirrorMatrices(matrices);
}


function set_3_60(mirror1, mirror2, mirror3) {
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
    mirrorBox.setMirrorMatrices(matrices);
    console.log("done in "+(performance.now()-startTime));
}


function clearScene() {
    mirrors.forEach(mirror => mirror.line.visible = false);
    mirrorBox.setMirrorMatrices([]);
}
function setScene1() {
    clearScene();
    mirrors[0].line.visible = true;
    mirrorBox.setMirrorMatrices([new PIXI.Matrix(), mirrors[0].matrix]);
}
function setScene2() {
    clearScene();
    mirrors[0].line.visible = true;
    mirrors[1].line.visible = true;
    set_2_60(...mirrors)
}
function setScene3() {
    clearScene();
    mirrors[0].line.visible = true;
    mirrors[1].line.visible = true;
    mirrors[2].line.visible = true;
    set_3_60(...mirrors)
}

async function initialize() {
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

    let dot = new MovingDot({color:'red', callback:(p) =>{
        mirrorBox.setSeedMatrix(new PIXI.Matrix().translate(p.x,p.y))
    }})
    let p = new PIXI.Point(0,-50);
    dot.asset.position.set(p.x,p.y)

    mirrorBox = new MirrorBox();
    mirrorBox.setSeedMatrix(new PIXI.Matrix().translate(p.x,p.y))

    

    let mirror1 = new Mirror(new PIXI.Point(0,100), 0);
    let mirror2 = new Mirror(new PIXI.Point(-100,100), -60);
    let mirror3 = new Mirror(new PIXI.Point(300,100), 60);
    mirrors = [mirror1, mirror2, mirror3]
    // set_3_60(...mirrors)

    clearScene();
    setScene1();
    //let g = new PIXI.Graphics().circle(200,0,3).fill('blue');
    //dotLayer.addChild(g);

    addEventListener("keydown", (event) => {
        console.log(event);
        if(event.key=='1') setScene1();
        else if(event.key=='2') setScene2();
        else if(event.key=='3') setScene3();
    });
}

async function setup() {
    initialize()
}


