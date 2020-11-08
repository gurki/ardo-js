import * as THREE from '/build/three.module.js'
import { Laser, fireLaser } from '/js/laser.js'
import Board from '/js/board.js'
import Camera from '/js/camera.js'


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

const axes = new THREE.AxesHelper( 1 );
axes.position.add( new THREE.Vector3( 0.001, 0.001, 0.001 ) );
scene.add( axes );

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

// const light2 = new THREE.DirectionalLight( 0xffffff, 0.8 );
// light2.position.set( -12, 10, -7 );
// light2.castShadow = true;
// scene.add( light2 );

// const helper = new THREE.DirectionalLightHelper( light, 5 );
// scene.add( helper );

var ambientLight = new THREE.AmbientLight(0xffff00, 0.3);
scene.add(ambientLight);

let board = new Board();
scene.add( board.mesh );
// board.addGuess( 0, 0 );
// board.addGuess( 4, 3 );

let camera = new Camera( renderer, board );


let AudoContext = window.AudioContext || window.webkitAudioContext;
let audioContext;
let analyser;
let source;
let dataArray;
let stream;
let node;
let recorder;
let bufferSource;
let audioBuffer;


renderer.domElement.onclick = function() {

    if ( ! audioContext ) {
        return;
    }

    // if ( recorder.state == "inactive" ) {
    //     // audioContext.suspend();
    //     recorder.start();
    // } else {
    //     // audioContext.resume();
    //     recorder.stop();
    // }


}

document.addEventListener( "keydown", function( event ) {

    if ( event.key == ' ' ) {

        const trace = board.trace( camera.tile, camera.direction );

        const material = new THREE.MeshToonMaterial({ color: 0x0000ff });
        const geometry = new THREE.SphereGeometry( 0.2, 32, 32 );

        console.log( trace );

        for ( const obstacle of trace.obstacles ) {
            console.log( obstacle.tile, obstacle.steps );
            const mesh = new THREE.Mesh( geometry, material );
            mesh.position.copy( board.tileToWorld( obstacle.tile ) );
            mesh.position.y += 0.7;
            scene.add( mesh );
        }

        // console.log( trace.path );
        // console.log( trace.info );

        // let laser = fireLaser( camera, scene, lasers );

        // laser.delay = audioContext.createDelay();
        // laser.delay.delayTime.value = 0.1;

        // laser.panner = audioContext.createPanner();
        // laser.panner.panningModel = 'HRTF';
        // laser.panner.distanceModel = 'inverse';
        // laser.panner.refDistance = 1;
        // laser.panner.maxDistance = 10000;
        // laser.panner.rolloffFactor = 1;
        // laser.panner.coneInnerAngle = 360;
        // laser.panner.coneOuterAngle = 0;
        // laser.panner.coneOuterGain = 0;

        // source.connect( laser.delay );
        // laser.delay.connect( laser.panner );
        // laser.panner.connect( audioContext.destination );

    }
    else if ( event.key === 'd' ) {
        camera.move( 1 );
    }
    else if ( event.key === 'a' ) {
        camera.move( -1 );
    }
    else if ( event.key === 'f' ) {
        camera.free = ! camera.free;
    }
    else if ( event.key === 's' ) {
        board.spawnAtoms();
    }

});


const initMedia = async function() {

    stream = await navigator.mediaDevices.getUserMedia( { audio: true } )
    // recorder = new MediaRecorder( stream );
    // console.log( recorder );

    // recorder.ondataavailable = async function( event ) {
        // const data = await event.data.arrayBuffer();
        // const buffer = await audioContext.decodeAudioData( data );
        // audioBuffer = buffer;
    // }

    // recorder.onstop = function() {
        // console.log( "onstop" );
    // }

    audioContext = new AudioContext();
    // audioContext.suspend();

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    // analyser.connect( audioContext.destination );
    dataArray = new Float32Array( analyser.frequencyBinCount );
    // source.connect( analyser );

    source = audioContext.createMediaStreamSource( stream );

};

initMedia();


const animate = function() {

    requestAnimationFrame( animate );
    camera.update();

    lasers.forEach( laser => {
        laser.update( 1.0 / 60.0 );

        if ( laser.distance() > 100 ) {
            scene.remove( laser.mesh );
            laser.panner.disconnect();
        }
    });

    lasers = lasers.filter( item => item.distance() < 100 );

    renderer.render( scene, camera );

    if ( analyser ) {
        analyser.getFloatTimeDomainData( dataArray )
    }

    if ( audioContext ) {

        let listener = audioContext.listener;
        // listener.positionX.value = camera.position.x;
        // listener.positionY.value = camera.position.y;
        // listener.positionZ.value = camera.position.z;

        let dir = new THREE.Vector3();
        // camera.getWorldDirection( dir );

        listener.forwardX.value = dir.x;
        listener.forwardY.value = dir.y;
        listener.forwardZ.value = dir.z;

        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;

    }

};

animate();