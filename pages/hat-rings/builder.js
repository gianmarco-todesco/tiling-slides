"use strict";

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


class Edge {
    constructor(cell, index) {
        this.cell = cell;
        this.next = null;
        this.prev = null;
        this.adj = null;
        this.index = index;
    }
    setNext(next) {
        if(this.next) throw "Internal error";
        if(next.prev) throw "Internal error";
        this.next = next;
        next.prev = this;
    }
    setAdj(adj) {
        if(this.adj) throw "Internal error";
        if(adj.adj) throw "Internal error";
        this.adj = adj;
        adj.adj = this;
    }
}


class Cell {
    constructor(pts, index) {
        this.pts = pts;
        this.center = pts.reduce((a,b)=>a.add(b)).multiplyScalar(1/pts.length);
        this.edges = [0,1,2,3].map(i=>new Edge(this,i));
        for(let i=0;i<this.edges.length;i++) {
            this.edges[i].setNext(this.edges[(i+1)%this.edges.length]);
        }
        this.index = index;
        this.vCompleted = [false,false,false,false];
        this.empty = true;
        this.layer = 0;
    }
    link(edge,other,otherEdge) {
        this.edges[edge].setAdj(other.edges[otherEdge]);
    }
    closeVertex(vIndex) {
        let e0 = this.edges[vIndex];
        let count = 1;
        while(e0.adj) {
            e0 = e0.adj;
            if(e0.cell == this) {
                this.vCompleted[vIndex] = true;
                return;
            }
            e0 = e0.next;
            count++;
        }
        let e1 = this.edges[vIndex].prev;
        while(e1.adj) {
            e1 = e1.adj;
            if(e1.cell == this) throw "Internal error";
            e1 = e1.prev;
            count++;
        }
        const cc = [6,4,3,4];
        if(count<cc[vIndex]) return;
        if(count != cc[vIndex]) throw "Internal error";
        e0.adj = e1;
        e1.adj = e0;   
        this.vCompleted[vIndex] = true;     
        let edge = this.edges[vIndex];
        for(let i=0; i<6; i++) {
            edge = edge.adj;
            if(edge==null) throw "Internal error";
            if(edge.cell == this) break;
            edge = edge.next;        
            edge.cell.vCompleted[edge.index] = true;
        }
    }

    getVertexCells(vIndex, ccw = true) {
        let edge = this.edges[vIndex];
        let cells = [];
        if(ccw) {
            while(edge.adj) {
                edge = edge.adj;
                let other = edge.cell;
                if(other == this) break;
                cells.push(other);
                edge = edge.next;
            }
        } else {
            edge = edge.prev;
            while(edge.adj) {
                edge = edge.adj;
                let other = edge.cell;
                if(other == this) break;
                cells.push(other);
                edge = edge.prev;
            }
        }
        return cells;
    }

    getEdgeCell(edgeIndex) {
        return this.edges[edgeIndex].adj?.cell;
    }

    
    createGraphics(color = 'white') {
        const pts = this.pts;
        if(this.g) this.g.destroy();
        let g = this.g = new PIXI.Graphics();
        g.moveTo(pts[0].x,pts[0].y);
        pts.slice(1).forEach(p=>g.lineTo(p.x,p.y));
        g.closePath();
        g.fill(color);
        g.stroke({color:'gray', width:1.5})
        
        app.stage.addChild(g);
        let center = pts.reduce((a,b)=>a.add(b)).multiplyScalar(1/pts.length);
        /*
        const text = new PIXI.Text({
            text: this.index,
            style: {
                fontFamily: 'Arial',
                fontSize: 8,
                fill: 'gray',
                align: 'center',

            }
        });
        app.stage.addChild(text);
        this.text = text;
        text.position.set(center.x, center.y);
        */
    } 
}

class Board {
    constructor(n=25) {
        this.cells = [];
        this.unit = 20;
        this.buildFirstCell();
        for(let i=0; i<n; i++) 
            this.addRing(this.cells.map(p=>p));
        this.computeAllPlacements();
    }
    
