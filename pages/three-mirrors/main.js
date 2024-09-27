const slide = {
    name:"three-mirrors"    
}

let p1,p2;
let matrix;

let fillLayer, strokeLayer, mirrorLayer;

class Mirror {
    constructor(x0,y0,angle) {
        
        let p0 = new paper.Point(x0,y0);
        let phi = Math.PI*angle/180.0;
        let d = new paper.Point(Math.cos(phi), Math.sin(phi));        
        mirrorLayer.activate();
        let line = new paper.Path();
        line.moveTo(p0.add(d.multiply(1000))); 
        line.lineTo(p0.add(d.multiply(-1000)));
        line.strokeColor = 'black';
        line.strokeWidth = 5;
        this.line = line;       

        
        this.matrix = new paper.Matrix().rotate(angle,p0).scale(1,-1,p0).rotate(-angle,p0);
    }
}

class Shape {
    constructor() {
        this.fillSymbols = [];
        this.strokeSymbols = [];
        this.matrices = [];
    }
    add(fillShape, strokeShape, matrix = new paper.Matrix()) {
        this.fillSymbols.push(new paper.Symbol(fillShape));
        this.strokeSymbols.push(new paper.Symbol(strokeShape));
        this.matrices.push(matrix)
    }

    place(matrix) {
        fillLayer.activate();
        this.fillSymbols.forEach(s=>{
            let v = s.place();
            v.applyMatrix = false;
            v.matrix = matrix.clone();
        });
        strokeLayer.activate();
        this.strokeSymbols.forEach(s=>{
            let v = s.place();
            v.applyMatrix = false;
            v.matrix = matrix.clone();
        });

    }
}

function placeSymbol(symbol, matrix) {
    let itm = symbol.place();
    itm.applyMatrix = false;
    itm.matrix = matrix.clone();
    return itm;
}

class ShapeGroup {
    constructor(shape, matrices) {
        this.shape = shape;
        this.fillItems = [];
        this.strokeItems = [];
        this._createItems(matrices);
    }
    _createItems(matrices) {
        fillLayer.activate();
        const fillItems = this.fillItems;
        const strokeItems = this.strokeItems;
        const shapeMatrices = this.shape.matrices;
        matrices.forEach(matrix => {
            shape.fillSymbols.forEach((s,i)=> {
                let itmMatrix = matrix.clone().append(shapeMatrices[i]);
                let itm = placeSymbol(s, itmMatrix);
                fillItems.push(itm);
                itm.data.shapeIndex = i;
                itm.data.matrix = matrix;
            });
        });
        strokeLayer.activate();
        matrices.forEach(matrix => {
            shape.strokeSymbols.forEach((s,i)=> {
                let itmMatrix = matrix.clone().append(shapeMatrices[i]);
                let itm = placeSymbol(s, itmMatrix);
                strokeItems.push(itm);
                itm.data.shapeIndex = i;
                itm.data.matrix = matrix;
            });
        });
    } 
    setMatrices(matrices) {
        this.fillItems.forEach(itm=>itm.remove());
        this.strokeItems.forEach(itm=>itm.remove());
        this.fillItems.length = 0;
        this.strokeItems.length = 0;
        this._createItems(matrices);
    }
}

