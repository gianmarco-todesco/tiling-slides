const slide = {
    name:"playground"    
}

let mainLayer, textLayer;

function setup() {
    console.log("setup playground")
    paper.setup('myCanvas');
    with(paper) {
        const size = 100;
		var path = new Path.Rectangle([-size/2, -size/2], [size, size]);
		path.strokeColor = new Color(0.7,0.9,0.9);
        path.strokeWidth = 5;
        path.fillColor = new Color(0.85,0.95,0.98);
        path.applyMatrix = false;
        let symbol = new Symbol(path);
        let items = [];
        mainLayer = project.activeLayer;

        function placeSymbols() {
            mainLayer.activate();
            items.forEach(item=>item.remove());
            items.length = 0;
            let width = view.viewSize.width;
            let height = view.viewSize.height;
            
            let y = -size*1.5;
            while(y-size * 1.5 < height) {
                let x = -size*1.5;
                while(x-size*1.5 < width) {
                    let p = symbol.place(new Point(x,y));
                    items.push(p);
                    x += size;
                }
                y += size;
            }
        }
        placeSymbols();

        view.onResize = placeSymbols;
		view.onFrame = function(event) {
			// On each frame, rotate the path by 3 degrees:
			path.rotation += 0.125;//(1);
            let phi = path.rotation/90;
            phi -= Math.floor(phi);
            if(phi>0.5) phi = 1.0-phi;
            let s = Math.cos(phi*Math.PI/2);
            path.scaling = s;
		}

    }
}

function cleanup() {
    console.log("cleanup playground")
    paper.clear();
}
