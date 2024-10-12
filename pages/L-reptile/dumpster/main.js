const slide = {
    name:"penrose"    
}

let shapePts, shapeSymbol;
let matrices = [];

(()=>{
    const unit = 100.0;
    const Point = paper.Point;
    shapePts = [[0,0],[2,0],[2,1],[1,1],[1,2],[0,2]].map(([x,y])=>new Point(unit*x, unit*y));
})();

function createProtoTile(pts, color, name= "BOH") {
    let path = new paper.Path();
    pts.forEach(p=>path.lineTo(p));
    path.closePath();
    path.fillColor = color;
    path.strokeColor = "blue";
    path.strokeWidth = 5;
    path.applyMatrix = false;
    /*
    text = new paper.PointText();
    text.fontSize = 30;
    text.content = name;
    let pc = new paper.Point();
    pts.forEach(p=>pc = pc.add(p));
    pc = pc.multiply(1/pts.length);
    text.position.set(pc)
    path.addChild(text)

    let group = new paper.Group([path, text]);
    group.pivot = new paper.Point(0,0);
    group.applyMatrix = false;
    return new paper.Symbol(group, true);
    */
    return new paper.Symbol(path, true);
}


function place(symbol, matrix) {
    let itm = symbol.place();
    itm.pivot = new paper.Point(0,0);
    itm.applyMatrix = false;
    itm.matrix = matrix; 
    return itm;
}

function build(level, parentMatrix) {
    if(level == 0) place(shapeSymbol, parentMatrix);
    else {
        let childMatrix = parentMatrix.clone().scale(0.5,0.5);
       
        matrices.forEach(mat => build(level-1, childMatrix.clone().append(mat)))
        /*
        let p = shapePts[1].multiply(2);
        build(level-1, childMatrix.clone().translate(p).rotate(90));
        p = shapePts[5].multiply(2);
        build(level-1, childMatrix.clone().translate(p).rotate(-90));
        */
        
    }
}

function setup() {
    paper.setup('myCanvas');
    with(paper) {

        view.setCenter(new Point(0,0))
        shapeSymbol = createProtoTile(shapePts, "cyan", "1");
        matrices.push(new Matrix());
        matrices.push(new Matrix().translate(shapePts[3]));
        matrices.push(new Matrix().translate(shapePts[1].multiply(2)).rotate(90));
        matrices.push(new Matrix().translate(shapePts[5].multiply(2)).rotate(-90));

        console.log("started")
        let start = performance.now();
        build(7,new Matrix().translate(-500,-400).scale(20,20))
        view.update()
        console.log(performance.now() - start)

        let dot = new paper.Path.Circle({
            radius:5, 
            strokeColor:"black"});
        dot.applyMatrix = false;

        var toolPan = new paper.Tool();
        toolPan.onMouseDrag = function (event) {
            var offset = event.downPoint.subtract(event.point);
            paper.view.center = paper.view.center.add(offset);
        };
    }
}
