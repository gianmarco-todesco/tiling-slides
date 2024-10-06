
"use strict";



let model = new Model();

let tool = new QuadTool(model.quad);

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

        model.load();
        model.editLine2();
        tool = new LineTool(model.line2);
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


    app.stage.on('pointerdown', (e) => {
        if(e.button == 0 && !!tool) tool.pointerDown(e);
    });

    document.addEventListener('keydown', (e) => {
        if(e.key=='1') {
            model.editLine1();
            tool = new LineTool(model.line1);
        } else if(e.key=='2') {
            model.editLine2();
            tool = new LineTool(model.line2);
        } else if(e.key=='3') {
            model.editShape();
            tool = new ShapeTool(model.shape);
        } else if(e.key=='s') {
            model.save();
            console.log("saved")
        } else {
            if(tool) tool.keyDown(e)
        }
    })

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