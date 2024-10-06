const slide = {
    name:"horses"    
}
const HORSES_URL = '/images/horses.png';

let app, horsesTexture;
let currentStatus = 0;
let currentT = 0;


function smoothStep(t, t0, t1) {
    if(t<t0) return 0;
    else if(t>t1) return 1;
    else return (1-Math.cos(Math.PI*(t-t0)/(t1-t0)))*0.5;
}

async function initPixiAndLoadTexture() {
    app = new PIXI.Application();
    await app.init({ 
        backgroundColor: 'gray',
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        // autoStart: false,
        // backgroundColor: 0x333333,
        resolution: window.devicePixelRatio
        
    });
    document.body.appendChild(app.canvas);
    app.stage.eventMode = 'dynamic';
    app.stage.position.set(app.canvas.width/2,app.canvas.height/2);

    horsesTexture = await PIXI.Assets.load(HORSES_URL);
    

    // app.stage.addChild(mesh1);

    /*
    const horses = PIXI.Sprite.from(horsesTexture);
    horses.anchor.set(0.5);
    window.horses = horses;
    app.stage.addChild(horses);
    */
    blackHorseMeshGeometry = new MeshGeometry(blackPts);
    whiteHorseMeshGeometry = new MeshGeometry(whitePts);

    /*
    let mesh1 = blackHorseMeshGeometry.createMesh();
    app.stage.addChild(mesh1);
    let mesh2 = whiteHorseMeshGeometry.createMesh();
    app.stage.addChild(mesh2);
    */

    let curMesh;

    const d1 = new PIXI.Point(276.8955574951815, -1.831314061311275);
    const d2 = new PIXI.Point(2.3027298260553977, 348.1738454461723);
    for(let i=-5; i<=5; i++) {
        for(let j=-5; j<=5; j++) {
            let d = d1.multiplyScalar(j).add(d2.multiplyScalar(i));
            let tr = new PIXI.Matrix().translate(d.x,d.y);
            let mesh;
            mesh = blackHorseMeshGeometry.createMesh();
            mesh.setFromMatrix(tr);
            if(i==0 && j==0)
                curMesh = mesh;
            else
                app.stage.addChild(mesh);
            
            mesh = whiteHorseMeshGeometry.createMesh();
            mesh.setFromMatrix(tr);
            app.stage.addChild(mesh);            
        }
    }

    /*
    let g = window.g = new PIXI.Graphics();
    g.moveTo(quadPts[0].x, quadPts[0].y);
    quadPts.slice(1).forEach(p=>g.lineTo(p.x,p.y));
    g.closePath();
    g.stroke({color:'magenta', width:2})
    app.stage.addChild(g);
    */

    app.stage.addChild(curMesh);
    //curMesh.position.x += 50;
    //curMesh.alpha = 0.5
    window.mesh = curMesh

    PIXI.Ticker.shared.add((t) => {
        if(currentStatus == 0 && currentT > 0.0) {
            currentT = Math.max(0.0, currentT - 0.0005 * t.elapsedMS);
        } else if(currentStatus == 1 && currentT < 1.0) {
            currentT = Math.min(1.0, currentT + 0.0005 * t.elapsedMS);
        } else return;

        let t0 = smoothStep(currentT,0,1/3);
        let t1 = smoothStep(currentT,1/3,2/3);
        let t2 = smoothStep(currentT,2/3,1);
        curMesh.setFromMatrix(getGlideMatrix(t0,t1));
        curMesh.alpha = 1-t2;
    
    })
}


function setup() {
    initPixiAndLoadTexture().then(()=>console.log("qui"));
    document.addEventListener('keydown', (e) => {
        if(e.key == '1') currentStatus = 1;
        else if(e.key == '0') currentStatus = 0;
    })
}

function cleanup() {
    document.body.querySelectorAll('canvas').forEach(e=>e.remove());
    app.stage.removeChildren();
    PIXI.Assets.unload(HORSES_URL);
    app.destroy();
    app = null;
}


