const slide = {
    name:"penrose"    
}


class Model {
    constructor(n, size) {
        this.n = n;
        this.size = size;
        this.p1 = new paper.Point(size,0);
        this.p2 = new paper.Matrix().rotate(360/n).transform(this.p1);
        this.d12 = this.p2.subtract(this.p1);
        
        let path = new paper.Path();
        this.prototilePath1 = path;
        this._drawPrototile(path, 'yellow');        
        this.prototile1 = new paper.Symbol(path, true); // true => not center

        path = path.clone();
        path.fillColor = 'cyan';
        this.prototile2 = new paper.Symbol(path, true); 
        this.items = [];
    }

    _drawPrototile(path, color) {
        let pts = [];

        function rot(p,ang,center) {
            return new paper.Matrix().rotate(ang, center).transform(p);
        }
        pts.push(rot(this.p1.multiply(0.2), 70, new paper.Point(0,0)));
        pts.push(rot(this.p1.multiply(0.33), 30, new paper.Point(0,0)));
        for(let i = pts.length-1; i>=0; i--) {
            let p = new paper.Point(this.p1.x - pts[i].x, -pts[i].y);
            pts.push(p);
        }
        pts.push(this.p1);
        let rotMat = new paper.Matrix().rotate(360/this.n);
        for(let i = pts.length-1; i>=0; i--) {
            pts.push(rotMat.transform(pts[i]))
        }
        path.moveTo(0,0);
        pts.forEach(p=>path.lineTo(p));
        path.closePath();
        path.fillColor = color;
        path.strokeColor = "black";
        path.strokeJoin = 'round';
        path.strokeWidth = 1;
        path.applyMatrix = false;
    }

    getMatrix(k,i,j) {
        if(k<0 || k>=this.n) return null;
        if(i<0) return null;
        if(j<0 || j>2*i) return null;
        let matrix = new paper.Matrix();
        if(k>=this.n/2) matrix.translate(this.p1.multiply(1.0));
        if(i==0) {
            matrix.rotate(k*360/this.n);
        } else {
            matrix.rotate(k*360/this.n);                
            matrix.translate(this.p1.multiply(i));
            let delta = this.d12.multiply(Math.floor(j/2));
            matrix.translate(delta);
            if(j%2==1) {
                matrix.translate(this.p2);
                matrix.rotate(180);
            }    
        }
        return matrix;
    }

    place(k,i,j) {
        
        let matrix = this.getMatrix(k,i,j);
        if(matrix === null) return;
        let t = (k+j)%2; 
        
        let itm = t==0 ? this.prototile1.place() : this.prototile2.place();
        itm.pivot = new paper.Point(0,0);
        itm.applyMatrix = false;
        itm.matrix = matrix;
        this.items.push(itm);
        return itm; 
    }
    placeRing(i) {
        for(let k=0; k<this.n; k++) {
            for(let j=0; j<=2*i; j++) this.place(k,i,j);
        }
    }
}


function makeBuilder(model) {
    let i = 0;
    let k = 0;
    let j = 0;
    const it = {
        step() {
            console.log(i,j,k)
            if(i==0) {
                if(k<model.n) model.place(k++,i,0);
                else {
                    i = 1;
                    j = 0;
                    k = 0;
                }
            } else {
                if(j<=2*i) model.place(k,i,j++);
                else if(k+1<model.n) {
                    model.place(++k,i,j=0);
                }
            }

        }
    }
    return it;
}

let model;
let builder;


function setup() {
    paper.setup('myCanvas');
    with(paper) {

        view.setCenter(new Point(0,0));

        model = new Model(30,200);
        // model.place(0,0,0)
        //for(let i=0; i<12; i++)
        //    model.placeRing(i);
        
        /*
        place(model.prototile, model.getMatrixByRowColumn(1,3));

        place(model.prototile, model.getMatrixByRowColumn(1,5));
        place(model.prototile, model.getMatrixByRowColumn(2,0));
        place(model.prototile, model.getMatrixByRowColumn(2,2));
        place(model.prototile, model.getMatrixByRowColumn(2,4));

        */
        builder = makeBuilder(model); 
        for(let i=0; i<12; i++) model.placeRing(i);
        /*
        setInterval(() => {
            builder.step();
        }, 50);
        */
    }
}