function foo(baseMatrix) {
    /*
    let matrices = []
    for(let i=-20;i<20;i++) {
        for(let j=-20;j<20; j++) {
            matrices.push(new paper.Matrix().translate(100*j,100*i).append(baseMatrix))
        }
    }
    shapeGroup.setMatrices(matrices);
    */
    if(shapeGroup.fillItems.length < 10) {
        let matrices = []
        for(let i=-20;i<20;i++) {
            for(let j=-20;j<20; j++) {
                matrices.push(new paper.Matrix().translate(100*j,100*i).append(baseMatrix))
            }
        }
        shapeGroup.setMatrices(matrices);    
    } else {
        let k = 0;
        for(let i=-20;i<20;i++) {
            for(let j=-20;j<20; j++) {
                let mat = new paper.Matrix().translate(100*j,100*i).append(baseMatrix);
                shapeGroup.fillItems[k].matrix = mat;
                shapeGroup.strokeItems[k].matrix = mat;
                k++;
                
            }
        }
    }
}
function uff() {
    let k = 0;
    for(let i=-20;i<20;i++) {
        for(let j=-20;j<20; j++) {
            for(let t=0; t<2;t++) {
                let mat = new paper.Matrix().translate(100*j,100*i).append(shapeGroup.shape.matrices[t]);
                shapeGroup.fillItems[k].matrix = mat;
                shapeGroup.strokeItems[k].matrix = mat;    
                k++;
            }
            
        }
    }
}

function createSeedShape() {    
    let letter = new paper.PointText();
    letter.fontSize = 90;
    letter.fontWeight = "bold"
    letter.content = "R";
    letter.fillColor = "red";
    let letterOutline = letter.clone();
    letterOutline.fillColor = "transparent";
    letterOutline.strokeColor = "black";
    letterOutline.strokeWidth = 3;
    let shape = new Shape();
    shape.add(letter, letterOutline);

    let dot = paper.Path.Circle({ radius: 20, fillColor:"red" });
    let dotOutline = dot.clone();
    dotOutline.fillColor = "transparent";
    dotOutline.strokeColor = "black";
    shape.add(dot, dotOutline, new paper.Matrix().translate(0,-100));
    return shape;
}

let mirror;
let shape;
let shapeGroup;

