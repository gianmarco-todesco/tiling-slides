
"use strict";

let app;
let hTexture;


// (0,0),(1,0) => p0,p1
function getTwoPointsTransform(p0, p1) {
    let e0 = p1.subtract(p0);
    let e1 = new PIXI.Point(-e0.y,e0.x);
    return new PIXI.Matrix(e0.x,e0.y,e1.x,e1.y,p0.x,p0.y);
}

// p0,p1 => p2,p3
function getFourPointsTransform(p0,p1,p2,p3) {
    let mat1 = getTwoPointsTransform(p0,p1).invert();
    let mat2 = getTwoPointsTransform(p2,p3);
    return mat2.append(mat1);
}


function makeDraggable(obj, cb = null) {
    const dragOffset = new PIXI.Point(0,0);
    obj.on('pointerdown', function(e) {  
        if(e.button != 1) return;
        this.position.subtract(e.global, dragOffset)
        function onDrag(e) {
            e.global.add(dragOffset, obj.position);
            if(cb) cb(obj.position);
        } 
        function dragEnd(e) {
            app.stage.off('globalpointermove', onDrag)
            app.stage.off('pointerup', dragEnd)
            app.stage.off('pointerupoutside', dragEnd)
        }
        app.stage.on('globalpointermove', onDrag)
        app.stage.on('pointerup', dragEnd)
        app.stage.on('pointerupoutside', dragEnd)
    });
}

let path, path2;
let pts = [];
let bgLayer, fgLayer;

class Tool {
    constructor() {}
    getWorldPos(e) {
        return app.stage.localTransform.clone().invert().apply(e.global);
    }
    pointerDown(e) {}

    drag(callback) {
        function onDrag(e) {
            callback(e);
        }
        function dragEnd(e) {
            app.stage.off('globalpointermove', onDrag)
            app.stage.off('pointerup', dragEnd)
            app.stage.off('pointerupoutside', dragEnd)
        }
        app.stage.on('globalpointermove', onDrag)
        app.stage.on('pointerup', dragEnd)
        app.stage.on('pointerupoutside', dragEnd)
        
    }
}
class QuadTool extends Tool {
    constructor() {
        super();
        this.pts = [];
        this._g = null;
    }
    
    findClosestPointIndex(p, maxd = 10) {
        const maxd2 = Math.pow(maxd,2);
        const pts = this.pts;
        if(pts.length==0) return -1;
        let D = pts.map(q=>q.subtract(p).magnitude());
        let j = D.indexOf(Math.min(...D));
        return D[j]<maxd2 ? j : -1;
    }

    updatePath() {
        const pts = this.pts;
        if(this._g == null) {
            this._g = new PIXI.Graphics();
            fgLayer.addChild(this._g);
        } else this._g.clear();
        let g = this._g;
        if(pts.length==0) return;
        else if(pts.length==1) {
            g.circle(pts[0].x, pts[0].y, 5);
            g.fill('red');
        } else {
            g.moveTo(pts[0].x, pts[0].y);
            pts.slice(1).forEach(p=>g.lineTo(p.x,p.y));
            g.stroke({color:'red', width:2})
            if(this.pts.length==4) g.closePath();
            pts.forEach(p=>g.circle(p.x,p.y,3));
            g.fill('orange')
            g.stroke('black')
        }
    }
    pointerDown(e) {
        let p = this.getWorldPos(e);
        let j = this.findClosestPointIndex(p, 5);
        console.log(j)
        if(j<0) {
            if(this.pts.length>=3) return;
            j = this.pts.length;
            this.pts.push(p);
            if(this.pts.length==3) this.addFourthPoint();
            this.updatePath();    
        }
        const me = this;
        const pts = this.pts;
        this.drag((e)=>{
            pts[j] = me.getWorldPos(e);
            me.updatePath();
        })
    }
    addFourthPoint() {
        if(this.pts.length != 3) return;
        let [p0,p1,p2] = this.pts;
        let e0 = p2.subtract(p0).normalize();
        let e1 = new PIXI.Point(-e0.y,e0.x);
        let p = p1.subtract(p0);
        let u = p.dot(e0);
        let v = p.dot(e1);
        let p3 = p0.add(e0.multiplyScalar(u)).add(e1.multiplyScalar(-v));
        this.pts.push(p3);        
    }
}

let tool = new QuadTool();

