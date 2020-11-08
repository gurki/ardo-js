import * as THREE from '/build/three.module.js'


export class Laser {

    constructor( position, velocity ) {

        this.start = position.clone();
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.audioSource = undefined;
        this.panner = undefined;
        this.delay = undefined;
        this.randomized = false;

        const geometry = new THREE.SphereGeometry( 0.5, 32, 32 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        this.mesh = new THREE.Mesh( geometry, material );

    }

    update( dt ) {

        this.position.addScaledVector( this.velocity, 10 *dt );
        this.mesh.position.copy( this.position );

        if ( this.panner ) {
            this.panner.positionX.value = this.position.x;
            this.panner.positionY.value = this.position.y;
            this.panner.positionZ.value = this.position.z;
        }

        if ( this.distance() > 10 && ! this.randomized ) {
            this.velocity.random();
            this.randomized = true;
        }

    }

    distance() {
        return this.position.distanceTo( this.start );
    }

};


export const fireLaser = function( camera, scene, lasers ) {

    let position = new THREE.Vector3();
    let velocity = new THREE.Vector3();
    camera.getWorldPosition( position );
    camera.getWorldDirection( velocity );

    const laser = new Laser( position, velocity );
    lasers.push( laser );
    scene.add( laser.mesh )

    return laser;

}