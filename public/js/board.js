import * as THREE from '/three/build/three.module.js'


const ItemType = Object.freeze({
    Atom: 0,
    Guess: 1
});

const PathInfo = Object.freeze({
    Unknown: 0,
    Hit: 1,
    Exit: 2,
    Reflect: 3,
});

export const Direction = Object.freeze({
    North: 0,
    East: 1,
    South: 2,
    West: 3
});

export const Motion = Object.freeze({
    Right: 1,
    Clockwise: 1,
    Left: -1,
    CounterClockwise: -1
});


export const flip = function( direction ) {
    return ( direction + 6 ) % 4;
}


export const rotate = function( direction, motion ) {
    return ( direction + motion + 4 ) % 4;
}


export const rotateOpposite = function( direction, motion ) {
    return ( direction - motion + 4 ) % 4;
}


export const getDirection = function( dir ) {

    switch( dir ) {
        case Direction.North: return new THREE.Vector3( 0, 0,-1 );
        case Direction.East:  return new THREE.Vector3( 1, 0, 0 );
        case Direction.South: return new THREE.Vector3( 0, 0, 1 );
        case Direction.West:  return new THREE.Vector3(-1, 0, 0 );
    }

}


export const neighbourTile = function( tile, direction ) {

    switch ( direction ) {
        case Direction.North: return new THREE.Vector2( tile.x, tile.y + 1 );
        case Direction.East: return new THREE.Vector2( tile.x + 1, tile.y );
        case Direction.South: return new THREE.Vector2( tile.x, tile.y - 1 );
        case Direction.West: return new THREE.Vector2( tile.x - 1, tile.y );
    }

}


export class Board {

    constructor() {

        this.items = [];
        this.mesh = new THREE.GridHelper( 8, 8, "#5b76ad", "#5b76ad" );
        this.atoms = new THREE.Object3D();
        this.guesses = new THREE.Object3D();
        this.mesh.add( this.atoms );
        this.mesh.add( this.guesses );
        this.raycaster = new THREE.Raycaster();

        this.maxNumAtoms = 4;

        const planeGeom = new THREE.PlaneGeometry( 8, 8 );
        const planeMat = new THREE.MeshToonMaterial( { color: 0x335599, side: THREE.DoubleSide }  )
        this.planeMesh = new THREE.Mesh( planeGeom, planeMat );
        this.planeMesh.position.setY( -0.01 );
        this.planeMesh.rotateX( - 0.5 * Math.PI );
        this.planeMesh.receiveShadow = true;
        this.mesh.add( this.planeMesh );

    }

    clear() {
        this.items = [];
        this.updateMesh();
    }

    numGuesses() {
        return this.guesses.children.length / 2;
    }

    tileToWorld( tile ) {
        return new THREE.Vector3( tile.x - 3.5, 0.5, -tile.y + 3.5 );
    }

    worldToTile( world ) {
        return new THREE.Vector2( Math.floor( world.x + 4 ), Math.floor( -world.z + 4 ) );
    }

    isInside( tile ) {
        return ( tile.x >= 0 ) && ( tile.x < 8 ) && ( tile.y >= 0 ) && ( tile.y < 8 );
    }

    isBorder( tile ) {
        return ( tile.x == 0 ) || ( tile.x == 7 ) || ( tile.y == 0 ) || ( tile.y == 7 );
    }

    hasWon() {

        const res = this.items.every( item => {
            return ( item.type !== ItemType.Atom ) || this.hasGuess( item.coord );
        });

        return ( this.atoms.children.length > 0 ) && res;

    }

    hasGuess( tile ) {

        return this.items.some( item =>
            ( item.type == ItemType.Guess ) &&
            item.coord.equals( tile )
        );

    }

    isAtom( tile ) {

        return this.items.some( item =>
            ( item.type == ItemType.Atom ) &&
            item.coord.equals( tile )
        );

    }

    removeItem( tile, type ) {

        this.items = this.items.filter( item =>
            ( item.type !== type ) ||
            ( ! item.coord.equals( tile ) )
        );

        this.updateMesh();

    }

    addItem( tile, type ) {

        this.items.push( {
            coord: tile,
            position: this.tileToWorld( tile ),
            type: type
        });

        this.updateMesh();

    }

    toggleGuess( x, y ) {

        const tile = new THREE.Vector2( x, y );

        if ( this.hasGuess( tile ) ) {
            this.removeItem( tile, ItemType.Guess );
            return;
        }

        if ( this.numGuesses() >= this.maxNumAtoms ) {
            return;
        }

        this.addItem( tile, ItemType.Guess );
    }

    clearAtoms() {
        this.items = this.items.filter( item => item.type !== ItemType.Atom );
        this.updateMesh();
    }

    clearGuesses() {
        this.items = this.items.filter( item => item.type !== ItemType.Guess );
        this.updateMesh();
    }

    spawnAtoms() {

        this.clearAtoms();
        let count = 0;

        while ( count < this.maxNumAtoms )
        {
            const tile = new THREE.Vector2(
                Math.floor( Math.random() * 8 ),
                Math.floor( Math.random() * 8 )
            );

            if ( this.isAtom( tile ) ) {
                continue;
            }

            this.addItem( tile, ItemType.Atom );
            count++;
        }

        this.updateMesh();

    }

