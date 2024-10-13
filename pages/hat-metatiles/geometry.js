"use strict"; 
const sqrt3_2 = Math.sqrt(3)/2;
let unit = 50.0;
function pt(x,y) { return new PIXI.Point(unit*x, -unit*sqrt3_2 * y); }
function hexGrid(i,j) { return new PIXI.Point(unit*(j+i/2), unit*sqrt3_2 * i); }
function coords(p) { return [p.x,p.y] }
function makeMatrix(scale, rot, x, y) {
    let cs = scale*Math.cos(rot), sn = scale*Math.sin(rot);
    return new PIXI.Matrix(cs,sn,-sn,cs,unit*x,unit*sqrt3_2*y);
}

function rotAbout(center, angle) {
    const cs = Math.cos(angle), sn = Math.sin(angle);
    return ((new PIXI.Matrix(cs,sn,-sn,cs,center.x,center.y)))
        .append(new PIXI.Matrix(1,0,0,1,-center.x, -center.y));
}
function trot(angle) { 
    const cs = Math.cos(angle), sn = Math.sin(angle);
    return new PIXI.Matrix(cs,sn,-sn,cs,0,0);
}

function intersect( p1, q1, p2, q2 )
{
    const d = (q2.y - p2.y) * (q1.x - p1.x) - (q2.x - p2.x) * (q1.y - p1.y);
    const uA = ((q2.x - p2.x) * (p1.y - p2.y) - (q2.y - p2.y) * (p1.x - p2.x)) / d;
    return new PIXI.Point( p1.x + uA * (q1.x - p1.x), p1.y + uA * (q1.y - p1.y) );
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

