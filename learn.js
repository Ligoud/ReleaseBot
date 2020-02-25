var textract = require('textract');
textract.fromFileWithPath('md.md', function( error, text ) {
    if(error)
        console.log(error)
    else
        console.log(text)
})