    updateMesh() {

        this.atoms.clear();
        this.guesses.clear();

        const sphereGeom = new THREE.SphereGeometry( 0.4, 32, 32 );
        const planeGeom = new THREE.BoxGeometry( 0.8, 0.05, 0.8 );

        const guessMat = new THREE.MeshToonMaterial( { color: 0xeeee00 } );
        const guessMatSnd = new THREE.MeshToonMaterial( { color: 0x999900 } );

        const atomMat = new THREE.MeshToonMaterial( { color: 0x00ee00 } );
        const atomMatSnd = new THREE.MeshToonMaterial( { color: 0x009900 } );

        // guessMatSnd.side = THREE.DoubleSide;
        // atomMatSnd.side = THREE.DoubleSide;
        guessMat.transparent = true;
        guessMatSnd.transparent = true;

        guessMat.opacity = 0.61;
        guessMatSnd.opacity = 0.61;

        for ( const item of this.items ) {

            const isAtom = ( item.type === ItemType.Atom );
            const object = isAtom ? this.atoms : this.guesses;

            let sphereMesh = new THREE.Mesh( sphereGeom, isAtom ? atomMat : guessMat );
            sphereMesh.position.copy( item.position );
            sphereMesh.castShadow = true;
            object.add( sphereMesh );

            let planeMesh = new THREE.Mesh( planeGeom, isAtom ? atomMatSnd : guessMatSnd );
            planeMesh.position.copy( item.position );
            planeMesh.position.setY( 0.02 );
            // planeMesh.rotateX( - 0.5 * Math.PI );
            planeMesh.receiveShadow = true;
            planeMesh.castShadow = true;
            object.add( planeMesh );

            sphereMesh.scale.setScalar( isAtom ? 0.9 : 1.0 );
            planeMesh.scale.setScalar( isAtom ? 0.9 : 1.0 );

        }

    }


    trace( fromTile, direction ) {
        let path = [ fromTile ];
        let obstacles = [];
        let info = PathInfo.Unknown;
        let steps = 1;

        this.traceHelper( fromTile, direction, path, info, obstacles, steps );
        return { path: path, info: info, obstacles: obstacles };

    }


    traceHelper( fromTile, direction, path, info, obstacles, steps ) {

        // console.log( fromTile, direction );

        let tile = fromTile.clone();

        if ( this.isAtom( tile ) ) {
            path.push( tile );
            obstacles.push( { tile: tile, steps: steps } );
            // console.log( "Hit" );
            info = PathInfo.Hit;
            return;
        }

        const r = rotate( direction, Motion.Clockwise );
        const l = rotate( direction, Motion.CounterClockwise )

        const rn = neighbourTile( tile, r );
        const ln = neighbourTile( tile, l );

        const ra = this.isAtom( rn );
        const la = this.isAtom( ln );

        // console.log( "rn/ln", rn, ra, ln, la );

        if ( this.isBorder( tile ) && ( ra || la ) ) {
            path.push( tile );
            obstacles.push( { tile: tile, steps: steps } );
            steps++;
            obstacles.push( { tile: neighbourTile( tile, flip( direction ) ), steps: steps } );
            info = PathInfo.Reflect;
            // console.log( "Border Reflect" );
            return;
        }

        const fn = neighbourTile( tile, direction );
        const frn = neighbourTile( fn, r );
        const fln = neighbourTile( fn, l );

        // console.log( "fn/frn/fln", fn, frn, fln );

        const fa = this.isAtom( fn );

        if ( fa ) {
            path.push( fn );
            steps++;
            obstacles.push( { tile: fn, steps: steps } );
            info = PathInfo.Hit;
            // console.log( "Frontal Hit" );
            return;
        }

        const fra = this.isAtom( frn );
        const fla = this.isAtom( fln );

        if ( fra && fla ) {
            path.push( fn )
            steps++;
            obstacles.push( { tile: fn, steps: steps } );
            steps++;
            info = PathInfo.Reflect;
            // console.log( "Reflect" );
            this.traceHelper( tile, flip( direction ), path, info, obstacles, steps );
            return;
        }

        if ( fra ) {
            path.push( tile );
            steps++;
            obstacles.push( { tile: tile, steps: steps } );
            // console.log( "Left" );
            this.traceHelper( tile, l, path, info, obstacles, steps );
            return;
        }

        if ( fla ) {
            path.push( tile );
            steps++;
            obstacles.push( { tile: tile, steps: steps } );
            // console.log( "Right" );
            this.traceHelper( tile, r, path, info, obstacles, steps );
            return;
        }

        if ( ! this.isInside( fn ) ) {

            path.push( tile );
            steps++;
            obstacles.push( { tile: fn, steps: steps } );

            if ( info != PathInfo.Unknown ) {
                info = PathInfo.Exit;
            }

            // console.log( "Exit" );
            return;

        }

        steps++;
        this.traceHelper( fn, direction, path, info, obstacles, steps );
        return;
    }

    toggleGuessOnScreen( mouse, camera )  {

        this.raycaster.setFromCamera( mouse, camera );
        const intersects = this.raycaster.intersectObject( this.planeMesh );

        if ( intersects.length == 0 ) {
            return;
        }

        const tile = this.worldToTile( intersects[ 0 ].point );
        this.toggleGuess( tile.x, tile.y );

    }

}