function setup() {
    paper.setup('myCanvas');
    with(paper) {

        view.setCenter(new Point(0,0))
        fillLayer = new Layer();
        strokeLayer = new Layer();
        mirrorLayer = new Layer();

        mirror = new Mirror(0,0,30);

        let matrix = new paper.Matrix().translate(30,-30);
        shape = createSeedShape();


        shapeGroup = new ShapeGroup(shape, [
            matrix,
            mirror.matrix.clone().append(matrix),
            new paper.Matrix().scale(-1,1).append(mirror.matrix).append(matrix), 
        ])
        foo(new paper.Matrix());

        shapeGroup.fillItems.forEach(itm => {
            itm.onMouseDrag = function(e) {
                let matrix = new paper.Matrix().translate(e.delta);
                let i = itm.data.shapeIndex;
                shapeGroup.shape.matrices[i] = shapeGroup.shape.matrices[i].append(matrix);
                uff()
                // console.log(matrix);
            }
        })

        mirrorLayer.activate();
        let dot1 = Path.Circle({
            radius: 10,
            center: view.center,
            fillColor:"blue"
        });
        let dot2 = dot1.clone();
        dot2.fillColor = "cyan"
        dot2.onMouseDrag = function(e) {
            let p = e.point;
            this.position.set(p);
            dot1.position.set(mirror.matrix.transform(p))
        }

        paper.view.onFrame = function(e) {
            // foo(new paper.Matrix().rotate(performance.now()*0.1))
        }
        /*
        LayerLayer 
        let layer = new Layer();
        let layer2 = new Layer();
        layer2.activate();

        let line = new Path();
        line.moveTo(-800,0); line.lineTo(800,0);
        line.strokeColor = 'black';
        line.strokeWidth = 5;
        
        project.layers[0].activate();

        let dot = Path.Circle({
            radius: 100,
            center: view.center,
            fillColor:"red"
        });
        dot.position.set(0,200)
        let letter = createSeedShape();
        letter.fillColor = "red";
        let letterOutline = letter.clone();
        let s1 = new Symbol(letter);
        
        letterOutline.strokeColor = "black";
        letterOutline.strokeWidth = 3;
        letterOutline.fillColor = "transparent";
        let s2 = new Symbol(letterOutline);
        
        s1.place()
        s1.place(30,30)
        
        s2.place()
        s2.place(30,30)
*/


        /*
        let size = 50;

        let start = performance.now();

        let rect = new Path.Rectangle([-size/2, -size/2], [size, size]);
        rect.strokeColor = new Color(0.8,0.9,0.9);
        rect.strokeWidth = 5;
        rect.fillColor = new Color(0.85,0.95,0.98);
        
        let rect2 = new Path.Rectangle([-size/2, -size/2], [size, size]);
        rect2.fillColor = new Color(0.85,0.35,0.38);
        let text2 = new PointText(new Point(-30, 30));
        text2.fillColor = 'black';
        text2.content = "Carola";
        text2.fontSize = "20px";
        let g2 = new Group([rect2, text2]);
        g2.applyMatrix = false;



        let text = new PointText(new Point(-30, 30));
        text.fillColor = 'black';
        text.content = "Carola";
        text.fontSize = "20px";

        let g = new Group([rect, text]);


        
        let s = new Symbol(g);

        let transformations = [];
        matrix = new Matrix();
        matrix.translate(400,400);
        matrix.scale(1,-1);
        matrix.translate(-400,-400);

        let matrix2 = new Matrix();
        matrix2.translate(400,400);
        matrix2.rotate(120)
        matrix2.scale(1,-1);
        matrix2.rotate(-120)
        matrix2.translate(-400,-400);

        let matrix3 = new Matrix();
        matrix3.translate(600,400);
        matrix3.rotate(-120)
        matrix3.scale(1,-1);
        matrix3.rotate(120)
        matrix3.translate(-600,-400);

        let symbols = []
        symbols.push([matrix,s.place(new Point(0,0))])
        symbols.push([matrix2,s.place(new Point(0,0))])
        symbols.push([matrix.clone().append(matrix2),s.place(new Point(0,0))])
        symbols.push([matrix2.clone().append(matrix),s.place(new Point(0,0))])
        symbols.push([matrix.clone().append(matrix2).append(matrix),s.place(new Point(0,0))])
        // symbols.push([matrix2.clone().append(matrix).append(matrix2),s.place(new Point(0,0))])
        
        // symbols.push([matrix3.clone(),s.place(new Point(0,0))])

        function place6(mat) {
            symbols.push([mat,s.place(new Point(0,0))])
            for(let i=0; i<5; i++) {
                let mat_i = mat.clone().append(symbols[i][0]);
                symbols.push([mat_i,s.place(new Point(0,0))])
            }    
        }

        // place6(matrix3);
        let mat_1 = matrix.clone().append(matrix2).append(matrix).append(matrix3);
        place6(mat_1);
        place6(mat_1.inverted());
        place6(mat_1.clone().append(mat_1));

        
        let mat_2 = matrix.clone().append(matrix3).append(matrix).append(matrix2);
        place6(mat_2);
        place6(mat_2.inverted());

        place6(mat_1.clone().append(mat_2));
        place6(mat_1.clone().append(mat_2).inverted());
        // place6(mat_2.clone().append(mat_1));
        
        // symbols.push([mat_2,g2])


        let p3 = s.place(new Point(400,400));

        p3.onMouseDrag = function(e) { 
            this.position.set(e.point);
            symbols.forEach(([mat, p]) => {
                p.transform(p.matrix.inverted());
                p.transform(mat.clone().append(p3.matrix));
            })
        }

        p3.position.set(new Point(400,320));
        symbols.forEach(([mat, p]) => {
            p.transform(p.matrix.inverted());
            p.transform(mat.clone().append(p3.matrix));
        })



        let line = new Path();
        line.moveTo(-800,0); line.lineTo(800,0);
        line.strokeColor = 'black';
        line.strokeWidth = 5;
        let lineS = new Symbol(line);
        let line1 = lineS.place(new Point(400,400))
        let line2 = lineS.place(new Point(400,400))
        line2.rotation = 120;
        let line3 = lineS.place(new Point(600,400))
        line3.rotation = 240;

        console.log(performance.now() - start)
        */
    }
}
