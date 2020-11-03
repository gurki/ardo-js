import * as THREE from '/build/three.module.js'


export class Laser {

    constructor( position, velocity ) {

        this.start = position.clone();
        this.position = position.clone();
        this.velocity = velocity.clone();

        const geometry = new THREE.SphereGeometry( 0.5, 32, 32 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        this.mesh = new THREE.Mesh( geometry, material );

    }

    update( dt ) {
        this.position.addScaledVector( this.velocity, dt );
        this.mesh.position.copy( this.position );
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

}