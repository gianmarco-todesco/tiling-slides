"use strict";



class Model {
    constructor() {
        this.quad = new Quad();
        this.storageName = "horsesModel";
        this.line1 = null;
        this.line2 = null;
        this.blackShape = null;
        this.whiteShape = null;
        

    }

    computeLine1Matrix() {
        const pts = this.quad.pts;
        let A = getTwoPointsTransform(pts[1],pts[0]).invert();
        let B = getTwoPointsTransform(pts[0], pts[3]);
        let matrix = B.clone()
            .append(new PIXI.Matrix().scale(1,-1))
            .append(A);
        return matrix;
    }

    computeLine2Matrix() {
        const pts = this.quad.pts;        
        let A = getTwoPointsTransform(pts[1],pts[2]).invert();
        let B = getTwoPointsTransform(pts[2], pts[3]);
        let matrix = B.clone()
            .append(new PIXI.Matrix().scale(1,-1))
            .append(A);
        return matrix;
    }

    createLine1() {
        this.line1 = new TileLine(
            this.computeLine1Matrix(),
            this.quad.pts[1], this.quad.pts[0]
        );
    }

    createLine2() {
        this.line2 = new TileLine(
            this.computeLine2Matrix(),
            this.quad.pts[1], this.quad.pts[2]
        );
    }

    editQuad() {
        this.clear();
        this.quad.g.visible = true;
        this.quad.updateGraphics();        
    }
    
    editLine1() {
        this.quad.updateGraphics(false);
        if(this.line2) this.line2.updateGraphics(false);
        if(!this.line1) this.createLine1();
        if(this.line1.pts.length == 0) this.line1.initialize(10);
        this.line1.g.visible = true;
        this.line1.updateGraphics(true);        
    }
    editLine2() {
        this.quad.updateGraphics(false);
        if(this.line1) this.line1.updateGraphics(false);
        if(!this.line2) this.createLine2();
        if(this.line2.pts.length == 0) this.line2.initialize(15);
        this.line2.g.visible = true;
        this.line2.updateGraphics(true);        
    }
    
    computeBlackShapePts() {
        let matrix1 = this.line1.matrix;
        let matrix2 = this.line2.matrix;

        let pts = [this.quad.pts[0]]
            .concat(this.line1.pts.toReversed())
            .concat([this.quad.pts[1]])
            .concat(this.line2.pts)
            .concat([this.quad.pts[2]])
            .concat(this.line2.pts.map(p=>matrix2.apply(p)))
            .concat([this.quad.pts[3]])
            .concat(this.line1.pts.toReversed().map(p=>matrix1.apply(p)))
        return pts;
    }
    computeWhiteShapePts() {
        let pts = this.computeBlackShapePts();
        let matrix = this.line2.matrix;
        pts = pts.map(p=>matrix.apply(p))
        return pts;
    }
    editBlackShape() {
        if(this.blackShape) {this.blackShape.destroy(); this.blackShape=null; }
        this.quad.g.visible = false;
        this.line1.g.visible = false;
        this.line2.g.visible = false;
        this.blackShape = new Shape(this.computeBlackShapePts());
        this.blackShape.updateGraphics2();
    }
    editWhiteShape() {
        if(this.whiteShape) {this.whiteShape.destroy(); this.whiteShape=null; }
        this.quad.g.visible = false;
        this.line1.g.visible = false;
        this.line2.g.visible = false;
        this.whiteShape = new Shape(this.computeWhiteShapePts());
        this.whiteShape.updateGraphics2();
    }


    clear() {
        if(this.line1) {this.line1.destroy(); this.line1 = null;}
        if(this.line2) {this.line2.destroy(); this.line2 = null;}
        if(this.blackShape) {this.blackShape.destroy(); this.blackShape = null;}
        if(this.whiteShape) {this.whiteShape.destroy(); this.whiteShape = null;}
    }
    save() {
        let json = {
            "quad": this.quad.getJson(),
            "line1": this.line1 ? this.line1.getJson() : [],
            "line2": this.line2 ? this.line2.getJson() : []
        }
        localStorage[this.storageName] = JSON.stringify(json);        
    }

    load() {
        let json = JSON.parse(localStorage[this.storageName]);
        this.quad.setJson(json["quad"]);
        let line1Json = json["line1"];
        if(line1Json) {
            this.createLine1();
            this.line1.setJson(line1Json);            
        }
        let line2Json = json["line2"];
        if(line2Json) {
            this.createLine2();
            this.line2.setJson(line2Json);            
        }
    }

    prova() {
        if(!this.blackShape) this.editBlackShape();
        if(!this.whiteShape) this.editWhiteShape();
        let container = new PIXI.Container();
        fgLayer.addChild(container)

        let glideMatrix = this.line2.matrix;                
        let d1 = this.quad.pts[2].subtract(this.quad.pts[0]);
        let d2 = this.quad.pts[3].subtract(this.quad.pts[1]);

        for(let i= -1;i<=1;i++) {
            for(let j=-1; j<=1; j++) {
                let pos = d1.multiplyScalar(j).add(d2.multiplyScalar(i));
                let m1 = this.blackShape.createMesh();
                container.addChild(m1);
                m1.setFromMatrix(new PIXI.Matrix().translate(pos.x,pos.y));
                let m2 = this.whiteShape.createMesh();
                m2.setFromMatrix(new PIXI.Matrix().translate(pos.x,pos.y));
                container.addChild(m2);        
            }
        }

        container.position.set(-1000,0);
        
        return container;
    }
}
