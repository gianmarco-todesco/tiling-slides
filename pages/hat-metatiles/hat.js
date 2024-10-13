
const hatPts = [
    hexGrid(0, 0), hexGrid(-1,-1), hexGrid(0,-2), hexGrid(2,-2),
    hexGrid(2,-1), hexGrid(4,-2), hexGrid(5,-1), hexGrid(4, 0),
    hexGrid(3, 0), hexGrid(2, 2), hexGrid(0, 3), hexGrid(0, 2),
    hexGrid(-1, 2),
];
function createHatShape(bgColor) {
    let hatShape = new PIXI.GraphicsContext();
    hatShape.moveTo(...coords(hatPts[hatPts.length-1]));
    for(let i=0; i<hatPts.length; i++) 
        hatShape.lineTo(...coords(hatPts[i]));
    hatShape.fill(bgColor).stroke({width:2.5, color:0x000000});
    let p0 = hexGrid(0,0), p1 = hexGrid(2,2), p2 = hexGrid(4,-2);

    hatShape.moveTo(...coords(p0))
        .lineTo(...coords(p1))
        .lineTo(...coords(p2))
        .lineTo(...coords(p0))
        .stroke({width:0.5, color:0x888888})

    return hatShape;
}

function createObject(app, shape) {
    let obj = new PIXI.Graphics(shape);
    app.stage.addChild(obj);
    return obj;
}

class MetatileItem {
    constructor(matrix, shape) {
        this.matrix = matrix;
        this.shape = shape;
    }
    createObject(app, matrix = null) {
        let obj = createObject(app, this.shape);
        if(matrix == null)
            obj.setFromMatrix(this.matrix);
        else
        {
            obj.setFromMatrix(matrix.clone().append(this.matrix));
        }
        return obj;
    }
}

class Metatile {
    constructor() {
        this.bounds = null;
        this.children = [];
        this.matrix = new PIXI.Matrix();
        this.type = null;
    }
    addChild(matrix, shape) {
        this.children.push(new MetatileItem(matrix, shape))
    }
    setBounds(bounds)  {
        this.bounds = bounds;
    }
    createObject(app) {
        let c = new PIXI.Container();
        app.stage.addChild(c);
        let matrix = this.matrix;
        this.children.forEach(child => {
            let childObj = child.createObject(app, matrix);
            c.addChild(childObj);
        });
        let bounds = this.bounds;
        if(bounds) {
            bounds = bounds.map(p=>matrix.apply(p));
            let shape = new PIXI.Graphics()
            shape.moveTo(...coords(bounds[bounds.length-1]));
            bounds.forEach(p=>shape.lineTo(...coords(p)));
            shape.stroke({width:1.5, color:0xFF0000});
            
            c.addChild(shape);
        }
        return c;
    }

    recenter() {
        if(!this.bounds || this.bounds.length == 0) return;
        let center = new PIXI.Point(0,0);
        this.bounds.forEach(p=>{ center = center.add(p); })
        center = center.multiplyScalar(1/this.bounds.length);
        for(let i=0;i<this.bounds.length;i++) this.bounds[i] = this.bounds[i].subtract(center);
        // this.bounds.forEach(p=>p.subtract(center, p));
        let tr = new PIXI.Matrix(1,0,0,1,-center.x, -center.y);
        this.children.forEach(child => {
            child.matrix.prepend(tr);
        })

    }
}


const H_shape = createHatShape('rgb(148,205,235)');
const H1_shape = createHatShape('rgb(0,137,212)');
const P_shape = createHatShape('rgb(100,205,125)');
const T_shape = createHatShape('rgb(251,251,251)');
const F_shape = createHatShape('rgb(191,191,191)');

const H_metatile = (()=>{
    let m = new Metatile();
    let pts = [pt(0,0), pt(4,0), pt(4.5,1), pt(2.5,5),
        pt(1.5,5), pt(-0.5,1)];
    [[5,7,5,0], [9,11,1,2], [5,7,3,4]].forEach(([a,b,c,d])=>{
        let matrix = getFourPointsTransform(hatPts[a], hatPts[b], pts[c], pts[d]);
        //matrix = matrix.append(PIXI.Matrix.IDENTITY.scale(0.5,0.5));
        m.addChild(matrix, H_shape);
    })
    let matrix = makeMatrix(0.5,Math.PI*2/3, 2.5, -1);
    matrix = matrix.append(new PIXI.Matrix(-1,0,0,1,0,0));
    m.addChild(matrix, H1_shape);
    m.setBounds(pts);
    m.type = "H";
    return m;
})();