    buildFirstCell() {
        let unit = this.unit;
        const sqrt3_2 = Math.sqrt(3)/2;
        let x = unit * sqrt3_2 * Math.cos(Math.PI/6);
        let y = unit * sqrt3_2 * Math.sin(Math.PI/6);   
        let cell = new Cell([
            new PIXI.Point(0,0),
            new PIXI.Point(x,y),
            new PIXI.Point(unit,0),
            new PIXI.Point(x,-y)               
        ], 0);
        this.cells.push(cell);
        return cell;
    }

    
    createAdjacentCell(cell, edge) {
        if(cell.edges[edge].adj != null) throw "Internal Error";
        let matrix;
        let otherEdge;
        if(edge == 0) {
            matrix = getFourPointsTransform(
                cell.pts[0], cell.pts[1], 
                cell.pts[0], cell.pts[3]
            );
            otherEdge = 3;
        } else if(edge == 1) {
            matrix = getFourPointsTransform(
                cell.pts[1], cell.pts[2], 
                cell.pts[3], cell.pts[2]
            );
            otherEdge = 2;
        } else if(edge == 2) {
            matrix = getFourPointsTransform(
                cell.pts[2], cell.pts[3], 
                cell.pts[2], cell.pts[1]
            );
            otherEdge = 1;
        } else if(edge == 3) {
            matrix = getFourPointsTransform(
                cell.pts[3], cell.pts[0], 
                cell.pts[1], cell.pts[0]
            );
            otherEdge = 0;
        }        
        let other = new Cell(
            cell.pts.map(p=>matrix.apply(p)), 
            this.cells.length);
        this.cells.push(other);
        cell.link(edge,other,otherEdge);

        for(let i=0; i<4; i++) cell.closeVertex((edge+i)%4);
        for(let i=0; i<4; i++) other.closeVertex((otherEdge+i)%4);
        
        return other;
    }

    
    completeVertex(cell, vIndex) {
        if(cell.vCompleted[vIndex]) return;
        for(;;) {
            let edge = cell.edges[vIndex];
            while(edge.adj) {
                edge = edge.adj;
                if(edge.cell == cell) throw "Internal error";
                edge = edge.next;
            }
            let other = edge.cell;
            let newCell = this.createAdjacentCell(other, edge.index);
            if(cell.vCompleted[vIndex]) break;    
        }
    }

    
    completeVertices(lst) {
        let todo = [];
        lst.forEach(cell=>{
            for(let i=0; i<4; i++) {
                if(!cell.vCompleted[i]) todo.push([cell,i]);
            }
        })
        todo.forEach(([cell,i])=>this.completeVertex(cell,i));
    }

    
    addRing(lst) {
        let todo = [];
        lst.forEach(cell=>{
            cell.edges.forEach(edge=>{
                if(!edge.adj) todo.push(edge);
            })
        })
        todo.forEach(edge=>{
            if(edge.adj) return;
            let other = this.createAdjacentCell(edge.cell, edge.index);
            // other.createGraphics(color);
        })
        this.completeVertices(lst);
    }

    computePlacement(cell, lst, flipped) {
        if(lst.indexOf(cell.index)<0) throw "cell not in lst";
        lst = lst.map(x=>x);
        let children = [];
        let items = [{cell, children}];
    
        while(items.length>0 && lst.length>0) {
            let itm = items.pop();
            let {cell, children} = itm;
            for(let i=0; i<4; i++) {
                let other = cell.getEdgeCell(i);
                let j = lst.indexOf(other.index);
                if(j<0) continue;
                lst.splice(j,1);
                let grandChildren = [];
                children.push({edge:i, children:grandChildren})
                items.push({cell:other, children:grandChildren});
            }
        }
        return {flipped, children, sourceIndex:cell.index};
    }

    computeAllPlacements() {
        let placements = this.placements = [];
        let ii = [1,0,4,7,8,2,3,12];
        for(let i of [1,7,4,3,12,2,8]) {
            placements.push(this.computePlacement(this.cells[i], ii, false));
        }
        ii = [1,8,0,2,3,9,11,22];
        for(let i of [1,0,9,3,11,22,8]) {
            placements.push(this.computePlacement(this.cells[i], ii, true));
        }  
    }

    getPlacementCells(cellIndex, placementIndex) {
        let lst = [];
        function f(cell, children) {
            lst.push(cell);
            for(let child of children) {
                let other = cell.getEdgeCell(child.edge);
                f(other, child.children);
            }
        }
        f(this.cells[cellIndex], this.placements[placementIndex].children);
        return lst.slice(1);
    }


}


class Painter {
    constructor(board) {
        this.board = board;

        this.tb = {}
    }

    placeHat(flipped, color, targetCell, sourceCell) {
        let matrix = getFourPointsTransform(
            this.board.cells[sourceCell].pts[0],
            this.board.cells[sourceCell].pts[2],
            this.board.cells[targetCell].pts[0],
            this.board.cells[targetCell].pts[2]
        );
        let key = (flipped ? "-":"+") + color;
        let hatShape = this.tb[key];
        if(!hatShape) {
            hatShape = this.tb[key] = this.makeHatShape(flipped, color);
        }
        let g = new PIXI.Graphics(hatShape);        
        g.setFromMatrix(matrix);
        app.stage.addChild(g);
        return g;
    }


