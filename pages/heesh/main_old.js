const slide = {
    name:"heesh"    
}


// (0,0),(1,0) => p0,p1
function getTwoPointsTransform(p0, p1) {
    let e0 = p1.subtract(p0);
    let e1 = new paper.Point(-e0.y,e0.x);
    return new paper.Matrix(e0.x,e0.y,e1.x,e1.y,p0.x,p0.y);
}

// p0,p1 => p2,p3
function getFourPointsTransform(p0,p1,p2,p3) {
    let mat1 = getTwoPointsTransform(p0,p1).invert();
    let mat2 = getTwoPointsTransform(p2,p3);
    return mat2.append(mat1);
}

const unit = 20.0;
const sqrt3_2 = Math.sqrt(3)/2;
const unitx = unit, unity = unit*sqrt3_2;

function hexGrid(a,b) { return new paper.Point(unitx*(a*3), unity*(2*a+4*b))}
function getHexGridIndices(p) {
    let a = Math.floor(p.x/(3*unitx)+0.5);
    let b = Math.floor((p.y/unity - 2*a)/4 + 0.5);
    return {a,b}
}

let hatPts = (()=>{
    function hatGrid(a,b) {
        return new paper.Point((a+b*0.5)*unit, b*unit*sqrt3_2);
    }
    const hatPts = [
        hatGrid(0, 0), hatGrid(-1,-1), hatGrid(0,-2), hatGrid(2,-2),
        hatGrid(2,-1), hatGrid(4,-2), hatGrid(5,-1), hatGrid(4, 0),
        hatGrid(3, 0), hatGrid(2, 2), hatGrid(0, 3), hatGrid(0, 2),
        hatGrid(-1, 2),
    ];
    return hatPts
})();

let kites = (()=>{
    const ps = hatPts;
    let kites = [];
    let p23 = ps[2].add(ps[3]).multiply(0.5);
    let pc = ps[0].add(ps[5]).add(ps[9]).multiply(1/3);
    let pc11 = pc.add(ps[11]).multiply(0.5);
    kites.push([ps[0],ps[1],ps[2],p23]);
    kites.push([ps[0],p23,ps[3],ps[4]]);
    kites.push([ps[0],ps[4],pc,pc11]);
    kites.push([ps[0],pc11,ps[11],ps[12]]);
    kites.push([ps[9],ps[10],ps[11],pc11]);
    kites.push([ps[9],pc11,pc,ps[8]]);
    kites.push([ps[5],ps[6],ps[7],ps[8]]);
    kites.push([ps[5],ps[8],pc,ps[4]]);
    return kites;
})();

function makeOutline(pts) {
    const n = pts.length;
    const distances = [unit, unit*2, unit*Math.sqrt(3)];
    const distanceNames = ["1","2","s3"]
    let vertices = pts.map((p,i)=> {
        let p0 = pts[(i+n-1)%n];
        let p1 = pts[(i+1)%n];
        let d1 = p.getDistance(p1);
        let angle = p.subtract(p0).getDirectedAngle(p1.subtract(p));
        angle = 0.125*Math.floor(angle*8+0.5);
        let dd = distances.map(x=>Math.abs(x-d1));
        let minErr = Math.min(...dd);
        let j = dd.findIndex(v=>v===minErr);
        return {
            p,d1:distanceNames[j],angle
        }        
    });
    vertices.forEach((v,i)=>v.d0 = vertices[(i+n-1)%n].d1)
    return vertices;
}

let hatOutline = makeOutline(hatPts);


function getKiteKey(pts) {
    const {a,b} = getHexGridIndices(pts[0]);
    let err = hexGrid(a,b).getDistance(pts[0]);
    if(err>1.0e-6) throw "Uffa!";
    let d = pts[2].subtract(pts[0]);
    return {a,b,d:Math.floor(d.angle/60.0 + 0.5)+3};
}

function buildKite(a,b,d) {
    let pc = hexGrid(a,b);
    let p = pc.add(hexGrid(a-1,b)).add(hexGrid(a,b-1)).multiply(1/3);
    let mat = new paper.Matrix().rotate(60, pc);
    let hpts = [p];
    for(let i=1;i<6;i++) hpts.push(mat.transform(hpts.at(-1)));
    let k = d-1;
    let k1 = (k+1)%6, k2 = (k+5)%6;
    let pts = [pc, hpts[k2].add(hpts[k]).multiply(0.5), hpts[k], hpts[k1].add(hpts[k]).multiply(0.5)];
    return pts;
}

function placeHatByKite(kite, kiteIndex) {
    let hatKite = kites[kiteIndex];
    let matrix = getFourPointsTransform(hatKite[0],hatKite[1], kite[0], kite[1]);
    addHat(matrix);
}

function appendHat(outline, i, j) {
    let p0 = outline[i].p;
    let p1 = outline[(i+1)%outline.length].p;
    let p2 = hatOutline[j].p;
    let p3 = hatOutline[(j+hatOutline.length-1)%hatOutline.length].p;
    let matrix = getFourPointsTransform(p2,p3,p0,p1);
    addHat(matrix);
}

function getCandidates(outline, i) {
    let candidates = [];
    for(let j = 0; j<hatOutline.length; j++) {
        if(hatOutline[j].d0 != outline[i].d1) continue;
        candidates.push(j)
    }
    return candidates;
}



function addHat(matrix) {
    let path = new paper.Path();
    path.moveTo(hatPts[0]);
    hatPts.slice(1).forEach(p=>path.lineTo(p));
    path.closePath();
    path.fillColor = "cyan";
    path.strokeColor = "black"
    path.applyMatrix = false;
    path.matrix = matrix;
    path.setPivot(hatPts[0])
    return path;
}

function drawPoly(ps) {
    let path = new paper.Path();
    path.moveTo(ps[0]);
    ps.slice(1).forEach(p=>path.lineTo(p));
    path.closePath();
    path.strokeColor = 'red';
    path.strokeWidth = 3;
    path.setPivot(ps[0]);
    return path;
}


function setup() {
    paper.setup('myCanvas');
    with(paper) {

        view.setCenter(new Point(0,0));

        let p = addHat(new Matrix())
        // p.rotation = 60; 
        dot = new Path.Circle({radius:5, center:new Point(0,0), strokeColor:"black"})
        let grid = new CompoundPath();

        let n = 3;
        for(let i = -n; i<n; i++) {
            for(let j=-n; j<n; j++) {
                let x0 = unitx*(3*j+2);
                let y0 = unity*2*(2*i+j%2);
                
                grid.moveTo(x0,y0);
                [[2,0],[3,2],[2,4],[0,4],[-1,2]].forEach(([x,y])=>grid.lineTo(x0+x*unitx, y0+y*unity))
                grid.closePath();
                [[1,0],[2.5,1],[2.5,3],[1,4],[-0.5,3],[-0.5,1]].forEach(([x,y])=>{
                    grid.moveTo(x0+1*unitx, y0+2*unity);
                    grid.lineTo(x0+x*unitx, y0+y*unity);            
                });
            }
        }

        grid.setPivot(new Point(0,0))
        
        
        grid.strokeColor = "black";
        grid.position.set(0,0)
        /*

        let path = new Path();
        path.moveTo(hatPts[0]);
        hatPts.slice(1).forEach(p=>path.lineTo(p));
        path.closePath();
        path.fillColor = "yellow";
        path.strokeColor = "black"
        window.path = path;
        */
    }
}