let blackPts = JSON.parse('[{"x":-158.8168125365792,"y":82.6201813197511},{"x":-145.61374627767287,"y":80.70052714050426},{"x":-131.62744579804732,"y":79.78775242809931},{"x":-117.0674161338514,"y":80.84460273130944},{"x":-111.6568950978915,"y":71.96524688677033},{"x":-105.13619379868935,"y":64.09119685664116},{"x":-102.05060336193407,"y":55.57239491379241},{"x":-105.09261977756879,"y":48.15823471266847},{"x":-111.77992267813845,"y":38.500522900931564},{"x":-116.33020171103936,"y":30.244439328168866},{"x":-120.39216718343613,"y":22.50635219487624},{"x":-121.8241564036689,"y":13.762563595419763},{"x":-119.2848776601595,"y":2.452122699647358},{"x":-113.87146588423398,"y":-4.5607053670878095},{"x":-118.17758813688285,"y":-12.065662335100814},{"x":-121.49944844650194,"y":-20.185777848395254},{"x":-118.30061571712976,"y":-23.507646383231098},{"x":-111.90295025838536,"y":-28.305895426742367},{"x":-105.87437580059263,"y":-33.2271803094153},{"x":-101.31336434864721,"y":-40.44449245747374},{"x":-97.87729397716217,"y":-52.54321645272746},{"x":-97.13910371504801,"y":-61.03243122329612},{"x":-99.59974618230602,"y":-69.89074112103364},{"x":-102.42947965051573,"y":-76.16537686837842},{"x":-107.47380042548959,"y":-83.7933655454477},{"x":-113.87146588423397,"y":-88.59161613774849},{"x":-121.45788128193868,"y":-91.72143832774614},{"x":-115.23611429662478,"y":-95.69460454809345},{"x":-107.19758275016333,"y":-95.80040099094991},{"x":-97.46324709776218,"y":-91.72967918702052},{"x":-94.4544497409441,"y":-111.02136387939927},{"x":-90.02975333749822,"y":-126.24232676784864},{"x":-81.35734791143489,"y":-125.18039946989677},{"x":-73.74686082897544,"y":-121.46365244172345},{"x":-64.36649993823126,"y":-113.67618658030435},{"x":-52.86229047754529,"y":-72.26100710676371},{"x":-50.91542334706506,"y":-51.376429982115354},{"x":-42.95097338568263,"y":-33.14667555837207},{"x":-44.89784051616286,"y":-29.429934471565957},{"x":-69.45312573741228,"y":-32.69721333662284},{"x":-74.09775947211182,"y":-28.006339130566502},{"x":-76.41213173601307,"y":-16.581600416136},{"x":-71.65070269636914,"y":1.731601673161265},{"x":-70.55191421689071,"y":13.818311363526377},{"x":-69.45312573741228,"y":25.90502105389149},{"x":-57.73266610869291,"y":44.218210847951866},{"x":-49.30859650888348,"y":34.69534699104095},{"x":-40.5182517873439,"y":32.13150115758671},{"x":-32.094194482771854,"y":18.21347740591031},{"x":-42.715853336775524,"y":11.254459382453689},{"x":-49.67342962137815,"y":5.267384852380886},{"x":-52.85921435902469,"y":-1.4581477697191474},{"x":-51.08934055073992,"y":-7.475742723041449},{"x":-45.425720598760705,"y":-8.537667050309693},{"x":-31.361668829786197,"y":-5.959941974819884},{"x":-18.176157895095514,"y":14.18457417578864},{"x":-19.82434676193185,"y":28.651992145858387},{"x":-23.670112587725043,"y":41.28809605461689},{"x":-35.390572216444525,"y":56.30492053831699},{"x":-54.07003784376474,"y":76.8156995011878},{"x":-35.02429709471431,"y":79.01327637476129},{"x":-17.80990736384007,"y":80.11207710678497},{"x":-14.69665489579512,"y":64.1795894448108},{"x":-7.5544990410918444,"y":49.34590251486031},{"x":2.334609569451402,"y":23.707431885081064},{"x":19.549023890800413,"y":6.493030527807463},{"x":30.306687970561605,"y":-2.606615516062689},{"x":41.361198716296855,"y":-12.470197511191373},{"x":56.985402059024516,"y":-19.71871962128209},{"x":73.38984381380413,"y":-22.075554895306723},{"x":87.43686112715972,"y":-20.9313892531038},{"x":99.83303871122092,"y":-16.619677519496175},{"x":110.20809419006761,"y":-11.499520118534946},{"x":120.98735780656236,"y":-5.031954779706105},{"x":134.55589567618944,"y":2.097864485423486},{"x":135.17603780377658,"y":14.602851739238275},{"x":134.38028081342367,"y":29.231693588956787},{"x":133.09084437021818,"y":48.613376890335815},{"x":124.66678706564625,"y":64.36272699856036},{"x":118.07874495860233,"y":80.78886725843982},{"x":111.80496960373176,"y":76.89834325380117},{"x":103.76574190315297,"y":76.89888086285161},{"x":94.08610080428807,"y":81.0980015798303},{"x":90.82239760469784,"y":61.847801548933475},{"x":86.19676222203634,"y":46.686695163814676},{"x":77.5391614496341,"y":47.863238544165824},{"x":69.97850114169219,"y":51.68032353295358},{"x":60.70196481514962,"y":59.5911811834051},{"x":49.74655588213774,"y":101.15490263915785},{"x":48.07609712969288,"y":122.06340380149635},{"x":40.35346690364223,"y":140.3969084290639},{"x":42.34932466058307,"y":144.08757337513475},{"x":66.85924585765271,"y":140.49579019788223},{"x":71.56551897498323,"y":145.12481997653407},{"x":74.0308025764313,"y":156.51794730985893},{"x":69.51201682783456,"y":174.89252628792764},{"x":68.57319408568306,"y":186.99271220057457},{"x":67.63437134353153,"y":199.0928981132215},{"x":56.15716361349311,"y":217.55951115035597},{"x":47.60787304273112,"y":208.14890461324194},{"x":38.78438557870774,"y":205.70155201227863},{"x":30.176972992309004,"y":191.8961699027372},{"x":40.705656485325655,"y":184.79726910292973},{"x":47.58343373248793,"y":178.718691199906},{"x":50.679981879716756,"y":171.95160888790127},{"x":48.83066881376046,"y":165.957950280374},{"x":43.15349835109997,"y":164.971030944665},{"x":29.12477218763155,"y":167.73455423127226},{"x":16.20686407093255,"y":188.0517114989487},{"x":18.04626774554363,"y":202.4960634533732},{"x":22.05883354168811,"y":215.08019443295984},{"x":33.97689380542422,"y":229.94067999140148},{"x":52.92601924788426,"y":250.2025933944317},{"x":33.91101171878281,"y":252.65189400144578},{"x":16.712661608286147,"y":253.97829150291508},{"x":13.388944174919818,"y":238.0883762592178},{"x":6.0512095197924705,"y":223.3504554995041},{"x":-4.176151308272216,"y":197.84502988380927},{"x":-21.6167527722508,"y":180.8598276450652},{"x":-32.4938358252989,"y":171.90326810281908},{"x":-43.67784407553201,"y":162.18676579690054},{"x":-59.396556052435876,"y":155.14553744791803},{"x":-75.83073636823836,"y":153.00588814428582},{"x":-89.86139110353099,"y":154.33575209128176},{"x":-102.19945373029488,"y":158.81104955484363},{"x":-112.50587783357412,"y":164.0679887977025},{"x":-123.19865269403829,"y":170.67756452609333},{"x":-136.67169824237652,"y":177.9862296795478},{"x":-137.12638399163467,"y":190.4983255609699},{"x":-136.1372024870795,"y":205.11536229906486},{"x":-134.59151939085143,"y":224.47829486885024},{"x":-125.95988404662307,"y":240.11484313201922},{"x":-119.15515145588328,"y":256.45240711842615},{"x":-132.38245378192545,"y":254.70755641408195},{"x":-146.3796039249958,"y":253.97985685085212},{"x":-160.9243810438802,"y":255.22919865661925},{"x":-166.45187506189117,"y":246.42218395381738},{"x":-173.0761551530154,"y":238.63507135769237},{"x":-176.2741529469439,"y":230.15782740727383},{"x":-173.33046894832106,"y":222.7040793650354},{"x":-166.77149256859263,"y":212.95876016181302},{"x":-162.33081392465465,"y":204.64321277039178},{"x":-158.37155464045563,"y":196.8520753757711},{"x":-157.0553438459831,"y":188.09011090749337},{"x":-159.74400244738428,"y":176.81424620809622},{"x":-165.24969858921799,"y":169.87363423629466},{"x":-161.0432202956415,"y":162.31237717730278},{"x":-157.82905447894893,"y":154.1490341140307},{"x":-161.0715453768555,"y":150.86976679186435},{"x":-167.53211709994986,"y":146.15655873192028},{"x":-173.6252574917532,"y":141.3154436686987},{"x":-178.28133256595572,"y":134.15909089576476},{"x":-181.87713088097786,"y":122.10687382217995},{"x":-182.72754250253524,"y":113.62816564476039},{"x":-180.3842832077384,"y":104.73808400996218},{"x":-177.63779121814267,"y":98.42656858068138},{"x":-172.69480630649522,"y":90.73252650245256},{"x":-166.3611664575915,"y":85.850074420465}]')
let whitePts = JSON.parse('[{"x":157.7404060392982,"y":254.6210930571149},{"x":144.5131037132561,"y":252.8762423527707},{"x":130.51595357018573,"y":252.14854278954087},{"x":115.97117645130132,"y":253.39788459530797},{"x":110.44368243329035,"y":244.5908698925061},{"x":103.8194023421661,"y":236.8037572963811},{"x":100.62140454823763,"y":228.32651334596255},{"x":103.56508854686047,"y":220.87276530372412},{"x":110.12406492658889,"y":211.12744610050174},{"x":114.5647435705269,"y":202.8118987090805},{"x":118.5240028547259,"y":195.02076131445983},{"x":119.84021364919846,"y":186.2587968461821},{"x":117.15155504779723,"y":174.98293214678495},{"x":111.64585890596355,"y":168.0423201749834},{"x":115.85233719954002,"y":160.4810631159915},{"x":119.06650301623262,"y":152.3177200527194},{"x":115.824012118326,"y":149.03845273055308},{"x":109.36344039523166,"y":144.32524467060898},{"x":103.27030000342835,"y":139.48412960738742},{"x":98.61422492922584,"y":132.32777683445346},{"x":95.01842661420369,"y":120.27555976086866},{"x":94.16801499264632,"y":111.7968515834491},{"x":96.51127428744316,"y":102.90676994865089},{"x":99.25776627703887,"y":96.59525451937009},{"x":104.20075118868633,"y":88.90121244114125},{"x":110.53439103759004,"y":84.0187603591537},{"x":118.07874495860234,"y":80.78886725843981},{"x":111.80496960373176,"y":76.89834325380117},{"x":103.76574190315297,"y":76.89888086285161},{"x":94.08610080428807,"y":81.0980015798303},{"x":90.82239760469784,"y":61.847801548933475},{"x":86.19676222203634,"y":46.686695163814676},{"x":77.5391614496341,"y":47.863238544165824},{"x":69.97850114169219,"y":51.68032353295358},{"x":60.70196481514962,"y":59.5911811834051},{"x":49.74655588213774,"y":101.15490263915785},{"x":48.07609712969288,"y":122.06340380149635},{"x":40.35346690364223,"y":140.3969084290639},{"x":42.34932466058307,"y":144.08757337513475},{"x":66.85924585765271,"y":140.49579019788223},{"x":71.56551897498323,"y":145.12481997653407},{"x":74.0308025764313,"y":156.51794730985893},{"x":69.51201682783456,"y":174.89252628792764},{"x":68.57319408568306,"y":186.99271220057457},{"x":67.63437134353153,"y":199.0928981132215},{"x":56.15716361349311,"y":217.55951115035597},{"x":47.60787304273112,"y":208.14890461324194},{"x":38.78438557870774,"y":205.70155201227863},{"x":30.176972992309004,"y":191.8961699027372},{"x":40.705656485325655,"y":184.79726910292973},{"x":47.58343373248793,"y":178.718691199906},{"x":50.679981879716756,"y":171.95160888790127},{"x":48.83066881376046,"y":165.957950280374},{"x":43.15349835109997,"y":164.971030944665},{"x":29.12477218763155,"y":167.73455423127226},{"x":16.20686407093255,"y":188.0517114989487},{"x":18.04626774554363,"y":202.4960634533732},{"x":22.05883354168811,"y":215.08019443295984},{"x":33.97689380542422,"y":229.94067999140148},{"x":52.92601924788426,"y":250.2025933944317},{"x":33.91101171878281,"y":252.65189400144578},{"x":16.712661608286147,"y":253.97829150291508},{"x":13.388944174919818,"y":238.0883762592178},{"x":6.0512095197924705,"y":223.3504554995041},{"x":-4.176151308272216,"y":197.84502988380927},{"x":-21.6167527722508,"y":180.8598276450652},{"x":-32.4938358252989,"y":171.90326810281908},{"x":-43.67784407553201,"y":162.18676579690054},{"x":-59.396556052435876,"y":155.14553744791803},{"x":-75.83073636823836,"y":153.00588814428582},{"x":-89.86139110353099,"y":154.33575209128176},{"x":-102.19945373029488,"y":158.81104955484363},{"x":-112.50587783357412,"y":164.0679887977025},{"x":-123.19865269403829,"y":170.67756452609333},{"x":-136.67169824237652,"y":177.9862296795478},{"x":-137.12638399163467,"y":190.4983255609699},{"x":-136.1372024870795,"y":205.11536229906486},{"x":-134.59151939085143,"y":224.47829486885024},{"x":-125.95988404662307,"y":240.11484313201922},{"x":-119.1551514558833,"y":256.45240711842615},{"x":-112.93338447056941,"y":252.4792408980788},{"x":-104.89485292410797,"y":252.37344445522234},{"x":-95.16051727170681,"y":256.44416625915176},{"x":-92.15171991488873,"y":237.152481566773},{"x":-87.72702351144284,"y":221.93151867832364},{"x":-79.0546180853795,"y":222.9934459762755},{"x":-71.44413100292007,"y":226.7101930044488},{"x":-62.06377011217589,"y":234.49765886586792},{"x":-50.55956065148991,"y":275.91283833940855},{"x":-48.61269352100968,"y":296.79741546405694},{"x":-40.648243559627254,"y":315.0271698878002},{"x":-42.59511069010748,"y":318.7439109746063},{"x":-67.15039591135691,"y":315.4766321095494},{"x":-71.79502964605645,"y":320.16750631560575},{"x":-74.10940190995768,"y":331.5922450300363},{"x":-69.34797287031375,"y":349.90544711933353},{"x":-68.24918439083534,"y":361.9921568096986},{"x":-67.15039591135691,"y":374.0788665000637},{"x":-55.42993628263754,"y":392.39205629412413},{"x":-47.00586668282811,"y":382.8691924372132},{"x":-38.21552196128853,"y":380.30534660375895},{"x":-29.791464656716478,"y":366.38732285208255},{"x":-40.41312351072015,"y":359.428304828626},{"x":-47.37069979532277,"y":353.44123029855314},{"x":-50.556484532969314,"y":346.7156976764531},{"x":-48.78661072468454,"y":340.6981027231308},{"x":-43.122990772705336,"y":339.63617839586254},{"x":-29.058939003730824,"y":342.21390347135235},{"x":-15.87342806904014,"y":362.3584196219609},{"x":-17.521616935876473,"y":376.82583759203067},{"x":-21.367382761669667,"y":389.4619415007891},{"x":-33.08784239038915,"y":404.47876598448926},{"x":-51.76730801770936,"y":424.98954494736006},{"x":-32.721567268658944,"y":427.1871218209335},{"x":-15.507177537784694,"y":428.28592255295723},{"x":-12.393925069739748,"y":412.35343489098307},{"x":-5.25176921503647,"y":397.5197479610326},{"x":4.6373393955067765,"y":371.88127733125333},{"x":21.851753716855786,"y":354.6668759739797},{"x":32.60941779661698,"y":345.56722993010953},{"x":43.66392854235223,"y":335.7036479349809},{"x":59.28813188507989,"y":328.45512582489016},{"x":75.6925736398595,"y":326.09829055086556},{"x":89.73959095321509,"y":327.24245619306845},{"x":102.13576853727629,"y":331.5541679266761},{"x":112.51082401612298,"y":336.67432532763735},{"x":123.29008763261773,"y":343.14189066646617},{"x":136.85862550224482,"y":350.27170993159575},{"x":137.47876762983196,"y":362.7766971854105},{"x":136.683010639479,"y":377.40553903512904},{"x":135.39357419627356,"y":396.7872223365081},{"x":126.96951689170162,"y":412.53657244473266},{"x":120.3814747846577,"y":428.9627127046121},{"x":133.58454104356406,"y":427.04305852536527},{"x":147.57084152318959,"y":426.13028381296033},{"x":162.13087118738548,"y":427.18713411617045},{"x":167.54139222334538,"y":418.3077782716314},{"x":174.06209352254757,"y":410.4337282415022},{"x":177.14768395930287,"y":401.9149262986534},{"x":174.10566754366812,"y":394.5007660975295},{"x":167.41836464309847,"y":384.8430542857926},{"x":162.86808561019757,"y":376.5869707130299},{"x":158.80612013780075,"y":368.8488835797373},{"x":157.37413091756804,"y":360.1050949802808},{"x":159.91340966107737,"y":348.79465408450835},{"x":165.32682143700293,"y":341.7818260177732},{"x":161.02069918435404,"y":334.2768690497602},{"x":157.69883887473497,"y":326.15675353646577},{"x":160.89767160410713,"y":322.8348850016299},{"x":167.29533706285156,"y":318.0366359581187},{"x":173.3239115206443,"y":313.11535107544574},{"x":177.88492297258972,"y":305.8980389273873},{"x":181.32099334407474,"y":293.7993149321336},{"x":182.05918360618892,"y":285.31010016156495},{"x":179.5985411389309,"y":276.45179026382743},{"x":176.76880767072117,"y":270.17715451648263},{"x":171.72448689574736,"y":262.5491658394134},{"x":165.326821437003,"y":257.7509152471126}]')
let quadPts = JSON.parse('[{"x":-158.8168125365792,"y":82.6201813197511},{"x":-121.45788128193868,"y":-91.72143832774614},{"x":118.07874495860233,"y":80.78886725843982},{"x":-119.15515145588328,"y":256.45240711842615}]');

