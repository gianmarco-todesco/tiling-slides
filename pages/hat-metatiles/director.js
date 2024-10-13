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
    
}
