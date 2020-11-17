import * as THREE from '/three/build/three.module.js'
import * as Board from '/js/board.js'
import Camera from '/js/camera.js'
import { GLTFLoader } from '/three/examples/jsm/loaders/GLTFLoader.js'


let lasers = [];


const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// renderer.physicallyCorrectLights = true;

// renderer.domElement.focus();

const container = document.getElementById( 'canvas3d' );
container.appendChild( renderer.domElement );

const scene = new THREE.Scene();
scene.background = new THREE.Color( "#222" );

// const grid = new THREE.GridHelper( 10, 10 );
// scene.add( grid );

// const axes = new THREE.AxesHelper( 1 );
// axes.position.add( new THREE.Vector3( 0.001, 0.001, 0.001 ) );
// scene.add( axes );

const boxGeometry = new THREE.BoxGeometry( 8, 0.1, 0.1 );
const boxMaterial = new THREE.MeshToonMaterial( {color: 0x004499 } );
const boxMesh = new THREE.Mesh( boxGeometry, boxMaterial );
boxMesh.position.set( 0, 0, -4.2 );
scene.add( boxMesh );

const boxMaterial2 = new THREE.MeshToonMaterial( {color: 0x009944 } );
const boxMesh2 = new THREE.Mesh( boxGeometry, boxMaterial2 );
boxMesh2.position.set( 0, 0, 4.2 );
scene.add( boxMesh2 );

const planeGeom = new THREE.PlaneGeometry( 0.8, 0.8 );
const guessMat = new THREE.MeshToonMaterial( { color: 0xeeee00 } );

// const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
// scene.add( light );

// const light = new THREE.PointLight( 0xffffff, 1, 0, 2 );
// scene.add( light );

const light1 = new THREE.DirectionalLight( 0xffffff, 0.9 );
light1.position.set( 5, 10, 8 );
light1.castShadow = true;
light1.shadow.mapSize.width = 1024;
light1.shadow.mapSize.height = 1024;
// light1.shadow.camera.near = 0.1;
// light1.shadow.camera.far = 100;
scene.add( light1 );


const playerGeom = new THREE.BoxGeometry( 0.39, 0.05, 0.39 );
const playerMat = new THREE.MeshToonMaterial( { color: 0x999900 } );

const playerIndicator = new THREE.Mesh( playerGeom, playerMat );
playerIndicator.receiveShadow = true;
scene.add( playerIndicator );

const loader = new GLTFLoader();

loader.load( 'models/Cat.gltf', gltf => {
    gltf.scene.scale.setScalar( 0.16 );
    playerIndicator.add( gltf.scene );
});


// const light2 = new THREE.DirectionalLight( 0xffffff, 0.8 );
// light2.position.set( -12, 10, -7 );
// light2.castShadow = true;
// scene.add( light2 );

// const helper = new THREE.DirectionalLightHelper( light, 5 );
// scene.add( helper );

var ambientLight = new THREE.AmbientLight(0xffff00, 0.3);
scene.add(ambientLight);

let board = new Board.Board();
scene.add( board.mesh );
// board.addGuess( 0, 0 );
// board.addGuess( 4, 3 );

let camera = new Camera( renderer, board );


let AudoContext = window.AudioContext || window.webkitAudioContext;
let audioContext;
let analyser;
let source;
let dataArray;
let mic;
let node;
let recorder;
let bufferSource;
let audioBuffer;
let audioNodes = [];
let obstacleObjects = new THREE.Object3D();
let meter;
let limiter;
let volume;
let mouse = new THREE.Vector2();
let startTime;
let duration;

scene.add( obstacleObjects );

const statusElement = document.getElementById( "status" );


const reset = function() {

    // board.atoms.visible = false;
    board.clear();
    board.spawnAtoms();

    updateTrace();
    checkVictory();

    startTime = new Date();
    duration = null;

}


const checkVictory = function() {

    if ( board.hasWon() ) {

        board.atoms.visible = true;

        if ( ! duration ) {
            const delta = new Date() - startTime;
            duration = new Date( delta ).toISOString().substr( 14, 5 );
        }

        statusElement.innerHTML = "YOU WON in " + duration + "!!";

    } else if ( board.numGuesses() < board.maxNumAtoms ) {
        statusElement.innerHTML = "place " + ( board.maxNumAtoms - board.numGuesses() ) + " more guesses";
    } else {
        statusElement.innerHTML = "that's not it";
    }

}