async function initialize() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'gray',
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        // autoStart: false,
        // backgroundColor: 0x333333,
        resolution: window.devicePixelRatio
      
    });

    document.body.appendChild(app.canvas);
    app.stage.eventMode = 'dynamic';
            
    app.stage.position.set(app.canvas.width/2,app.canvas.height/2);



    bgLayer = new PIXI.Container();
    fgLayer = new PIXI.Container();
    app.stage.addChild(bgLayer);
    app.stage.addChild(fgLayer);
    


    const texturePromise = PIXI.Assets.load('/images/horses.png');
    texturePromise.then((resolvedTexture) =>
    {
        hTexture = resolvedTexture;
        // create a new Sprite from the resolved loaded Texture
        const horses = PIXI.Sprite.from(resolvedTexture);

        // center the sprite's anchor point
        horses.anchor.set(0.5);
        window.horses = horses;
        bgLayer.addChild(horses);
    });

    makeDraggable(app.stage);
    app.stage.on('wheel', (e) => {
        console.log(e.global);
        const matrix = app.stage.localTransform;
        const worldPos = matrix.clone().invert().apply(e.global);
        let sc = app.stage.scale.x;
        sc *= Math.exp(-e.deltaY * 0.001);
        app.stage.scale.set(sc,sc);
        const winPos = worldPos.multiplyScalar(sc).add(app.stage.position);
        const delta = e.global.subtract(winPos);
        delta.add(app.stage.position, app.stage.position)
    })

    path = new PIXI.Graphics();
    fgLayer.addChild(path);
    path2 = new PIXI.Graphics();
    fgLayer.addChild(path2);

    let g = new PIXI.Graphics().circle(0,0,10).fill('blue');
    fgLayer.addChild(g);

    app.stage.on('pointerdown', (e) => {
        if(e.button == 0 && !!tool) tool.pointerDown(e);
    });

    /*
    app.stage.on('pointerdown', (e) => {
        if(e.button != 0) return;
        let p = app.stage.localTransform.clone().invert().apply(e.global);
        pts.push(p);
        path.clear();
        path.moveTo(pts[0].x,pts[0].y);
        pts.slice(1).forEach(p=>path.lineTo(p.x,p.y));
        path.closePath();
        path.fill('yellow')
        path.stroke({color:'blue', width:4});
        path.alpha = 0.5;


        let delta = new PIXI.Point(-600,0).subtract(pts[0]);
        let pts2 = pts.map(p=>p.add(delta));
        path2.clear();
        path2.moveTo(pts2[0].x,pts2[0].y);
        pts2.slice(1).forEach(p=>path2.lineTo(p.x,p.y));
        path2.closePath();
        path2.fill('pink');
        *//*
        path2.clear();
        if(pts.length>=4) {
            let matrix = new PIXI.Matrix()
                .translate(-pts[0].x,-pts[0].y)
                .scale(-1,1)
                .translate(pts[3].x, pts[3].y)
            let p = matrix.apply(pts[0]);
            path2.moveTo(p.x,p.y)
            pts.slice(1).forEach(p=>{let q = matrix.apply(p); path2.lineTo(q.x,q.y); });
            path2.stroke({color:'red', width:4});
    
        }
            * /

    });
    */

}

document.addEventListener('DOMContentLoaded', initialize)


document.addEventListener('wheel', function(e) {
    console.log(e);
    app.stage
})

function load() {
    pts = JSON.parse(localStorage['horse']);
    updatePath();
}

function updatePath() {
    path.clear();
    path.moveTo(pts[0].x,pts[0].y);
    pts.slice(1).forEach(p=>path.lineTo(p.x,p.y));
    path.closePath();
    path.fill('yellow')
    path.stroke({color:'blue', width:1});
    path.alpha = 0.5;
}

function triangulate() {
    let V = [];
    pts.forEach(p=>V.push(p.x, p.y))
    let L = earcut.default(V);
    path2.clear();
    for(let i=0; i+2<L.length; i+=3) {
        const a = L[i], b = L[i+1], c = L[i+2];
        path2.moveTo(pts[a].x, pts[a].y);
        path2.lineTo(pts[b].x, pts[b].y);
        path2.lineTo(pts[c].x, pts[c].y);
        path2.closePath();
        
    }
    path2.stroke({color:'black', width:1})
}


let mesh;

function uffa() {

    const vertices = [];
    const uvs = [];
    const width = hTexture.width, height = hTexture.height;

    pts.forEach(p=>{
        vertices.push(p.x-700,p.y)
        let u = (p.x + width/2)/width;
        let v = (p.y + height/2)/height;
        uvs.push(u,v)
    });
    let indices = earcut.default(vertices)

        const geometry = new PIXI.MeshGeometry({
            positions: new Float32Array(vertices),
            uvs: new Float32Array(uvs),
            indices: new Uint32Array(indices)
        });
        mesh = new PIXI.Mesh({
            geometry, 
            texture:hTexture
        });
        app.stage.addChild(mesh)
}