const slide = {
    name:"penrose2"    
}

let app;
let model;
let director;
let animations = new AnimationManager();
let maxScale = Infinity, minScale = 0.001;



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
    /*
    document.addEventListener('keydown', (e) => {
        console.log(e);
        if(e.key == '0') foo(0);
        else if(e.key == '1') foo(1);
        else if(e.key == '2') foo(2);
        else if(e.key == '3') foo(3);
        else if(e.key == '4') foo(4);
        
    })
        */
}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    app.destroy();
    app = null;
}

function addDot(p) {
    let g = new PIXI.Graphics().circle(p.x,p.y,5).fill('red').stroke('black');
    app.stage.addChild(g);
    return g;
}


class Model {
    constructor() {
        this.snapshotLayer = new PIXI.Container();
        app.stage.addChild(this.snapshotLayer);
        this.container = new PIXI.Container();
        app.stage.addChild(this.container);
        this.chainsContainer = new PIXI.Container();
        app.stage.addChild(this.chainsContainer);
        
        let y = ptsTable['tL'][1].y * 0.8;
        let s = 5;
        let globalMatrix = new PIXI.Matrix().translate(0,-y).scale(s,s);
        const width = app.canvas.width * 3, height = app.canvas.height * 3;
        let startTime = performance.now();
        let patch = buildPatch('tL',13,globalMatrix, width*0.4, height*0.4);
        patch.cells.forEach((cell,i) => cell.index = i);
        this.patch = patch;
        console.log("patch:", performance.now() - startTime);
        window.patch = patch;

        startTime = performance.now();
        let chains = computeChains(patch);
        console.log("chains: ", performance.now() - startTime);
        this.chains = chains;
        
        this.buildSimplePrototiles();
        this.chain = [];
        // startTime = performance.now();    
        // patch.placeTiles(app.stage, 2000);
        this.computeFirstCells();
    }

    computeFirstCells() {
        let firstCell = null;
        let minDist = 0;
        for(let cell of patch.cells) {
            if(!cell.isThick()) continue;
            let dist = cell.center.magnitude();
            if(firstCell == null || dist < minDist) { 
                minDist = dist; 
                firstCell = cell;
            }
        }
        this.firstCell = firstCell;
        let lst = firstCell.getNeighbours().filter(c=>!c.isThick());
        this.secondCell = lst[0];
    }

    placeFirstCells() {
        let container = this.container;
        let cell = this.firstCell;
        cell.placeTile(container);
        cell.getTween().placeTile(container);
        cell = this.secondCell;
        cell.placeTile(container);
        cell.getTween().placeTile(container);
    }

    buildSimplePrototiles() {
        let prototiles = this.simplePrototiles = {}
        for(let key of ['tL','TL','tR','TR']) {
            let pts = ptsTable[key];
            let p = prototiles[key] = new PIXI.GraphicsContext();
            p.poly(pts,true).fill('white');
            p.poly([pts[2],pts[0],pts[1]],false).stroke({color:'gray', width:4});
        }
    }

    hideChain() {
        this.chain.forEach(d=>d.destroy());
        this.chain.length = 0;
    }
    showChain(length) {
        animations.clear();
        this.hideChain();
        if(this.chains[length] === undefined) return;
        const prototiles = this.simplePrototiles;
        let chain = this.chains[length].chain;
        let index = 0;
        const me = this;
        let g1, g2;
        let alpha = 0.0;

        animations.run(e=>{            
            if(index>=chain.length) return false;
            let node = chain[index];
            let cell = node.cell, tween = node.tween;
            g1 = new PIXI.Graphics(prototiles[cell.key]);
            g1.setFromMatrix(cell.matrix);
            me.chainsContainer.addChild(g1);
            me.chain.push(g1);
            g2 = new PIXI.Graphics(prototiles[tween.key]);
            g2.setFromMatrix(tween.matrix);
            me.chainsContainer.addChild(g2);
            me.chain.push(g2);
            g1.alpha = g2.alpha = 0.7;
            index++;
            return true;
        });
    }

