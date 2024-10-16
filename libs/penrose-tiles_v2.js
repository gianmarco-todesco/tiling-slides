

let tLpts, tRpts, TLpts, TRpts;
const unit = 300.0;

const protoTileKeys = ['tL','TL','tR','TR'];
const tweenKeyTable = {
    'tL':'tR', 'tR':'tL',
    'TL':'TR', 'TR':'TL'    
}
// (0,0),(1,0) => p0,p1
function getTwoPointsTransform(p0, p1) {
    let e0 = p1.subtract(p0);
    let e1 = new PIXI.Point(-e0.y,e0.x);
    return new PIXI.Matrix(e0.x,e0.y,e1.x,e1.y,p0.x,p0.y);
}

// p0,p1 => p2,p3
function getFourPointsTransform(p0,p1,p2,p3) {
    let mat1 = getTwoPointsTransform(p0,p1).invert();
    let mat2 = getTwoPointsTransform(p2,p3);
    return mat2.append(mat1);
}


function lerp(p1,p2,t) {
    return p1.add(p2.subtract(p1).multiplyScalar(t));
}

(()=>{
    
    const Point = PIXI.Point;
    let a18 = Math.PI/10;
    let a54 = Math.PI/2 - Math.PI/5;
    let cs18 = Math.cos(a18), sn18 = Math.sin(a18);
    let cs54 = Math.cos(a54), sn54 = Math.sin(a54);
    tLpts = [[0,0],[-1,1],[1,1]].map(([x,y])=>new Point(sn18*unit*x, cs18*unit*y))
    tRpts = [[0,0],[1,1],[-1,1]].map(([x,y])=>new Point(sn18*unit*x, cs18*unit*y))
    TLpts = [[0,0],[-1,1],[1,1]].map(([x,y])=>new Point(sn54*unit*x, cs54*unit*y))
    TRpts = [[0,0],[1,1],[-1,1]].map(([x,y])=>new Point(sn54*unit*x, cs54*unit*y))
})();


const ptsTable = {
    'tL':tLpts,
    'TL':TLpts,
    'tR':tRpts,
    'TR':TRpts,
}

// ordine dei punti: il primo è il vertice, poi in senso antiorario


function createProtoTile(index) {
    const pts = [tLpts,TLpts,tRpts,TRpts][index-1]
    const color = index % 2 == 1? "cyan" : "orange";

    let gc = new PIXI.GraphicsContext();
    gc.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p=>gc.lineTo(p.x,p.y));
    gc.closePath();
    gc.fill(color);
    let innerStrokeWidth = 16;
    const r1 = unit * 0.25, r2 = unit * 0.25;
    const r3 = unit - r1;
    if(index == 1) {
        gc.moveTo(pts[1].x + r1, pts[1].y);
        gc.arc(pts[1].x, pts[1].y, r1, 0, -Math.PI*72/180, true);
        gc.stroke({color:'green', width:innerStrokeWidth, cap:"butt"})
        gc.moveTo(pts[2].x - r2, pts[2].y);
        gc.arc(pts[2].x, pts[2].y, r2, Math.PI, Math.PI + Math.PI*72/180);
        gc.stroke({color:'pink', width:innerStrokeWidth, cap:"butt"})
    } else if(index == 3) {
        gc.moveTo(pts[1].x - r1, pts[1].y);
        gc.arc(pts[1].x, pts[1].y, r1, Math.PI, Math.PI + Math.PI*72/180);
        gc.stroke({color:'green', width:innerStrokeWidth, cap:"butt"})
        gc.moveTo(pts[2].x + r2, pts[2].y);
        gc.arc(pts[2].x, pts[2].y, r2, 0, -Math.PI*72/180, true);
        gc.stroke({color:'pink', width:innerStrokeWidth, cap:"butt"})

    } else if(index == 2) {
        gc.moveTo(pts[1].x + r3, pts[1].y);
        gc.arc(pts[1].x, pts[1].y, r3, 0, -Math.PI*36/180, true);
        gc.stroke({color:'green', width:innerStrokeWidth, cap:"butt"})

        gc.moveTo(pts[2].x - r2, pts[2].y);
        gc.arc(pts[2].x, pts[2].y, r2, Math.PI, Math.PI + Math.PI*36/180);
        gc.stroke({color:'pink', width:innerStrokeWidth, cap:"butt"})
    } else if(index == 4) {
        gc.moveTo(pts[1].x - r3, pts[1].y);
        gc.arc(pts[1].x, pts[1].y, r3, Math.PI, Math.PI + Math.PI*36/180);
        gc.stroke({color:'green', width:innerStrokeWidth, cap: "butt"})

        gc.moveTo(pts[2].x + r2, pts[2].y);
        gc.arc(pts[2].x, pts[2].y, r2, 0, -Math.PI*36/180, true);
        gc.stroke({color:'pink', width:innerStrokeWidth, cap:"butt"})

    }
    gc.moveTo(pts[2].x, pts[2].y);
    gc.lineTo(pts[0].x, pts[0].y);
    gc.lineTo(pts[1].x, pts[1].y);
    gc.stroke({color:'black', width:6, join:"round"})
    return gc;
}

