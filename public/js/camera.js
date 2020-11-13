import * as THREE from '/three/build/three.module.js'
import { OrbitControls } from '/three/examples/jsm/controls/OrbitControls.js'
import * as Board from '/js/board.js'


export default class Camera extends THREE.PerspectiveCamera {

    constructor( renderer, board ) {

        super( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

        this.tile = new THREE.Vector2( 3, 0 );
        this.direction = Board.Direction.North;

        // this.controls = new OrbitControls( this, renderer.domElement );
        this.board = board;

        this.fixedBird = false;

    }

    move( motion ) {

        if ( this.fixedBird ) {
            return;
        }

        const rot = Board.rotate( this.direction, motion );
        let ntile = Board.neighbourTile( this.tile, rot );

        if ( this.board.isInside( ntile ) ) {
            this.tile = ntile;
        } else {
            this.direction = Board.rotateOpposite( this.direction, motion );
        }

    }

    toggle() {

        this.fixedBird = ! this.fixedBird;

        if ( ! this.fixedBird ) {
            return;
        }

        let dir = Board.getDirection( Board.flip( this.direction ) );
        let pos = dir.clone();
        pos.multiplyScalar( 5 );
        pos.y = 5;

        this.position.copy( pos );
        this.lookAt( dir );

    }

    update() {

        if ( this.fixedBird ) {
            return;
        }

        const tilePos = this.board.tileToWorld( this.tile );
        const dir = Board.getDirection( this.direction );
        const camPos = tilePos.clone().addScaledVector( dir, -1.3 );

        this.position.copy( camPos );
        this.lookAt( tilePos );

    }

}