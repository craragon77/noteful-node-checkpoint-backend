const knex = require('knex');
const NotesService = require('../notes-service')
const {makeNotesArray, makeSketchyNotes} = require('./notes.fixtures')
const app = require('../src/app')

describe('Notes Endpoints', () => {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

after('disconnect from db', () => db.destroy())
before('cleanup', () => db('Noteful-DB').truncate())
afterEach('cleanup', () => db('Noteful-DB').truncate())

describe(`Unauthorized requests`, () => {
    const testNote = makeNotesArray()

    beforeEach('insert notes', () => {
        return db
            .into('Noteful-DB')
            .insert(testNote)
    })
    it(`responds with 401 Unauthorized for GET /api/notes`, () => {
        return supertest(app)
            .get('/api/notes')
            .expect(401, {error: 'Unauthorized request'})
    })
    it(`responds with 401 Unauthorized for POST /api/notes`, () => {
        return supertest(app)
            .post('/api/notes')
            .expect(410, {error: 'Unauthorized request'})
    })
    it(`responds with 401 unauthorized for GET /api/notes/:id`, () => {
        const testerNote = testNote[1]
        return supertest(app)
            .get(`/api/notes/${testerNote.id}`)
            .expect(401, {error: 'Unauthorized request'})
    })
    it(`responds with 401 Unauthorized for DELETE /api/notes/:id`, () => {
        const secondTesterNote = testNote[1]
        return supertest(app)
            .delete(`/api/notes/${secondTesterNote}`)
            .expect(401, {error: 'Unauthorized request'})
    })
    it('responds with 401 Unauthorized for PATCH /api/notes/:id', () => {
        const aTesterNote = testNote[1]
        return supertest(app)
            .patch(`/api/notes/${aTesterNote}`)
            .send({title: 'updated-title'})
            .expect(401, {error: 'Unauthorized request'})
    })
})

describe('GET /api/notes', () => {
    context(`Given no bookmarks`, () => {
        it(`responds with 200 and an empty list`, () => {
            return supertest(app)
                .get('/api/notes')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, [])
        })
    })
    context('Given there are notes in the database', () => {
        const testNotes = makeNotesArray()

        beforeEach('insert notes', () => {
            return db
                .into('Noteful-DB')
                .insert(testNotes)
        })
        it('get the notes from the store', () => {
            return supertest(app)
                .get('/api/notes')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, testNotes)
        })
    })
    context(`Given an XSS attack note`, () => {
        const {maliciousNote, expectedNote} = makeSketchyNotes()

        beforeEach('insert malicious bookmark', () => {
            return db
                .into('Noteful-DB')
                .insert([maliciousNote])
        })

        it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/api/notes`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(res => {
                    expect(res.body[0].title).to.eql(expectedNote.title)
                    expect(res.body[0].content).to.eql(expectedNote.content)
                })
        })
    })
})

describe('GET /api/notes/:id', () => {
    context('Given no notes', () => {
        it(`responds 404 when note isn't found`, () => {
            return supertest(app)
                .get(`/api/notes/123`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, {
                    error: {message: `Note not found`}
                })
        })
    })
    context('Given there are bookmarks in the database', () => {
        const testNotes = makeNotesArray()

        beforeEach('insert bookmarks', () => {
            return db
                .into('Noteful-DB')
                .insert(testNotes)
        })

        it('responds with 200 and the specified note', () => {
            const noteId = 2
            const expectedNote = testNotes[noteId - 1]
            return supertest(app)
                .get(`/api/notes/${noteId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, expectedNote)
        })
    })

    context(`Given an XSS attack note`, () => {
        const {maliciousNote, expectedNote} = makeSketchyNotes()

        beforeEach('insert sketchy note', () => {
            return db
                .into('Notes-DB')
                .insert({maliciousNote})
        })
        it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/api/notes/${maliciousNote.id}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedNote.title)
                    expect(res.body.content).to.eql(expectedNote.content)
                })
        })
    })
})

describe('DELETE /api/notes/:id', () => {
    context(`given no bookmarks`, () => {
        it('responds with 404 when bookmrk doesnt exist', () => {
            return supertest(app)
                .delete(`/api/notes/123`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, {
                    error: {message: `Note not found`}
                })
        })
    })

    context('Given there are notes in the database', () => {
        const testNotes = makeNotesArray()

        beforeEach('insert notes', () => {
            return db
                .into('Noteful-DB')
                .insert(testNotes)
        })

        it('removes the bookmark by ID from the store', () => {
            const idToRemove = 7
            const expectedNote = testNotes.filter(note => note.id !== idToRemove)
            return supertest(app)
                .delete(`/api/notes/${idToRemove}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(204)
                .then(() => {
                    supertest(app)
                        .get(`/api/notes`)
                        .set('authorization' `bearer ${process.env.API_TOKEN}`)
                        .expect(expectedNote)
                })
        })
    })
})