    /*
    createWholeTiling() {
        let g = new PIXI.Graphics();
        this.patch.cells.forEach(cell=>{

            let pts = ptsTable[cell.key].map(p=>cell.matrix.apply(p));
            let center = pts.reduce((a,b)=>a.add(b)).multiplyScalar(1/pts.length);
            if(center.magnitude()<100) {
                g.poly(pts,true).fill(cell.key.startsWith('T')?'orange':'cyan');
                g.poly([pts[1],pts[0],pts[2]],false).stroke({color:'black', width:0});
            }
        });
        return g;
    }
    */

    takeSnapshot() {
        let sz = 4096;
        let worldSz = 600.0;
        if(this.snapshotTexture) this.snapshotTexture.destroy();
        const myRenderTexture = this.snapshotTexture = PIXI.RenderTexture.create({
            width:sz, 
            height:sz, 
            antialias:true,
            resolution:1
            // autoGenerateMipmaps:true
        });
        this.container.scale.set(sz/worldSz,sz/worldSz)
        this.container.position.set(sz/2, sz/2);
        app.renderer.render({
            target:myRenderTexture, container:this.container,
            antialias:true
        });
        myRenderTexture.source.updateMipmaps()
        if(this.snapshot) this.snapshot.destroy();
        let sprite = this.snapshot = new PIXI.Sprite(myRenderTexture);
        sprite.anchor.set(0.5,0.5);
        sprite.scale.set(worldSz/sz, worldSz/sz);
        this.container.setFromMatrix(new PIXI.Matrix());

        this.snapshotLayer.addChild(sprite);
        if(app.stage.scale.x < 4) 
            this.container.visible = false;
        
    }
    
}

class Act1 extends Act {
    constructor() { super(); }
    start() {
        app.stage.scale.set(30,30);
        minScale = 3.38;
        this.model.placeFirstCells();
        let patch = this.model.patch;
        // patch.placeTiles(app.stage, 2000);
        let center = this.model.firstCell.center;
        let items = this.items = [];
        for(let cell of this.model.patch.cells) {
            if(cell.index == this.model.firstCell.index || 
                cell.index == this.model.secondCell.index) continue;
            if(cell.itm) continue;
            let disp = cell.center.subtract(center);
            let d = disp.magnitude();
            if(d>300) continue;
            
            let itm = cell.placeTile(model.container);
            itm.visible = false;
            items.push({cell, dist:d});
            //let mat = new PIXI.Matrix().translate(disp.x*2,disp.y*2).append(cell.matrix);
            //itm.setFromMatrix(mat);
        }
        this.t0 = performance.now();
        this.state = 0;
    }

    onkeydown(e) {
        if(e.key == '1') {
            this.t0 = performance.now();
            this.state = 1;
        } else if(e.key == '2') {
            this.model.showChain([25])
        } else if(e.key == '3') {
            this.model.showChain([215])
        } else if(e.key == '4') {
            this.model.showChain([855])
        } else if(e.key == 's') {
            this.model.container.visible = !this.model.container.visible    

        }
    }

    grow() {
        let t = (performance.now()-this.t0) * 0.001;
        t = Math.exp(t);
        // let center = this.model.firstCell.center;
        let done = true;
        this.items.forEach(itm => {
            const {cell, dist} = itm;
            // if(dist > 4100) return;
            if(cell.key.endsWith('R')) return;
            let tween = cell.getTween();
            let param = dist - t;
            if(param <= 0) {
                cell.itm.visible = true;
                cell.itm.alpha = 1.0;
                cell.itm.setFromMatrix(cell.matrix);
                if(tween && tween.itm) {
                    tween.itm.visible = true;
                    tween.itm.alpha = 1.0
                    tween.itm.setFromMatrix(tween.matrix);
                }
            } else {
                done = false;
                if(param < 1) {
                    let alpha = 1.0 - param;
                    cell.itm.visible = true;
                    cell.itm.alpha = alpha;
                    if(tween && tween.itm) {
                        tween.itm.visible = true;
                        tween.itm.alpha = alpha;
                    }
                }
            } 
        })
        if(done) {
            this.model.takeSnapshot();
            this.model.container.visible = false;
            this.state = 2;
        }
    }
    tick() {
        if(this.state == 1) this.grow();
    }
}

