"use strict";

class TileLine {
    constructor(matrix, p0, p1) {
        this.pts = [];
        this.g = null;
        this.p0 = p0;
        this.p1 = p1;
        this.matrix = matrix;
        this.currentPoint = -1;
    }

    destroy() {
        this.g.destroy();
        this.g = null;
    }
    
    initialize(n = 20) {
        const p0 = this.p0, p1 = this.p1;
        this.pts.length = 0;
        for(let i = 1; i<n; i++) {
            let t = i/n;
            let p = p0.multiplyScalar(1-t).add(p1.multiplyScalar(t));
            this.pts.push(p);
        }
        this.updateGraphics();
    }
    updateGraphics(editing = true) {
        const pts = this.pts;
        const p0 = this.p0;
        const p1 = this.p1;        
        if(this.g == null) {
            this.g = new PIXI.Graphics();
            fgLayer.addChild(this.g);
        } else this.g.clear();
        let g = this.g;
        g.alpha=0.75;
        g.moveTo(p0.x,p0.y);
        pts.forEach(p=>g.lineTo(p.x,p.y));
        g.lineTo(p1.x,p1.y);       
        g.stroke({color:'blue', width: (editing?1:0.5)})
        this.drawOtherLine(g);
        if(editing) {
            pts.forEach(p=>g.circle(p.x,p.y,1));
            g.fill('blue')
            g.stroke({color:'black', width:0.5})
            let j = this.currentPoint;
            if(0<=j && j<pts.length) {
                let p = pts[j];
                g.circle(p.x,p.y,1);
                g.fill('red');
                g.stroke('black')
            }
        }
    }

    drawOtherLine(g) {
        const matrix = this.matrix;
        let pts = [this.p0].concat(this.pts).concat([this.p1]);
        pts = pts.map(p=>matrix.apply(p));
        g.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p=>g.lineTo(p.x,p.y));
        g.stroke('cyan');
    }


    getJson() {
        return this.pts.map(p=>({"x":p.x, "y":p.y}))
    }
    setJson(json) {
        if(!Array.isArray(json) || json.length==0) {
            this.pts = [];
        } else {
            this.pts = json.map(p=>new PIXI.Point(p.x,p.y));
        }
        this.updateGraphics(false);
    }
}



class LineTool extends Tool {
    constructor(line) { 
        super();
        this.line = line;
    }
    
    pointerDown(e) {
        let p = this.getWorldPos(e);
        const line = this.line;
        const pts = line.pts;
        const me = this;
        let j = findClosestPointIndex(p, pts, 5);
        line.currentPoint = j;
        line.updateGraphics();  
        if(j>=0) {
            this.drag((e)=>{
                pts[j] = me.getWorldPos(e);
                line.updateGraphics();  
            })
        }
    }

    keyDown(e) {
        const line = this.line;
        const pts = line.pts;
        let j = line.currentPoint;
        if(e.key == "Delete") {
            if(j>=0) {
                pts.splice(j,1);
                if(j>=pts.length) j = pts.length-1;
                line.updateGraphics();
            }
        } else if(e.key == '+') {
            if(j>=0) {
                let p1 = pts[j];
                let p0 = j==0 ? line.p0 : pts[j-1];
                let p = p0.add(p1).multiplyScalar(0.5);
                pts.splice(j, 0, p)
                line.updateGraphics();
            }
        }
    }
    
}