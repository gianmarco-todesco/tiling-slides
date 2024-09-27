const slide = {
    name:"penrose"    
}


let tLpts, tRpts, TLpts, TRpts;

(()=>{
    const unit = 300.0;
    const Point = paper.Point;
    let a18 = Math.PI/10;
    let a54 = Math.PI/2 - Math.PI/5;
    let cs18 = Math.cos(a18), sn18 = Math.sin(a18);
    let cs54 = Math.cos(a54), sn54 = Math.sin(a54);
    tLpts = [[0,0],[-1,1],[1,1]].map(([x,y])=>new Point(sn18*unit*x, cs18*unit*y))
    tRpts = [[0,0],[1,1],[-1,1]].map(([x,y])=>new Point(sn18*unit*x, cs18*unit*y))
    TLpts = [[0,0],[-1,1],[1,1]].map(([x,y])=>new Point(sn54*unit*x, cs54*unit*y))
    TRpts = [[0,0],[1,1],[-1,1]].map(([x,y])=>new Point(sn54*unit*x, cs54*unit*y))

})();

function createProtoTile(pts, color, name= "BOH") {
    let fill = new paper.Path();
    pts.forEach(p=>fill.lineTo(p));
    fill.closePath();
    fill.fillColor = color;
    fill.applyMatrix = false;
    let stroke = new paper.Path();
    stroke.moveTo(pts[2]);
    stroke.lineTo(pts[0]);
    stroke.lineTo(pts[1]);
    stroke.fillColor = "transparent";
    stroke.strokeColor = "blue";
    stroke.strokeWidth = 5;
    stroke.applyMatrix = false;
    text = new paper.PointText();
    text.fontSize = 30;
    text.content = name;
    let pc = new paper.Point();
    pts.forEach(p=>pc = pc.add(p));
    pc = pc.multiply(1/pts.length);
    text.position.set(pc)
    let group = new paper.Group([fill, stroke, text]);
    group.pivot = new paper.Point(0,0);
    group.applyMatrix = false;
    // return group;
    return new paper.Symbol(group, true);
    //fill.addChild(stroke);
    //return new paper.Symbol(fill, true)
}

let p1,p2;
let goldenRatio = (Math.sqrt(5)+1)/2;

function place(symbol, matrix) {
    let itm = symbol.place();
    itm.pivot = new paper.Point(0,0);
    itm.applyMatrix = false;
    itm.matrix = matrix; 
    return itm;
}


function setup() {
    paper.setup('myCanvas');
    with(paper) {

        view.setCenter(new Point(0,0))

        let tLsymbol = createProtoTile(tLpts, "cyan", "tL");
        let tRsymbol = createProtoTile(tRpts, "cyan", "tR");
        let TLsymbol = createProtoTile(TLpts, "orange", "TL");
        let TRsymbol = createProtoTile(TRpts, "orange", "TR");


        let mat11 = new Matrix().translate(tLpts[2].multiply(goldenRatio)).rotate(180-72);
        let mat12 = new Matrix().translate(tLpts[1]).rotate(36*2+180);

        let mat21 = new Matrix().rotate(180-36).translate(tRpts[2].multiply(-1));
        let mat22 = new Matrix().translate(TRpts[2].multiply(1/goldenRatio));
        let mat23 = new Matrix().rotate(180+36).translate(TLpts[2].multiply(-1));

        let mat31 = new Matrix().translate(tLpts[1].multiply(goldenRatio)).rotate(-180+72);
        let mat32 = new Matrix().translate(tLpts[2]).rotate(-36*2-180);

        let mat41 = new Matrix().rotate(-180+36).translate(tRpts[1].multiply(-1));
        let mat42 = new Matrix().translate(TRpts[1].multiply(1/goldenRatio));
        let mat43 = new Matrix().rotate(-180-36).translate(TLpts[1].multiply(-1));


        function build(i, level, parentMatrix) {
            if(level == 0) {
                switch(i) {
                    case 1: place(tLsymbol, parentMatrix); break; // tL
                    case 2: place(TLsymbol, parentMatrix); break; // TL
                    case 3: place(tRsymbol, parentMatrix); break; // tR
                    case 4: place(TRsymbol, parentMatrix); break; // TR
                }
            } else {
                let matrix = parentMatrix.clone().scale(1/goldenRatio, 1/goldenRatio);
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

        let layer1 = new Layer();
        let layer2 = new Layer();

        let level = 7;
        layer1.activate();
        build(1,level,new Matrix().translate(-400,-290).scale(10,10));
        layer2.activate();
        //build(2,level,new Matrix().translate(-50,-200));
        //build(3,level,new Matrix().translate(-400,0));
        //build(4,level,new Matrix().translate(-50,0));
        
        /*
        let gmat = new Matrix().translate(-200,-200);


        p1 = place(tLsymbol, gmat.clone().append(mat11));
        p2 = place(TLsymbol, gmat.clone().append(mat12));


        gmat = new Matrix().translate(0,-200);

        p1 = place(tRsymbol, gmat.clone().append(mat21));
        p2 = place(TRsymbol, gmat.clone().append(mat22));
        p2 = place(TLsymbol, gmat.clone().append(mat23));
        

        gmat = new Matrix().translate(-200,0);

        p1 = place(tLsymbol, gmat.clone().append(mat31));
        p2 = place(TRsymbol, gmat.clone().append(mat32));

        gmat = new Matrix().translate(0,0);


        p1 = place(tLsymbol, gmat.clone().append(mat41));
        p2 = place(TLsymbol, gmat.clone().append(mat42));
        p2 = place(TRsymbol, gmat.clone().append(mat43));

        //p1 = tLsymbol;
        //p2 = TRsymbol;
        let dot = new paper.Path.Circle({
            radius:5, 
            strokeColor:"black"});
        dot.applyMatrix = false;
        dot.matrix = gmat;
        
        */
        layer1.applyMatrix = false;
        view.onFrame = function() {
            layer1.matrix = new Matrix().translate(
                400 + 200 * Math.sin(performance.now()*.001), 
                -2000)
        }

    }
}
