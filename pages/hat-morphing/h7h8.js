function h7h8(level) {

    const ident = [1,0,0,0,1,0];

    let to_screen = [20, 0, 0, 0, -20, 0];
    let lw_scale = 1;

    let sys;

    let scale_centre;
    let scale_start;
    let scale_ts;

    let reset_but;
    let tile_sel;
    let colscheme_sel;

    let ab_label;
    let ab_slider;

    let subst_button;
    let translate_button;
    let scale_button;
    let dragging = false;
    let uibox = true;

    let a = 1.0;
    let b = 1.7320508075688772;

    const PI = Math.PI, cos = Math.cos, sin = Math.sin;

    const tile_names = [ 'H7', 'H8' ];

    const colmap_orig = {
        'single' : [255, 255, 255],
        'unflipped' : [200, 200, 200],
        'flipped' : [150, 150, 150] };

    let colmap = colmap_orig;

    function chooseColour( label )
    {
        return colmap[label];
    }

    // A 2D point

    function pt( x, y )
    {
        return { x : x, y : y };
    }

    // Create a representation for numbers of the form xa+yb, where x and y
    // are coefficients and a and b are undefined (or symbolic) constants.

    function makeAB( a, b )
    {
        return { a : a, b : b };
    }

    function addAB( ab1, ab2 )
    {
        return makeAB( ab1.a + ab2.a, ab1.b + ab2.b );
    }

    function subAB( ab1, ab2 )
    {
        return makeAB( ab1.a - ab2.a, ab1.b - ab2.b );
    }

    function scaleAB( ab, alpha )
    {
        return makeAB( ab.a * alpha, ab.b * alpha );
    }

    function evalAB( ab )
    {
        return a*ab.a + b*ab.b;
    }

    function padd( P, Q )
    {
        return pt( addAB( P.x, Q.x ), addAB( P.y, Q.y ) );
    }

    function psub( P, Q )
    {
        return pt( subAB( P.x, Q.x ), subAB( P.y, Q.y ) );
    }

    // Add two values, both numbers or both ABs
    function addAny( x, y )
    {
        if( isNaN( x ) ) {
            return addAB( x, y );
        } else {
            return x + y;
        }
    }

    // Linear matrix inverse
    function inv( T ) {
        const det = T[0]*T[3] - T[1]*T[2];
        return [T[3]/det, -T[1]/det, -T[2]/det, T[0]/det];
    };

    // Linear matrix multiply
    function mul( A, B )
    {
        return [A[0]*B[0] + A[1]*B[2], 
            A[0]*B[1] + A[1]*B[3],

            A[2]*B[0] + A[3]*B[2], 
            A[2]*B[1] + A[3]*B[3]];
    }

    // Rotation matrix
    function trot( ang )
    {
        const c = cos( ang );
        const s = sin( ang );
        return [c, -s, s, c];
    }

    function transAB( M, P )
    {
        return pt(
            addAB( scaleAB( P.x, M[0] ), scaleAB( P.y, M[1] ) ), 
            addAB( scaleAB( P.x, M[2] ), scaleAB( P.y, M[3] ) ) );
    }

    // Affine matrix inverse
    function invAffine( T ) {
        const det = T[0]*T[4] - T[1]*T[3];
        return [T[4]/det, -T[1]/det, (T[1]*T[5]-T[2]*T[4])/det,
            -T[3]/det, T[0]/det, (T[2]*T[3]-T[0]*T[5])/det];
    };

    // Affine matrix multiply
    function mulAffine( A, B )
    {
        return [A[0]*B[0] + A[1]*B[3], 
            A[0]*B[1] + A[1]*B[4],
            A[0]*B[2] + A[1]*B[5] + A[2],

            A[3]*B[0] + A[4]*B[3], 
            A[3]*B[1] + A[4]*B[4],
            A[3]*B[2] + A[4]*B[5] + A[5]];
    }

    // Translation matrix
    function ttransAffine( tx, ty )
    {
        return [1, 0, tx, 0, 1, ty];
    }

    // Matrix * point
    function transAffine( M, P )
    {
        return pt(M[0]*P.x + M[1]*P.y + M[2], M[3]*P.x + M[4]*P.y + M[5]);
    }

    /*
    function drawPolygon( shape, f, s, w )
    {
        if( f != null ) {
            fill( ...f );
        } else {
            noFill();
        }
        if( s != null ) {
            stroke( 0 );
            strokeWeight( w ) ; // / lw_scale );
        } else {
            noStroke();
        }
        beginShape();
        for( let p of shape ) {
            const op = pt( evalAB( p.x ), evalAB( p.y ) );
            vertex( op.x, op.y );
        }
        endShape( CLOSE );
    }
    */

    class Shape
    {
        constructor( pts, quad, label )
        {
            this.pts = pts;
            this.quad = quad;
            this.label = label;
            this.matrix = null;
        }

        getPoints() {
            return this.pts.map(p=>pt(evalAB(p.x), evalAB(p.y)));
        }
        /*
        draw()
        {
            drawPolygon( this.pts, chooseColour( this.label ), [0,0,0], 0.1 );
        }
        */
        accept(visitor) { visitor.shape(this) }

        streamSVG( S, stream )
        {
            var s = '<polygon points="';
            var at_start = true;
            for( let p of this.pts ) {
                const op = pt( evalAB( p.x ), evalAB( p.y ) );
                const sp = transAffine( S, op );
                if( at_start ) {
                    at_start = false;
                } else {
                    s = s + ' ';
                }
                s = s + `${sp.x},${sp.y}`;
            }
            const col = chooseColour( this.label );

            s = s + `" stroke="black" stroke-weight="0.1" fill="rgb(${col[0]}
    ,${col[1]},${col[2]})" />`;
            stream.push( s );
        }

        translateInPlace( dp )
        {
            for( let idx = 0; idx < this.pts.length; ++idx ) {
                this.pts[idx] = padd( this.pts[idx], dp );
            }
            for( let idx = 0; idx < 4; ++idx ) {
                this.quad[idx] = padd( this.quad[idx], dp );
            }
        }

        rotateAndMatch( T, qidx, P )
        {
            // First, construct a copy with all points transformed by the linear
            // operation T.
            const pts = this.pts.map( p => transAB( T, p ) );
            const quad = this.quad.map( p => transAB( T, p ) );
            const ret = new Shape( pts, quad, this.label );
            if( qidx >= 0 ) {
                ret.translateInPlace( psub( P, quad[qidx] ) );
            }
            return ret;
        }
    }

    class Meta
    {
        constructor()
        {
            this.geoms = [];
            this.quad = [];
        }

        addChild( g )
        {
            this.geoms.push( g );
        }

        accept(visitor) {
            for( let g of this.geoms ) {
                g.accept(visitor);
            }
        }

        /*
        draw() 
        {
            for( let g of this.geoms ) {
                g.draw();
            }
        }
        */

        streamSVG( S, stream )
        {
            for( let g of this.geoms ) {
                g.streamSVG( S, stream );
            }
        }

        translateInPlace( dp )
        {
            for( let g of this.geoms ) {
                g.translateInPlace( dp );
            }
            for( let idx = 0; idx < 4; ++idx ) {
                this.quad[idx] = padd( this.quad[idx], dp );
            }
        }

        rotateAndMatch( T, qidx, P )
        {
            const ret = new Meta();
            ret.geoms = this.geoms.map( g => g.rotateAndMatch( T, -1 ) );
            ret.quad = this.quad.map( p => transAB( T, p ) );
            if( qidx >= 0 ) {
                ret.translateInPlace( psub( P, ret.quad[qidx] ) );
            }
            return ret;
        }
    }

    function buildBaseTiles()
    {
        // Schematic description of the edges of a shape in the hat
        // continuum.  Each edge's length is one of 'a' or 'b', and the
        // direction d gives the orientation of d*30 degrees relative to
        // the positive X axis.
        const edges = [
            ['a',0], ['a',2], ['b',11], ['b',1], ['a',4], ['a',2],
            ['b',5], ['b',3], ['a',6], ['a',8], ['a',8], ['a',10], ['b',7] ];
        const hr3 = 0.5*1.7320508075688772;
        const dirs = [pt(1,0), pt(hr3,0.5), pt(0.5,hr3), 
            pt(0,1), pt(-0.5,hr3), pt(-hr3,0.5),
            pt(-1,0), pt(-hr3,-0.5), pt(-0.5,-hr3),
            pt(0,-1), pt(0.5,-hr3), pt(hr3,-0.5)];
            
        let prev = pt(makeAB(0,0),makeAB(0,0));
        const pts = [prev];

        for( let e of edges ) {
            if( e[0] == 'a' ) {
                prev = pt( 
                    addAB( prev.x, makeAB( dirs[e[1]].x, 0 ) ),
                    addAB( prev.y, makeAB( dirs[e[1]].y, 0 ) ) );
            } else {
                prev = pt( 
                    addAB( prev.x, makeAB( 0, dirs[e[1]].x ) ),
                    addAB( prev.y, makeAB( 0, dirs[e[1]].y ) ) );
            }

            pts.push( prev );
        }

        const quad = [pts[1], pts[3], pts[9], pts[13]];
        const ret = {};

        ret['H8'] = new Shape( pts, quad, 'single' );

        const fpts = [];
        const len = pts.length;
        for( let idx = 0; idx < len; ++idx ) {
            const p = pts[len-1-idx];
            fpts.push( pt( p.x, scaleAB( p.y, -1 ) ) );
        }
        const dp = psub( pts[0], fpts[5] );
        for( let idx = 0; idx < len; ++idx ) {
            fpts[idx] = padd( fpts[idx], dp );
        }

        const comp = new Meta();
        comp.addChild( new Shape( pts, quad, 'unflipped' ) );
        comp.addChild( new Shape( fpts, quad , 'flipped' ) );
        comp.quad = quad;
        ret['H7'] = comp;

        return ret;
    }

    function buildSupertiles( sys )
    {
        
        const sing = sys['H8'];
        const comp = sys['H7'];

        const quad = sys['H8'].quad;

        const smeta = new Meta();
        const rules = [
            [PI/3, 2, 0, false],
            [2*PI/3, 2, 0, false],
            [0, 1, 1, true],
            [-2*PI/3, 2, 2, false],
            [-PI/3, 2, 0, false], 
            [0, 2, 0, false] ];

        smeta.addChild( sing );
        for( let r of rules ) {
            if( r[3] ) {
                smeta.addChild( comp.rotateAndMatch( trot( r[0] ), r[1], 
                    smeta.geoms[smeta.geoms.length-1].quad[r[2]] ) );
            } else {
                smeta.addChild( sing.rotateAndMatch( trot( r[0] ), r[1], 
                    smeta.geoms[smeta.geoms.length-1].quad[r[2]] ) );
            }
        }
        
        smeta.quad = [
            smeta.geoms[1].quad[3], smeta.geoms[2].quad[0], 
            smeta.geoms[4].quad[3], smeta.geoms[6].quad[0] ];
        
        const cmeta = new Meta();
        cmeta.geoms = smeta.geoms.slice( 0, smeta.geoms.length - 1 );
        cmeta.quad = smeta.quad;

        return { 'H8' : smeta, 'H7' : cmeta };
    }



    class Model {
        constructor(level = 1) {
            let sys = buildBaseTiles();
            this.pts = sys.H8.pts;
            sys = buildSupertiles( sys )
            for(let i=1; i<level; i++)
                sys = buildSupertiles( sys )
            this.sys = sys;
        }

        getPoints(pts) {
            return pts.map(p=>pt(evalAB(p.x), evalAB(p.y)))
        }

        setAb(v) {
            let alpha = (1+Math.sqrt(3));
	        a = alpha * v;
	        b = alpha * (1 - v);
        }

        getPoint(p) { return pt(evalAB(p.x), evalAB(p.y)) }

    }

    return new Model(level);
}
