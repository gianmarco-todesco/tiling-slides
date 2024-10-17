const slide = {
    name:"pixi-template"    
}

let app;

const c0 = chroma('white').hex(), c1 = chroma('black').hex();
const cA = chroma('yellow').hex(), cB = chroma('cyan').hex();
const c_ = chroma('pink').hex();

async function initPixi() {
    app = new PIXI.Application();
    await app.init({ 
        resizeTo: window,
        backgroundColor: 'lightgray',
        antialias: true,
        // autoDensity: true,
        // autoStart: false,
        // backgroundColor: 0x333333,
        // resolution: window.devicePixelRatio        
    });
    document.body.appendChild(app.canvas)

    // app.stage.eventMode = 'dynamic';
    // app.stage.position.set(app.canvas.width/2,app.canvas.height/2);
    buildScene();
}

function setup() {
    initPixi();
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
        this.lastLine = [];
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
        this.x0 = 100;
        this.y0 = -100;
    }

    clear() {
        this.container.removeChildren().forEach(d=>d.destroy());
        this.lastLine = [];
    }

    placeTile(tile, x, y, container) {
        let g = tile.createGraphics();
        g.position.set(x,y); 
        container.addChild(g);
        return g;
    }

    placeTiles(x0,y0) {
        let i = 0;
        let x=x0, y=y0;
        for(let tile of this.tiles) {
            this.placeTile(tile, x,y, this.tilesetContainer); y+=50;
            if(i++>=6) {x += 50; y = y0; i = 0;}
        }
    }

    findTile(top,right) {
        console.log(top, right)
        let q = this.tiles.filter(tile=>
            tile.colors[0]==top && tile.colors[1]==right);
        if(q.length == 0) return null;
        if(q.length != 1) {
            console.log(top, right);
            console.log(q);
            throw "Error";
        }
        return q[0];        
    }

    addToFirstLine(color) {
        const d = 40;
        let g, tile;
        if(this.lastLine.length == 0) {
            tile = this.findTile(color,cB);
            g = this.placeTile(tile, this.x0, this.y0, this.container);
        } else {
            let prev = this.lastLine.at(-1);
            let prevTile = prev.tile;
            tile = this.findTile(color, prev.tile.colors[3]);
            let x = prev.g.position.x - d;
            let y = prev.g.position.y;
            g = this.placeTile(tile, x,y, this.container);
        }
        let digit = "";
        if(color == c0) digit = '0';
        else if(color == c1) digit = '1';
        if(digit != '') {
            let txt = new PIXI.Text({
                text: color == c0 ? '0' : '1',
                anchor: new PIXI.Point(0.5,0.5),
                style:{
                    fontFamily:'short-stack'
                }
            })
            this.container.addChild(txt);
            txt.x = g.x;
            txt.y = g.y - 40;    
        }
        this.lastLine.push({g, tile})
        console.log(g)
        console.log(g.position)
        
        this.curLine = [];
    }

    /*
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
    */

    step() {
        const d = 40;
        let g, tile;
        if(this.curLine.length == 0) {
            let upTile = this.lastLine[0];
            tile = this.findTile(upTile.tile.colors[2],this.cx);
            if(!tile) return false;
            g = this.placeTile(tile, upTile.g.position.x, upTile.g.position.y+d, this.container);        
            this.curLine.push({g, tile})
        } else if(this.curLine.length < this.lastLine.length) {
            let i = this.curLine.length;
            let upTile = this.lastLine[i];
            let rightTile = this.curLine.at(-1);
            tile = this.findTile(upTile.tile.colors[2],rightTile.tile.colors[3]);
            if(!tile) return false;
            g = this.placeTile(tile, upTile.g.position.x, upTile.g.position.y+d, this.container);        
            this.curLine.push({g, tile})
        } else {
            this.lastLine = this.curLine;
            this.curLine = []; 
       }
       return true;
    }
    visualizeResult() {
        for(let itm of this.curLine) {
            let digit = '';
            if(itm.tile.colors[2] == c0) digit = '0';
            else if(itm.tile.colors[2] == c1) digit = '1';
            if(digit != '') {
                let txt = new PIXI.Text({
                    text: digit,
                    anchor: new PIXI.Point(0.5,0.5),
                    style:{
                        fontFamily:'short-stack'
                    }
                })
                this.container.addChild(txt);
                txt.x = itm.g.x;
                txt.y = itm.g.y + 40;   
            }
        }
    }

    run() {
        if(this.lastLine.length==0) return;
        if(this.lastLine.at(-1).tile.colors[0] != c_) 
            this.addToFirstLine(c_);
        let t = setInterval(()=>{
            console.log("step")
            let ret = this.step();
            if(!ret) {
                console.log("finito");
                clearInterval(t);
                this.visualizeResult();
            }
        }, 100)
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



    wangSet = new WangSet([c0,c1,c_],[cA,cB],[
        {input:c0,state:cA,output:c0, nextState:cA, dir:"L"},
        {input:c0,state:cB,output:c1, nextState:cA, dir:"L"},
        {input:c1,state:cA,output:c1, nextState:cA, dir:"L"},
        {input:c1,state:cB,output:c0, nextState:cB, dir:"L"},        
    ]);
    wangSet.placeTiles(50,50);
    wangSet.x0 = 600;
    wangSet.y0 = 80;
//    g = new PIXI.Graphics().circle(wangSet.x0, wangSet.y0, 5).fill('red');
//    app.stage.addChild(g);

    document.addEventListener('keydown', e=>{
        if(e.key == 'c') {
            wangSet.clear();
        } else if(e.key == '0') {
            wangSet.addToFirstLine(c0);            
        } else if(e.key == '1') {
            wangSet.addToFirstLine(c1);            
        } else if(e.key == '.') {
            wangSet.addToFirstLine(c_);
        } else if(e.key == ' ') {
            wangSet.step();
        } else if(e.key == 'r' || e.key == "Enter") {
            wangSet.run();
        }
    })
}

