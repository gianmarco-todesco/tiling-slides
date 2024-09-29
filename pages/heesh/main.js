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

let hat2Pts = hatPts.map(p=>new paper.Point(-p.x,p.y)).reverse();


function addHat(matrix, d, color) {
    let path = new paper.Path();
    let pts = d>0 ? hatPts : hat2Pts;
    path.moveTo(pts[0]);
    pts.slice(1).forEach(p=>path.lineTo(p));
    path.closePath();
    path.fillColor = color;
    path.strokeColor = "black"
    path.opacity = 0.5;
    path.applyMatrix = false;
    path.matrix = matrix;
    path.setPivot(hatPts[0])
    return path;
}


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
        let angle = 180-p.subtract(p0).getDirectedAngle(p1.subtract(p));
        angle = 0.125*Math.floor(angle*8+0.5);
        if(angle<0) angle += 360;
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
let hat2Outline = makeOutline(hat2Pts);


function getAppendMatrix(outline, options) {
    const {i,i0,i1,j,d} = options;
    let p0 = outline[i].p;
    let p1 = outline[(i+1)%outline.length].p;
    let pts = d>0 ? hatPts : hat2Pts;
    let p2 = pts[j];
    let p3 = pget(pts, j-1);
    let matrix = getFourPointsTransform(p2,p3,p0,p1);
    return matrix;
}

function appendHat(outline, options) {
    const {d} = options;
    const matrix = getAppendMatrix(outline, options);
    return addHat(matrix, d, d>0 ? 'yellow' : 'orange');
}

function pget(a, i) {
    const n = a.length;
    if(i<0) return a[(i%n)+n];
    else return a[i%n];
}


function checkCandidate(A, i, B, j) {
    let na = A.length;
    let nb = B.length;
    const checkLength = (t) => {
        return pget(A,i+t).d1 == pget(B,j-1-t).d1;
    }
    const getAngleSum = (t) => {
        return pget(A,i+t).angle + pget(B,j-t).angle;
    }
    if(!checkLength(0)) return null;
    let angle = getAngleSum(0);
    if(angle>270 && angle !=360) return null;
    let t = 0;
    while(angle == 360) {
        t++;
        if(!checkLength(-t)) return null;
        angle = getAngleSum(-t);
        if(angle>270 && angle !=360) return null;
    }
    let t0 = t;
    t = 1;
    for(;;) {
        angle = getAngleSum(t);
        if(angle>270 && angle !=360) return null;
        if(angle<=270) break;
        if(!checkLength(t)) return null;
        t++;
    }
    let t1 = t;
    return {t0,t1};
}

function getCandidates(outline, i) {
    // cerca gli hat che possono attaccarsi al segment outline[i]->outline[i+1]
    // ritorna [{i0,i1,j,d},...]; [i0,i1] è la regione di contatto, j è il punto che corrisponde
    // a i e d=-1 per le eventuali riflessioni
    let candidates = [];
    let A = outline;
    for(let d of [-1,1]) {
        let B = d>0 ? hatOutline : hat2Outline;
        let nb = B.length;
        for(let j=0; j<nb; j++) {
            let res = checkCandidate(A, i, B, j);
            if(res !== null) {
                res.i = i;
                res.j = j;
                res.d = d;
                candidates.push(res);
            }
        }
    }
    return candidates;
}

function mergeOutline(outline, info) {
    let {t0,t1,d} = info;
    const matrix = getAppendMatrix(outline, info);
    let A = outline;
    let B = d>0 ? hatOutline : hat2Outline;
    let na = A.length;
    let nb = B.length;
    let q = [];
    i = (info.i + t1)%na;
    j = (info.j + nb - t1)%nb;
    q.push({p:A[i].p, d0:B[j].d0, d1:A[i].d1, angle:A[i].angle+B[j].angle })
    i = (i+1)%na;
    for(let r = 0; r<na-(t0+t1+1); r++) {
        q.push(A[i]);
        i = (i+1)%na;
    }
    j = (info.j + t0)%nb;
    q.push({p:A[i].p, d0:A[i].d0, d1:B[j].d1, angle:A[i].angle+B[j].angle })
    j = (j+1)%nb;
    for(let r = 0; r<nb-(t0+t1+1); r++) {
        let g = B[j];
        q.push({p:matrix.transform(g.p), d1:g.d1, d0:g.d0, angle:g.angle});
        j = (j+1)%nb;
    }    
    return q;
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


function checkOutline(outline) {
    let n = outline.length;
    let tb = {'1':unit,'2':unit*2,'s3':unit*Math.sqrt(3)};
    for(let i=0;i<n; i++) {
        let i1 = (i+1)%n;
        let s = outline[i].p.getDistance(outline[i1].p);
        let err1 = Math.abs(s - tb[outline[i].d1]);
        let err2 = Math.abs(s - tb[outline[i1].d0]);
        let v1 = outline[i].p.subtract(outline[(i+n-1)%n].p);
        let v2 = outline[i1].p.subtract(outline[i].p);
        let angle = 180-v1.getDirectedAngle(v2);
        angle = 0.125*Math.floor(angle*8+0.5);
        let err3 = Math.abs(angle - outline[i].angle);
        if(err1>1.0e-6 || err2>1.0e-6 || err3>1.0e-6) console.log("uff ",i,err1,err2,err3);
    }
}

let outline = hatOutline;
let stack = [];
let poly;

function addTile(cIndex) {
    let cc = getCandidates(outline, 0);
    if(cIndex<0 || cIndex>=cc.length) { console.warn("uff"); return; }
    let c = cc[cIndex];
    let other = appendHat(outline, c);
    stack.push({other, outline, cIndex});
    outline = mergeOutline(outline, c);
    checkOutline(outline);
    if(poly) poly.remove();
    poly = drawPoly(outline.map(v=>v.p));
    dot.position.set(outline[0].p)
}

function removeTile() {
    if(stack.length==0) { console.warn("uff"); return; }
    let u = stack.pop();
    outline = u.outline;
    u.other.remove();
    if(poly) poly.remove();
    poly = drawPoly(outline.map(v=>v.p));
    dot.position.set(outline[0].p);
    return u.cIndex;
}
function setup() {
    paper.setup('myCanvas');
    with(paper) {

        view.setCenter(new Point(0,0));

        let p = addHat(new Matrix(),1,'yellow');
        
        // p.rotation = 60; 
        dot = new Path.Circle({radius:5, center:new Point(0,0), strokeColor:"black"})



        view.onKeyDown = (e) => {
            

            console.log(e);
        }
    }
}
