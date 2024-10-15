class Act {
    constructor() {
        this.model = null;
    }
    start() {}
    end() {}
    forward() { return false; }
    backward() { return false; }
    tick() {}
    onkeydown(e) {}
    onclick(x,y,e) {}
    ondrag(dx,dy,e,startPos) {}
    onclick(e) {}  
    onrelease(e) {}  
}

class Director {
    constructor(model) {
        this.model = model; 
        this.acts = []
        document.addEventListener('keydown', (e) => {
            console.log(e);
            if(e.key == "x") { director.forward(); }
            else if(e.key == 'z')  { director.backward(); }
            else if(e.key == 'd') { director.startAct(director.currentActIndex+1); }
            else if(director.currentAct) 
                director.currentAct.onkeydown(e);
        })

        PIXI.Ticker.shared.add((ticker)=>{
            if(director.currentAct) 
                director.currentAct.tick(ticker.elapsedMS * 0.001);
        });

    }

    addAct(act) {
        this.acts.push(act);
        act.model = this.model;
        if(!this.currentAct) this.startAct(0);
    }

    startAct(actIndex) {
        if(0<=actIndex && actIndex<this.acts.length) {
            if(this.currentAct) this.currentAct.end();
            this.currentActIndex = actIndex;
            this.currentAct = this.acts[actIndex];
            this.currentAct.start();
        }
    }
    forward() {
        if(this.currentAct) {
            if(this.currentAct.forward()) return;
        }
        this.startAct(this.currentActIndex+1);
    }

    backward() {
        if(this.currentAct) {
            if(this.currentAct.backward()) return;
        }
        this.startAct(this.currentActIndex-1);
    }

    enablePointer() {
        let oldx, oldy;
        let startPos = new PIXI.Point();
        const director = this;

        function onClick(e) {
            startPos.x = oldx = e.clientX;
            startPos.y = oldy = e.clientY;
            document.addEventListener('pointermove', onDrag);
            document.addEventListener('pointerup', onDragEnd);
            document.addEventListener('pointerleave', onDragEnd);
            document.addEventListener('pointerout', onDragEnd);
            if(director.currentAct) director.currentAct.onclick(oldx,oldy,e);
        }
        
        function onDrag(e) {
            let dx = e.clientX - oldx; oldx = e.clientX;
            let dy = e.clientY - oldy; oldy = e.clientY;
            if(director.currentAct) director.currentAct.ondrag(dx,dy,e,startPos);
        }
        function onDragEnd(e) {
            document.removeEventListener('pointermove', onDrag);
            document.removeEventListener('pointerup', onDragEnd);
            document.removeEventListener('pointerleave', onDragEnd);
            document.removeEventListener('pointerout', onDragEnd);            
            if(director.currentAct) director.currentAct.onrelease(e);
        }
        document.addEventListener('pointerdown', onClick);
    }
    
}