//-----------------------------------------------
class Act2 extends Act {
    constructor() { super(); }
    start() {
        app.stage.removeChildren().forEach(d=>d.destroy())
        let prototiles = {}
        for(let key of ['tL','TL','tR','TR']) {
            let g = new PIXI.GraphicsContext();
            g.poly(ptsTable[key],true).fill(key.startsWith('T')?'#FF0000FF':'#787878FF');
            prototiles["1_"+key] = g;
            g = new PIXI.GraphicsContext();
            g.poly(ptsTable[key],true).fill(key.startsWith('T')?'#00FFFFFF':'#777777FF');
            prototiles["2_"+key] = g;            
        }
        let c1 = new PIXI.Container();
        let c2 = new PIXI.Container();
        app.stage.addChild(c1);
        app.stage.addChild(c2);
        c1.position.x = 0;
        c2.position.x = 0;
        this.c1 = c1;
        this.c2 = c2;
        c2.blendMode = 'add';
        let sc = 3.2;
        app.stage.scale.set(sc,sc);
        minScale = sc;
        
        for(let cell of this.model.patch.cells) {
            if(cell.center.magnitude()<350) {
                let g = new PIXI.Graphics(prototiles["1_"+cell.key]);
                g.setFromMatrix(cell.matrix);
                c1.addChild(g);
                g = new PIXI.Graphics(prototiles["2_"+cell.key]);
                g.setFromMatrix(cell.matrix);
                c2.addChild(g);
            }
        }
        
        /*
        app.stage.on('globalpointermove', (e) => {
            c2.position.set(e.global.x, e.global.y)
        })
            */

        
        document.addEventListener('pointerdown', e=>{
            let x,y;
            function drag(e) {
                let dx = e.clientX - x; x = e.clientX;
                let dy = e.clientY - y; y = e.clientY;
                let amount = 1.0/app.stage.scale.x;
                let newx = c2.position.x + dx * amount;
                let newy = c2.position.y + dy * amount;                
                // setTimeout(()=>{c2.position.set(newx,newy)},0)
                // c2.position.set(newx,newy);  
                c2.position.x = newx;
            }
            function dragEnd(e) {
                document.removeEventListener('pointermove', drag);
                document.removeEventListener('pointerup', dragEnd);
                
            }
            document.addEventListener('pointermove', drag);
            document.addEventListener('pointerup', dragEnd);
            x = e.clientX;
            y = e.clientY;
        })
        
            
    }

    tick() {
        // this.c1.position.x = 200*Math.sin(performance.now()*0.0001)
    }
}

