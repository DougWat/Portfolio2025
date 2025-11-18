import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';

let HeroComputer;
let Screen;

const _HeroComputer = function(){
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 60, 1, .01, 10 );
    const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
    const loader = new GLTFLoader();

    const block = $(".hero-computer-block");
    const element = $("#HeroComputer");
    const lights = [];

    
    let computerMesh;
    let monitorMesh;
    let screenMesh;
    let chassisMesh;

    let canvasPos = {};

    let currentFrameTime = 0;
    const desiredFPS = 60;
    const frameTimeTarget = 1/desiredFPS;

    let lookPoint = {x:0,y:0};
    let currentRot = new THREE.Vector3(0,0,0);
    let desiredRot = new THREE.Vector3(0,0,0);
    let rotSpeed = .01;

    Init();

    function Animate() {
        currentFrameTime += Time.delta;
        if(currentFrameTime < frameTimeTarget){requestAnimationFrame( Animate ); return;}

        Logic();
        screenMesh.material.emissiveMap.needsUpdate = true;
        renderer.render( scene, camera );
        requestAnimationFrame( Animate );
        currentFrameTime = 0;
        Screen.Render(canvasPos);
    }

    async function Init(){
        SetRandomLookPoint();

        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.physicallyCorrectLights = true;
        renderer.setSize( 500, 500 );

        $(element)[0].appendChild( renderer.domElement );
        GetCanvasPos();
        camera.position.z = 4.5;
        
        BuildLights();
        await AddComputerModel();
        ConfigComputerModel();
        ApplyFaceCanvas();
        Animate();

        $(element).on('mousedown',(e)=>{
            currentRot.x += (Math.floor(Math.random() - .5) + .5) * .5;
            currentRot.y += (Math.floor(Math.random() - .5) + .5) * .5;
            Screen.ShowStatic();
            Screen.Face().Emot('blink',300);
        });
        $(block).removeClass('pre-load');
    }

    function GetCanvasPos(){
        const r = $(element)[0].getBoundingClientRect();
        canvasPos.x = r.left + window.scrollX + (r.width/2);
        canvasPos.y = r.top + window.scrollY + (r.height/2);
    }

    function BuildLights(){
        scene.add(new THREE.HemisphereLight(0xffeeb1,0x080820,3));
        AddLight(0xecb2ed,700,{x:-10,y:5,z:10});
        AddLight(0xC6F0C5,700,{x:10,y:5,z:10});
        AddLight(0xecb2ed,700,{x:0,y:-10,z:15});
    }

    async function AddComputerModel(){
        return new Promise((res)=>{
            loader.load( ThreesAssetAtlas.Computer, function ( gltf ) {
                computerMesh = gltf.scene;
                scene.add( computerMesh );
                res();
            });
        });
    }

    function ConfigComputerModel(){
        computerMesh.translateY(-1.7);
        computerMesh.traverse(n => { if ( n.isMesh ) {
            n.castShadow = true;
            n.receiveShadow = true;

            if(n.material.map) n.material.map.anisotropy = 1;
            
            if(n.name == "Screen"){
                screenMesh = n;
            }else if(n.name =="Monitor"){
                monitorMesh = n;
            }else if(n.name == "Chassis"){
                chassisMesh = n;
            }
        }});
    }

    function AddLight(color, intensity, position){
        const light = new THREE.SpotLight(color,intensity);
        light.position.set(position.x,position.y,position.z);
        light.castShadow = true;
        light.shadow.bias = -0.0001;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        lights.push(light);
        scene.add(light);
    }

    function Logic(){
        lookPoint.x = (Mouse.y - canvasPos.y) / 1000;
        lookPoint.y = (Mouse.x - canvasPos.x) / 1000;


        desiredRot.x = lookPoint.x;
        desiredRot.y = lookPoint.y;

        currentRot.x = GetFrameRotInc(currentRot.x,desiredRot.x);
        currentRot.y = GetFrameRotInc(currentRot.y,desiredRot.y);

        monitorMesh.rotation.x = currentRot.x * .2;
        monitorMesh.rotation.y = currentRot.y * .7;
        screenMesh.rotation.x = currentRot.x * .2;
        screenMesh.rotation.y = currentRot.y * .7;
        chassisMesh.rotation.y = currentRot.y * .1;
    }

    function SetRandomLookPoint(){
        const x = Math.random() * 2 - 1;
        const y = Math.random() * 2 - 1;

        $(element.attr('data-yDiv',y));
        $(element.attr('data-xDiv',x));

        const rand = Math.floor(Math.random()*10000) + 1000;
        setTimeout(()=>{
            //SetRandomLookPoint();
        },rand);
    }

    
    function GetFrameRotInc(current,desired){
        const x = current - desired;
        if(Math.abs(x) < .0001){return current;}
        return current - (x/40 * (currentFrameTime * 300));
    }

    function ApplyFaceCanvas(){
        const texture = new THREE.CanvasTexture(Screen.GetView());
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        screenMesh.material.map = texture;

        screenMesh.material.emissive = new THREE.Color(0xffffff);
        screenMesh.material.emissiveMap = texture;
        screenMesh.material.emissiveIntensity = 1;
    }
}

