function makeNotesArray(){
    return[
        {
            id: 1,
            title: 'first title!',
            content: 'lorem imsum',
            date_published: Date()
        },
        {
            id: 2,
            title: 'second title!',
            content: 'lorem imsum',
            date_published: Date()
        },
        {
            id: 3,
            title: 'third title!',
            content: 'lorem imsum',
            date_published: Date()
        }
    ]
}

function makeSketchyNotes(){
    const sketchyNote = {
        id: 420,
        title: 'guess who <script>alert("xss");</script>',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        date_published: Date()
    }
    const expectedNote = {
        ...sketchyNote,
        title: `guess who &lt;script&gt;alert(\"xss\");&lt;/script&gt;`,
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad`
    }
    return{
        sketchyNote,
        expectedNote
    }
}

module.exports = {
    makeNotesArray,
    makeSketchyNotes
}