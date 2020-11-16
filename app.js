import express from 'express';


const app = express();
app.use( express.static( 'public' ));
app.use( express.static( 'node_modules' ));

app.listen( 3000, () =>
    console.log( 'visit http://localhost:3000' )
);