const _Screen = function(){
    console.log("_Screen Start");
    const app = new PIXI.Application();
    const masterContainer = new PIXI.Container();
    const containers = {};
    
    let crtFilter;
    let noiseFilter;
    let pixelateFilter;

    let _face;
    this.Face = ()=>{return _face;}

    let isInitialized = false;

    Init();

    async function Init(){

        await app.init({width: 300, height: 300*.84,background: '#1099bb'});
        document.body.appendChild(app.canvas);
        app.canvas.style.display = "none";

        app.stage.addChild(masterContainer);

        containers.background = AddContainer(true);
        containers.face = AddContainer(true);
        containers.emojis = AddContainer(true);
        containers.static = AddContainer();

        PIXI.Assets.addBundle('face',{
            LeftEye_Default: ThreesAssetAtlas.LeftEye_Default,
            RightEye_Default: ThreesAssetAtlas.RightEye_Default,
            LeftEye_Blink: ThreesAssetAtlas.LeftEye_Blink,
            RightEye_Blink: ThreesAssetAtlas.RightEye_Blink,
            Mouth_Default: ThreesAssetAtlas.Mouth_Default,
            Mouth_Simple: ThreesAssetAtlas.Mouth_Simple,
            Mouth_Drool: ThreesAssetAtlas.Mouth_Drool
        });

        BuildFace();
        BuildFilters();
        BuildContainers();

        isInitialized = true;
    }

    async function BuildFace(){
        const bundle = await PIXI.Assets.loadBundle('face');
        _face = new Face(bundle);
    }

    const Face = function(bundle){
        this.Eyes = new Eyes();
        this.Mouth = new Mouths();
        this.Emojis = new Emojis();

        this.Eyes.AddEyes("default",bundle.LeftEye_Default, bundle.RightEye_Default,50,50);
        this.Eyes.AddEyes("blink",bundle.LeftEye_Blink, bundle.RightEye_Blink,50,20);

        this.Eyes.SetEyes("default",true,true,true);

        this.Mouth.AddMouth("default",bundle.Mouth_Default, 75);

        this.Emot = function(name, time){
            this.Eyes.SetEyes(name,true,true,true);
            setTimeout(()=>{
                this.Eyes.SetEyes('default',true,true,true);
            },time);
        }
        this.EyeEmot = function(name,time){

        }
        this.MouthEmot = function(name,time){

        }

        this.Render = (pos) =>{
            this.Eyes.Render(pos);
            this.Mouth.Render(pos);
            this.Emojis.Render();
        }

        let randBlink = Math.random() * 8000 + 500;
        setInterval(()=>{
            this.Emot('blink',100);
            randBlink = Math.random() * 8000 + 500;
        },randBlink);
    }

    const Mouths = function(){
        const DefaultPosition = {x:app.screen.width/2,y:170};
        const Mouths = {};

        let currentMouth = "default";

        this.AddMouth = function(key,mouth,width){
            Mouths[key] = new Mouth(mouth,width);
            Mouths[key].Init(DefaultPosition.x,DefaultPosition.y);
        }

        this.Render = (pos) =>{
            
            Mouths[currentMouth].MouseOffset(pos).Render();
        }
    }

    const Mouth = function(_asset,_width){
        const asset = new PIXI.GifSprite(_asset);
        const width = _width;

        let defaultPosition = {x:-1000,y:-1000};
        let currentPosition = {x:-1000,y:-1000};
        let offsetPosition = {x:0,y:0};
        let jitterPosition = {x:0,y:0};

        let jitterTime = Time.now;
        let jitterDelta = 0;

        asset.anchor.set(0.5);

        containers.face.addChild(asset);

        this.Init = function(x,y){
            asset.width = width;
            asset.height = width/4;

            defaultPosition.x = x;
            defaultPosition.y = y;
        }

        this.MouseOffset = (pos) =>{
            let x = Mouse.x - pos.x;
            let y = Mouse.y - pos.y;

            offsetPosition.x = x/25;
            offsetPosition.y = y/12;
            return this;
        }

        this.Render = function(){
            Jitter();
            asset.x = defaultPosition.x + offsetPosition.x + jitterPosition.x;
            asset.y = defaultPosition.y + offsetPosition.y + jitterPosition.y;
        }

        function Jitter(){
            jitterDelta += (Time.now - jitterTime);
            jitterTime = Time.now;
            if(jitterDelta >= 1000/20){
                jitterPosition.x = Math.random() * 4 - 2;
                jitterPosition.y = Math.random() * 4 - 2;
                jitterDelta = 0;
            }
        }
    }

    const Eyes = function(){
        const Left = {};
        const Right = {};
        const BaseOffset = {x:-100,y:80};

        let defaultPosition = {left:{x:70,y:120},right:{x:app.screen.width - 70,y:120}};
        let currentPosition = {left:{x:60,y:120},right:{x:app.screen.width - 60,y:120}};
        let wanderPosition = {left:{x:0,y:0,min:{x:-15,y:-10},max:{x:15,y:10}},right:{x:0,y:0,min:{x:-15,y:-10},max:{x:15,y:10}}};
        let offsetPosition = {left:{x:0,y:0},right:{x:0,y:0}};
        let jitterPosition = {left:{x:0,y:0},right:{x:0,y:0}};

        let lookPosition = {x:0,y:0};
        let currentEyes = {left:"default",right:"default"};

        let jitterTime = Time.now;
        let jitterDelta = 0;

        this.AddEyes = function(key,left,right,w,h){
            Left[key] = new Eye(left,w,h,false);
            Right[key] = new Eye(right,w,h);

            Left[key].Init();
            Right[key].Init();
        }

        this.Render = (pos)=>{
            EyeOffset(pos);
            JitterAndWander();
            Left[currentEyes.left].SetPos(ComputerEyePosition('left'));
            Right[currentEyes.right].SetPos(ComputerEyePosition('right'));
        }

        function EyeOffset(pos){
            offsetPosition = {left:ComputeEyeOffset('left',pos),right:ComputeEyeOffset('right',pos)};
        }

        function ComputeEyeOffset(key,pos){
            return {
                x:(Mouse.x - pos.x - (key == 'right' ? BaseOffset.x : (-1*BaseOffset.x)))/25,
                y:(Mouse.y - pos.y - BaseOffset.y)/10
            }
        }

        function ComputerEyePosition(key){
            currentPosition[key].x = defaultPosition[key].x + offsetPosition[key].x + jitterPosition[key].x + wanderPosition[key].x;
            currentPosition[key].y = defaultPosition[key].y + offsetPosition[key].y + jitterPosition[key].y + wanderPosition[key].y;
            return currentPosition[key];
        }

        this.SetEyes = (key,value,left,right) =>{
            if(left){
                SetEye(Left[currentEyes.left],Left[key],currentPosition['left']);
                currentEyes.left = key;
            }
            if(right){
                SetEye(Right[currentEyes.right],Right[key],currentPosition['right']);
                currentEyes.right = key;
            }
        }

        function SetEye(current,next,pos){
            current.Visible(false);
            next.SetPos(pos);
            next.Visible(true);
        }

        function JitterAndWander(){
            jitterDelta += (Time.now - jitterTime);
            jitterTime = Time.now;
            if(jitterDelta >= 1000/20){
                jitterPosition.left = GetJitterNumber();
                jitterPosition.right = GetJitterNumber();

                const wpL = GetWanderNumber(wanderPosition.left);
                const wpR = GetWanderNumber(wanderPosition.right);
                wanderPosition.left.x = wpL.x;
                wanderPosition.left.y = wpL.y;
                wanderPosition.right.x = wpR.x;
                wanderPosition.right.y = wpR.y;
                jitterDelta = 0;
            }
        }

        function GetJitterNumber(amt = 4){
            return {x:Math.random() * amt - amt/2,y:Math.random() * amt - amt/2};
        }

        function GetWanderNumber(current){
            const min = current.min;
            const max = current.max;
            
            const clamp = (num, min, max) => Math.min(Math.max(num, min), max)
            
            const jitter = GetJitterNumber(6);

            let x = clamp(current.x + jitter.x ,min.x,max.x);
            let y = clamp(current.y + jitter.y,min.y,max.y);
            
            return {x:x,y:y};
        }
    }

    const Eye = function(_asset, _w,_h, _isRight = true){
        const asset = new PIXI.GifSprite(_asset);
        console.log(asset);
        const defaultSize = {x:_w,y:_h};
        const isRight = _isRight;
        const yOffset = -100;
        const xOffset = 80;

        asset.anchor.set(0.5);

        containers.face.addChild(asset);

        asset.visible = false;

        this.Init = function(){
            asset.width = defaultSize.x;
            asset.height = defaultSize.y;
        }

        this.SetPos = (pos) => {
            asset.x = pos.x;
            asset.y = pos.y;
        }

        this.Visible = (v) =>{
            asset.visible = v;
        }

    }

    const Emojis = function(){
        const emojiStyle = new PIXI.TextStyle({
            fontSize: 200,
            align:'center'
        });
        const wave = new PIXI.Text({text:"👋",emojiStyle});
        const thumb = new PIXI.Text({text:"👍",emojiStyle});
        const cross = new PIXI.Text({text:"❌",emojiStyle});
        SetEmojiState(wave);
        SetEmojiState(thumb);
        SetEmojiState(cross);

        this.Render = () =>{
           //wave.angle = Math.cos(Time.now) * 10;
        }
    }

    function SetEmojiState(e){
        e.anchor.set(.5);
        e.x = app.screen.width/2;
        e.y = app.screen.height/2;
        e.visible = false;
        containers.emojis.addChild(e);
    }

    function BuildFilters(){
        crtFilter = new PIXI.filters.CRTFilter();
        noiseFilter = new PIXI.NoiseFilter();
        pixelateFilter = new PIXI.filters.PixelateFilter();

        crtFilter.lineContrast = .3;
        crtFilter.lineWidth = 2
        crtFilter.vignettingAlpha = .6;
        crtFilter.vignettingBlur = .5;

        pixelateFilter.size = 2.4;

        setInterval(()=>{
            crtFilter.time += 1;
            noiseFilter.seed = Math.random();
        },33);
    }

    async function BuildContainers(){
        app.stage.filters = [crtFilter, pixelateFilter];

        const graphics_background = new PIXI.Graphics();
        graphics_background.rect(0, 0, app.canvas.width, app.canvas.height).fill(0x664799);
        containers.background.addChild(graphics_background);

        const graphics_static = new PIXI.Graphics();
        graphics_static.rect(0, 0, app.canvas.width, app.canvas.height).fill(0x999999);
        containers.static.addChild(graphics_static);
        containers.static.filters = [noiseFilter];
    }

    function AddContainer(visible = false){
        const c = new PIXI.Container();
        c.visible = visible;
        masterContainer.addChild(c);

        return c;
    }

    this.ShowStatic = function(){
        containers.static.visible = true;
        setTimeout(()=>{
            containers.static.visible =false;
        },200)
    }

    this.GetView = function(){
        if(isInitialized){
            return app.canvas;
        }
        return null;
    }

    this.Render = function(pos){
        if( _face != undefined){
            _face.Render(pos);
        }
    }

}

document.addEventListener("DOMContentLoaded",()=>{
    HeroComputer = new _HeroComputer();
    Screen = new _Screen();
});