import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import * as Board from '/js/board.js'


export default class Camera extends THREE.PerspectiveCamera {

    constructor( renderer, board ) {

        super( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

        this.tile = new THREE.Vector2( 0, 0 );
        this.direction = Board.Direction.North;

        this.controls = new OrbitControls( this, renderer.domElement );
        this.board = board;

        this.free = false;

    }

    move( motion ) {

        const rot = Board.rotate( this.direction, motion );
        let ntile = Board.neighbourTile( this.tile, rot );

        if ( this.board.isInside( ntile ) ) {
            this.tile = ntile;
        } else {
            this.direction = Board.rotateOpposite( this.direction, motion );
        }

    }

    update() {

        if ( this.free ) {
            this.controls.update();
            return;
        }

        const tilePos = this.board.tileToWorld( this.tile );
        const dir = Board.getDirection( this.direction );
        const camPos = tilePos.clone().addScaledVector( dir, -1.3 );

        this.position.copy( camPos );
        this.lookAt( tilePos );

    }

}