let p1,p2;
let goldenRatio = (Math.sqrt(5)+1)/2;

function place(gc, matrix) {
    let itm = new PIXI.Graphics(gc);
    itm.setFromMatrix(matrix);
    app.stage.addChild(itm)
    return itm;
}


let tLprotoTile = createProtoTile(1); // tLpts, "cyan");
let TLprotoTile = createProtoTile(2); // TLpts, "orange", true);
let tRprotoTile = createProtoTile(3); // tRpts, "cyan");
let TRprotoTile = createProtoTile(4); // TRpts, "orange");
const protoTileTable = {
    'tL':tLprotoTile,
    'TL':TLprotoTile,
    'tR':tRprotoTile,
    'TR':TRprotoTile,
}

class Matrix {
    constructor() {
        this.matrix = new PIXI.Matrix();
    }
    translate(p, factor=1.0) {
        this.matrix = this.matrix.translate(p.x*factor, p.y*factor);
        return this;
    }
    rotate(degrees) {
        this.matrix = this.matrix.rotate(degrees * Math.PI / 180.0);
        return this;
    }
    toPixi() {
        return this.matrix;
    }
}

// see: https://www.projectrhea.org/rhea/index.php/MA271Fall2020Walther_Topic27_Inflation_and_Deflation


let mat11 = new Matrix().rotate(180-72).translate(tLpts[2],goldenRatio).toPixi();
let mat12 = new Matrix().rotate(36*2+180).translate(tLpts[1]).toPixi();

let mat21 = new Matrix().translate(tRpts[2],-1).rotate(180-36).toPixi();
let mat22 = new Matrix().translate(TRpts[2],1/goldenRatio).toPixi();
let mat23 = new Matrix().translate(TLpts[2],-1).rotate(180+36).toPixi();

let mat31 = new Matrix().rotate(-180+72).translate(tLpts[1],goldenRatio).toPixi();
let mat32 = new Matrix().rotate(-36*2-180).translate(tLpts[2]).toPixi();

let mat41 = new Matrix().translate(tRpts[1],-1).rotate(-180+36).toPixi();
let mat42 = new Matrix().translate(TRpts[1],1/goldenRatio).toPixi();
let mat43 = new Matrix().translate(TLpts[1],-1).rotate(-180-36).toPixi();

class Edge {
    constructor(cell, i) {
        this.i = i;
        this.cell = cell;
        this.next = null;
        this.prev = null;
        this.tween = null;
        this.pa = null;
        this.pb = null;
    }
}

// ordine degli edge: il primo è la base (dove si attaccano i due mezzi tile) e poi in senso
// antiorario

class Cell {
    constructor(key, matrix) {
        this.key = key;
        this.prototile = protoTileTable[key];
        if(this.prototile === undefined) throw "Bad cell key: "+key;
        this.matrix = matrix.clone();
        this.edges = [0,1,2].map(i=>new Edge(this,i));
        this.edges.forEach((edge,i,a) => {
            edge.next = a[(i+1)%a.length];
            edge.prev = a[(i+a.length-1)%a.length];            
        })
        this.pts = ptsTable[key].map(p=>matrix.apply(p));
        let pts = this.pts;
        if(key == "TR" || key == "tR") pts = [pts[0],pts[2],pts[1]];
        for(let i=0;i<3;i++) {
            this.edges[i].pa = pts[(i+1)%3];
            this.edges[i].pb = pts[(i+2)%3];            
        }
        this.center = this.pts.reduce((a,b)=>a.add(b)).multiplyScalar(1/3);
    }

