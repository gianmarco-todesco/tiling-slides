const slide = {
    name:"regular-tiling"    
}

function erode(pts,amount) {
    const n = pts.length;
    return pts.map((p,i) => {
        let p1 = pts[(i+1)%n].subtract(p).normalize(), 
            p0 = pts[(i+n-1)%n].subtract(p).normalize();
        let d = p1.add(p0).normalize();
        let cs = d.dot(p0);
        let sn = Math.sqrt(1-cs*cs);
        return p.add(d.multiply(amount/sn))
    })
}


class Tiling {
    constructor(d1,d2,shape) {
        this.d1 = d1;
        this.d2 = d2;
        let protocell = this.protocell = new paper.Symbol(shape, true);
        let cells = [];
        for(let x=-10;x<=10;x++) {
            for(let y=-10;y<=10;y++) {
                let matrix = new paper.Matrix().translate(d1.multiply(x).add(d2.multiply(y)))
                let cell = protocell.place();
                cell.applyMatrix = false;
                cell.matrix = matrix;
                cells.push(cell);
        }}
        let group = new paper.Group(cells);
        group.setPivot(new paper.Point(0,0));
        this.group = group;
        /*

        let dot = new paper.Path.Circle({radius : 5, strokeColor:'red', fillColor:'orange'})
        dot.position.set(d1.multiply(0.5))
        dot = dot.clone();
        dot.position.set(d2.multiply(0.5))
        */
       this.rotations = [];
    }

    destroy() {
        this.group.remove();
    }
}

let tiling = null;

function addPolygon(path, pts, color) {
    path.moveTo(pts[0]);
    pts.slice(1).forEach(p=>path.lineTo(p));
    path.closePath();
    path.strokeWidth = 1;
    path.strokeColor = "black";
    path.fillColor = color;
}

function makeTiling2() {
    if(tiling) tiling.destroy();
    const unit = 200;
    const d1 = new paper.Point(unit,0);
    const d2 = new paper.Point(unit*0.75,unit*0.75);
    let pts = erode([new paper.Point(0,0), d1, d1.add(d2), d2],4);

    let path = new paper.Path();
    addPolygon(path, pts, "#90aacc");
    path.setPivot(new paper.Point(0,0));

    tiling = new Tiling(d1,d2,path);
}


function makeTiling3() {
    const sqrt3_2 = Math.sqrt(3)/2;
    const unit = 200.0;
    if(tiling) tiling.destroy();
    const d1 = new paper.Point(unit, 0);
    const d2 = new paper.Point(unit*0.5, unit*sqrt3_2);
    let pts = [d1.add(d2).multiply(1/3)];
    const rot = new paper.Matrix().rotate(60);
    for(let i=1;i<6;i++) pts.push(rot.transform(pts.at(-1)));
    pts = erode(pts, 4);

    let path = new paper.Path();
    addPolygon(path, pts, "yellow");
    path.setPivot(new paper.Point(0,0));    

    tiling = new Tiling(d1,d2,path);    
    tiling.rotations.push([new paper.Point(0,0), 6])
}


function makeTiling4() {
    const unit = 200.0;
    if(tiling) tiling.destroy();
    const d1 = new paper.Point(unit, 0);
    const d2 = new paper.Point(0, unit);
    let pts = [d1.add(d2).multiply(0.5)];
    const rot = new paper.Matrix().rotate(90);
    for(let i=1;i<4;i++) pts.push(rot.transform(pts.at(-1)));
    pts = erode(pts, 4); 
    let path = new paper.Path();
    addPolygon(path, pts, "green");
    path.setPivot(new paper.Point(0,0));    
    tiling = new Tiling(d1,d2,path);
}


function makeTiling6() {
    const unit = 200.0;
    if(tiling) tiling.destroy();
    const d1 = new paper.Point(unit, 0);
    const d2 = (new paper.Matrix().rotate(60)).transform(d1);
    let pts = [new paper.Point(0,0), d1, d1.add(d2), d2];
    let pts1 = erode([pts[0],pts[1],pts[3]],4);
    let pts2 = erode([pts[3],pts[1],pts[2]],4);
    let path = new paper.CompoundPath();
    addPolygon(path, pts1, 'orange');
    addPolygon(path, pts2, 'orange');
    path.setPivot(new paper.Point(0,0));    
    
    tiling = new Tiling(d1,d2,path);    
}