let blackHorseMeshGeometry;
let whiteHorseMeshGeometry;

let center;
let halfUp;

const [p0,p1,p2,p3] = quadPts.map(p=>new PIXI.Point(p.x,p.y));
let p13 = p1.add(p3).multiplyScalar(0.5);
center = p13.add(p2).multiplyScalar(0.5);
halfUp = p1.subtract(p3).multiplyScalar(0.5);

let phi = Math.atan2(halfUp.y, halfUp.x);

function getGlideMatrix(t0, t1) {    
    return new PIXI.Matrix()
        .translate(-center.x,-center.y)
        .rotate(-phi)
        .scale(1,1-2*t0)
        .rotate(phi)
        .translate(center.x+t1*halfUp.x, center.y+t1*halfUp.y);
}

class MeshGeometry {
    constructor(pts) {
        const width = horsesTexture.width, height = horsesTexture.height;
        let vertices = [];
        let uvs = [];
        pts.forEach(p=>{
            vertices.push(p.x,p.y)
            let u = (p.x + width/2)/width;
            let v = (p.y + height/2)/height;
            uvs.push(u,v)
        });
        let indices = earcut.default(vertices)
        this.meshGeometry = new PIXI.MeshGeometry({
            positions: new Float32Array(vertices),
            uvs: new Float32Array(uvs),
            indices: new Uint32Array(indices)
        });
    }

    createMesh() {
        let mesh = new PIXI.Mesh({
            geometry: this.meshGeometry, 
            texture:horsesTexture
        });
        return mesh;
    }
}

    
