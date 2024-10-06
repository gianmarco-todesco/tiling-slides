"use strict";

class Quad {
    constructor() {
        this.pts = [];
        this.g = null;
    }

    updateGraphics(editing = true) {
        const pts = this.pts;
        if(this.g == null) {
            this.g = new PIXI.Graphics();
            fgLayer.addChild(this.g);
        } else this.g.clear();
        let g = this.g;
        if(pts.length==0) return;
        else if(pts.length==1) {
            g.circle(pts[0].x, pts[0].y, 5);
            g.fill('red');
        } else {
            g.moveTo(pts[0].x, pts[0].y);
            pts.slice(1).forEach(p=>g.lineTo(p.x,p.y));
            if(pts.length>=4) g.closePath();
            g.stroke({color:'red', width:2})
            if(pts.length==4) {
                g.moveTo(pts[3].x,pts[3].y);
                let q = this.computeOther(pts[1]);
                g.lineTo(q.x,q.y);
                q = this.computeOther(pts[0]);
                g.lineTo(q.x,q.y);
                g.lineTo(pts[2].x, pts[2].y);
                g.stroke({color:'green', width:2})    
            }
            
            if(editing) {
                pts.forEach(p=>g.circle(p.x,p.y,3));
                g.fill('orange')
                g.stroke('black')
            }
        }
    }
    computeOther(p) {
        if(this.pts.length < 3) return p;
        const center = this.pts[2].add(this.pts[3]).multiplyScalar(0.5);
        return center.multiplyScalar(2).subtract(p);
    }
    computePoint23(p) {
        if(this.pts.length < 3) return p;
        const p0 = this.pts[0], p2 = this.pts[2];
        let e0 = p2.subtract(p0).normalize();
        let e1 = new PIXI.Point(-e0.y,e0.x);
        p = p.subtract(p0);
        let u = p.dot(e0);
        let v = p.dot(e1);
        return p0.add(e0.multiplyScalar(u)).add(e1.multiplyScalar(-v));
    }
    addFourthPoint() {
        if(this.pts.length != 3) return;
        this.pts.push(this.computePoint23(this.pts[1])); 
    }
    getJson() {
        return this.pts.map(p=>({"x":p.x, "y":p.y}))
    }
    setJson(json) {
        this.pts = json.map(p=>new PIXI.Point(p.x,p.y));
        this.updateGraphics(false);
    }
}



class QuadTool extends Tool {
    constructor(quad) {
        super();
        this.quad = quad;
    }
    
    pointerDown(e) {
        let p = this.getWorldPos(e);
        const quad = this.quad;
        const pts = quad.pts;
        const me = this;
        let j = findClosestPointIndex(p, pts, 5);
        console.log(j)
        if(j<0) {
            if(pts.length>=3) return;
            j = pts.length;
            pts.push(p);
            if(pts.length==3) quad.addFourthPoint();
            quad.updateGraphics();    
        }
        this.drag((e)=>{
            pts[j] = me.getWorldPos(e);
            if(pts.length == 4) {
                if(j<3) pts[3] = quad.computePoint23(pts[1]);
                else pts[1] = quad.computePoint23(pts[3]);
            }
            quad.updateGraphics();  
        })
    }
    
}