class TranslateAnimation {
    constructor(delta) {
        let ghost = this.ghost = tiling.group.clone();
        ghost.applyMatrix = false;
        ghost.opacity = 0.9;
        this.startTime = performance.now();
        this.delta = delta;
    } 

    move(t) {
        this.ghost.position.set(this.delta.multiply(t));
    }
    step() {
        if(this.ghost == null) return false;
        const period = 1.0;
        let t = (performance.now() - this.startTime)*0.001;
        if(t>period) {
            this.ghost.position.set(this.delta);
            this.ghost.remove();
            this.ghost = null;
            return false;
        } else {
            this.move(t/period);
            return true;
        }
    }
}


class RotateAnimation {
    constructor(center, angle) {
        let ghost = this.ghost = tiling.group.clone();
        ghost.applyMatrix = false;
        ghost.opacity = 0.9;
        this.startTime = performance.now();
        this.center = center;
        this.angle = angle;
        let a = this.arrows = new paper.CompoundPath();
        a.moveTo(center);
        a.lineTo(center.add(200,0));
        a.strokeWidth = 3
        a.strokeColor = "black"
                
    } 

    move(t) {
        this.ghost.matrix = new paper.Matrix().rotate(-this.angle * t, this.center);
        let a = this.arrows;
        a.clear();
        let p = (this.center.add(200,0));
        a.moveTo(this.center);
        a.lineTo(p);
        a.moveTo(this.center);
        a.lineTo(this.ghost.matrix.transform(p));
        let p2 = this.center.add(50,0);
        let p3 = new paper.Matrix().rotate(-this.angle * t/2, this.center).transform(p2);
        let p4 = this.ghost.matrix.transform(p2);
        a.strokeWidth = 1;
        a.moveTo(p2);
        a.arcTo(p3,p4);
        //a.strokeWidth = 3
        //a.strokeColor = "black"
        
    }
    step() {
        if(this.ghost == null) return false;
        const period = 1.0;
        let t = (performance.now() - this.startTime)*0.001;
        if(t>period) {
            this.ghost.position.set(this.delta);
            this.ghost.remove();
            this.ghost = null;
            this.arrows.remove();
            this.arrows = null;
            return false;
        } else {
            this.move(t/period);
            return true;
        }
    }

}

function setup() {
    paper.setup('myCanvas');
    with(paper) {

        view.setCenter(new Point(0,0));

        
        /*
        let protocell = new Symbol(path);
        window.protocell = protocell;
        for(let x=-10;x<=10;x++) {
            for(let y=-10;y<=10;y++) {
                let matrix = new Matrix().translate(d1.multiply(x).add(d2.multiply(y)))
                let cell = protocell.place();
                cell.applyMatrix = false;
                cell.matrix = matrix;
        }}
                */
        makeTiling2();

        let tool = new Tool();
        tool.onMouseDrag = function(e) {
            console.log(e.delta)
            let center = view.center;
            center = center.add(e.delta)
            view.center = view.center.subtract(e.point.subtract(e.downPoint));
        }
        let animation = null;
        view.onFrame = function(e) {
            if(animation) {
                let result = animation.step();
                if(!result) animation = null;
            }
        }

        tool.onKeyDown = function(e) {
            if(e.key == '1') makeTiling2();
            else if(e.key == '2') makeTiling3();
            else if(e.key == '3') makeTiling4();
            else if(e.key == '4') makeTiling6();
            else if(e.key == 't') {
                if(animation == null && tiling != null) 
                    animation = new TranslateAnimation(tiling.d1)
            }
            else if(e.key == 'y') {
                if(animation == null && tiling != null) 
                    animation = new TranslateAnimation(tiling.d2)
            }
            else if(e.key == 'r') {
                if(animation == null && tiling != null) 
                    animation = new RotateAnimation(new Point(0,0), 360/6)
            }
            
            
        }
    }
}

function cleanup() {
    
}