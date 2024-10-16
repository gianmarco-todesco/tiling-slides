const slide = {
    name:"pixi-template"    
}

let app;

async function initPixiAndLoadTexture() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'black',
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        // autoStart: false,
        // backgroundColor: 0x333333,
        useBackBuffer:true,
        resolution: window.devicePixelRatio
        
    });
    document.body.appendChild(app.canvas);
    app.stage.eventMode = 'dynamic';
    app.stage.position.set(app.canvas.width/2,app.canvas.height/2);


    buildScene();
}

function setup() {
    initPixiAndLoadTexture();
    document.addEventListener('keydown', (e) => {
        console.log(e);
    })
}


function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    app.destroy();
    app = null;
}

let g1,g2;



const vert = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}`;

const frag = `
in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform float uTime;

void main(void)
{
    vec2 uvs = vTextureCoord.xy;

    float x = 0.3*sin(uTime*0.5);
    vec2 disp = vec2(x,0.0);

    vec4 v1 = texture2D(uTexture, vTextureCoord );

    vec4 v2 = texture2D(uTexture, vTextureCoord + disp);

    vec4 fg = v1.r==v2.r ? vec4(0.0,0.0,0.0,0.0) : vec4(1.0,0.0,0.0,0.0);
    
    // fg = fg + texture2D(uTexture, vTextureCoord + vec2(0.0, sin(uTime)));
    // fg.r = uvs.y + sin(uTime);
    gl_FragColor = fg; // vec4(1.0,0.0,0.0,1.0);
}
`;

let renderTexture;
let background;

async function buildScene() {
    

    const myRenderTexture = PIXI.RenderTexture.create({
        width:2048, 
        height:2048, 
        // autoGenerateMipmaps:true
    });

    let c = new PIXI.Container();
    for(let i=0;i<16;i++) {
        for(let j=0;j<16;j++) {
            let g = new PIXI.Graphics().circle(0,0,50).stroke({color:'white', width:4});
            c.addChild(g);
            g.position.x = 2048*(i+0.5)/16;
            g.position.y = 2048*(j+0.5)/16;
                        
        }
    }
    app.renderer.render({
        target:myRenderTexture, container:c,
        antialias:true
    });

    // myRenderTexture.source.updateMipmaps();


    const texture = await PIXI.Assets.load('https://pixijs.com/assets/bg_grass.jpg');

    background = PIXI.Sprite.from(myRenderTexture);
    background.scale.set(0.25,0.25);
    background.anchor.set(0.5,0.5)
    app.stage.addChild(background);


    const filter = new PIXI.Filter({
        glProgram: new PIXI.GlProgram({
            fragment:frag,
            vertex:vert,
        }),
        resources: {
            timeUniforms: {
                uTime: { value: 0.0, type: 'f32' },
            },
        },
    });

    background.filters = [filter];

    // Animate the filter
    app.ticker.add((ticker) =>
    {
        filter.resources.timeUniforms.uniforms.uTime += 0.04 * ticker.deltaTime;
    });
    
    
}


function buildScenes_old() {
    let r = 200;
    g1 = new PIXI.Graphics().poly([
        {x:-r,y:-r},{x:r,y:-r},{x:r,y:r},{x:-r,y:r}
    ],true).fill('#888888');
    for(let i=0;i<10;i++) {
        let t = i/9;
        let y = (-r + 10) * (1-t) + (r - 10) * t; 
        for(let j=0;j<10; j++) {
            let s = j/9;
            let x = (-r + 10) * (1-s) + (r - 10) * s; 
            g1.circle(x,y,5).fill('#FF8800')
        }
    }
    g2 = new PIXI.Graphics().poly([
        {x:-r,y:-r},{x:r,y:-r},{x:r,y:r},{x:-r,y:r}
    ],true).fill('#777777');
    for(let i=0;i<10;i++) {
        let t = i/9;
        let y = (-r + 10) * (1-t) + (r - 10) * t; 
        for(let j=0;j<10; j++) {
            let s = j/9;
            let x = (-r + 10) * (1-s) + (r - 10) * s; 
            g2.circle(x,y,5).fill('#0077FF')
        }
    }
    app.stage.addChild(g1);
    app.stage.addChild(g2);

    PIXI.Ticker.shared.add((ticker)=>{
        g2.position.x = Math.cos(performance.now()*0.001) * 100;
    });

/*
    class InvertFilter extends PIXI.Filter {
        constructor() {
            super({fragment:"void main(void) { gl_FragColor = vec4(1.0,0.0,0.0,1.0);}"});
        }
    }

    let filter = new InvertFilter();
        
    g2.filters = [filter];
*/
    
    g2.blendMode = 'add';
}