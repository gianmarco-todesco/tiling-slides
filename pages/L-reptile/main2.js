
async function initialize() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'gray',
        resizeTo: window,
        antialias: true,
    });

    document.body.appendChild(app.canvas);

    /*
    let n = 10;
    const instancePositionBuffer = new PIXI.Buffer({
        data: new Float32Array(n * 2),
        usage: PIXI.BufferUsage.VERTEX | PIXI.BufferUsage.COPY_DST,
    })
    let shapes = []
    for(let i=0; i<n; i++) {
        shapes[i] = {x : 800*Math.random(), y : 600*Math.random()}
    }
        */

    let unit = 100;
    let path2 = [0,0,2,0,2,1,1,1,1,2,0,2].map(v=>v*unit+0.5);
    let eps = 0.1;
    let path = [
        0+eps,0+eps,
        2-eps,0+eps, 2-eps,1-eps,
        1-eps,1-eps,
        1-eps,2-eps, 0+eps,2-eps].map(v=>v*unit+0.5);
    let shape = new PIXI.Graphics();
    shape.poly(path2);
    shape.stroke({width:1, color:"black"})
    shape.poly(path);
    shape.fill(0x657688);

    shape.stroke({ width: 4, color: 0xfeeb77 });

    var texture = app.renderer.generateTexture( shape, {resolution: 1} )

    let matrices = [];
    matrices.push(new PIXI.Matrix());
    matrices.push(new PIXI.Matrix().translate(unit, unit));
    matrices.push(new PIXI.Matrix().rotate(Math.PI/2).translate(4*unit, 0));
    matrices.push(new PIXI.Matrix().rotate(-Math.PI/2).translate(0,4*unit));
    //matrices.push(new PIXI.Matrix().translate(unit*4,0));
    //matrices.push(new PIXI.Matrix().translate(0,unit*4).rotate(-Math.PI/2));

    let mainContainer = new PIXI.Container();
    window.mainContainer = mainContainer;
    app.stage.addChild(mainContainer);

    function place(level, matrix) {
        if(level == 0) {
            let s = new PIXI.Sprite(texture);
            s.setFromMatrix(matrix);
            mainContainer.addChild(s);
        } else {
            matrices.forEach(mat => {
                let mat2 = matrix.clone()
                    .append(new PIXI.Matrix().scale(0.5,0.5))
                    .append(mat);
                place(level-1, mat2);
           });
        }
    }

    place(8, new PIXI.Matrix().scale(64,64).translate(-200.5,-200.5))
    // place(4, new PIXI.Matrix().scale(2,2).translate(100.5,100.5))
    /*
    matrices.forEach(mat => {
        let s = new PIXI.Sprite(texture);
        s.setFromMatrix(new PIXI.Matrix().translate(200,100).append(mat));
        
        app.stage.addChild(s);

    });
    */
    app.stage.eventMode = 'static';
    // Make sure the whole canvas area is interactive, not just the circle.
    app.stage.hitArea = app.screen;
    let mouseDown = false;
    let mousePos = new PIXI.Point(0,0);
    app.stage.addEventListener('pointerdown', (e) => {
        mousePos.copyFrom(e.screen);
        mouseDown = true;
    });
    app.stage.addEventListener('pointerup', (e) => {
        mouseDown = false;
    });
    app.stage.addEventListener('pointermove', (e) => {
        if(mouseDown) {
            // console.log(mousePos)
            let delta = e.screen.subtract(mousePos);
            mousePos.copyFrom(e.screen);
            mainContainer.position.add(delta, mainContainer.position);
        }
    });
    
    
}
addEventListener("DOMContentLoaded",initialize);

