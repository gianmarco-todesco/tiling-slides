const slide = {
    name:"penrose2"    
}

let app;
let model;
let director;

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
        let y = ptsTable['tL'][1].y * 0.8;
        let s = 5;
        let globalMatrix = new PIXI.Matrix().translate(0,-y).scale(s,s);
        const width = app.canvas.width * 3, height = app.canvas.height * 3;
        let startTime = performance.now();
        let patch = buildPatch('tL',12,globalMatrix, width*0.4, height*0.4);
        patch.cells.forEach((cell,i) => cell.index = i);
        this.patch = patch;
        console.log("patch:", performance.now() - startTime);
        window.patch = patch;

        startTime = performance.now();
        let chains = computeChains(patch);
        let H = window.H = {}
        chains.forEach(chain => H[chain.length] = chain);
        console.log("chains: ", performance.now() - startTime);
        this.chains = chains;
        
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
        let container = app.stage;
        let cell = this.firstCell;
        cell.placeTile(container);
        cell.getTween().placeTile(container);
        cell = this.secondCell;
        cell.placeTile(container);
        cell.getTween().placeTile(container);
    }
}

class Act1 extends Act {
    constructor() { super(); }
    start() {
        app.stage.scale.set(30,30);
        this.model.placeFirstCells();
        let patch = this.model.patch;
        // patch.placeTiles(app.stage, 2000);
        let center = this.model.firstCell.center;
        let items = this.items = [];
        for(let cell of this.model.patch.cells) {
            if(cell.index == this.model.firstCell.index || 
                cell.index == this.model.secondCell.index) continue;
            if(cell.itm) continue;
            let itm = cell.placeTile(app.stage);
            let disp = cell.center.subtract(center);
            let d = disp.magnitude();
            itm.visible = false;
            items.push({cell, dist:d});
            //let mat = new PIXI.Matrix().translate(disp.x*2,disp.y*2).append(cell.matrix);
            //itm.setFromMatrix(mat);
        }
        this.t0 = performance.now();
    }
    tick() {
        let t = (performance.now()-this.t0) * 0.001;
        let center = this.model.firstCell.center;
        this.items.forEach(itm => {
            const {cell, dist} = itm;
            let param = dist - t;
            if(param <= 0) {
                cell.itm.visible = true;
                cell.itm.setFromMatrix(cell.matrix);
            } else if(param < 10) {
                cell.itm.visible = true;
                let disp = cell.center.subtract(center).multiplyScalar(param);
                let mat = new PIXI.Matrix().translate(disp.x*2,disp.y*2).append(cell.matrix);
                cell.itm.setFromMatrix(mat);
            } 
        })

    }
}

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
        
        for(let cell of this.model.patch.cells) {
            if(cell.center.magnitude()<100) {
                let g = new PIXI.Graphics(prototiles["1_"+cell.key]);
                g.setFromMatrix(cell.matrix);
                c1.addChild(g);
                g = new PIXI.Graphics(prototiles["2_"+cell.key]);
                g.setFromMatrix(cell.matrix);
                c2.addChild(g);
            }
        }
        document.addEventListener('pointerdown', e=>{
            let x,y;
            function drag(e) {
                let dx = e.clientX - x; x = e.clientX;
                let dy = e.clientY - y; y = e.clientY;
                c2.position.x += dx;
                c2.position.y += dy;
                
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


function buildScene() {
    model = new Model();
    director = new Director(model);
    director.addAct(new Act2())
    director.addAct(new Act1())


    
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
        scale = Math.max(0.1, Math.min(30.0, scale * Math.exp(-e.deltaY*0.002)));
        app.stage.scale.set(scale,scale);
        console.log(scale);
    })

    //filter = new PIXI.ColorMatrixFilter(); 
    //filter.hue(60);
    // setInterval(foo, 100)

}



function showChain(chain) {
    for(let node of chain) {
        node.cell.itm.alpha = 0.3;
        node.tween.itm.alpha = 0.3;        
    }
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


