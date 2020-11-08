import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ));

const app = express();
app.use( express.static(path.join(__dirname, '/public' )));
app.use( '/build/', express.static(path.join(__dirname, 'node_modules/three/build' )));
app.use( '/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm' )));

app.listen( 8000, () =>
    console.log( 'visit http://localhost:8000' )
);