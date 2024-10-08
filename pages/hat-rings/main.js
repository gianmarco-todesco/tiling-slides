const slide = {
    name:"hat-rings"    
}

let app;

async function initPixiAndLoadTexture() {
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
    initPixiAndLoadTexture();
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

let unit = 20.0;
let sqrt3_2 = Math.sqrt(3)/2;



let cells = []



function getCellsByTree(tree, cellIndex) {
    let lst = [];
    function foo(tree, cell) {
        lst.push(cell.index);
        tree.children.forEach(node=>{
            let other = cell.getEdgeCell(node.edgeIndex);
            foo(node, other)
        })
    }
    foo(tree,cells[cellIndex]);
    return lst;
}

function createTree(tree, cellIndex) {
    let lst = getCellsByTree(tree, cellIndex);
    lst.forEach(i=>{
        let cell = cells[i];
        cell.createGraphics('orange')
        cell.empty = false;
    })
}

function checkTree(tree, cellIndex) {
    let ok = true;
    function foo(tree, cell) {
        if(!cell.empty) { ok = false; return; }
        tree.children.forEach(node=>{
            let other = cell.getEdgeCell(node.edgeIndex);
            foo(node, other)
        })
    }
    foo(tree, cells[cellIndex])
    return ok;
}

let trees1 = [];
let trees2 = [];
let hatShape1, hatShape2;
let ex

let board; 
let painter;
let explorer;

function buildScene() {
    board = new Board();
    board.cells.forEach(cell=>cell.createGraphics('#aaaaaa'));
    painter = new Painter(board);
    explorer = new Explorer(board);
    explorer.placeFirst();
}

function buildScene_old() {


    
    hatShape1 = makeHatShape();
    hatShape2 = makeHatShape2();

    //hatShape2 = makeHatShape2();

    let ii = [1,0,4,7,8,2,3,12];
    /*
    ii.forEach(i=>{
        cells[i].createGraphics('red');
        cells[i].empty = false;
    })
    */

    //let boundary = getBoundary(ii.map(i=>cells[i]));
    //boundary.forEach(c=>c.createGraphics('orange'))

    for(let i of [1,7,4,3,12,2,8]) {
        trees1.push(getTree(ii,i))
    }

    ii = [1,8,0,2,3,9,11,22];
    ii.forEach(i=>{
        cells[i].createGraphics('red');
        cells[i].empty = false;
    })
    for(let i of [1,0,9,3,11,22,8]) {
        trees2.push(getTree(ii,i))
    }


    ex = new Explorer();
}

function findTree(trees, cellIndex) {
    return trees.filter(tree=>checkTree(tree, cellIndex));
}

function getBoundary(lst) {
    let boundary = [];
    let tb = {};
    lst.forEach(cell => tb[cell.index] = cell.layer);
    lst.forEach(cell => {
        let nextLayer = cell.layer + 1;
        for(let i=0; i<4; i++) {
            let others = cell.getVertexCells(i);

            for(let other of others) {
                if(tb[other.index]===undefined) {
                    boundary.push(other);
                    tb[other.index] = nextLayer;
                } else {
                    if(tb[other.index] > nextLayer) tb[other.index] = nextLayer;
                }
            }
        }
    })
    return boundary.map(cell=>({cell, layer:tb[cell.index]}));
}



function placeHat(tree, cellIndex, hatShape) {
    let matrix = getFourPointsTransform(
        cells[tree.cellIndex].pts[0],
        cells[tree.cellIndex].pts[2],
        cells[cellIndex].pts[0],
        cells[cellIndex].pts[2]
    );
    let g = new PIXI.Graphics(hatShape);
    g.alpha = 0.5;
    
    g.setFromMatrix(matrix);
    app.stage.addChild(g);
    let lst = getCellsByTree(tree, cellIndex);
    lst.forEach(i=>cells[i].empty = false);
    return {g,lst}
}


class ExplorerOld {
    constructor() {
        this.index = 0;
        this.stack = [];
        this.usedCells = cells.filter(c=>!c.empty);
        this.regularPool = [];
        this.flippedPool = [];
        this.dotPool = [];
        this.dotShape = null;
    }

    placeDot(p) {
        let dot;
        if(this.dotPool.length>0) { 
            dot = this.dotPool.pop(); 
            dot.visible=true;
        }
        else {
            if(!this.dotShape) {
                this.dotShape = new PIXI.GraphicsContext().circle(0,0,3).fill('red').stroke('black');
            }
            dot = new PIXI.Graphics(this.dotShape);
        }
        dot.position.set(p.x,p.y);
        app.stage.addChild(dot);
        return dot;
    }
    removeDot(dot) {
        dot.visible = false;
        app.stage.removeChild(dot);
        this.dotPool.push(dot);
    }
    placeDotInCell(cell) {
        if(cell.dot) throw "Dot already present in cell"
        let c = cell.pts.reduce((a,b)=>a.add(b)).multiplyScalar(0.25);
        let dot = this.placeDot(c);
        cell.dot = dot;
        return dot;
    }
    removeDotFromCell(cell) {
        if(!cell.dot) throw "Missing dot in cell";
        let dot = cell.dot;
        this.removeDot(dot);
        cell.dot = undefined;
    }

    placeHat(tree, cellIndex, flipped) {
        let matrix = getFourPointsTransform(
            cells[tree.cellIndex].pts[0],
            cells[tree.cellIndex].pts[2],
            cells[cellIndex].pts[0],
            cells[cellIndex].pts[2]
        );
        let g = null;
        if(flipped) { if(this.flippedPool.length>0) g = this.flippedPool.pop(); }
        else { if(this.regularPool.length>0) g = this.regularPool.pop();}
        if(g) g.visible = true;
        else g = new PIXI.Graphics(flipped ? hatShape2 : hatShape1);
        g.alpha = 0.5;
        
        g.setFromMatrix(matrix);
        app.stage.addChild(g);
        let lst = getCellsByTree(tree, cellIndex);
        lst.forEach(i=>{
            cells[i].empty = false;
            this.placeDotInCell(cells[i])
        });
        return {g, lst, flipped}
    }

    removeHat(hat) {
        const {g,lst,flipped} = hat;
        lst.forEach(i=>{ 
            cells[i].empty = true; 
            cells[i].layer=0;
            this.removeDotFromCell(cells[i])
        });
        app.stage.removeChild(g);
        g.visible = false;
        if(flipped) this.flippedPool.push(g);
        else this.regularPool.push(g);
        for(let i=0; i<lst.length; i++) this.usedCells.pop();
    }

    getCandidates(cell) {
        let c1 = findTree(trees1, cell.index).map(c=>({
            tree:c, flipped:false, cellIndex:cell.index
        }));
        let c2 = findTree(trees2, cell.index).map(c=>({
            tree:c, flipped:true, cellIndex:cell.index
        }));
        return c1.concat(c2);        
    }

    placeCandidate(candidate, candidateIndex) {
        const {tree, flipped, cellIndex} = candidate;
        console.log(tree, flipped, cellIndex)
        let hat = this.placeHat(tree, cellIndex, flipped);
        console.log(hat);
        hat.lst.forEach(i=>this.usedCells.push(cells[i]))
        this.stack.push({
            cellIndex:cellIndex,
            candidateIndex,
            g:hat.g,
            lst:hat.lst,
            flipped:hat.flipped
        });
    }

    step() {
        let boundary = getBoundary(this.usedCells);
        boundary = boundary.sort((a,b)=>a.layer-b.layer);
        let cell = boundary[0].cell;
        let candidates = this.getCandidates(cell);
        if(candidates.length == 0) return this.backtrack();
        this.placeCandidate(candidates[0], 0);
        this.index++;
        return true;
    }
    backtrack() {
        if(this.stack.length==0) return false;
        let q = this.stack.pop();
        this.removeHat(q);
        let cellIndex = q.cellIndex;
        let candidateIndex = q.candidateIndex;
        let candidates = this.getCandidates(cells[cellIndex]);
        candidateIndex++;
        if(candidateIndex>=candidates.length) {
            return this.backtrack();            
        }
        let candidate = candidates[candidateIndex];
        this.placeCandidate(candidate, candidateIndex);
        return true;

    }

}

