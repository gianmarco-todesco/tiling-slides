"use strict";


class Shape {
    constructor(pts) {
        this.pts = pts;
            
        let g = this.g = new PIXI.Graphics();
        g.moveTo(pts[0].x,pts[0].y);
        pts.slice(1).forEach(p=>g.lineTo(p.x,p.y));
        g.closePath();
        g.stroke({color:'magenta', width:3});
        pts.forEach(p=>g.circle(p.x,p.y,3));
        g.fill('magenta')
        g.alpha = 0.5;
        fgLayer.addChild(g)

        this.pts2 = pts.map(p=>p);
        let g2 = this.g2 = new PIXI.Graphics();
        fgLayer.addChild(g2)
        this.meshes = [];

    }

    destroy() {
        this.g.destroy(); this.g = null;
        this.g2.destroy(); this.g2 = null;
        this.meshes.forEach(mesh => mesh.destroy());
        this.meshes.length = 0;
        if(this.meshGeometry) {
            this.meshGeometry.destroy();
            this.meshGeometry = null;
        }
    }

    updateGraphics2() {
        const pts = this.pts2;
        const g = this.g2;
        g.clear();
        g.moveTo(pts[0].x,pts[0].y);
        pts.slice(1).forEach(p=>g.lineTo(p.x,p.y));
        g.closePath();
        g.stroke({color:'blue', width:1});
        pts.forEach(p=>g.circle(p.x,p.y,1.5));
        g.fill('blue')
    }

    updateMeshGeometry() {    
        const width = hTexture.width, height = hTexture.height;
        const pts = this.pts;
        let vertices = [];
        let uvs = [];
        pts.forEach(p=>{
            vertices.push(p.x,p.y)
            let u = (p.x + width/2)/width;
            let v = (p.y + height/2)/height;
            uvs.push(u,v)
        });
        let indices = earcut.default(vertices)
    
        this.meshGeometry = new PIXI.MeshGeometry({
            positions: new Float32Array(vertices),
            uvs: new Float32Array(uvs),
            indices: new Uint32Array(indices)
        });
    }

    createMesh() {    
        if(!this.meshGeometry) this.updateMeshGeometry();
        mesh = new PIXI.Mesh({
            geometry: this.meshGeometry, 
            texture:hTexture
        });
        fgLayer.addChild(mesh)
    
        return mesh
    }

    
}




class ShapeTool extends Tool {
    constructor(shape) { 
        super();
        this.shape = shape;
    }
    
    pointerDown(e) {
        let p = this.getWorldPos(e);
        const shape = this.shape;
        const pts = shape.pts2;
        const me = this;
        let j = findClosestPointIndex(p, pts, 5);
        shape.currentPoint = j;
        shape.updateGraphics2();  
        if(j>=0) {
            this.drag((e)=>{
                pts[j] = me.getWorldPos(e);
                shape.updateGraphics2();  
            })
        }
    }
}