const P_metatile = (()=>{
    let m = new Metatile();
    m.addChild(makeMatrix(0.5,0,0,-2), P_shape);
    m.addChild(makeMatrix(0.5,-Math.PI/3,1.5,-1), P_shape);
    m.setBounds([pt(0,0),pt(4,0),pt(3,2),pt(-1,2)]);
    m.type = "P";
    return m;
})();

const F_metatile = (()=>{
    let m = new Metatile();
    m.addChild(makeMatrix(0.5,0,0,-2), F_shape);
    m.addChild(makeMatrix(0.5,-Math.PI/3,1.5,-1), F_shape);
    m.setBounds([pt(0,0),pt(3,0),pt(3.5,1),pt(3,2),pt(-1,2)]);
    m.type = "F";
    return m;
})();

const T_metatile = (()=>{
    let m = new Metatile();
    m.addChild(makeMatrix(0.5,-Math.PI/3,0.5,-1), T_shape);
    m.setBounds([pt(0,0),pt(3,0),pt(1.5,3)]);
    m.type = "T";
    return m;
})();

/*
function uff(t) {
    t.createObject(app);
}
*/

class SupertileChild {
    constructor(matrix, metatile) {
        this.matrix = matrix;
        this.metatile = metatile;
    }
    createObject(app) {
        let obj = this.metatile.createObject(app);
        obj.setFromMatrix(this.matrix);
        return obj;
    }
}

class Supertile {
    constructor() {
        this.children = [];

    }

    addChild(matrix, metatile) {
        this.children.push(new SupertileChild(matrix, metatile))
    }

    createObject(app) {
        let c = new PIXI.Container();
        app.stage.addChild(c);
        this.children.forEach(child => c.addChild(child.createObject(app)));
        return c;
    }

    getP(childIndex, ptIndex) {
        let child = this.children[childIndex];
        return child.matrix.apply(child.metatile.bounds[ptIndex]);
    }
}


function createPatch(metatiles) {
    let patch = new Supertile();
    const rules = [
        ['H'],
		[0, 0, 'P', 2],
		[1, 0, 'H', 2],
		[2, 0, 'P', 2],
		[3, 0, 'H', 2],
		[4, 4, 'P', 2],
		[0, 4, 'F', 3],
		[2, 4, 'F', 3],
		[4, 1, 3, 2, 'F', 0],
		[8, 3, 'H', 0],
		[9, 2, 'P', 0],
		[10, 2, 'H', 0],
		[11, 4, 'P', 2],
		[12, 0, 'H', 2],
		[13, 0, 'F', 3],
		[14, 2, 'F', 1],
		[15, 3, 'H', 4],
		[8, 2, 'F', 1], 
		[17, 3, 'H', 0],
		[18, 2, 'P', 0],
		[19, 2, 'H', 2],
		[20, 4, 'F', 3],
		[20, 0, 'P', 2],
		[22, 0, 'H', 2],
		[23, 4, 'F', 3],
		[23, 0, 'F', 3],
		[16, 0, 'P', 2],
		[9, 4, 0, 2, 'T', 2],
		[4, 0, 'F', 3] 
    ]

    rules.forEach(rule => {
        if(rule.length == 1) {
            let tile = metatiles[rule[0]];
            patch.addChild(new PIXI.Matrix(), tile);
        } else if(rule.length == 4) {
            const [a,b,c,d] = rule;
            let poly = patch.children[a].metatile.bounds;
            let T = patch.children[a].matrix;
            let P = T.apply(poly[(b+1)%poly.length]);
            let Q = T.apply(poly[b%poly.length]);
            const nshp = metatiles[c];
            const npoly = nshp.bounds;
            let matrix = getFourPointsTransform(
                npoly[d], npoly[(d+1)%npoly.length],P,Q
            );
            patch.addChild(matrix, nshp);

        } else if(rule.length == 6) {
            const [a,b,c,d,e,f] = rule;
            const chP = patch.children[a];
            const chQ = patch.children[c];
            const P = chQ.matrix.apply(chQ.metatile.bounds[d]);
            const Q = chP.matrix.apply(chP.metatile.bounds[b]);
            const nshp = metatiles[e];
            const npoly = nshp.bounds;
            let matrix = getFourPointsTransform(
                npoly[f], npoly[(f+1)%npoly.length],P,Q
            );
            patch.addChild(matrix, nshp);    
        }
    })


    
    let bps1 = patch.getP(8,2);
    let bps2 = patch.getP(21,2);
    let rbps = rotAbout(bps1, 2*Math.PI/3).apply(bps2);

	const p72 = patch.getP( 7, 2 );
	const p252 = patch.getP( 25, 2 );

    const llc = intersect( bps1, rbps, patch.getP( 6, 2 ), p72 );
	let w = patch.getP(6,2).subtract(llc);
    
    let H_outline = [llc, bps1];
    w = trot(Math.PI/3).apply(w);
    H_outline.push(H_outline[1].add(w));
    H_outline.push(patch.getP(14,2));
    w = trot(Math.PI/3).apply(w);
    H_outline.push(H_outline[3].subtract(w));
    H_outline.push(patch.getP(6,2));

    const P_outline = [ p72, p72.add(bps1.subtract(llc)), bps1, llc ];
	
    const F_outline = [ 
		bps2, patch.getP( 24, 2 ), patch.getP( 25, 0 ),
		p252, p252.add(llc.subtract(bps1)) ];
	
    const AAA = H_outline[2];
    const BBB = H_outline[1].add(H_outline[4].subtract(H_outline[5]));
    const CCC = rotAbout( BBB, Math.PI/3 ).apply(AAA);
    const T_outline = [
        BBB,CCC,AAA
    ];
	
    patch.outlines = {
        'H' : H_outline,
        'P' : P_outline,
        'F' : F_outline,
        'T' : T_outline
    }

    return patch;
}