    makeHatShape(flipped, color) {
        let g = new PIXI.GraphicsContext();
        const cells = this.board.cells;
        let pts = (flipped 
            ? [[0,0],[1,3],[1,2],[8,1],[8,0],[22,3],
                [22,2],[22,1],[11,2],[11,1],[3,0],[9,3],[9,2],
                [9,1]]
            : [[0,0],[1,3],[1,2],[8,1],[8,0],[2,3],
                [12,2],[12,1],[12,0],[3,3],[4,2],[4,1],
                [7,2],[7,1]]
            ).map(([cellIndex,vIndex])=>cells[cellIndex].pts[vIndex])
        g.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p=>g.lineTo(p.x,p.y))
        g.closePath();
        g.fill(color);
        g.stroke({color:'black', width:3})
        return g;
    }
}

/*
function foo(cell, lst) {
    lst = lst.map(x=>x);

    let children = [];
    let items = [{cell, children}];

    while(items.length>0 && lst.length>0) {
        let itm = items.pop();
        let {cell, children} = itm;
        for(let i=0; i<4; i++) {
            let other = cell.getEdgeCell(i);
            let j = lst.indexOf(other.index);
            if(j<0) continue;
            lst.splice(j,1);
            let grandChildren = [];
            children.push({edge:i, children:grandChildren})
            items.push({cell:other, children:grandChildren});
        }
    }
    return children;
}

function uffi(cell, children) {    
    function f(cell, children) {
        putDot(cell);
        for(let child of children) {
            let other = cell.getEdgeCell(child.edge);
            f(other, child.children);
        }
    }
    f(cell, children);
}



*/
function putDot(cell) {
    let dot = new PIXI.Graphics().circle(0,0,3).fill('red').stroke('black');
    dot.position.set(cell.center.x, cell.center.y);
    app.stage.addChild(dot);
}


class Explorer {
    constructor(board) {
        this.board = board;
        this.stack = [];
    }

    addTile(cellIndex, placementIndex, layer) {
        let cc = this.board.getPlacementCells(cellIndex, placementIndex);
        if(cc.findIndex(c=>!c.empty)>=0) 
            throw "tile collision"
        cc.forEach(c=>{
            c.empty = false;
            c.layer = layer;
        });
        const pl = this.board.placements[placementIndex];
        this.stack.push({
            lst:cc.map(c=>c.index),
            targetIndex:cellIndex,
            sourceIndex:pl.sourceIndex,
            placementIndex,
            flipped:pl.flipped,
            layer
        })
    }

    placeFirst() {
        const pl = this.board.placements[0];
        this.addTile(pl.sourceIndex, 0, 1);
    }

    getBoundary() {
        let boundary = [];
        let lst = this.board.cells.filter(c=>!c.empty);
        let tb = {};
        lst.forEach(cell => tb[cell.index] = cell.layer);
        lst.forEach(cell => {
            let nextLayer = cell.layer + 1;
            for(let i=0; i<4; i++) {
                let others = cell.getVertexCells(i);

                for(let other of others) {
                    if(tb[other.index]===undefined) {
                        boundary.push(other);
                        tb[other.index] = nextLayer;
                    } else {
                        if(tb[other.index] > nextLayer) tb[other.index] = nextLayer;
                    }
                }
            }
        })
        return boundary.map(cell=>({cell, layer:tb[cell.index]}));
    }

    // return { index, cells } oppure null
    findPlacement(cellIndex, startPlacementIndex = 0) {
        for(let i=startPlacementIndex; i<this.board.placements.length; i++) {
            let lst = this.board.getPlacementCells(cellIndex, i);
            if(lst.findIndex(c=>!c.empty)<0) {
                return {index:i, cells:lst}
            }
        }
        return null;
    }
    step() {
        let b = this.getBoundary();
        let cellIndex = b[0].cell.index;
        let v = this.findPlacement(cellIndex);
        if(v == null) return this.backtrack();
        this.addTile(cellIndex, v.index, 2)
    }

    backtrack() {
        let t = this.stack.pop();
        t.lst.forEach(i=>{
            this.board.cells[i].empty = true;
        });
        let cellIndex = t.targetIndex;
        let v = this.findPlacement(cellIndex, t.placementIndex+1);
        if(v == null) return this.backtrack();
        this.addTile(cellIndex, v.index, 2)
    }
    showTiles(painter) {
        if(this.gg) this.gg.forEach(g=>g.destroy());
        let gg = [];
        for(let i=0; i<this.stack.length; i++) {
            let t = this.stack[i];
            let cells = this.board.cells;
            let g = painter.placeHat(t.flipped, t.flipped ? 'cyan' : 'orange', t.targetIndex, t.sourceIndex);
            gg.push(g);
        }
        this.gg = gg;
    }
}
