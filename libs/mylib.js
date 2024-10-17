
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

function getMidPoint(pa,pb) {
    return pa.add(pb).multiplyScalar(0.5);
}

function getDistance(pa,pb) {
    return pb.subtract(pa).magnitude();
}

function smoothStep(t, t0, t1) {
    if(t<t0) return 0;
    else if(t>t1) return 1;
    else return (1-Math.cos(Math.PI*(t-t0)/(t1-t0)))*0.5;
}


function getRegularPolygonPoints(n,r) {
    return [...Array(n).keys()].map(i=>{
        let phi = 2*Math.PI*i/n; 
        return new PIXI.Point(Math.cos(phi)*r, Math.sin(phi)*r);
    });
}

function getRotateAroundMatrix(angle, center) {
    return new PIXI.Matrix()
        .translate(-center.x, -center.y)
        .rotate(angle)
        .translate(center.x, center.y)
}

function getAdjacentRegularPolygonPoints(srcPolygon, i, m) {
    let n = srcPolygon.length;
    let p0 = srcPolygon[i%n];
    let p1 = srcPolygon[(i+1)%n];
    let srcEdge = getDistance(p0,p1);
    let dstR = srcEdge*0.5/Math.cos(Math.PI/m);
    let dstPts = getRegularPolygonPoints(m, dstR);
    let matrix = getFourPointsTransform(dstPts[0],dstPts[1], p1,p0);
    return dstPts.map(p=>matrix.apply(p))    
}

function createDot(x,y) {
    let g = new PIXI.Graphics().circle(x,y,3).fill('red').stroke('black');
    app.stage.addChild(g);
    return g;
}

class DotSet {
    constructor() {
        this.pool = [];
        this.dots = [];
    }
    _createDot(p) {
        if(this.pool.length==0) {
            let dot = new PIXI.Graphics().circle(0,0,3).fill('red').stroke('black');
            app.stage.addChild(dot);
            dot.position.set(p.x,p.y);
            this.dots.push(dot);
            return dot;
        } else {
            let dot = this.pool.pop();
            dot.position.set(p.x,p.y);
            dot.visible = true;
            app.stage.addChild(dot);
            return dot;
        }
    }
    set(pts) {
        this.dots.forEach(dot => {
            dot.visible=false; 
            app.stage.removeChild(dot);
            this.pool.push(dot);
        })
        pts.forEach(p=>this._createDot(p));
    }
}

function drawRect(g, x0,y0,x1,y1) {
    const pt = (x,y) => new PIXI.Point(x,y);
    g.poly([pt(x0,y0),pt(x1,y0),pt(x1,y1),pt(x0,y1)],true);
}

function rot90(p) { return new PIXI.Point(p.y,-p.x);}
function rot270(p) { return new PIXI.Point(-p.y,p.x);}

class ReferenceFrame {
    constructor(v1,v2,origin=new PIXI.Point(0,0)) {
        this.v1 = v1;
        this.v2 = v2;
        this.origin = origin;
        this.w1 = rot90(v1).normalize();
        this.w2 = rot90(v2).normalize();   
        this.inv_v1dotw2 = 1.0/v1.dot(this.w2);
        this.inv_v2dotw1 = 1.0/v2.dot(this.w1);
             
    }
    getPoint(u,v) {
        return this.origin.add(this.v1.multiplyScalar(u)).add(this.v2.multiplyScalar(v))
    }
    getUv(p) {
        let d = p.subtract(this.origin);
        return new PIXI.Point(d.dot(this.w2)*this.inv_v1dotw2, d.dot(this.w1)*this.inv_v2dotw1);
    }
}

function getRectIntersections(origin, dir, bounds) {
    let u0 = -Infinity, u1 = Infinity;
    if(dir.x>0) {
        u0 = Math.max(u0, (bounds.x0-origin.x)/dir.x);
        u1 = Math.min(u1, (bounds.x1-origin.x)/dir.x);
    } else if(dir.x<0) {
        u0 = Math.max(u0, (bounds.x1-origin.x)/dir.x);
        u1 = Math.min(u1, (bounds.x0-origin.x)/dir.x);
    } else {
        if(origin.x<bounds.x0 || origin.x>bounds.x1) return [];
    }     
    if(dir.y>0) {
        u0 = Math.max(u0, (bounds.y0-origin.y)/dir.y);
        u1 = Math.min(u1, (bounds.y1-origin.y)/dir.y);
    } else if(dir.y<0) {
        u0 = Math.max(u0, (bounds.y1-origin.y)/dir.y);
        u1 = Math.min(u1, (bounds.y0-origin.y)/dir.y);
    } else {
        if(origin.y<bounds.y0 || origin.y>bounds.y1) return [];
    }
    if(u0<u1)
        return [u0,u1]; 
    else
        return []; 

}

function createGrid(origin, e0, e1, bounds) {
    let grid = [];
    let rf = new ReferenceFrame(e0,e1,origin);
    let boundsUvs = [
        rf.getUv(new PIXI.Point(bounds.x0,bounds.y0)),
        rf.getUv(new PIXI.Point(bounds.x1,bounds.y0)),
        rf.getUv(new PIXI.Point(bounds.x1,bounds.y1)),
        rf.getUv(new PIXI.Point(bounds.x0,bounds.y1))        
    ] 

    let i0 = Math.floor(Math.min(...boundsUvs.map(uv=>uv.x)));
    let i1 = Math.ceil(Math.max(...boundsUvs.map(uv=>uv.x)));

    let maxCount = 10000;
    for(let i=i0;i<=i1 && grid.length<maxCount;i++) {
        let q = rf.getPoint(i,0);
        js = getRectIntersections(q,e1,bounds);
        if(js.length == 2) {
            let [j0,j1] = js;
            j0 = Math.floor(j0);
            j1 = Math.ceil(j1);
            for(let j=j0; j<=j1 && grid.length<maxCount;j++) {
                grid.push({p:rf.getPoint(i,j), i, j});
            }   
        }
    }
    return grid;
}