    placeTile(container) {
        if(this.itm) throw "Duplicate tile";
        let itm = new PIXI.Graphics(this.prototile);
        itm.setFromMatrix(this.matrix);
        container.addChild(itm);
        this.itm = itm;
        
        /*
        const text = new PIXI.Text({
            text:this.key,
            // align:'center',
            anchor: new PIXI.Point(0.5,0.5),
            style:{
              fontFamily:'short-stack'
            }
          })
        app.stage.addChild(text);
        text.x = this.center.x;
        text.y = this.center.y;
        */
        /*
        let q = new PIXI.Graphics();
        const ee = this.edges;
        const ce = this.center;
        
        q.poly([lerp(ee[0].pa,ce,0.1),lerp(ee[0].pb,ce,0.1),lerp(ee[0].pb,ce,0.3)],  false)
          .stroke({color:"black", width:1})
        q.poly([lerp(ee[1].pa,ce,0.1),lerp(ee[1].pb,ce,0.1),lerp(ee[1].pb,ce,0.3)],  false)
          .stroke({color:"red", width:1})
          app.stage.addChild(q);
          */

        return itm;
    }

    placeTween(container) {
        let pa = this.edges[0].pa;
        let pb = this.edges[0].pb;
        if(this.key == 'tL' || this.key == 'TL') [pa,pb]=[pb,pa];
        let tweenKey = tweenKeyTable[this.key];
        let tweenPrototile = protoTileTable[tweenKey];
        let tweenPts = ptsTable[tweenKey];
        let matrix = getFourPointsTransform(tweenPts[1],tweenPts[2], pb, pa);
        let itm = new PIXI.Graphics(tweenPrototile);
        itm.setFromMatrix(matrix);
        container.addChild(itm);
        return itm;
    }

    isThick() {
        return this.key == "TL" || this.key == "TR";
    }
    getTween() {
        return this.edges[0].tween?.cell;
    }
    getNeighbours() {
        let lst = [];
        for(let i=1; i<3; i++) 
            if(this.edges[i].tween)
                lst.push(this.edges[i].tween.cell);
        let tween = this.getTween();
        if(tween) {
            for(let i=1; i<3; i++) 
                if(tween.edges[i].tween)
                    lst.push(tween.edges[i].tween.cell);
        }
        return lst;   
    }
}

function areClose(p1,p2) {
    return p1.subtract(p2).magnitude() < 1.0e-6;
}

class CellPatch {
    constructor() {
        this.cells = [];
        this.edges = []; // il primo è la base (che connette le due mezze tessere), poi in senso antiorario 
    }
    placeTiles(container, maxDistance = Infinity) {
        this.cells.forEach(cell=>{

            let p = cell.matrix.apply(new PIXI.Point(0,0));
            if(p.magnitude()<maxDistance)
               cell.placeTile(container)
        });
    }
    joinEdge(edgeIndex, other, otherEdgeIndex) {
        let edges = this.edges[edgeIndex];
        let otherEdges = other.edges[otherEdgeIndex].toReversed();
        if(edges.length != otherEdges.length) throw "joinEdge: length mismatch";
        for(let i=0;i<edges.length;i++) {
            if(!areClose(edges[i].pa, otherEdges[i].pb)) throw "joinEdge: points AB mismatch, i=" + i;
            if(!areClose(edges[i].pb, otherEdges[i].pa)) throw "joinEdge: points BA mismatch, i=" + i;
            if(edges[i].tween != null || otherEdges[i].tween != null ) 
                throw "joinEdge: edges already connected";
            edges[i].tween = otherEdges[i];
            otherEdges[i].tween = edges[i];
        }
    }

    placeTweens(container) {
        for(let mainEdge of this.edges.slice(1)) {
            for(let edge of mainEdge) {
                if(edge.i == 0) {
                    let itm = edge.cell.placeTween(container);
                    itm.alpha = 0.25
                }
            }
        }
    }
}
// see: https://www.projectrhea.org/rhea/index.php/MA271Fall2020Walther_Topic27_Inflation_and_Deflation

function concatCells(...patches) {
    let a = null;
    for(let patch of patches) {
        if(patch != null) {
            if(a==null) a = patch.cells;
            else a = a.concat(patch.cells);
        }
    }
    return a;
}


