const fs = require('fs');
const path = requir('path');

const schemaSqlPathname = path.join(__dirname, 'schema.sql');
const schemaStyle = fs.readFileSync(schemaSqlPathname, 'utf8');