document.getElementById( "reset-btn" ).addEventListener( "click", event => {
    reset();
});


window.addEventListener( "resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});


document.addEventListener( "mousemove", event => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
});


document.addEventListener( "click", event => {
    initMedia();
    board.toggleGuessOnScreen( mouse, camera );
    checkVictory();
});


const updateTrace = function() {

    const trace = board.trace( camera.tile, camera.direction );
    // const material = new THREE.MeshToonMaterial({ color: 0x0000ff });
    // const geometry = new THREE.SphereGeometry( 0.2, 32, 32 );

    // obstacleObjects.clear();

    if ( ! audioContext ) {
        return;
    }

    for ( const node of audioNodes ) {
        node.dispose();
    }

    audioNodes = [];

    const camPos = camera.position;
    let count = 1;

    for ( const obstacle of trace.obstacles ) {

        // console.log( obstacle.tile, obstacle.steps );
        const pos = board.tileToWorld( obstacle.tile );
        const dist = camPos.distanceTo( pos );

        // const mesh = new THREE.Mesh( geometry, material );
        // mesh.position.copy( pos );
        // mesh.position.y += 0.7;
        // obstacleObjects.add( mesh );

        let pitch = new Tone.PitchShift( ( count == trace.obstacles.length ) * 0 );
        let delay = new Tone.Delay( ( obstacle.steps - 1 ) / 8 + 1 / 16, 4 );

        let panner = new Tone.Panner3D( pos.x, pos.y, pos.z );
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 100;
        panner.rolloffFactor = 2;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;

        let reverb = new Tone.Reverb( ( dist * dist ) / 16 );
        let gain = new Tone.Volume( Math.max( - ( obstacle.steps * obstacle.steps ) / 8, -16 ) );

        mic.connect( pitch );
        pitch.connect( delay );
        delay.connect( panner );
        panner.connect( reverb );
        reverb.connect( gain );
        gain.connect( volume );

        audioNodes.push( pitch );
        audioNodes.push( delay );
        audioNodes.push( panner );
        audioNodes.push( reverb );
        audioNodes.push( gain );

        count++;

    }

}


document.addEventListener( "keydown", async function( event ) {

    await initMedia();

    if ( event.key == ' ' ) {
    }
    else if ( event.key === 'd' ) {
        camera.move( 1 );
        updateTrace();
    }
    else if ( event.key === 'a' ) {
        camera.move( -1 );
        updateTrace();
    }
    else if ( event.key === 'f' ) {
        camera.toggle();
    }
    // else if ( event.key === 's' ) {

        // if ( board.hasWon() ) {
        //     return;
        // }

        // board.spawnAtoms();
        // updateTrace();

    // }
    else if ( event.key === 'h' ) {
        board.atoms.visible = ! board.atoms.visible;
    }

});


const initMedia = async function() {

    if ( audioContext ) {
        return;
    }

    await Tone.start();
    console.log( "audio started" );

    audioContext = new Tone.Context({
        clockSource: "worker",
        latencyHint: "interactive"
    });

    Tone.setContext( audioContext );

    mic = new Tone.UserMedia();
    await mic.open();

    volume = new Tone.Volume( 10 );
    meter = new Tone.Meter();
    limiter = new Tone.Limiter( 0 );

    mic.connect( limiter );

    volume.connect( limiter );
    limiter.toDestination();
    limiter.connect( meter );

    updateTrace();

};


const animate = function() {

    requestAnimationFrame( animate );
    camera.update();
    renderer.render( scene, camera );

    let dir = new THREE.Vector3();
    camera.getWorldDirection( dir );

    const tile = Board.neighbourTile( camera.tile, Board.flip( camera.direction ) );
    const pos = board.tileToWorld( tile );
    const lookAt = dir.clone().add( pos );
    playerIndicator.lookAt( lookAt );
    playerIndicator.position.copy( pos );
    playerIndicator.position.setY( 0.02 );

    if ( analyser ) {
        analyser.getFloatTimeDomainData( dataArray )
    }

    if ( audioContext ) {

        let listener = audioContext.listener;
        listener.positionX.value = camera.position.x;
        listener.positionY.value = camera.position.y;
        listener.positionZ.value = camera.position.z;

        listener.forwardX.value = dir.x;
        listener.forwardY.value = dir.y;
        listener.forwardZ.value = dir.z;

        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;

        // console.log( meter.getValue() );

    }


};

reset();
animate();