function buildPatch(key, level, parentMatrix, halfWidth, halfHeight) {
    let pts = ptsTable[key].map(p=>parentMatrix.apply(p));

    let b0=true,b1=true,b2=true,b3=true;
    pts.forEach(p=>{
        if(p.x>-halfWidth) b0=false;
        if(p.x<halfWidth) b1=false;
        if(p.y>-halfHeight) b2=false;
        if(p.y<halfHeight) b3=false;
    })
    // if(b0||b1||b2||b3) return null;

    if(level == 0) {
        let cell = new Cell(key, parentMatrix);
        let patch = new CellPatch();
        patch.cells.push(cell);
        cell.edges.forEach(edge => patch.edges.push([edge]));
        return patch;
    } else {
        let s = 1/goldenRatio;
        let matrix = parentMatrix.clone().append(new PIXI.Matrix().scale(s,s));
        if(key == 'tL') {
            // tL
            let patch1 = buildPatch('tL', level-1, matrix.clone().append(mat11));
            let patch2 = buildPatch('TL', level-1, matrix.clone().append(mat12));
            if(patch1 && patch2) patch1.joinEdge(2,patch2,2);
            let patch = new CellPatch();
            patch.cells = concatCells(patch1, patch2);
            if(patch1 && patch2) {
                patch.edges.push(
                    patch1.edges[1],
                    patch2.edges[0],
                    patch2.edges[1].concat(patch1.edges[0])
                );
            }
            
            return patch;
        } else if(key == 'TL') {
            let patch1 = buildPatch('tR', level-1, matrix.clone().append(mat21));
            let patch2 = buildPatch('TR', level-1, matrix.clone().append(mat22));
            let patch3 = buildPatch('TL', level-1, matrix.clone().append(mat23));
            let patch = new CellPatch();
            patch3.joinEdge(1,patch1,2)
            patch1.joinEdge(1,patch2,1);
            patch.cells = patch1.cells.concat(patch2.cells).concat(patch3.cells);
            patch.edges.push(
                patch2.edges[0].concat(patch3.edges[2]),
                patch3.edges[0],
                patch1.edges[0].concat(patch2.edges[2])
            );

            return patch;
        } else if(key == 'tR') {
            let patch1 = buildPatch('tR', level-1, matrix.clone().append(mat31));
            let patch2 = buildPatch('TR', level-1, matrix.clone().append(mat32));
            let patch = new CellPatch();
            patch1.joinEdge(1,patch2,1);
            patch.cells = patch1.cells.concat(patch2.cells);
            patch.edges.push(
                patch1.edges[2],
                patch1.edges[0].concat(patch2.edges[2]),
                patch2.edges[0]
            );
            return patch;
        } else if(key == 'TR') {
            let patch1 = buildPatch('tL', level-1, matrix.clone().append(mat41));
            let patch2 = buildPatch('TL', level-1, matrix.clone().append(mat42));
            let patch3 = buildPatch('TR', level-1, matrix.clone().append(mat43));
            let patch = new CellPatch();
            patch3.joinEdge(2,patch1,1)
            patch1.joinEdge(2,patch2,2);
            patch.cells = patch1.cells.concat(patch2.cells).concat(patch3.cells);
            patch.edges.push(
                patch3.edges[1].concat(patch2.edges[0]),
                patch2.edges[1].concat(patch1.edges[0]),
                patch3.edges[0]                
            );
            return patch;

        }
        else
          throw "Uffa"; 
    }
}



function computeChains(patch) {
    let chainTable = {}
    let touched = {}
    function touch(cell) {
        if(touched[cell.index]) throw "Cell already touched:" + cell.index;
        touched[cell.index] = true;    
        let tween = cell.getTween();
        if(tween)
        {
            if(touched[tween.index]) throw "Tween already touched:" + tween.index;
            touched[tween.index] = true;
        }
    }
    for(let cell of patch.cells) {
        let nodes = [];
        if(!cell.isThick() || touched[cell.index]) continue;
        let stack = [cell];
        touch(cell);
        while(stack.length>0) {
            let cell = stack.pop();
            let tween = cell.getTween();
            let node = { cell, tween, links:[] };
            let others = [];
            for(let i=1;i<3;i++) others.push(cell.edges[i].tween?.cell);
            if(tween)
                for(let i=1;i<3;i++) others.push(tween.edges[i].tween?.cell);
            for(let other of others) {
                if(!other || !other.isThick()) continue;
                node.links.push(other);
                if(!touched[other.index]) {
                    touch(other);
                    stack.push(other);
                }
            }
            nodes.push(node);
        }
        // check if it is complete
        let err = nodes.filter(node=>(node.tween==null || node.links.length != 2));
        if(err.length ==0)
        {
            let c = nodes.map(node=>node.cell.center.add(node.tween.center))
                .reduce((a,b)=>a.add(b)).multiplyScalar(0.5/nodes.length);
            let r = c.magnitude();
            let chainLength = nodes.length;
            if(chainTable[chainLength]===undefined ||
                r<chainTable[chainLength].r) {
                chainTable[chainLength] = {chain:nodes, r}
            }
        }
        
    }
    return chainTable;
}