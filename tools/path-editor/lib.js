"use strict";

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



function makeDraggable(obj, cb = null) {
    const dragOffset = new PIXI.Point(0,0);
    obj.on('pointerdown', function(e) {  
        if(e.button != 1) return;
        this.position.subtract(e.global, dragOffset)
        function onDrag(e) {
            e.global.add(dragOffset, obj.position);
            if(cb) cb(obj.position);
        } 
        function dragEnd(e) {
            app.stage.off('globalpointermove', onDrag)
            app.stage.off('pointerup', dragEnd)
            app.stage.off('pointerupoutside', dragEnd)
        }
        app.stage.on('globalpointermove', onDrag)
        app.stage.on('pointerup', dragEnd)
        app.stage.on('pointerupoutside', dragEnd)
    });
}


function findClosestPointIndex(p, pts, maxd = 10) {
    const maxd2 = Math.pow(maxd,2);
    if(pts.length==0) return -1;
    let D = pts.map(q=>q.subtract(p).magnitude());
    let j = D.indexOf(Math.min(...D));
    return D[j]<maxd2 ? j : -1;
}