describe('POST /api/notes', () => {
    ['title', 'content'].forEach(field => {
        const newNote = {
            title: 'this bitch empty',
            content: 'YEET!'
        }

        it(`responds with 400 missing 'field' if not supplied`, () => {
            delete newNote[field]
            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: {message: 'field is required'}
                })
        })
    })
    it('adds a new note to the store', () => {
        const newNote = {
            title: 'test-title',
            content: 'test-content'
        }
        return supertest(app)
            .post(`/api/notes`)
            .send(newNote)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(201)
            .expect(res => {
                expect(res.body.title).to.eql(newNote.title)
                expect(res.body.content).to.eql(newNote.content)
                expect(res.body).to.have.property('id')
            })
            .then(res => {
                supertest(app)
                    .get(`/api/notes/${res.body.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(res.body)
            })
    })
    it('removes XSS attack content from response', () => {
        const {maliciousNote, expectedNote} = makeSketchyNotes()
        return supertest(app)
            .post(`/api/notes`)
            .send(maliciousNote)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(201)
            .expect(res => {
                expect(res.body.title).to.eql(expectedNote.title)
                expect(res.body.content).to.eql(expectedNote.content)
            })
    })
})

describe(`PATCH /api/notes/note_id`, () => {
    context('Given no notes', () => {
        it('responds with 404', () => {
            const noteId = 123
        return supertest(app)
            .patch(`/api/notes/${noteId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, {error: {message: `note not found :(`}})
        })
        
    })
    context('Given there are notes in the database', () => {
        const testNotes = makeSketchyNotes()

        beforeEach('insert notes', () => {
            return db
                .into('notes')
                .insert(testNotes)
        })

        it('responds with 204 and updates the bookmark', () => {
            const idToUpdate = 69
            const updateNotes = {
                title: 'update notes title',
                content: 'updated content'
            }
            const expectedNote = {
                ...testNotes[idToUpdate - 1],
                ...updateNotes
            }
            return supertest(app)
                .patch(`/api/notes/${idToUpdate}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(updateNotes)
                .expect(204)
                .then(res => {
                    supertest(app)
                    .get(`/api/notes/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(expectedNote)
                })
        })
        it(`responds with 400 when no required fields supplied`, () => {
            const idToUpdate = 2
            return supertest(app)
                .patch(`/api/notes/${idToUpdate}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({irrelevantField: 'yeet'})
                .expect(400, {
                    error: {message: `request body must contain either title or content`}
                })
        })
        it(`responds with 204 when updating only a subset of fields`, () => {
            const idToUpdate = 666
            const updateNote = {
                title: 'title to update',
            }
            const expectedNote = {
                ...testNotes[idToUdpate - 1],
                ...updateNote
            }
            return supertest(app)
                .patch(`/api/notes/${idToUpdate}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    ...updateNote,
                    fieldToIgnore: 'should not be in GET response'
                })
                .expect(204)
                .then(res => {
                    supertest(app)
                        .get(`/api/notes/${idToUpdate}`)
                        .set('Authorisation', `Bearer ${process.env.API_TOKEN}`)
                        .expect(expectedNote)
                })
        })
    })
})
})