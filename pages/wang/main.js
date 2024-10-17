const slide = {
    name:"pixi-template"    
}

let app;

const c0 = chroma('white').hex(), c1 = chroma('black').hex();
const cA = chroma('yellow').hex(), cB = chroma('cyan').hex();


async function initPixi() {
    app = new PIXI.Application();
    await app.init({ 
        resizeTo: window,
        backgroundColor: 'gray',
        antialias: true,
        autoDensity: true,
        // autoStart: false,
        // backgroundColor: 0x333333,
        // resolution: window.devicePixelRatio        
    });
    document.body.appendChild(app.canvas)

    app.stage.eventMode = 'dynamic';
    app.stage.position.set(app.canvas.width/2,app.canvas.height/2);
    buildScene();
}

function setup() {
    initPixi();
    document.addEventListener('keydown', (e) => {
        console.log(e);
    })
}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    // PIXI.Assets.unload(HORSES_URL);
    app.destroy();
    app = null;
}

class Wang {
    constructor(c0,c1,c2,c3) {
        this.colors = [c0,c1,c2,c3];
        this.shape = null;
    }
    createGraphics() {
        if(this.shape == null) {
            const u = 20.0;
            let s = this.shape = new PIXI.GraphicsContext();
            function triangle(x0,y0,x1,y1,x2,y2, color) {
                s.moveTo(x0,y0).lineTo(x1,y1).lineTo(x2,y2).closePath();
                s.fill(color);
            }
            triangle(0,0,u,u,-u,u, this.colors[2]);
            triangle(0,0,u,-u,u,u, this.colors[1]);
            triangle(0,0,-u,-u,u,-u, this.colors[0]);
            triangle(0,0,-u,u,-u,-u, this.colors[3]);
            s.moveTo(-u,-u).lineTo(u,u);
            s.moveTo(-u,u).lineTo(u,-u);
            s.stroke('gray');
            s.moveTo(-u,-u).lineTo(u,-u).lineTo(u,u).lineTo(-u,u);
            s.closePath();
            s.stroke('#333333');
        }
        return new PIXI.Graphics(this.shape);
    }
}

class WangSet {
    constructor(alphabet, states, rules) {
        this.alphabet = alphabet;
        this.states = states;
        this.tiles = [];
        let cx = this.cx = chroma('lightgray').hex();
        this.container = new PIXI.Container();
        app.stage.addChild(this.container);
        this.tilesetContainer = new PIXI.Container();
        app.stage.addChild(this.tilesetContainer);
        this.firstLine = [];
        for(let c of alphabet) {
            let w = new Wang(c,cx,c,cx);
            this.tiles.push(w);
        }
        let tb = {}
        for(let s of states) {
            for(let c of alphabet) {
                console.log(s,c)
                let sc = chroma.average([chroma(s), chroma(c)]).hex();
                tb[s+"_"+c] = sc;
                // this.tiles.push(new Wang(c, cx, sc, s));
                this.tiles.push(new Wang(c, s, sc, cx));
            }
        }
        for(let rule of rules) {
            const {input,state,nextState,output,dir} = rule;
            let sc = tb[state+"_"+input];
            if(dir=="L") this.tiles.push(new Wang(sc,cx,output,nextState));
            else this.tiles.push(new Wang(sc,nextState,output,cx));
        }
        this.x0 = -200;
        this.y0 = 100;
    }

    clear() {
        this.container.removeChildren().forEach(d=>d.destroy());
        this.firstLine = [];
    }

    placeTile(tile, x, y, container) {
        let g = tile.createGraphics();
        g.position.set(x,y); 
        container.addChild(g);
        return g;
    }

    placeTiles(x0,y0,maxcol=5) {
        let i = 0;
        let x=x0, y=y0;
        for(let tile of this.tiles) {
            this.placeTile(tile, x,y, this.tilesetContainer); x+=50;
            if(i++>maxcol) {
                i=0;
                x=x0;
                y+=50;
            }
        }
    }

    findTile(top,right) {
        let q = this.tiles.filter(tile=>
            tile.colors[0]==top && tile.colors[1]==right);
        if(q.length != 1) {
            console.log(top, right);
            console.log(q);
            throw "Error";
        }
        return q[0];        
    }

    addToFirstLine(color) {
        if(this.firstLine.length == 0) {
            let tile = this.findTile(color,cB);
            let g = this.placeTile(prevTile, this.x0, this.y0, this.container);
        }

    }

    firstLine(x,y,colors,s0) {
        const d = 40;
        let L = [];
        let prevTile = this.findTile(colors.at(-1),s0);
        let g = this.placeTile(prevTile, x+d*(colors.length-1),y, this.container);
        L.push({g,tile:prevTile});        
        for(let i = colors.length-2; i>=0; i--) {
            let tile = this.findTile(colors[i], prevTile.colors[3]);
            g = this.placeTile(tile, x+d*i, y, this.container);
            L.push({g, tile});
            prevTile = tile;
        }
        this.lastLine = L.toReversed();
    }

    nextLine() {
        const d = 40;
        let L = []
        // this.lastLine = [];
        let upTile = this.lastLine.at(-1);
        let tile = this.findTile(upTile.tile.colors[2],this.cx);
        let g = this.placeTile(tile, upTile.g.position.x, upTile.g.position.y+d, this.container);
        L.push({g, tile});
        let prevTile = tile;
        for(let i = this.lastLine.length-2; i>=0; i--) {
            upTile = this.lastLine[i];
            console.log(i,upTile)
            tile = this.findTile(upTile.tile.colors[2], prevTile.colors[3]);
            g = this.placeTile(tile, upTile.g.position.x, upTile.g.position.y+d, this.container);
            L.push({g, tile});
            prevTile = tile;
        }
        this.lastLine = L.toReversed();
    }

}

let wangSet;

function buildScene() {



    wangSet = new WangSet([c0,c1],[cA,cB],[
        {input:c0,state:cA,output:c0, nextState:cA, dir:"L"},
        {input:c0,state:cB,output:c1, nextState:cA, dir:"L"},
        {input:c1,state:cA,output:c1, nextState:cA, dir:"L"},
        {input:c1,state:cB,output:c0, nextState:cB, dir:"L"},        
    ]);
    wangSet.placeTiles(-200,-300);

    let y = -100;
    wangSet.firstLine(-200,y,[c0,c0,c0,c1,c1,c1,c1],cB); y+=40;
    for(let i=0;i<8;i++) wangSet.nextLine(-200,y);


    document.addEventListener('keydown', e=>{
        if(e.key == 'c') {

        }  
    })
}