function createChildren(patch) {

    function createMetatile(lst, outline, type) {
        let m = new Metatile();
        m.type = type;
        for( let ch of lst ) {
            let child = patch.children[ch];
            child.metatile.children.forEach(grandchild => {
                let matrix = child.matrix.clone().append(grandchild.matrix);
                m.addChild(matrix, grandchild.shape);
            })
        }
        m.setBounds(outline.map(p=>p));
        m.recenter();
        return m;    
    }

    let metatiles = {
        'H': createMetatile([0, 9, 16, 27, 26, 6, 1, 8, 10, 15], patch.outlines.H, 'H'),
        'P': createMetatile([7,2,3,4,28], patch.outlines.P,'P'),
        'F': createMetatile([21,20,22,23,24,25], patch.outlines.F, 'F'),
        'T': createMetatile([11], patch.outlines.T, 'T'),        
    }
    return metatiles;
}



function createAbstractChildren(patch) {

    function createAbstractChild(lst, outline, type) {
        let m = {
            type,
            outline: outline.map(p=>p),
            children:[]
        }
        for( let ch of lst ) {
            let child = patch.children[ch];
            let bounds = child.metatile.bounds.map(p=>child.matrix.apply(p));            
            m.children.push({
                type: child.metatile.type,
                bounds
            });
        }
        return m;    
    }

    let children = {
        'H': createAbstractChild([0, 9, 16, 27, 26, 6, 1, 8, 10, 15], patch.outlines.H),
        'P': createAbstractChild([7,2,3,4,28], patch.outlines.P),
        'F': createAbstractChild([21,20,22,23,24,25], patch.outlines.F),
        'T': createAbstractChild([11], patch.outlines.T),        
    }
    return children;


    let Hlst = [0, 9, 16, 27, 26, 6, 1, 8, 10, 15];

    let g1 = new PIXI.Graphics();
    g1.poly(patch.outlines.H, true);
    g1.stroke('magenta');

    let g2 = new PIXI.Graphics();

    for(let ch of Hlst) {
        let child = patch.children[ch];
        let bounds = child.metatile.bounds.map(p=>child.matrix.apply(p));
        g2.poly(bounds,true);
    }
    g2.stroke('black');
    app.stage.addChild(g2);
    app.stage.addChild(g1);
}
