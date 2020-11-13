import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';


const __dirname = path.dirname( fileURLToPath( import.meta.url ));

const app = express();
app.use( express.static( __dirname + '/public' ));
app.use( express.static(path.join(__dirname, 'node_modules/' )));

app.listen( 3000, () =>
    console.log( 'visit http://localhost:3000' )
);