class Act3 extends Act {
    constructor() { super(); }
    start() {
        app.stage.removeChildren().forEach(d=>d.destroy())
        let prototiles = {}
        for(let key of ['tL','TL','tR','TR']) {
            let g = new PIXI.GraphicsContext();
            g.poly(ptsTable[key],true).fill(key.startsWith('T')?'#FF0000FF':'#787878FF');
            prototiles["1_"+key] = g;
            g = new PIXI.GraphicsContext();
            g.poly(ptsTable[key],true).fill(key.startsWith('T')?'#00FFFFFF':'#777777FF');
            prototiles["2_"+key] = g;            
        }
        let c1 = new PIXI.Container();
        let c2 = new PIXI.Container();
        app.stage.addChild(c1);
        app.stage.addChild(c2);
        c1.position.x = 0;
        c2.position.x = 0;
        this.c1 = c1;
        this.c2 = c2;
        c2.blendMode = 'add';
        let sc = 3.2;
        app.stage.scale.set(sc,sc);
        minScale = sc;
        

        let g1 = new PIXI.Graphics();
        let g2 = new PIXI.Graphics();
        for(let cell of this.model.patch.cells) {
            if(cell.center.magnitude()<350) {
                let pts = ptsTable[cell.key].map(p=>cell.matrix.apply(p));
                g1.poly(pts,true);
                g1.fill(cell.key.startsWith('T')?'#FF0000FF':'#787878FF');
                g2.poly(pts,true);
                g2.fill(cell.key.startsWith('T')?'#00FFFFFF':'#777777FF');
            }
        }
        c1.addChild(g1);
        c2.addChild(g2);
                
        /*
        app.stage.on('globalpointermove', (e) => {
            c2.position.set(e.global.x, e.global.y)
        })
            */

        
        document.addEventListener('pointerdown', e=>{
            let x,y;
            function drag(e) {
                let dx = e.clientX - x; x = e.clientX;
                let dy = e.clientY - y; y = e.clientY;
                let amount = 1.0/app.stage.scale.x;
                let newx = c2.position.x + dx * amount;
                let newy = c2.position.y + dy * amount;                
                // setTimeout(()=>{c2.position.set(newx,newy)},0)
                // c2.position.set(newx,newy);  
                c2.position.x = newx;
            }
            function dragEnd(e) {
                document.removeEventListener('pointermove', drag);
                document.removeEventListener('pointerup', dragEnd);
                
            }
            document.addEventListener('pointermove', drag);
            document.addEventListener('pointerup', dragEnd);
            x = e.clientX;
            y = e.clientY;
        })
        
            
    }

    tick() {
        // this.c1.position.x = 200*Math.sin(performance.now()*0.0001)
    }
}

//-----------------------------------------------


function buildScene() {
    model = new Model();
    director = new Director(model);
    director.addAct(new Act1())
    director.addAct(new Act3())


    PIXI.Ticker.shared.add((ticker)=>{
        animations.tick();
    });
    
    /*
    let y = ptsTable['tL'][1].y * 0.8;
    let s = 5;
    let globalMatrix = new PIXI.Matrix().translate(0,-y).scale(s,s);
    const width = app.canvas.width * 3, height = app.canvas.height * 3;
    let startTime = performance.now();
    let patch = buildPatch('tL',12,globalMatrix, width*0.4, height*0.4);
    console.log("patch:", performance.now() - startTime);
    window.patch = patch;
    startTime = performance.now();    
    patch.placeTiles(app.stage, 2000);
    console.log("tiles:", performance.now() - startTime);

    
    */

    // implement zoom
    document.addEventListener('wheel', (e)=>{
        console.log(e);
        let scale = app.stage.scale.x;
        scale = Math.max(minScale, Math.min(maxScale, scale * Math.exp(-e.deltaY*0.002)));
        app.stage.scale.set(scale,scale);
        if(director.currentAct && director.currentAct.onzoom) 
            director.currentAct.onzoom(scale);
        console.log(scale);
    })

    //filter = new PIXI.ColorMatrixFilter(); 
    //filter.hue(60);
    // setInterval(foo, 100)

}



function showChain(chain) {
    
    /*
    let pts = [];
    for(let node of chain) {
        let pa = node.cell.edges[0].pa;
        let pb = node.cell.edges[0].pb;
        let p = lerp(pa,pb,0.5);
        pts.push(p);        
    }
    let g = new PIXI.Graphics();
    g.poly(pts, true).stroke({color:'red', width:2});
    app.stage.addChild(g);
    return g; 
    */
}

function foo() {
    if(stack.length > 0) {
        let cell = stack.pop();
        for(let edge of cell.edges) {
            if(edge.tween && (edge.tween.cell.key.startsWith('T'))) {
                let other = edge.tween.cell;
                if(!touched[other.index]) {
                    touched[other.index] = true;
                    other.itm.filters = [filter];
                    stack.push(other);
                }    
            }
        }
    } else {
        while(cur < patch.cells.length) 
        {
            let cell = patch.cells[cur];
            if(!touched[cell.index] && cell.key.startsWith('T'))
                break;
            cur++;
        }
        if(cur < patch.cells.length) 
        {
            let cell = patch.cells[cur];
            cur++;
            touched[cell.index] = true;
            stack.push(cell);
            cell.itm.filters = [filter];
        }
        
    }
}


