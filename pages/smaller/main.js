
const slide = {
    name:"smaller"    
}

async function setup() {
    console.log("qui")

    const app = new PIXI.Application();
    await app.init({ background: '#1099bb', resizeTo: window });

    document.body.appendChild(app.canvas);

    let fullTexture = await PIXI.Assets.load('smaller_and_smaller.png');

    window.t = fullTexture;
    let texture1 = new PIXI.Texture({
        source:fullTexture, 
        frame:new PIXI.Rectangle(440,440,400,400)});

        let container
        
    let sprite = new PIXI.Sprite(fullTexture);
    app.stage.addChild(sprite);

    let sprite2 = new PIXI.Sprite(texture1);
    app.stage.addChild(sprite2);
    
    window.sprite2 = sprite2;

    // Add a ticker callback to move the sprite back and forth
    let elapsed = 0.0;
    app.ticker.add((ticker) => {
    elapsed += ticker.deltaTime;
    //sprite2.x = 100.0 + Math.cos(elapsed/50.0) * 100.0;
    // sprite2.y = 50; 
    });

}

function cleanup() {

}
