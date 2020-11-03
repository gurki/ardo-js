import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import { Laser, fireLaser } from '/js/laser.js'


let lasers = [];


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

const container = document.getElementById( 'canvas3d' );
container.appendChild( renderer.domElement );

const grid = new THREE.GridHelper( 10, 10 );
const axes = new THREE.AxesHelper( 1 );
axes.position.add( new THREE.Vector3( 0.001, 0.001, 0.001 ) );
scene.add( grid );
scene.add( axes );
scene.background = new THREE.Color( "#222" );


camera.position.x = 0;
camera.position.y = 9;
camera.position.z = 3;
camera.lookAt( 0, 0, 0 );

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();


let AudoContext = window.AudioContext || window.webkitAudioContext;
let audioContext;
let analyser;
let source;
let dataArray;
let stream;
let node;
let recorder;
let bufferSource;


renderer.domElement.onclick = function() {

    if ( ! audioContext ) {
        return;
    }

    if ( audioContext.state == "running" ) {
        audioContext.suspend();
        recorder.stop();
    } else {
        audioContext.resume();
        recorder.start();
    }

}

renderer.domElement.onkeyup = function( event ) {
    if ( event.keyCode == 32 ) {
        fireLaser( camera, scene, lasers );
    }
}


const initMedia = async function() {

    stream = await navigator.mediaDevices.getUserMedia( { audio: true } )
    recorder = new MediaRecorder( stream );
    console.log( recorder );

    recorder.ondataavailable = async function( event ) {

        const data = await event.data.arrayBuffer();
        const buffer = await audioContext.decodeAudioData( data );

        bufferSource.buffer = buffer;
        source.disconnect();
        audioContext.resume();
        bufferSource.start();

    }

    recorder.onstop = function() {
        console.log( "onstop" );
    }

    audioContext = new AudioContext();
    audioContext.suspend();

    bufferSource = audioContext.createBufferSource();
    bufferSource.connect( audioContext.destination );

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    analyser.connect( audioContext.destination );
    dataArray = new Float32Array( analyser.frequencyBinCount );

    source = audioContext.createMediaStreamSource( stream );
    source.connect( analyser );

};

initMedia();


const animate = function() {

    requestAnimationFrame( animate );
    controls.update();

    lasers.forEach( laser => {
        laser.update( 1.0 / 60.0 );

        if ( laser.distance() > 100 ) {
            scene.remove( laser.mesh );
        }
    });

    lasers = lasers.filter( item => item.distance() < 100 );

    renderer.render( scene, camera );

    if ( ! analyser ) {
        return;
    }

    analyser.getFloatTimeDomainData( dataArray )

};

animate();