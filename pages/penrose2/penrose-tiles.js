

let tLpts, tRpts, TLpts, TRpts;

(()=>{
    const unit = 300.0;
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

function createProtoTile(pts, color) {
    let gc = new PIXI.GraphicsContext();
    gc.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p=>gc.lineTo(p.x,p.y));
    gc.closePath();
    gc.fill(color);
    gc.moveTo(pts[2].x, pts[2].y);
    gc.lineTo(pts[0].x, pts[0].y);
    gc.lineTo(pts[1].x, pts[1].y);
    
    gc.stroke({color:'gray', width:6})
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


let tLprotoTile = createProtoTile(tLpts, "cyan");
let tRprotoTile = createProtoTile(tRpts, "cyan");
let TLprotoTile = createProtoTile(TLpts, "orange");
let TRprotoTile = createProtoTile(TRpts, "orange");


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


function build(i, level, parentMatrix) {
    let pts = [tLpts,TLpts, tRpts, TRpts][i-1].map(p=>parentMatrix.apply(p));

    const width = app.canvas.width * 0.75, height = app.canvas.height * 0.75;
    let b0=true,b1=true,b2=true,b3=true;
    pts.forEach(p=>{
        if(p.x>-width/2) b0=false;
        if(p.x<width/2) b1=false;
        if(p.y>-height/2) b2=false;
        if(p.y<height/2) b3=false;
    })
    if(b0||b1||b2||b3) return;

    if(level == 0) {
        switch(i) {
            case 1: place(tLprotoTile, parentMatrix); break; // tL
            case 2: place(TLprotoTile, parentMatrix); break; // TL
            case 3: place(tRprotoTile, parentMatrix); break; // tR
            case 4: place(TRprotoTile, parentMatrix); break; // TR
        }
    } else {
        let s = 1/goldenRatio;
        let matrix = parentMatrix.clone().append(new PIXI.Matrix().scale(s,s));
        switch(i) {
            case 1:
                build(1, level-1, matrix.clone().append(mat11));
                build(2, level-1, matrix.clone().append(mat12));
            break;
            case 2:
                build(3, level-1, matrix.clone().append(mat21));
                build(4, level-1, matrix.clone().append(mat22));
                build(2, level-1, matrix.clone().append(mat23));
            break;            
            case 3:
                build(3, level-1, matrix.clone().append(mat31));
                build(4, level-1, matrix.clone().append(mat32));
            break;    
            case 4:
                build(1, level-1, matrix.clone().append(mat41));
                build(2, level-1, matrix.clone().append(mat42));
                build(4, level-1, matrix.clone().append(mat43));

        }
    }
}


/*
let layer1 = new Layer();
let layer2 = new Layer();

let level = 7;
layer1.activate();
build(1,level,new Matrix().translate(-400,-290).scale(10,10));
layer2.activate();
*/
